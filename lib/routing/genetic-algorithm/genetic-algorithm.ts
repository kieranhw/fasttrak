import { VRPSolution, VehicleRoute } from "../models/vrp";
import { PriorityQueue } from "../../scheduling/priority-queue";
import { selectRandomSegment } from "../models/ga-utils";
import { Graph, calculateDistance, createGraph } from "../models/graph";
import { calculateTraversalMins } from "@/lib/scheduling/create-schedules";
import { FaThList } from "react-icons/fa";
import { Node } from "../models/graph";
import { crossover } from "./crossover";
import { routeFitness } from "./fitness";
import { findShortestPathForNodes, mutate } from "./mutate";
import { insert } from "./insert";
import { ScheduleProfile } from "@/types/schedule-profile";

export class GeneticAlgorithm {
    private bestGeneration: VRPSolution;
    private deliveryNetwork: Graph;
    private remainingPackages: PriorityQueue;
    private scheduleProfile: ScheduleProfile

    constructor(initialPopulation: VRPSolution, graph: Graph, remainingPackages: PriorityQueue, scheduleProfile: ScheduleProfile) { // Specify the type of elements in the priority queue
        this.deliveryNetwork = graph;
        this.remainingPackages = remainingPackages;
        this.bestGeneration = initialPopulation;
        this.scheduleProfile = scheduleProfile;
    }

    private evolveGeneration(): void {
        // Evolve the current generation

        // Step 2: Evaluate fitness of the set of VRPSolutions and aggregate the total fitness
        let generationFitness = 0;
        for (const route of this.bestGeneration.routes) {
            generationFitness += routeFitness(route);
        }

        // Create a deep copy of the best generation
        let offspring = new VRPSolution();
        for (const route of this.bestGeneration.routes) {
            offspring.routes.push(route.clone());
        }

        // Step 4: Crossover
        if (offspring.routes.length > 1) {
            offspring = crossover(offspring);
        }

        // Step 5: Mutation
        for (const route of offspring.routes) {
            // 20% chance of mutation if there is more than one route
            if (Math.random() < 0.1 || offspring.routes.length === 1) {
                const mutatedRoute = mutate(route, this.deliveryNetwork.depot as Node);
                offspring.routes[offspring.routes.indexOf(route)] = mutatedRoute;
            }
        }

        // Step 7: Evaluate fitness of new population
        let offspringFitness = 0;
        for (const route of offspring.routes) {
            offspringFitness += routeFitness(route);
        }

        // Step 7: Replace old population with new population if new population is better
        if (offspringFitness < generationFitness) {
            this.bestGeneration = offspring;
        }

        // Step 6: Artificial Gene Transfer
        if (Math.random() < 0.2) {
            this.bestGeneration = insert(this.bestGeneration, this.remainingPackages);
        }


    }

    public evolve(generations: number): VRPSolution {
        // Test Iniiial Population
        let fitness = 0;
        for (const route of this.bestGeneration.routes) {
            fitness += routeFitness(route);
        }
        console.log("Initial Population Fitness: ", fitness)
        console.log("Initial population package count: ", this.bestGeneration.routes.reduce((sum, route) => sum + route.nodes.length, 0))

        for (let i = 0; i < generations; i++) {
            this.evolveGeneration();
        }

        // Find shortest path for each route
        for (const route of this.bestGeneration.routes) {
            findShortestPathForNodes(route, this.deliveryNetwork.depot as Node);
        }

        let endFitness = 0;
        for (const route of this.bestGeneration.routes) {
            endFitness += routeFitness(route);
        }
        console.log("End Population Fitness: ", endFitness)
        console.log("End population package count: ", this.bestGeneration.routes.reduce((sum, route) => sum + route.nodes.length, 0))
        this.bestGeneration.updateRouteMetrics();
        return this.bestGeneration;
    }
}

