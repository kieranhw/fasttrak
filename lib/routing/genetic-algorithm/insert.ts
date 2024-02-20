import { PriorityQueue } from "@/lib/scheduling/priority-queue";
import { VRPSolution, VehicleRoute } from "../models/vrp";
import { routeFitness } from "./fitness";
import { calculateTraversalMins } from "@/lib/scheduling/create-schedules";
import { calculateDistance } from "../models/graph";

export function insert(offspring: VRPSolution, remainingPackages: PriorityQueue): VRPSolution {
    // 1. Peek node from priority queue 
    const node = remainingPackages.peek();
    if (!node) return offspring;

    // 2. Test the fitness of the current input offspring
    let fitness = 0;
    for (const route of offspring.routes) {
        fitness += routeFitness(route);
    }

    // 3. Clone the offspring and select the first route which can accommodate the package
    const clonedOffspring = offspring.clone();

    // Iterate the routes, and try to add the package
    for (const route of clonedOffspring.routes) {
        // Check if the route can accommodate the package
        const deliveryTime = 3 //TODO: GET THIS
        const timeWindow = 60 * 8 //TODO: GET THIS
        const driverBreak = 30 //TODO: GET THIS

        // Calculate the travel cost and time required to travel from the last node in the route to the next node
        const travelCost = calculateDistance(route.nodes[route.nodes.length - 2], node);
        const travelTime = calculateTraversalMins(travelCost) + deliveryTime; // Calculate time required to traverse nodes, plus time to deliver package

        // Check if the package can be added to the vehicle route
        if ((route as any).canAddPackage(node.pkg, node, travelTime, timeWindow, driverBreak)) {
            (route as any).addNode(node, travelCost, travelTime);
            remainingPackages.dequeue();
            route.updateEuclideanTime(deliveryTime);
            break;
        }
    }

    // 4. Test the fitness of the new offspring
    let newFitness = 0;
    for (const route of clonedOffspring.routes) {
        newFitness += routeFitness(route);
    }

    // If new fitness has less than 2 penalties, prevent early convergence
    if (newFitness < 999) {
        return clonedOffspring;
    } else {
        // If the new offspring has more than 2 penalties, return the original offspring
        remainingPackages.enqueue(node);
        return offspring;
    }
}