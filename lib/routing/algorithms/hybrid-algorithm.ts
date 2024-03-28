import { Graph, createGraph, calculateDistance } from '../models/graph';
import { VehicleRoute, VRPSolution } from '../models/vrp';
import { ScheduleProfile } from "@/types/schedule-profile";
import { geospatialClustering } from "./k-means/k-means";
import { GeneticAlgorithm } from "./genetic-algorithm/genetic-algorithm";
import { Vehicle } from "@/types/vehicle";
import { Package } from "@/types/package";
import { PriorityQueue } from "../../scheduling/priority-queue";
import { roundRobinAllocation } from './rr-fifo';
import { Node } from '../models/graph';
import { calculateEfficiencyScores } from '@/lib/utils/calculate-efficiency';
import { calculateRealTimes, initialiseMetrics as computeMetrics } from '../../google-maps/directions';
import { initRandomMetrics } from '../initialisers/init-random-metrics';
import { geospatialClustering as KMeansClustering } from './k-means/k-means';
import { ScheduleInitialiser, ScheduleOptimiser, ScheduleReport } from '@/types/schedule-report';
import { initKMeans } from '../initialisers/init-k-means';
import { initRandom } from '../initialisers/init-random';

interface VRP {
    solution: VRPSolution;
    distanceMultiplier: number;
    avgSpeed: number;
}

interface EfficiencyScores {
    DE: number;
    TE: number;
    VU: number;
    WU: number;
    overallEfficiency: number;
}

export async function hybridAlgorithm(graph: Graph, vehicles: Vehicle[], profile: ScheduleProfile): Promise<{ finalSolution: VRPSolution, scheduleReport: ScheduleReport }> {
    // Run random solution generator to get random solution
    const initSolution = await initRandomMetrics(graph, vehicles, profile);

    const originalVehicles = vehicles.slice(); // Clone the vehicles array

    // Set average speed and multiplier
    const metrics: VRP = await computeMetrics(initSolution);

    // Find the round robin solution using the metrics
    let randomSolution = await roundRobinAllocation(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    randomSolution.loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);

    // Add leftover packages to priority queue
    const solutionNodes = [] as Node[]; // Holds all nodes in the solution
    const graphNodes = graph.nodes; // Holds all nodes in the graph
    const remainingPackages = new PriorityQueue(); // Holds the remaining packages

    // Add nodes in the solution to the array
    randomSolution.routes.forEach(route => route.nodes.forEach(node => node.pkg && solutionNodes.push(node)));

    // Compare solution nodes with graph nodes to queue the packages which have not been scheduled
    graphNodes.forEach(node => {
        if (!solutionNodes.includes(node)) remainingPackages.enqueue(node);
    });

    // Auto max vehicle count selection
    if (profile.auto_selection == true) {
        // Estimate maximum vehicles required from the initial solution
        const totalWeightCapacityNeeded = graph.nodes.reduce((acc, node) => acc + (node.pkg?.weight ?? 0), 0);
        const totalVolumeCapacityNeeded = graph.nodes.reduce((acc, node) => acc + (node.pkg?.volume ?? 0), 0);

        // Create a clone of the vehicles array
        const startingVehicles = vehicles.slice();
        let maximumVehiclesRequired: Vehicle[] = [];

        // Find maximum number of vehicles needed to load all the packages
        let weightAvailable = 0;
        let volumeAvailable = 0;

        // Find maximum number of vehicles needed to load all the packages
        for (const vehicle in startingVehicles) {
            // Find the number of vehicles required based on the total volume and weight, sum up the current time
            if (weightAvailable < totalWeightCapacityNeeded || volumeAvailable < totalVolumeCapacityNeeded) {
                weightAvailable += startingVehicles[vehicle].max_load
                volumeAvailable += startingVehicles[vehicle].max_volume
                maximumVehiclesRequired.push(startingVehicles[vehicle]);
                // Remove vehicle from startingVehicles
                startingVehicles.splice(parseInt(vehicle), 1);
            }
        }

        const EFFICIENCY_INCREASE = 0.5 // The typical difference in efficiency between the random solution and the final solution

        let currentTimeWindowMins = (profile.time_window * maximumVehiclesRequired.length) * 60; // Current time window available
        const averageTimePerPackage = (randomSolution.actualTime * EFFICIENCY_INCREASE) / randomSolution.numberOfPackages;
        const estimatedTotalTime = averageTimePerPackage * graph.nodes.length - 1; // Estimated (worst case) time to deliver all packages

        // Find maximum number of vehicles needed to route the packages within the time window
        for (const vehicle in startingVehicles) {
            // If current time of the routes are exceeding the time window, add more vehicles
            if (estimatedTotalTime > currentTimeWindowMins) {
                maximumVehiclesRequired.push(startingVehicles[vehicle]);
                startingVehicles.splice(parseInt(vehicle), 1);
                currentTimeWindowMins += (profile.time_window * 60); // Account for new vehicle's time window
            }
        }
        vehicles = maximumVehiclesRequired;
    }

    // Run KMeans clustering to get an initial solution
    let KMeansInitial = await initKMeans(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    KMeansInitial[0].loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);
    
    let randomOnly = await initRandom(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    randomOnly[0].loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);
    const randomOnlyEfficiency: EfficiencyScores = calculateEfficiencyScores(randomOnly[0]);

    // Define the number of generations and other GA parameters as necessary
    const numGenerations = 100000;

    //let randomOnly = await roundRobinAllocation(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    //randomOnly.loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);
    //const randomOnlyEfficiency: EfficiencyScores = calculateEfficiencyScores(randomOnly);

    let KMeansOnly = await KMeansClustering(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    KMeansOnly[0].loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);
    const KMeansOnlyEfficiency: EfficiencyScores = calculateEfficiencyScores(KMeansOnly[0]);

    // K Means Initialised Optimised Solution
    const gaKMeansInit = new GeneticAlgorithm(KMeansInitial[0], graph, KMeansInitial[1], profile); // Run GA with K-Means solution
    const kMeansOptimised = gaKMeansInit.evolve(numGenerations);
    const kMeansOptimisedEfficiency: EfficiencyScores = calculateEfficiencyScores(kMeansOptimised);

    // Random intialised Optimised Solution
    const gaRandomInit = new GeneticAlgorithm(randomOnly[0], graph, randomOnly[1], profile); // Run GA with random solution
    const randomOptimised = gaRandomInit.evolve(numGenerations);
    const randomOptimisedEfficiency: EfficiencyScores = calculateEfficiencyScores(randomOptimised);

    const randomOnlyReport: ScheduleReport = {
        initialiser: ScheduleInitialiser.Random,
        optimiser: ScheduleOptimiser.None,
        distance_multiplier: metrics.distanceMultiplier,
        average_speed: metrics.avgSpeed,
        vehicles_available: originalVehicles,
        vehicles_used: randomOnly[0].routes.map(route => route.vehicle),
        total_packages_count: graph.nodes.reduce((acc, node) => acc + (node.pkg ? 1 : 0), 0),
        scheduled_packages_count: randomOnly[0].numberOfPackages,
        total_distance_miles: randomOnly[0].actualDistance,
        total_duration_hours: randomOnly[0].actualTime / 60,
        // Schedule Profile
        auto_minimise: profile.auto_selection,
        optimisation_profile: profile.optimisation_profile,
        time_window_hours: profile.time_window,
        est_delivery_time: profile.delivery_time,
        TE: randomOnlyEfficiency.TE,
        DE: randomOnlyEfficiency.DE,
        WU: randomOnlyEfficiency.WU,
        VU: randomOnlyEfficiency.VU,
    }

    const KMeansOnlyReport: ScheduleReport = {
        initialiser: ScheduleInitialiser.KMeans,
        optimiser: ScheduleOptimiser.None,
        distance_multiplier: metrics.distanceMultiplier,
        average_speed: metrics.avgSpeed,
        vehicles_available: originalVehicles,
        vehicles_used: KMeansOnly[0].routes.map(route => route.vehicle),
        total_packages_count: graph.nodes.reduce((acc, node) => acc + (node.pkg ? 1 : 0), 0),
        scheduled_packages_count: KMeansOnly[0].numberOfPackages,
        total_distance_miles: KMeansOnly[0].actualDistance,
        total_duration_hours: KMeansOnly[0].actualTime / 60,
        // Schedule Profile
        auto_minimise: profile.auto_selection,
        optimisation_profile: profile.optimisation_profile,
        time_window_hours: profile.time_window,
        est_delivery_time: profile.delivery_time,
        TE: KMeansOnlyEfficiency.TE,
        DE: KMeansOnlyEfficiency.DE,
        WU: KMeansOnlyEfficiency.WU,
        VU: KMeansOnlyEfficiency.VU,
    }

    const randomOptimisedReport: ScheduleReport = {
        initialiser: ScheduleInitialiser.Random,
        optimiser: ScheduleOptimiser.GA,
        iterations: numGenerations,
        distance_multiplier: metrics.distanceMultiplier,
        average_speed: metrics.avgSpeed,
        vehicles_available: originalVehicles,
        vehicles_used: randomOptimised.routes.map(route => route.vehicle),
        total_packages_count: graph.nodes.reduce((acc, node) => acc + (node.pkg ? 1 : 0), 0),
        scheduled_packages_count: randomOptimised.numberOfPackages,
        total_distance_miles: randomOptimised.actualDistance,
        total_duration_hours: randomOptimised.actualTime / 60,
        // Schedule Profile
        auto_minimise: profile.auto_selection,
        optimisation_profile: profile.optimisation_profile,
        time_window_hours: profile.time_window,
        est_delivery_time: profile.delivery_time,
        TE: randomOptimisedEfficiency.TE,
        DE: randomOptimisedEfficiency.DE,
        WU: randomOptimisedEfficiency.WU,
        VU: randomOptimisedEfficiency.VU,
    }

    const kMeansOptimisedReport: ScheduleReport = {
        initialiser: ScheduleInitialiser.KMeans,
        optimiser: ScheduleOptimiser.GA,
        iterations: numGenerations,
        distance_multiplier: metrics.distanceMultiplier,
        average_speed: metrics.avgSpeed,
        vehicles_available: originalVehicles,
        vehicles_used: kMeansOptimised.routes.map(route => route.vehicle),
        total_packages_count: graph.nodes.reduce((acc, node) => acc + (node.pkg ? 1 : 0), 0),
        scheduled_packages_count: kMeansOptimised.numberOfPackages,
        total_distance_miles: kMeansOptimised.actualDistance,
        total_duration_hours: kMeansOptimised.actualTime / 60,
        // Schedule Profile
        auto_minimise: profile.auto_selection,
        optimisation_profile: profile.optimisation_profile,
        time_window_hours: profile.time_window,
        est_delivery_time: profile.delivery_time,
        // Efficiency Scores
        TE: kMeansOptimisedEfficiency.TE,
        DE: kMeansOptimisedEfficiency.DE,
        WU: kMeansOptimisedEfficiency.WU,
        VU: kMeansOptimisedEfficiency.VU,
    }

    type SolutionEfficiencyTuple = [VRPSolution, ScheduleReport, EfficiencyScores];

    const solutionEfficiencies: SolutionEfficiencyTuple[]  = [
        [randomOnly[0], randomOnlyReport, randomOnlyEfficiency],
        [KMeansOnly[0], KMeansOnlyReport, KMeansOnlyEfficiency],
        [randomOptimised, randomOptimisedReport, randomOptimisedEfficiency],
        [kMeansOptimised, kMeansOptimisedReport, calculateEfficiencyScores(kMeansOptimised)]
    ];

    // Find the most efficient solution
    const mostEfficientSolution = solutionEfficiencies.reduce((prev, current) => {
        return (prev[2].overallEfficiency > current[2].overallEfficiency) ? prev : current;
    });

    // Find the remaining solutions to add to the report
    const remainingSolutions = solutionEfficiencies.filter(solution => solution !== mostEfficientSolution);

    // Sort remaining solutions by efficiency, largest to smallest
    remainingSolutions.sort((a, b) => b[2].overallEfficiency - a[2].overallEfficiency);

    // Final solution and report
    const finalSolution = mostEfficientSolution[0];
    const scheduleReport = mostEfficientSolution[1];
    scheduleReport.other_solutions = remainingSolutions.map(solution => solution[1]);

    // Return finalSolution and scheduleReport together
    return { finalSolution, scheduleReport };
}


