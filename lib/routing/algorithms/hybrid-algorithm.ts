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
import { calculateRealTimes, initialiseMetrics } from '../../google-maps/directions';
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
    const metrics: VRP = await initialiseMetrics(initSolution);

    // Find the round robin solution using the metrics
    let randomSolution = await roundRobinAllocation(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    randomSolution.initMetrics(metrics.avgSpeed, metrics.distanceMultiplier);

    // Add leftover packages to priority queue
    const solutionNodes = [] as Node[];
    randomSolution.routes.forEach(route => {
        route.nodes.forEach(node => {
            if (node.pkg) {
                solutionNodes.push(node);
            }
        })
    });
    const graphNodes = graph.nodes;
    // Create a priority queue of packages which are not in the solution
    const remainingPackages = new PriorityQueue();
    graphNodes.forEach(node => {
        if (!solutionNodes.includes(node)) {
            remainingPackages.enqueue(node);
        }
    });

    // Run KMeans clustering to get an initial solution
    let KMeans = await geospatialClustering(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    KMeans[0].initMetrics(metrics.avgSpeed, metrics.distanceMultiplier);
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
    console.log("Efficiency scores")
    console.log("Random solution overall: ", + calculateEfficiencyScores(randomSolution).overallEfficiency);
    console.log("K Means Overall: " + calculateEfficiencyScores(KMeans[0]).overallEfficiency);
    console.log("Parcels/unit distance: ", + calculateEfficiencyScores(KMeans[0]).PUD);
    console.log("Parcels/unit time ", + calculateEfficiencyScores(KMeans[0]).PUT);
    console.log("volume utilisation: ", + calculateEfficiencyScores(KMeans[0]).VU);

    console.log("Optimised total eff ", + calculateEfficiencyScores(optimizedSolution).overallEfficiency);
    console.log("Parcels/unit distance: ", + calculateEfficiencyScores(optimizedSolution).PUD);
    console.log("Parcels/unit time ", + calculateEfficiencyScores(optimizedSolution).PUT);
    console.log("volume utilisation: ", + calculateEfficiencyScores(optimizedSolution).VU);


    return optimizedSolution;
}
