import { VRPSolution, VehicleRoute } from "../models/vrp";
import { PriorityQueue } from "../../scheduling/priority-queue";
import { selectRandomSegment } from "./ga-utils";
import { Graph, calculateDistance, createGraph } from "./graph";
import { calculateTraversalMins } from "@/lib/scheduling/create-schedules";
import { FaThList } from "react-icons/fa";
import { Node } from "./graph";

export class GeneticAlgorithm {
    private bestGeneration: VRPSolution;
    private deliveryNetwork: Graph;

    constructor(initialPopulation: VRPSolution, graph: Graph, remainingPackages: PriorityQueue) { // Specify the type of elements in the priority queue
        this.deliveryNetwork = graph,
            this.bestGeneration = initialPopulation;
    }

    routeFitness(route: VehicleRoute): number {
        return route.totalDistance;  
    }

    private crossover(clonedSolution: VRPSolution): VRPSolution {
        // Sort routes by fitness in descending order to get the two fittest routes
        const sortedRoutes = clonedSolution.routes.sort((a, b) => this.routeFitness(b) - this.routeFitness(a));

        // Select the two fittest routes for crossover, ensuring there are enough routes
        if (sortedRoutes.length < 2) {
            console.error('Not enough routes to perform crossover.');
            return clonedSolution; // Return the cloned solution unchanged if not enough routes
        }

        const parent1 = sortedRoutes[0];
        const parent2 = sortedRoutes[1];

        // Perform crossover on clones of the selected routes
        const [offspring1, offspring2] = this.performCrossoverOnRoutes(parent1, parent2);

        // Replace the routes in clonedSolution with the offspring
        clonedSolution.routes[sortedRoutes.indexOf(parent1)] = offspring1;
        clonedSolution.routes[sortedRoutes.indexOf(parent2)] = offspring2;

        return clonedSolution;
    }

    private performCrossoverOnRoutes(parent1: VehicleRoute, parent2: VehicleRoute): [VehicleRoute, VehicleRoute] {
        // Clone parents to avoid modifying originals
        const clone1 = Object.assign(Object.create(Object.getPrototypeOf(parent1)), parent1);
        const clone2 = Object.assign(Object.create(Object.getPrototypeOf(parent2)), parent2);

        // Determine the segment size for crossover (between 2 and 5 nodes)
        const segmentSize = Math.floor(Math.random() * 4) + 2; // 2 to 5

        // Choose random start index for the segment in each parent, ensuring the segment fits
        const startIndex1 = Math.floor(Math.random() * (clone1.nodes.length - segmentSize - 2)) + 1;
        const startIndex2 = Math.floor(Math.random() * (clone2.nodes.length - segmentSize - 2)) + 1;

        // Extract and swap segments
        const segment1 = clone1.nodes.slice(startIndex1, startIndex1 + segmentSize);
        const segment2 = clone2.nodes.slice(startIndex2, startIndex2 + segmentSize);
        clone1.nodes.splice(startIndex1, segmentSize, ...segment2);
        clone2.nodes.splice(startIndex2, segmentSize, ...segment1);

        // Update measurements with a fixed delivery time of 5
        const deliveryTime = 3; // TODO: Fixed delivery time, get from schedule profile
        clone1.updateMeasurements(deliveryTime);
        clone2.updateMeasurements(deliveryTime);

        return [clone1, clone2];
    }

    private mutate(clonedRoute: VehicleRoute): VehicleRoute {

        // Randomly select a mutation strategy
        const mutationType = Math.floor(Math.random() * 4);

        switch (mutationType) {
            case 0:
                this.swapNodes(clonedRoute);
                break;
            case 1:
                this.reverseSegment(clonedRoute);
                break;
            case 2:
                this.shiftNode(clonedRoute);
                break;
            case 3:
                this.findShortestPathForNodes(clonedRoute, this.deliveryNetwork.depot as Node);
        }

        clonedRoute.updateMeasurements(3); // TODO: Using fixed delivery time as per previous context

        return clonedRoute;
    }

    private swapNodes(route: VehicleRoute): void {
        if (route.nodes.length > 4) { // Ensure there are enough nodes to swap (excluding start/end depot)
            const index1 = this.getRandomIndex(route);
            let index2 = this.getRandomIndex(route);

            while (index1 === index2) {
                index2 = this.getRandomIndex(route); // Ensure we have two distinct indices
            }

            // Swap nodes
            [route.nodes[index1], route.nodes[index2]] = [route.nodes[index2], route.nodes[index1]];
        }
    }

    private findShortestPathForNodes(route: VehicleRoute, depot: Node): VehicleRoute {

        const path: Node[] = [];
        let remainingNodes = [...route.nodes];
        let currentNode = depot;
    
        while (remainingNodes.length > 0) {
            const nearestNode = this.findNearestNeighbour(currentNode, remainingNodes);
            if (nearestNode) {
                path.push(nearestNode);

                // Remove the nearest node from the remaining nodes
                remainingNodes = remainingNodes.filter(node => node !== nearestNode);

                currentNode = nearestNode;
            } else {
                break; // No more nearest nodes found
            }
        }

        route.nodes = path;
    
        return route;
    }
    
    
    private findNearestNeighbour(currentNode: Node, nodes: Node[]): Node | undefined {
        let nearestNode: Node | undefined;
        let shortestDistance = Number.MAX_VALUE;
    
        for (const node of nodes) {
            const distance = calculateDistance(currentNode, node);
            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestNode = node;
            }
        }
    
        return nearestNode;
    }
    
 

    private reverseSegment(route: VehicleRoute): void {
        if (route.nodes.length > 4) { // Ensure there's a segment to reverse
            let index1 = this.getRandomIndex(route);
            let index2 = this.getRandomIndex(route);

            while (index1 === index2) {
                index2 = this.getRandomIndex(route); // Ensure distinct indices
            }

            if (index2 < index1) {
                [index1, index2] = [index2, index1]; // Ensure index1 < index2
            }

            // Reverse the segment
            route.nodes = [
                ...route.nodes.slice(0, index1),
                ...route.nodes.slice(index1, index2 + 1).reverse(),
                ...route.nodes.slice(index2 + 1)
            ];
        }
    }

    private shiftNode(route: VehicleRoute): void {
        if (route.nodes.length > 4) {
            const index = this.getRandomIndex(route);
            const node = route.nodes.splice(index, 1)[0]; // Remove the node
            const newIndex = this.getRandomIndex(route);
            route.nodes.splice(newIndex, 0, node); // Insert the node at a new position
        }
    }

    private getRandomIndex(route: VehicleRoute): number {
        // Generate a random index for route manipulation, excluding the first and last node (depot)
        return Math.floor(Math.random() * (route.nodes.length - 2)) + 1;
    }

    private evolveGeneration(): void {
        // Evolve the current generation

        // Step 2: Evaluate fitness of the set of VRPSolutions and aggregate the total fitness
        let generationFitness = 0;
        for (const route of this.bestGeneration.routes) {
            generationFitness += this.routeFitness(route);
        }

        // Create a deep copy of the best generation
        let offspring = new VRPSolution();
        for (const route of this.bestGeneration.routes) {
            offspring.routes.push(route.clone());
        }

        // Step 4: Crossover
        offspring = this.crossover(offspring);

        // Step 5: Mutation
        for (const route of offspring.routes) {
            // 20% chance of mutation
            if (Math.random() < 0.2) {
                const mutatedRoute = this.mutate(route);
                offspring.routes[offspring.routes.indexOf(route)] = mutatedRoute;
            }
        }

        // Step 6: Evaluate fitness of new population
        let offspringFitness = 0;
        for (const route of offspring.routes) {
            offspringFitness += this.routeFitness(route);
        }

        // Step 7: Replace old population with new population if new population is better
        if (offspringFitness < generationFitness) {
            this.bestGeneration = offspring;
        }
    }

    public evolve(generations: number): VRPSolution {
        // Test Iniiial Population
        let fitness = 0;
        for (const route of this.bestGeneration.routes) {
            fitness += this.routeFitness(route);
        }
        console.log("Initial Population Fitness: ", fitness)

        for (let i = 0; i < generations; i++) {
            this.evolveGeneration();
        }

        // Find shortest path for each route
        for (const route of this.bestGeneration.routes) {
            this.findShortestPathForNodes(route, this.deliveryNetwork.depot as Node);
        }

        let endFitness = 0;
        for (const route of this.bestGeneration.routes) {
            endFitness += this.routeFitness(route);
        }
        console.log("End Population Fitness: ", endFitness)

        return this.bestGeneration;
    }

    public fetchAndProcessBatches(): void {
        // Fetch packages from priority queue and process
    }
}

