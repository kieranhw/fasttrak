import { RouteNode } from "../routing/model/RouteNode";

// Calculate distance between nodes using the Haversine formula
export function calculateDistance(node1: RouteNode, node2: RouteNode, multiplier?: number): number {
    if (!node1 || !node2) {
        console.error('One or both nodes are undefined:', node1, node2);
        return 0;
    }
    
    const dx = node1.coordinates.lat - node2.coordinates.lat;
    const dy = node1.coordinates.lng - node2.coordinates.lng;

    const dist = Math.sqrt(dx * dx + dy * dy);

    const miles = dist * 69.172;

    // Convert to non-euclidean distance if multiplier
    if (multiplier) {
        return miles * multiplier;
    }

    return miles;
}