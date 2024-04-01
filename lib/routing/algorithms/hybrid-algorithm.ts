import { Graph } from '../models/graph';
import { VRPSolution } from '../models/vrp';
import { ScheduleProfile } from "@/types/schedule-profile";
import { GeneticAlgorithm } from "./genetic-algorithm/genetic-algorithm";
import { Vehicle } from "@/types/vehicle";
import { roundRobinAllocation } from './rr-fifo/rr-fifo';
import { Node } from '../models/graph';
import { EfficiencyScores, calculateEfficiencyScores } from '@/lib/utils/calculate-efficiency';
import { initialiseMetrics as computeMetrics } from '../../google-maps/directions';
import { initRandomMetrics } from './rr-fifo/init-random-metrics';
import { geospatialClustering as KMeansClustering } from './k-means/k-means';
import { ScheduleInitialiser, ScheduleOptimiser, ScheduleReport } from '@/types/schedule-report';
import { initKMeans } from './k-means/init-k-means';
import { initRandom } from './rr-fifo/init-rr-fifo';

interface VRPMetrics {
    solution: VRPSolution;
    distanceMultiplier: number;
    avgSpeed: number;
}

export async function hybridAlgorithm(graph: Graph, vehicles: Vehicle[], profile: ScheduleProfile): Promise<{ finalSolution: VRPSolution, scheduleReport: ScheduleReport }> {
    const originalVehicles = vehicles.slice(); // Clone the vehicles array
    
    // 1. Generate a solution without any metrics to be used for calculating the metrics
    const metricsOnlySolution = await initRandomMetrics(graph, vehicles, profile);

    // Calculate metrics using the solution
    const metrics: VRPMetrics = await computeMetrics(metricsOnlySolution);

    // 2. Generate a random solution to be used as a baseline and to estimate the maximum number of vehicles required
    let randomSolution = await roundRobinAllocation(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    randomSolution.loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);

    // 3. If selected, estimate the maximum number of vehicles required to deliver all packages 
    if (profile.auto_selection == true) {
        // Estimate the amount of vehicles needed to deliver all pending packages
        const totalWeightCapacityNeeded = graph.nodes.reduce((acc, node) => acc + (node.pkg?.weight ?? 0), 0);
        const totalVolumeCapacityNeeded = graph.nodes.reduce((acc, node) => acc + (node.pkg?.volume ?? 0), 0);

        // Create a clone of the vehicles array
        const startingVehicles = vehicles.slice();
        let maximumVehiclesRequired: Vehicle[] = [];
        
        // Find maximum number of vehicles required to fit all packages based on weight and volume
        let weightAvailable = 0;
        let volumeAvailable = 0;

        for (const vehicle in startingVehicles) {
            // If the total weight and volume capacity needed exceeds the available capacity, add more vehicles
            if (weightAvailable < totalWeightCapacityNeeded && volumeAvailable < totalVolumeCapacityNeeded) {
                // Add the vehicle's capacity to the available capacity
                weightAvailable += startingVehicles[vehicle].max_load
                volumeAvailable += startingVehicles[vehicle].max_volume

                // Add the vehicle to the maximum vehicles required array
                maximumVehiclesRequired.push(startingVehicles[vehicle]);
                startingVehicles.splice(parseInt(vehicle), 1);
            }
        }

        const EFFICIENCY_INCREASE = 0.5 // Estimated routing efficiency increase between the random solution and the final solution

        let currentTimeWindowMins = (profile.time_window * maximumVehiclesRequired.length) * 60; // Current time window available
        const averageTimePerPackage = (randomSolution.actualTime * EFFICIENCY_INCREASE) / randomSolution.numberOfPackages;
        const estimatedTravelTimeMins = averageTimePerPackage * graph.nodes.length - 1; // Estimated (worst case) time to deliver all packages

        // From the remaining vehicles, add more vehicles if required based on the estimated time to deliver
        for (const vehicle in startingVehicles) {
            const travelTimeExceedsTimeWindow = estimatedTravelTimeMins > currentTimeWindowMins;

            if (travelTimeExceedsTimeWindow) {
                maximumVehiclesRequired.push(startingVehicles[vehicle]);
                startingVehicles.splice(parseInt(vehicle), 1);
                currentTimeWindowMins += (profile.time_window * 60); // Account for new vehicle's time window
            }
        }
        vehicles = maximumVehiclesRequired;
    }

    // 4. Run K-Means clustering to get a solution without any optimisation
    let KMeansOnly = await KMeansClustering(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    KMeansOnly[0].loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);
    const KMeansOnlyEfficiency: EfficiencyScores = calculateEfficiencyScores(KMeansOnly[0]);

    // 5. Run K-Means and Random initialisation to get an initial solution for the GA
    let KMeansInitial = await initKMeans(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    KMeansInitial[0].loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);
    
    let randomOnly = await initRandom(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    randomOnly[0].loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);
    const randomOnlyEfficiency: EfficiencyScores = calculateEfficiencyScores(randomOnly[0]);

    // 6. Run the Genetic Algorithm to optimise the K-Means and Random initialisation solutions
    const numGenerations = 100000;

    // K Means
    const gaKMeansInit = new GeneticAlgorithm(KMeansInitial[0], graph, KMeansInitial[1], profile);
    const kMeansOptimised = gaKMeansInit.evolve(numGenerations);
    const kMeansOptimisedEfficiency: EfficiencyScores = calculateEfficiencyScores(kMeansOptimised);

    // Random Initialised
    const gaRandomInit = new GeneticAlgorithm(randomOnly[0], graph, randomOnly[1], profile);
    const randomOptimised = gaRandomInit.evolve(numGenerations);
    const randomOptimisedEfficiency: EfficiencyScores = calculateEfficiencyScores(randomOptimised);

    // 7. Generate reports for each solution
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

    // 8. Compare the efficiency of each solution, selecting the most efficient to be the final solution
    type SolutionEfficiencyTuple = [VRPSolution, ScheduleReport, EfficiencyScores];
    const solutionEfficiencies: SolutionEfficiencyTuple[]  = [
        [randomOnly[0], randomOnlyReport, randomOnlyEfficiency],
        [KMeansOnly[0], KMeansOnlyReport, KMeansOnlyEfficiency],
        [randomOptimised, randomOptimisedReport, randomOptimisedEfficiency],
        [kMeansOptimised, kMeansOptimisedReport, kMeansOptimisedEfficiency]
    ];

    const mostEfficientSolution = solutionEfficiencies.reduce((prev, current) => {
        return (prev[2].overallEfficiency > current[2].overallEfficiency) ? prev : current;
    });

    const remainingSolutions = solutionEfficiencies.filter(solution => solution !== mostEfficientSolution);

    // Sort remaining solutions by efficiency, largest to smallest
    remainingSolutions.sort((a, b) => b[2].overallEfficiency - a[2].overallEfficiency);

    // 9. Return the most efficient solution and report, with the other solution reports included in the main report
    const finalSolution = mostEfficientSolution[0];
    const scheduleReport = mostEfficientSolution[1];
    scheduleReport.other_solutions = remainingSolutions.map(solution => solution[1]);

    return { finalSolution, scheduleReport };
}


