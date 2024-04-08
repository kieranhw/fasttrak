import { VRPSolution, VehicleRoute } from "../../model/vrp";
import { routeFitness } from "./fitness";

export function crossover(clonedSolution: VRPSolution): VRPSolution {
    // Sort routes by fitness in descending order to get the two fittest routes
    const sortedRoutes = clonedSolution.routes.sort((a, b) => routeFitness(b) - routeFitness(a));

    // Select the two fittest routes for crossover, ensuring there are enough routes
    if (sortedRoutes.length < 2) {
        console.error('Not enough routes to perform crossover.');
        return clonedSolution; // Return the cloned solution unchanged if not enough routes
    }

    const parent1 = sortedRoutes[0];
    const parent2 = sortedRoutes[1];

    // Perform crossover on clones of the selected routes
    const [offspring1, offspring2] = performCrossoverOnRoutes(parent1, parent2);

    // Replace the routes in clonedSolution with the offspring
    clonedSolution.routes[sortedRoutes.indexOf(parent1)] = offspring1;
    clonedSolution.routes[sortedRoutes.indexOf(parent2)] = offspring2;

    return clonedSolution;
}

export function performCrossoverOnRoutes(parent1: VehicleRoute, parent2: VehicleRoute): [VehicleRoute, VehicleRoute] {
    // Clone parents to avoid modifying originals
    const clone1 = Object.assign(Object.create(Object.getPrototypeOf(parent1)), parent1);
    const clone2 = Object.assign(Object.create(Object.getPrototypeOf(parent2)), parent2);

    const maxLen = Math.min(clone1.nodes.length-2, clone2.nodes.length-2);

    // Determine the segment size for crossover (between 1 and maxLen nodes)
    const segmentSize = Math.floor(Math.random() * maxLen) + 1; // 1 to maxLen

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