import { Graph, createGraph, calculateDistance } from '../models/graph';
import { VehicleRoute, VRPSolution } from '../models/vrp';
import { ScheduleProfile } from "@/types/schedule-profile";
import { geospatialClustering } from "./algorithm-3";
import { GeneticAlgorithm } from "../models/genetic-algorithm"; // Assuming you have this class defined
import { Vehicle } from "@/types/vehicle";
import { Package } from "@/types/package";
import { PriorityQueue } from "../../scheduling/priority-queue";
import { roundRobinAllocation } from './algorithm-2';

export async function hybridAlgorithm(graph: Graph, vehicles: Vehicle[], profile: ScheduleProfile): Promise<VRPSolution> {
    // Run geospatial clustering to get an initial solution
    //const initialSolution = await geospatialClustering(graph, vehicles, profile);
    const initialSolution = await roundRobinAllocation(graph, vehicles, profile);

    // Initialize Genetic Algorithm with the initial solution
    //const ga = new GeneticAlgorithm(initialSolution[0], graph, initialSolution[1]); // Adjust the GeneticAlgorithm constructor as needed
    const ga = new GeneticAlgorithm(initialSolution, graph, new PriorityQueue()); // Adjust the GeneticAlgorithm constructor as needed
    
    // Define the number of generations and other GA parameters as necessary
    const numGenerations = 2500000; 

    // Evolve the solution
    const optimizedSolution = ga.evolve(numGenerations);

    return optimizedSolution;
}
