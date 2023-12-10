import { Package } from "@/types/package";
import { Vehicle } from "@/types/vehicle";
import { Graph, Node, Edge, createGraph, calculateDistance } from '../model/graph';
import { VehicleRoute, VRPSolution } from '../model/vrp';
import { estimateDuration } from "../create-schedules";

/***
 * Geospatial Density Clustering
 * 
 * Sort packages into priority queue, then allocate to n clusters based on geospatial density
 *  1. Sort priority queue: Time since date added >= 5 working days -> Express -> Redelivery -> Date added
 *  2. Create clusters based on geospatial density equal to number of vehicles
 *  4. Allocate packages to clusters
 *  3. Allocate clusters to vehicles
 *  4. Check constraints and try to re-allocate to other vehicle if necessary, else ignore package
 * 
 * Constraints: time window, vehicle capacity (weight and volume)
 * 
 * @param graph Graph of packages and depot
 * @param vehicles Array of available vehicles
 * @param timeWindow Number of hours to deliver packages
 * @returns VRPSolution, results in the minimum required number of vehicles to service all packages
 */
export async function geospatialClustering(graph: Graph, vehicles: Vehicle[], timeWindow: number): Promise<VRPSolution> {
    const solution = new VRPSolution();
    const availableVehicles = [...vehicles];

    // Step 1: Sort packages by date added
    const sortedPackages = graph.nodes
        .filter(node => !node.isDepot && node.pkg) // Ensure package exists
        .sort((a, b) => {
            if (a.pkg && b.pkg) {
                return new Date(a.pkg.date_added).getTime() - new Date(b.pkg.date_added).getTime();
            }
            return 0;
        });

    // Step 2: Generate coordinates array from the nodes
    const coordinates: Coordinate[] = sortedPackages.map(node => [node.coordinates.lat, node.coordinates.lng]);

    // Step 3: Perform K-Means clustering
    const numberOfClusters = Math.min(availableVehicles.length, coordinates.length);
    const clusters = kMeans(coordinates, numberOfClusters);

    // Step 4: Map clustered coordinates back to nodes
    const clusteredNodes: Node[][] = clusters.map(cluster => {
        return cluster.flatMap(coord => {
            return sortedPackages.filter(pkgNode => pkgNode.coordinates.lat === coord[0] && pkgNode.coordinates.lng === coord[1]);
        });
    });

    // Step 5: Allocate clusters to vehicles
    for (const [index, vehicle] of Array.from(availableVehicles.entries())) {
        const route = new VehicleRoute(vehicle, graph.depot as Node);
        let cluster = clusteredNodes[index % clusteredNodes.length];

        // Find the shortest path for the cluster
        cluster = findShortestPathForCluster(cluster, graph.depot as Node);

        // Add nodes to route
        for (const node of cluster) {
            const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], node);
            const timeRequired = estimateDuration(travelCost);

            if ((route as any).canAddPackage(node.pkg, node, timeRequired, timeWindow)) {
                (route as any).addNode(node, travelCost, timeRequired);
            }
            // Check other routes to see if they can add the package
            else {
                let vehicleChecked = index + 1;
                console.log("Trying to add package to other route")

                while (vehicleChecked < availableVehicles.length) {
                    const otherRoute = solution.routes[vehicleChecked];
                    if (otherRoute && (otherRoute as any).canAddPackage(node.pkg, node, timeRequired, timeWindow)) {
                        (otherRoute as any).addNode(node, travelCost, timeRequired);
                        break;
                    }
                    vehicleChecked++;
                }
            }
        }

        solution.addRoute(route);
    }

    // Step 6: Close routes back to depot
    for (const route of solution.routes) {
        route.closeRoute(graph.depot as Node);
    }

    return solution;
}

// Type declarations
type Coordinate = [number, number];
type Cluster = Coordinate[];

// calculateCentroid function
function calculateCentroid(cluster: Cluster): Coordinate {
    const sum = cluster.reduce((acc, coord) => {
        acc[0] += coord[0];
        acc[1] += coord[1];
        return acc;
    }, [0, 0]);

    return [sum[0] / cluster.length, sum[1] / cluster.length];
}

// assignToClusters function
function assignToClusters(coordinates: Coordinate[], centroids: Coordinate[]): Cluster[] {
    const clusters: Cluster[] = centroids.map(() => []);

    coordinates.forEach(coord => {
        let minDistance = Number.MAX_VALUE;
        let closestCentroidIndex = 0;

        centroids.forEach((centroid, index) => {
            const distance = Math.hypot(centroid[0] - coord[0], centroid[1] - coord[1]);
            if (distance < minDistance) {
                minDistance = distance;
                closestCentroidIndex = index;
            }
        });

        clusters[closestCentroidIndex].push(coord);
    });

    return clusters;
}

// kMeans function
function kMeans(coordinates: Coordinate[], k: number, maxIterations = 100): Cluster[] {
    let centroids = coordinates.slice(0, k);
    let clusters: Cluster[] = [];
    let iterations = 0;

    while (iterations < maxIterations) {
        const newClusters = assignToClusters(coordinates, centroids);

        let hasConverged = newClusters.every((cluster, i) => {
            return JSON.stringify(cluster) === JSON.stringify(clusters[i]);
        });

        if (hasConverged) {
            break;
        }

        clusters = newClusters;
        centroids = clusters.map(calculateCentroid);
        iterations++;
    }

    return clusters;
}

function findNearestNeighbour(currentNode: Node, nodes: Node[]): Node | undefined {
    let nearestNode: Node | undefined;
    let shortestDistance = Number.MAX_VALUE;

    for (const node of nodes) {
        const distance = calculateDistance(currentNode, node);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestNode = node;
        }
    }

    return nearestNode;
}

function findShortestPathForCluster(cluster: Node[], depot: Node): Node[] {
    const path: Node[] = [];
    let remainingNodes = [...cluster];
    let currentNode = depot;

    while (remainingNodes.length > 0) {
        const nearestNode = findNearestNeighbour(currentNode, remainingNodes);
        if (nearestNode) {
            path.push(nearestNode);
            remainingNodes = remainingNodes.filter(node => node !== nearestNode);
            currentNode = nearestNode;
        } else {
            break; // No more nearest nodes found
        }
    }

    return path;
}