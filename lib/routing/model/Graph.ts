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

    constructor(packages?: Package[], depotCoordinates?: Location, complete: boolean = false, multiplier: number = 0) {
        if (depotCoordinates) {
            // Initialize depot node and add it to the graph only if depotCoordinates are provided
            const depotNode = new RouteNode(null, depotCoordinates, true);
            this.addNode(depotNode);
        }

        if (packages) {
            // Initialize nodes for each package only if packages are provided
            packages.forEach(pkg => {
                const coordinates: Location = {
                    lat: pkg.recipient_address_lat as number,
                    lng: pkg.recipient_address_lng as number
                };
                this.addNode(new RouteNode(pkg, coordinates));
            });
        }

        // Connect nodes based on the 'complete' flag only if there are nodes in the graph
        if (this.nodes.length > 0 && this.depot) {
            if (complete) {
                this.connectAllNodes(multiplier);
            } else {
                this.connectNearestNeighbours(this.depot, multiplier);
            }
        }
    }

    

    addNode(node: RouteNode): void {
        this.nodes.push(node);
        if (node.isDepot) {
            this.depot = node;
        }
    }

    addEdge(edge: Edge): void {
        this.edges.push(edge);
    }

    private connectAllNodes(multiplier: number): void {
        this.nodes.forEach(node1 => {
            this.nodes.forEach(node2 => {
                if (node1 !== node2) {
                    const distance = calculateDistance(node1, node2, multiplier !== 0 ? multiplier : undefined);
                    this.addEdge(new Edge(node1, node2, distance));
                }
            });
        });
    }

    private connectNearestNeighbours(depotNode: RouteNode, multiplier: number): void {
        this.nodes.forEach(node => {
            if (node !== depotNode) {
                const distances = this.nodes.map(otherNode => ({
                    node: otherNode,
                    distance: calculateDistance(node, otherNode, multiplier !== 0 ? multiplier : undefined)
                })).filter(distObj => distObj.node !== node && distObj.node !== depotNode);

                distances.sort((a, b) => a.distance - b.distance);

                this.addEdge(new Edge(node, depotNode, calculateDistance(node, depotNode, multiplier !== 0 ? multiplier : undefined)));

                // Connect to the nearest neighbors, adjust this logic as needed
                for (let i = 0; i < Math.min(distances.length, 25); i++) {
                    this.addEdge(new Edge(node, distances[i].node, distances[i].distance));
                }
            }
        });
    }
}
