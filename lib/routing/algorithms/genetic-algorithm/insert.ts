import { PriorityQueue } from "@/lib/scheduling/priority-queue";
import { VRPSolution, VehicleRoute } from "../../model/vrp";
import { routeFitness } from "./fitness";
import { calculateTraversalMins } from "@/lib/scheduling/create-schedules";
import { calculateDistance } from "../../model/Graph";
import { ScheduleProfile } from "@/types/db/ScheduleProfile";

export function insert(offspring: VRPSolution, remainingPackages: PriorityQueue , profile: ScheduleProfile): VRPSolution {
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

    // Iterate the routes as shuffled order, and try to add the package
    for (const route of clonedOffspring.routes.sort(() => Math.random() - 0.5)){
        // Check if the route can accommodate the package
        const deliveryTime = profile.delivery_time;
        const timeWindow = (profile.time_window * 60) - 15;

        // Update the measurements of the route
        route.updateMeasurements(deliveryTime);

        if (route.actualTimeMins < timeWindow && route.currentVolume + node.pkg!.volume <= route.vehicle.max_volume && route.currentWeight + node.pkg!.weight <= route.vehicle.max_load) {
            // Calculate the travel cost and time required to travel from the last node in the route to the new node
            const travelCost = calculateDistance(route.nodes[route.nodes.length - 2], node, route.distanceMultiplier);
            const travelTime = calculateTraversalMins(travelCost) + deliveryTime; // Calculate time required to traverse nodes, plus time to deliver package

            // Check if the package can be added to the vehicle route
            if (route.canAddPackage(node.pkg!, node, travelTime, timeWindow)) {
                route.addNode(node, travelTime);
                remainingPackages.dequeue();
                break;
            }
        }
    }

    // 4. Test the fitness of the new offspring
    let newFitness = 0;
    for (const route of clonedOffspring.routes) {
        newFitness += routeFitness(route);
    }

    // If new fitness has no penalties, return
    if (newFitness < 499) {
        return clonedOffspring;
    } else {
        // If the new offspring has more than 2 penalties, return the original offspring
        remainingPackages.enqueue(node);
        return offspring;
    }
}