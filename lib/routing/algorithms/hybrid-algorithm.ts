import { Graph, createGraph, calculateDistance } from '../models/graph';
import { VehicleRoute, VRPSolution } from '../models/vrp';
import { ScheduleProfile } from "@/types/schedule-profile";
import { geospatialClustering } from "./k-means";
import { GeneticAlgorithm } from "../genetic-algorithm/genetic-algorithm"; 
import { Vehicle } from "@/types/vehicle";
import { Package } from "@/types/package";
import { PriorityQueue } from "../../scheduling/priority-queue";
import { roundRobinAllocation } from './rr-fifo';
import { Node } from '../models/graph';
import { calculateEfficiencyScores } from '@/lib/utils/calculate-efficiency';
import { calculateRealTimes, initialiseMetrics as computeMetrics } from '../../google-maps/directions';
import { randomVRPSolution } from '../initialisers/init-random';
import { geospatialClustering as KMeansClustering } from './k-means';
import { ScheduleInitialiser, ScheduleOptimiser, ScheduleReport } from '@/types/schedule-report';

interface VRP {
    solution: VRPSolution;
    distanceMultiplier: number;
    avgSpeed: number;
}

export async function hybridAlgorithm(graph: Graph, vehicles: Vehicle[], profile: ScheduleProfile): Promise<{ finalSolution: VRPSolution, scheduleReport: ScheduleReport }>{
    // Run random solution generator to get random solution
    const initSolution = await randomVRPSolution(graph, vehicles, profile);

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

        console.log("Estimated vehicles needed: " + maximumVehiclesRequired.length);

        vehicles = maximumVehiclesRequired;
    }

    // Run KMeans clustering to get an initial solution
    let KMeansInitial = await geospatialClustering(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    KMeansInitial[0].loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);
    //let KMeansMetrics = await initialiseMetrics(randomSolution);
    //KMeans[0] = KMeansMetrics.solution;
    console.log("KMeans SOLUTION: " + KMeansInitial[0].routes.forEach(route => {
        console.log(route)
    }));



    // Random Solution
    //randomSolution.initMetrics(KMeansMetrics.avgSpeed, KMeansMetrics.distanceMultiplier);
    //const ga = new GeneticAlgorithm(randomSolution, graph, remainingPackages, profile); // Run GA with random solution

    // Define the number of generations and other GA parameters as necessary
    const numGenerations = 10000;
    console.log(metrics.distanceMultiplier, metrics.avgSpeed);
    let randomOnly = await roundRobinAllocation(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    randomOnly.loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);
    let KMeansOnly = await KMeansClustering(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    KMeansOnly[0].loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);

    // K Means Initialised Optimised Solution
    const gaKMeansInit = new GeneticAlgorithm(KMeansInitial[0], graph, KMeansInitial[1], profile); // Run GA with K-Means solution
    const kMeansOptimised = gaKMeansInit.evolve(numGenerations);

    // Random intialised Optimised Solution
    const gaRandomInit = new GeneticAlgorithm(randomSolution, graph, remainingPackages, profile); // Run GA with random solution
    const randomOptimised = gaRandomInit.evolve(numGenerations);


    // Calculate the efficiency scores
    // TODO: store into schedule report table
    console.log("Efficiency scores")
    console.log("Random solution overall: ", + calculateEfficiencyScores(randomOnly).overallEfficiency);
    console.log(randomOnly.numberOfPackages)
    console.log("K Means solution overall: ", + calculateEfficiencyScores(KMeansOnly[0]).overallEfficiency);
    console.log(KMeansOnly[0].numberOfPackages)
    console.log("Random optimised solution overall: ", + calculateEfficiencyScores(randomOptimised).overallEfficiency);
    console.log(randomOptimised.numberOfPackages)
    console.log("K Means optimised solution overall: ", + calculateEfficiencyScores(kMeansOptimised).overallEfficiency);
    console.log(kMeansOptimised.numberOfPackages)

    const finalSolution = kMeansOptimised;

    const scheduleReport: ScheduleReport = {
        initialiser: ScheduleInitialiser.Random,
        optimiser: ScheduleOptimiser.GA,
        iterations: numGenerations,
        distance_multiplier: metrics.distanceMultiplier,
        average_speed: metrics.avgSpeed,
        vehicles_available: originalVehicles,
        vehicles_used: vehicles,
        total_packages_count: graph.nodes.length,
        scheduled_packages_count: finalSolution.numberOfPackages,
        // Schedule Profile
        auto_minimise: profile.auto_selection,
        optimisation_profile: profile.optimisation_profile,
        time_window_hours: profile.time_window,
        est_delivery_time: profile.delivery_time,
    }

    // Return finalSolution and scheduleReport together
    return { finalSolution, scheduleReport };
   
}
