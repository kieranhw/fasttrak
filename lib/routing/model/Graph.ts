import { UUID } from "crypto";
import { Vehicle } from "@/types/db/Vehicle";
import { Package } from "@/types/db/Package";
import { Location } from "@/types/Location";
import { RouteNode } from "./RouteNode";
import { Edge } from "./Edge";
import { calculateDistance } from "@/lib/utils/calculate-distance";

/**
 * Graph to model the vehicle routing network.
 */
export class Graph {
    public nodes: RouteNode[] = [];
    public edges: Edge[] = [];
    public depot: RouteNode | null = null;  // Reference to the depot node

    addNode(node: RouteNode): void {
        this.nodes.push(node);
        if (node.isDepot) {
            this.depot = node;  // Update the depot reference if the node is a depot
        }
    }

    addEdge(edge: Edge): void {
        this.edges.push(edge);
    }
}







// Exported function to create graph from supplied data
export async function createGraph(
    packages: Package[],
    depotCoordinates: Location,
    complete: boolean = false,
    multiplier: number = 0): Promise<Graph> {

    const graph = new Graph();

    // Create node for depot, starting point and end point
    const depotNode = new RouteNode(null, depotCoordinates, true);  // Mark as depot

    graph.addNode(depotNode);  // Ensure the depot node is added to the graph

    // Create nodes for each package
    for (const pkg of packages) {
        const coordinates: Location = {
            lat: pkg.recipient_address_lat as number,
            lng: pkg.recipient_address_lng as number
        };
        graph.addNode(new RouteNode(pkg, coordinates));
    }

    // If euclidean create the function calculateDistance as the euclidean distance
    const dist = (node1: RouteNode, node2: RouteNode) => calculateDistance(node1, node2, multiplier !== 0 ? multiplier : undefined);

    if (complete) {
        // Connect edges to all nodes
        for (const node1 of graph.nodes) {
            for (const node2 of graph.nodes) {
                if (node1 !== node2) {
                    // Add an edge between node1 and node2 with distance as cost
                    graph.addEdge(new Edge(node1, node2, dist(node1, node2)));
                }
            }
        }
    } else {
        // Connect edges to the nearest 5 neighbours for each node, including the depot
        for (const node of graph.nodes) {
            if (node !== depotNode) {
                const distances = graph.nodes.map(otherNode => ({
                    node: otherNode,
                    distance: dist(node, otherNode)
                })).filter(distObj => distObj.node !== node && distObj.node !== depotNode);  // Exclude current node and depot node

                distances.sort((a, b) => a.distance - b.distance);

                // Connect to the depot node
                graph.addEdge(new Edge(node, depotNode, dist(node, depotNode)));

                // Connect to the 25 nearest neighbors
                for (let i = 0; i < 25; i++) {
                    if (distances[i]) {  // Check if distances[i] exists before accessing its properties
                        const nearestNode = distances[i].node;
                        graph.addEdge(new Edge(node, nearestNode, distances[i].distance));
                    }
                }
            }
        }
    }

    return graph;
}
