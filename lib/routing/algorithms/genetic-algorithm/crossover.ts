import { VRPSolution } from "@/lib/routing/model/VRPSolution";
import { VehicleRoute } from "@/lib/routing/model/VehicleRoute";
import { routeFitness } from "./fitness";

/**
 * Performs crossover on the two fittest routes from the set of routes in the solution. Two random nodes are selected
 * from each parent route and swapped to create two offspring.
 * @param parentSolution The solution to perform crossover on
 * @returns The offspring solution with the two fittest routes crossed over
 */
export function crossover(parentSolution: VRPSolution): VRPSolution {
    // Sort routes by fitness in descending order to get the two fittest routes
    const sortedRoutes = parentSolution.routes.sort((a, b) => routeFitness(b) - routeFitness(a));

    // Select the two fittest routes for crossover, ensuring there are enough routes
    if (sortedRoutes.length < 2) {
        console.error('Not enough routes to perform crossover.');
        return parentSolution; // Return the cloned solution unchanged if not enough routes
    }

    const parent1 = sortedRoutes[0];
    const parent2 = sortedRoutes[1];

    // Perform crossover on clones of the selected routes
    const [offspring1, offspring2] = performCrossoverOnRoutes(parent1, parent2);

    // Replace the routes in clonedSolution with the offspring
    parentSolution.routes[sortedRoutes.indexOf(parent1)] = offspring1;
    parentSolution.routes[sortedRoutes.indexOf(parent2)] = offspring2;

    return parentSolution;
}

/**
 * Performs crossover on two vehicle routes. Two random segments are selected from each route and swapped to create two offspring.
 * @param parent1 The first parent route
 * @param parent2 The second parent route
 * @returns An array containing the two offspring routes
 */
function performCrossoverOnRoutes(parent1: VehicleRoute, parent2: VehicleRoute): [VehicleRoute, VehicleRoute] {
    // Clone parents to avoid modifying originals
    const clone1 = parent1.clone();
    const clone2 = parent2.clone();

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
    const deliveryTime = clone1.scheduleProfile.delivery_time;
    clone1.updateMeasurements(deliveryTime);
    clone2.updateMeasurements(deliveryTime);

    return [clone1, clone2];
}