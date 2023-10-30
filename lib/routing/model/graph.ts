import { UUID } from "crypto";
import { Vehicle } from "@/types/vehicle";
import { Package } from "@/types/package";

interface Location {
    lat: number;
    lng: number;
}

export class Graph {
    public nodes: Node[] = [];
    public edges: Edge[] = [];
    public depot: Node | null = null;  // Reference to the depot node

    addNode(node: Node): void {
        this.nodes.push(node);
        if (node.isDepot) {
            this.depot = node;  // Update the depot reference if the node is a depot
        }
    }

    addEdge(edge: Edge): void {
        this.edges.push(edge);
    }
}

export class Node {
    constructor(
        public pkg: Package | null,
        public coordinates: Location,
        public isDepot: boolean = false  // Identifier to check if the node is a depot
    ) { }

    // Method to find the nearest neighbor by cost
    findNearestNeighbor(graph: Graph): Node | null {
        // Initially, set nearestNode and minCost to null and Infinity, respectively
        let nearestNode: Node | null = null;
        let minCost: number = Infinity;

        // Iterate through all edges in the graph
        for (const edge of graph.edges) {
            // Check if the edge is connected to the current node
            if (edge.node1 === this || edge.node2 === this) {
                // Determine the neighboring node
                const neighbor = edge.node1 === this ? edge.node2 : edge.node1;
                // Update nearestNode and minCost if the cost of the current edge is lower than minCost
                if (edge.cost < minCost) {
                    nearestNode = neighbor;
                    minCost = edge.cost;
                }
            }
        }

        return nearestNode;
    }
}

export class Edge {
    constructor(
        public node1: Node,
        public node2: Node,
        public cost: number
    ) { }
}

// Helper function to calculate distance between two nodes
export function calculateDistance(node1: Node, node2: Node): number {
    const dx = node1.coordinates.lat - node2.coordinates.lat;
    const dy = node1.coordinates.lng - node2.coordinates.lng

    const dist = Math.sqrt(dx * dx + dy * dy);

    const miles = dist * 69.172;

    return miles;
}

// Exported function to create graph from supplied data
export async function createGraph(packages: Package[], depotCoordinates: Location, complete: boolean = false): Promise<Graph> {
    const graph = new Graph();

    // Create node for depot, starting point and end point
    const depotNode = new Node(null, depotCoordinates, true);  // Mark as depot

    graph.addNode(depotNode);  // Ensure the depot node is added to the graph

    // Create nodes for each package
    for (const pkg of packages) {
        const coordinates: Location = {
            lat: pkg.recipient_address_lat as number,
            lng: pkg.recipient_address_lng as number
        };
        graph.addNode(new Node(pkg, coordinates));
    }

    if (complete) {
        // Connect edges to all nodes
        for (const node1 of graph.nodes) {
            for (const node2 of graph.nodes) {
                if (node1 !== node2) {
                    graph.addEdge(new Edge(node1, node2, calculateDistance(node1, node2)));
                }
            }
        }
    } else {
        // Connect edges to the nearest 5 neighbours for each node, including the depot
        for (const node of graph.nodes) {
            if (node !== depotNode) {
                const distances = graph.nodes.map(otherNode => ({
                    node: otherNode,
                    distance: calculateDistance(node, otherNode)
                })).filter(distObj => distObj.node !== node && distObj.node !== depotNode);  // Exclude current node and depot node

                distances.sort((a, b) => a.distance - b.distance);

                // Connect to the depot node
                graph.addEdge(new Edge(node, depotNode, calculateDistance(node, depotNode)));

                // Connect to the five nearest neighbors
                for (let i = 0; i < 5; i++) {
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
