import { VRPSolution, VehicleRoute } from "../../models/vrp";
import { PriorityQueue } from "../../../scheduling/priority-queue";
import { selectRandomSegment } from "./ga-utils";
import { Graph, calculateDistance, createGraph } from "../../models/graph";
import { calculateTraversalMins } from "@/lib/scheduling/create-schedules";
import { FaThList } from "react-icons/fa";
import { Node } from "../../models/graph";
import { crossover } from "./crossover";
import { routeFitness } from "./fitness";
import { findShortestPathForNodes, mutate } from "./mutate";
import { insert } from "./insert";
import { ScheduleProfile } from "@/types/schedule-profile";
import { calculateRealTimes } from "@/lib/google-maps/directions";

export class GeneticAlgorithm {
    private bestGeneration: VRPSolution;
    private deliveryNetwork: Graph;
    private remainingPackages: PriorityQueue;
    private scheduleProfile: ScheduleProfile

    constructor(initialPopulation: VRPSolution, graph: Graph, remainingPackages: PriorityQueue | Node[], scheduleProfile: ScheduleProfile) {
        this.deliveryNetwork = graph;

        // Convert nodes to priority queue
        let packages = new PriorityQueue();
        if (remainingPackages instanceof PriorityQueue) {
            packages = remainingPackages;
        } else {
            const queue = new PriorityQueue();
            for (const node of remainingPackages) {
                queue.enqueue(node);
            }
            packages = queue;
        }
        
        this.remainingPackages = packages;
        this.bestGeneration = initialPopulation.clone();
        this.scheduleProfile = scheduleProfile;
    }

    private evolveGeneration(): void {
        // Evolve the current generation

        // Step 2: Evaluate fitness of the set of VRPSolutions and aggregate the total fitness
        let generationFitness = 0;
        for (const route of this.bestGeneration.routes) {
            route.scheduleProfile = this.scheduleProfile;
            generationFitness += routeFitness(route);
        }

        // Create a deep copy of the best generation
        let offspring = this.bestGeneration.clone();

        // Step 4: Crossover
        if (offspring.routes.length > 1) {
            offspring = crossover(offspring);
        }

        offspring.updateRouteMeasurements()

        // Step 5: Mutation
        for (const route of offspring.routes) {
            // 20% chance of mutation if there is more than one route, else always mutate
            if (Math.random() < 0.2 || offspring.routes.length === 1) {
                const mutatedRoute = mutate(route, this.deliveryNetwork.depot as Node);
                offspring.routes[offspring.routes.indexOf(route)] = mutatedRoute;
            }
        }


        offspring.updateRouteMeasurements()

        // Step 7: Evaluate fitness of new population
        let offspringFitness = 0;
        for (const route of offspring.routes) {
            offspringFitness += routeFitness(route);
        }

        // Step 7: Replace old population with new population if new population is better
        if (offspringFitness < generationFitness) {
            this.bestGeneration = offspring;
        }
    }

    public evolve(GENERATIONS: number): VRPSolution {
        // Test Initial Population
        let fitness = 0;
        for (const route of this.bestGeneration.routes) {
            fitness += routeFitness(route);
        }
        console.log("Initial Population Fitness: ", fitness)
        console.log("Initial population package count: ", this.bestGeneration.numberOfPackages)

        for (let i = 0; i < GENERATIONS; i++) {
            this.evolveGeneration();

            if (i > GENERATIONS / 4) {
                // Artificial Gene Transfer - start attempting to add genes to the pool after 25% of the generations
                this.bestGeneration = insert(this.bestGeneration, this.remainingPackages, this.scheduleProfile);
            }
        }

        this.bestGeneration.updateRouteMeasurements();

        let endFitness = 0;
        for (const route of this.bestGeneration.routes) {
            endFitness += routeFitness(route);
        }



        console.log("End Population Fitness: ", endFitness)
        console.log("End population package count: ", this.bestGeneration.numberOfPackages)
        return this.bestGeneration;
    }
}

