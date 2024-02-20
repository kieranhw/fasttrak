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
import { initialiseMetrics } from '../../google-maps/directions';

export async function hybridAlgorithm(graph: Graph, vehicles: Vehicle[], profile: ScheduleProfile): Promise<VRPSolution> {
    // Run geospatial clustering to get an initial solution
    const initSolution = await roundRobinAllocation(graph, vehicles, profile);

    const solutionNodes = [] as Node[];
    initSolution.routes.forEach(route => {
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

    // 1. Set average speed and multiplier
    const randomSolution = await initialiseMetrics(initSolution);
    

    // 1.1 get average speed (average speed of all routes)

    // 1.2 Get Teuc (total euclidean time of all routes), which is Total Euc / avgspeed

    // 1.3 get Tact (total actual time of all routes), which is summed from the response of the google maps api

    // 1.4 calculate multiplier, which is Tact / Teuc

    // 1.5 use multiplier to calculate actual time and actual distance for each route by multiplying the euclidean unit by the multiplier





    // Run KMeans clustering to get an initial solution
    let KMeans = await geospatialClustering(graph, vehicles, profile);
    KMeans[0] = await initialiseMetrics(KMeans[0]);

    // Initialize Genetic Algorithm with the initial solution
    const ga = new GeneticAlgorithm(KMeans[0], graph, KMeans[1], profile); // Adjust the GeneticAlgorithm constructor as needed
    //const ga = new GeneticAlgorithm(randomSolution, graph, remainingPackages, profile); // Adjust the GeneticAlgorithm constructor as needed

    // Define the number of generations and other GA parameters as necessary
    const numGenerations = 100;

    // Evolve the solution
    const optimizedSolution = ga.evolve(numGenerations);

    // Calculate the efficiency scores
    console.log("Efficiency scores")
    console.log("Random solution overall: ", + calculateEfficiencyScores(randomSolution).overallEfficiency);
    console.log("K Means Overal: " + calculateEfficiencyScores(KMeans[0]).overallEfficiency);
    console.log("Optimized solution overall: ", + calculateEfficiencyScores(optimizedSolution).overallEfficiency);

    console.log("Optimized solution overall (before real times): ", + calculateEfficiencyScores(optimizedSolution).overallEfficiency);
    console.log("Euclidean cost: " + optimizedSolution.euclideanDistance);

    console.log("Actual time solution overall (after real times): ", + calculateEfficiencyScores(optimizedSolution).overallEfficiency);
    console.log("Actual cost: " + optimizedSolution.actualDistance);


    return optimizedSolution;
}
