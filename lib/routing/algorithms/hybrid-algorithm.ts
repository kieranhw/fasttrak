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
import { calculateAverageSpeed } from '../../google-maps/directions';

export async function hybridAlgorithm(graph: Graph, vehicles: Vehicle[], profile: ScheduleProfile): Promise<VRPSolution> {
    // Run geospatial clustering to get an initial solution
    const randomSolution = await roundRobinAllocation(graph, vehicles, profile);

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

    const avgSpeed = await calculateAverageSpeed(randomSolution);
    console.log("Average network driving speed: ", avgSpeed);

    // Run KMeans clustering to get an initial solution
    const KMeans = await geospatialClustering(graph, vehicles, profile);

    // Initialize Genetic Algorithm with the initial solution
    const ga = new GeneticAlgorithm(KMeans[0], graph, KMeans[1], profile); // Adjust the GeneticAlgorithm constructor as needed
    //const ga = new GeneticAlgorithm(randomSolution, graph, remainingPackages, profile); // Adjust the GeneticAlgorithm constructor as needed

    // Define the number of generations and other GA parameters as necessary
    const numGenerations = 100000;

    // Evolve the solution
    const optimizedSolution = ga.evolve(numGenerations);

    // Calculate the efficiency scores
    console.log("Efficiency scores")
    console.log("Random solution overall: ", + calculateEfficiencyScores(randomSolution).overallEfficiency);
    console.log("K Means Overal: " + calculateEfficiencyScores(KMeans[0]).overallEfficiency);
    console.log("Optimized solution overall: ", + calculateEfficiencyScores(optimizedSolution).overallEfficiency);

    return optimizedSolution;
}
