import { Graph, createGraph, calculateDistance } from '../models/graph';
import { VehicleRoute, VRPSolution } from '../models/vrp';
import { ScheduleProfile } from "@/types/schedule-profile";
import { geospatialClustering } from "./k-means";
import { GeneticAlgorithm } from "../genetic-algorithm/genetic-algorithm"; // Assuming you have this class defined
import { Vehicle } from "@/types/vehicle";
import { Package } from "@/types/package";
import { PriorityQueue } from "../../scheduling/priority-queue";
import { roundRobinAllocation } from './rr-fifo';
import { Node } from '../models/graph';
import { calculateEfficiencyScores } from '@/lib/data/calculate-efficiency';
import { calculateRealTimes, initialiseMetrics as computeMetrics } from '../../google-maps/directions';
import { randomVRPSolution } from './init-metrics';

interface VRP {
    solution: VRPSolution;
    distanceMultiplier: number;
    avgSpeed: number;
}

export async function hybridAlgorithm(graph: Graph, vehicles: Vehicle[], profile: ScheduleProfile): Promise<VRPSolution> {
    // Run random solution generator to get random solution
    const initSolution = await randomVRPSolution(graph, vehicles, profile);

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
    let KMeans = await geospatialClustering(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    KMeans[0].loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);
    //let KMeansMetrics = await initialiseMetrics(randomSolution);
    //KMeans[0] = KMeansMetrics.solution;
    console.log("KMeans SOLUTION: " + KMeans[0].routes.forEach(route => {
        console.log(route)
    }));


    // K Means solution
    const ga = new GeneticAlgorithm(KMeans[0], graph, KMeans[1], profile); // Run GA with K-Means solution

    // Random Solution
    //randomSolution.initMetrics(KMeansMetrics.avgSpeed, KMeansMetrics.distanceMultiplier);
    //const ga = new GeneticAlgorithm(randomSolution, graph, remainingPackages, profile); // Run GA with random solution

    // Define the number of generations and other GA parameters as necessary
    const numGenerations = 1000000;

    // Evolve the solution
    const optimizedSolution = ga.evolve(numGenerations);


    // Calculate the efficiency scores
    // TODO: store into schedule report table
    console.log("Efficiency scores")
    console.log("Random solution overall: ", + calculateEfficiencyScores(randomSolution).overallEfficiency);
    console.log("K Means Overall: " + calculateEfficiencyScores(KMeans[0]).overallEfficiency);
    //console.log("Parcels/unit distance: ", + calculateEfficiencyScores(KMeans[0]).PUD);
    //console.log("Parcels/unit time ", + calculateEfficiencyScores(KMeans[0]).PUT);
    //console.log("volume utilisation: ", + calculateEfficiencyScores(KMeans[0]).VU);

    console.log("Optimised overall ", + calculateEfficiencyScores(optimizedSolution).overallEfficiency);
    //console.log("Parcels/unit distance: ", + calculateEfficiencyScores(optimizedSolution).PUD);
    //console.log("Parcels/unit time ", + calculateEfficiencyScores(optimizedSolution).PUT);
    //console.log("volume utilisation: ", + calculateEfficiencyScores(optimizedSolution).VU);


    return optimizedSolution;
}
