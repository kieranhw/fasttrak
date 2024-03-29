import { Package } from "@/types/package";
import { Vehicle } from "@/types/vehicle";
import { Graph, Node, Edge, createGraph, calculateDistance } from '../../models/graph';
import { VehicleRoute, VRPSolution } from '../../models/vrp';
import { calculateTraversalMins } from "../../../scheduling/create-schedules";
import { PriorityQueue } from "../../../scheduling/priority-queue";
import { ScheduleProfile } from "@/types/schedule-profile";
import { calculateCentroidFromNodes, calculateCentroidNodeDistance, findShortestPathForNodes, kMeans } from "./k-means-utils";

/***
 * Geospatial Density Clustering
 * 
 * Sort packages into priority queue, then allocate to n clusters based on geospatial density
 *  1. Initialise priority queue to maintain order of packages
 *  2. Create clusters based on geospatial density equal to number of vehicles
 *  3. Allocate packages to N clusters using KMeans, returning the clusters as priority queues
 *  4. For each cluster, allocate packages from the respective priority queue to the vehicle, once first constraint 
 *     is met dequeue the package back to main queue. Continue to iterate priority queue and try to allocate the rest of the packages
 *  5. close the routes back to the depot 
 *  6. Return the solution, with the lefotver packages remaining unallocated
 * 
 * Constraints: time window, vehicle capacity (weight and volume)
 * 
 * @param graph Graph of packages and depot
 * @param vehicles Array of available vehicles
 * @param timeWindow Number of hours to deliver packages
 * @returns VRPSolution, results in the minimum required number of vehicles to service all packages
 */
export async function geospatialClustering(graph: Graph, vehicles: Vehicle[], profile: ScheduleProfile, distanceMultiplier: number, avgSpeed: number): Promise<[VRPSolution, PriorityQueue]> {
    const solution = new VRPSolution()
    solution.loadMetrics(avgSpeed, distanceMultiplier);
    const availableVehicles = [...vehicles];

    console.log(graph.nodes.length + " nodes kmeans")


    const timeWindowHours = profile.time_window - 0.25;
    const deliveryTime = profile.delivery_time;

    // Step 1: Sort packages into priority queue
    const mainQueue = new PriorityQueue;
    graph.nodes.forEach(node => {
        if (node.pkg) {
            mainQueue.enqueue(node);
        }
    });

    const backupQueue = new PriorityQueue;

    // Step 2: Create clusters equal to number of vehicles
    const numberOfClusters = availableVehicles.length;

    // Step 3: Perform K-Means clustering to n clusters
    const clusterPriorityQueues = kMeans(mainQueue, numberOfClusters);

    // print length of each queue
    for (const queue of clusterPriorityQueues) {
        console.log("Cluster queues")
        console.log(queue.getData().length);
    }

    // Step 4: Allocate priority queue clusters to vehicles
    // For each cluster, allocate packages from the respective priority queue to the vehicle until the first constraint is met
    for (const [index, vehicle] of Array.from(availableVehicles.entries())) {
        // Get the cluster queue for the current vehicle
        const clusterQueue = clusterPriorityQueues[index];

        // Create a new route for the vehicle cluster
        const route = new VehicleRoute(vehicle, graph.depot as Node, profile);
        route.distanceMultiplier = distanceMultiplier;
        route.avgSpeed = avgSpeed;

        // Iterate through the current cluster queue and try to allocate the packages
        while (!clusterQueue.isEmpty()) {
            const node = clusterQueue.peek(); // Peek at the next package in the queue
            let nextNode = clusterQueue.peek(1);
            if (!node) break;

            if (nextNode == undefined) {
                // set next node to depot
                const depotNode = graph.depot as Node;
                nextNode = depotNode;
            }

            if (nextNode) {
                // Calculate the travel cost and time required to travel from the last node in the route to the next node
                const actualDistance = calculateDistance(node, nextNode, distanceMultiplier);
                const travelTime = calculateTraversalMins(actualDistance, avgSpeed) + deliveryTime;

                // Check if the package can be added to the vehicle route
                if (node.pkg && route.canAddPackage(node.pkg, node, travelTime, timeWindowHours)) {
                    // Remove the package from the cluster queue and add it to the vehicle route
                    route.addNode(node, travelTime);
                    clusterQueue.dequeue();
                } else {
                    // If the package cannot be added to the vehicle, requeue the package to main queue
                    // Continue to next package in cluster queue
                    clusterQueue.dequeue();
                    mainQueue.enqueue(node);
                }
            }

            route.updateMeasurements(deliveryTime);
        }

        // Find shortest path for the route
        const shortestPath = findShortestPathForNodes(route.nodes, graph.depot as Node);
        route.nodes = shortestPath;
        route.updateMeasurements(deliveryTime);

        solution.addRoute(route);
    }



    // Try to allocate leftover packages to vehicles
    while (!mainQueue.isEmpty()) {
        const node = mainQueue.peek(); // Peek at the next package in the queue

        if (!node) {
            break;
        };

        // Iterate solution routes, find centroid for each route and sort the route based on closest to node first
        const routeCentroids = solution.routes.map(route => {
            const centroid = calculateCentroidFromNodes(route.nodes);
            return { route, centroid };
        });

        // Sort routeCentroids by distance to node
        routeCentroids.sort((a, b) => {
            const distanceA = calculateCentroidNodeDistance(a.centroid, node);
            const distanceB = calculateCentroidNodeDistance(b.centroid, node);
            return distanceA - distanceB;
        });

        // Iterate route centroids trying to add a package to each route, if not possible, continue to next route
        for (const { route } of routeCentroids) {
            if (route.actualTimeMins > timeWindowHours * 60) {
                // skip this route if it cannot accommodate a package
                continue;
            }

            // Calculate the travel cost and time required to travel from the last node in the route to the next node
            const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], node, distanceMultiplier);
            const travelTime = calculateTraversalMins(travelCost, avgSpeed) + deliveryTime; // Calculate time required to traverse nodes, plus time to deliver package

            // If travel cost is more than triple the average time to travel for this route, skip this route
            const averageTimeToTravel = route.actualTimeMins / route.nodes.length;
            if (travelCost < averageTimeToTravel * 3) continue;

            // Check if the package can be added to the vehicle route
            if (node.pkg && route.canAddPackage(node.pkg, node, travelTime, timeWindowHours)) {
                // Remove the package from the cluster queue and add it to the vehicle route
                await (route as any).addNode(node, travelTime);
                mainQueue.dequeue();
                break;
            }
            // Find shortest path
            const shortestPath = findShortestPathForNodes(route.nodes, graph.depot as Node);
            route.nodes = shortestPath;
            route.updateMeasurements(deliveryTime);
        }


        // If the package cannot be added to any route, dequeue the package indefinitely
        backupQueue.enqueue(node);
        mainQueue.dequeue();
    }

    // Step 4: Allocate leftover packages to vehicles
    // Try to add backup queue to each route, if cant fit in any of the routes, then dequeue indefinitely
    while (!backupQueue.isEmpty()) {
        const node = backupQueue.peek(); // Peek at the next package in the queue
        if (!node) break;;

        for (const route of solution.routes) {
            if (route.actualTimeMins > timeWindowHours * 60) {
                // skip this route if it cannot accommodate a package
                continue;
            }

            // Calculate the travel cost and time required to travel from the last node in the route to the next node
            const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], node);
            const travelTime = calculateTraversalMins(travelCost, avgSpeed) + deliveryTime; // Calculate time required to traverse nodes, plus time to deliver package

            // Check if the package can be added to the vehicle route
            if (node.pkg && route.canAddPackage(node.pkg, node, travelTime, timeWindowHours)) {
                // Remove the package from the cluster queue and add it to the vehicle route
                (route as any).addNode(node, travelCost, travelTime);
                backupQueue.dequeue();
                break;
            }

            // Find shortest path
            const shortestPath = findShortestPathForNodes(route.nodes, graph.depot as Node);
            route.nodes = shortestPath;
            route.updateMeasurements(deliveryTime);
        }

        // If the package cannot be added to any route, dequeue the package indefinitely
        mainQueue.enqueue(node);
        backupQueue.dequeue();
    }

    // Step 5: Allocate leftover packages to vehicles
    // Try to add backup queue to each route, if cant fit in any of the routes, then dequeue indefinitely
    while (!mainQueue.isEmpty()) {
        const node = backupQueue.peek(); // Peek at the next package in the queue
        if (!node) break;;

        for (const route of solution.routes) {
            if (route.actualTimeMins > timeWindowHours * 60) {
                // skip this route if it cannot accommodate a package
                continue;
            }

            // Calculate the travel cost and time required to travel from the last node in the route to the next node
            const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], node);
            const travelTime = calculateTraversalMins(travelCost, avgSpeed) + deliveryTime; // Calculate time required to traverse nodes, plus time to deliver package

            // Check if the package can be added to the vehicle route
            if (node.pkg && route.canAddPackage(node.pkg, node, travelTime, timeWindowHours)) {
                // Remove the package from the cluster queue and add it to the vehicle route
                (route as any).addNode(node, travelCost, travelTime);
                mainQueue.dequeue();
                break;
            }
            route.updateMeasurements(deliveryTime);
        }

        // If the package cannot be added to any route, dequeue the package indefinitely
        backupQueue.enqueue(node);
        mainQueue.dequeue();
    }

    // Step 4: Allocate leftover packages to vehicles
    // Try to add backup queue to each route, if cant fit in any of the routes, then dequeue indefinitely
    while (!backupQueue.isEmpty()) {
        const node = backupQueue.peek(); // Peek at the next package in the queue
        if (!node) break;;

        for (const route of solution.routes) {
            if (route.actualTimeMins > timeWindowHours * 60) {
                // skip this route if it cannot accommodate a package
                continue;
            }

            // Calculate the travel cost and time required to travel from the last node in the route to the next node
            const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], node);
            const travelTime = calculateTraversalMins(travelCost, avgSpeed) + deliveryTime; // Calculate time required to traverse nodes, plus time to deliver package

            // Check if the package can be added to the vehicle route
            if (node.pkg && route.canAddPackage(node.pkg, node, travelTime, timeWindowHours)) {
                // Remove the package from the cluster queue and add it to the vehicle route
                (route as any).addNode(node, travelCost, travelTime);
                backupQueue.dequeue();
                break;
            }

            // Find shortest path
            const shortestPath = findShortestPathForNodes(route.nodes, graph.depot as Node);
            route.nodes = shortestPath;
            route.updateMeasurements(deliveryTime);
        }

        // If the package cannot be added to any route, dequeue the package indefinitely
        mainQueue.enqueue(node);
        backupQueue.dequeue();
    }
    
    // Step 5: Allocate leftover packages to vehicles
    // Try to add backup queue to each route, if cant fit in any of the routes, then dequeue indefinitely
    while (!mainQueue.isEmpty()) {
        const node = backupQueue.peek(); // Peek at the next package in the queue
        if (!node) break;;

        for (const route of solution.routes) {
            if (route.actualTimeMins > timeWindowHours * 60) {
                // skip this route if it cannot accommodate a package
                continue;
            }

            // Calculate the travel cost and time required to travel from the last node in the route to the next node
            const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], node);
            const travelTime = calculateTraversalMins(travelCost, avgSpeed) + deliveryTime; // Calculate time required to traverse nodes, plus time to deliver package

            // Check if the package can be added to the vehicle route
            if (node.pkg && route.canAddPackage(node.pkg, node, travelTime, timeWindowHours)) {
                // Remove the package from the cluster queue and add it to the vehicle route
                (route as any).addNode(node, travelCost, travelTime);
                mainQueue.dequeue();
                break;
            }
            route.updateMeasurements(deliveryTime);
        }

        // If the package cannot be added to any route, dequeue the package indefinitely
        backupQueue.enqueue(node);
        mainQueue.dequeue();
    }

    // Step 4: Allocate leftover packages to vehicles
    // Try to add backup queue to each route, if cant fit in any of the routes, then dequeue indefinitely
    while (!backupQueue.isEmpty()) {
        const node = backupQueue.peek(); // Peek at the next package in the queue
        if (!node) break;;

        for (const route of solution.routes) {
            if (route.actualTimeMins > timeWindowHours * 60) {
                // skip this route if it cannot accommodate a package
                continue;
            }

            // Calculate the travel cost and time required to travel from the last node in the route to the next node
            const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], node);
            const travelTime = calculateTraversalMins(travelCost, avgSpeed) + deliveryTime; // Calculate time required to traverse nodes, plus time to deliver package

            // Check if the package can be added to the vehicle route
            if (node.pkg && route.canAddPackage(node.pkg, node, travelTime, timeWindowHours)) {
                // Remove the package from the cluster queue and add it to the vehicle route
                (route as any).addNode(node, travelCost, travelTime);
                backupQueue.dequeue();
                break;
            }

            // Find shortest path
            const shortestPath = findShortestPathForNodes(route.nodes, graph.depot as Node);
            route.nodes = shortestPath;
            route.updateMeasurements(deliveryTime);
        }

        // If the package cannot be added to any route, dequeue the package indefinitely
        mainQueue.enqueue(node);
        backupQueue.dequeue();
    }


    // Assuming all routes have been tried for initial package allocations
    let allocationAttempted = false;
    do {
        allocationAttempted = false; // Reset flag for each round

        for (const vehicleRoute of solution.routes) {
            if (mainQueue.isEmpty()) break; // No more packages to allocate

            const node = mainQueue.peek(); // Look at the next package without removing it
            if (!node) break; // Exit if there's nothing to peek at

            // Assuming `vehicleRoute` has a method `canAddNode` similar to `canAddPackage`
            // and you've already defined how to calculate travel time to the next node
            const nextNode = node; // For simplification, assume direct allocation without checking next node
            const actualDistance = calculateDistance(vehicleRoute.nodes[vehicleRoute.nodes.length - 1], nextNode, distanceMultiplier);
            const travelTime = calculateTraversalMins(actualDistance, avgSpeed) + deliveryTime;

            // Check if we can add the package to this vehicle's route considering constraints
            if (node.pkg && vehicleRoute.canAddPackage(node.pkg, node, travelTime, timeWindowHours)) {
                vehicleRoute.addNode(node, travelTime); // Assuming `addNode` updates route metrics accordingly
                mainQueue.dequeue(); // Successfully allocated, remove from queue
                allocationAttempted = true; // Mark that an allocation was successful in this round
            }
        }
    } while (allocationAttempted && !mainQueue.isEmpty());


    // Close each route and find the shortest path for each
    for (const route of solution.routes) {
        route.closeRoute(graph.depot as Node);
        const shortestPath = findShortestPathForNodes(route.nodes, graph.depot as Node);
        route.nodes = shortestPath;
        route.updateMeasurements(deliveryTime);
    }

    return [solution, mainQueue];
}


