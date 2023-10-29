import { UUID } from "crypto";
import { Vehicle } from "@/types/vehicle";
import { Package } from "@/types/package";

class Node {
    constructor(
        public pkg: Package | null,
        public coordinates: [number, number],
        public isDepot: boolean = false  // Identifier to check if the node is a depot
    ) { }
}

class Edge {
    constructor(
        public node1: Node,
        public node2: Node,
        public cost: number
    ) { }
}

class Graph {
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

// Helper function to calculate distance between two nodes
function calculateDistance(node1: Node, node2: Node): number {
    const dx = node1.coordinates[0] - node2.coordinates[0];
    const dy = node1.coordinates[1] - node2.coordinates[1];
    return Math.sqrt(dx * dx + dy * dy);
}

// Exported function to create graph from supplied data
export async function createGraph(packages: Package[], depotCoordinates: [number,number]): Promise<Graph> {
    const graph = new Graph();

    // Create node for depot, starting point and end point
    const depotNode = new Node(null, depotCoordinates, true);  // Mark as depot

    graph.addNode(depotNode);  // Ensure the depot node is added to the graph

    // Create nodes for each package
    for (const pkg of packages) {
        const coordinates: [number, number] = [
            pkg.recipient_address_lat || 0,
            pkg.recipient_address_lng || 0
        ];
        graph.addNode(new Node(pkg, coordinates));
    }

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

    return graph;
}

