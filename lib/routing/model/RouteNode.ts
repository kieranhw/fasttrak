import { Package } from "@/types/db/Package";
import { Graph } from "./Graph";
import { Location } from "@/types/Location";

export class RouteNode {
    constructor(
        public pkg: Package | null,
        public coordinates: Location,
        public isDepot: boolean = false  // Identifier to check if the node is a depot
    ) { }

    clone(): RouteNode {
        // Create a new Node instance with copied values
        return new RouteNode(this.pkg, { ...this.coordinates }, this.isDepot);
    }

    // Find the nearest neighbor by cost
    findNearestNeighbor(graph: Graph): RouteNode | null {
        // Initially, set nearestNode and minCost to null and Infinity, respectively
        let nearestNode: RouteNode | null = null;
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