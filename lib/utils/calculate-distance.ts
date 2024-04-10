import { RouteNode } from "../routing/model/RouteNode";

/**
 * Calculates the distance between two nodes using the Haversine formula. Converts the Euclidean distance to 
 * non-euclidean distance if a multiplier is provided.
 * @param node1 First node
 * @param node2 Second node
 * @param distanceMultiplier Multiplier metric to convert to non-euclidean distance
 * @returns Distance between nodes in miles
 */
export function calculateDistance(node1: RouteNode, node2: RouteNode, distanceMultiplier?: number): number {
    if (!node1 || !node2) {
        console.error('One or both nodes are undefined:', node1, node2);
        return 0;
    }
    
    const dx = node1.coordinates.lat - node2.coordinates.lat;
    const dy = node1.coordinates.lng - node2.coordinates.lng;

    const dist = Math.sqrt(dx * dx + dy * dy);

    const miles = dist * 69.172;

    // Convert to non-euclidean distance if multiplier
    if (distanceMultiplier) {
        return miles * distanceMultiplier;
    }

    return miles;
}