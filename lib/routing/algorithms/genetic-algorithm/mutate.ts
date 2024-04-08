import { VehicleRoute } from "../../model/VehicleRoute";
import { RouteNode } from '@/lib/routing/model/RouteNode';
import { calculateDistance } from "@/lib/utils/calculate-distance";
import { ScheduleProfile } from "@/types/db/ScheduleProfile";

export function mutate(clonedRoute: VehicleRoute, depotNode: RouteNode): VehicleRoute {
    // Randomly select a mutation strategy
    const mutationType = Math.floor(Math.random() * 4);

    switch (mutationType) {
        case 0:
            swapNodes(clonedRoute);
            break;
        case 1:
            reverseSegment(clonedRoute);
            break;
        case 2:
            shiftNode(clonedRoute);
            break;
        case 3:
            findShortestPathForNodes(clonedRoute, depotNode);
    }

    clonedRoute.updateMeasurements(clonedRoute.scheduleProfile.delivery_time);

    return clonedRoute;
}

export function swapNodes(route: VehicleRoute): void {
    if (route.nodes.length > 4) { // Ensure there are enough nodes to swap (excluding start/end depot)
        const index1 = getRandomIndex(route);
        let index2 = getRandomIndex(route);

        // Ensure we maintain grouped packages and have two distinct indices
        while (route.nodes[index1].coordinates === route.nodes[index2].coordinates && index1 === index2) {
            index2 = getRandomIndex(route); 
        }

        // Swap nodes
        [route.nodes[index1], route.nodes[index2]] = [route.nodes[index2], route.nodes[index1]];
    }
}

export function findShortestPathForNodes(route: VehicleRoute, depot: RouteNode): VehicleRoute {

    const path: RouteNode[] = [];
    let remainingNodes = [...route.nodes];
    let currentNode = depot;

    while (remainingNodes.length > 0) {
        const nearestNode = findNearestNeighbour(currentNode, remainingNodes, route.distanceMultiplier);
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

export function findNearestNeighbour(currentNode: RouteNode, nodes: RouteNode[], distanceMultiplier: number): RouteNode | undefined {
    let nearestNode: RouteNode | undefined;
    let shortestDistance = Number.MAX_VALUE;

    for (const node of nodes) {
        const distance = calculateDistance(currentNode, node) * distanceMultiplier;
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestNode = node;
        }
    }

    return nearestNode;
}

export function reverseSegment(route: VehicleRoute): void {
    if (route.nodes.length > 4) { // Ensure there's a segment to reverse
        let index1 = getRandomIndex(route);
        let index2 = getRandomIndex(route);

        // Ensure we maintain grouped packages and have two distinct indices
        while (route.nodes[index1].coordinates === route.nodes[index2].coordinates && index1 === index2) {
            index2 = getRandomIndex(route); 
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

export function shiftNode(route: VehicleRoute): void {
    if (route.nodes.length > 4) {
        const index = getRandomIndex(route);
        const node = route.nodes.splice(index, 1)[0]; // Remove the node
        const newIndex = getRandomIndex(route);
        route.nodes.splice(newIndex, 0, node); // Insert the node at a new position
    }
}

export function getRandomIndex(route: VehicleRoute): number {
    // Generate a random index for route manipulation, excluding the first and last node (depot)
    return Math.floor(Math.random() * (route.nodes.length - 2)) + 1;
}