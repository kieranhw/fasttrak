import { DeliverySchedule, DeliveryStatus } from "@/types/delivery-schedule";
import { Package } from "@/types/package";
import { Vehicle } from "@/types/vehicle";
import { roundRobinAllocation } from "./algorithms/algorithm-2";
import { Edge, Graph, Node, calculateDistance, createGraph } from "./model/graph";
import { VRPSolution, VehicleRoute } from "./model/vrp";


export async function createSchedules(vehiclesData: Vehicle[], packagesData: Package[], date: Date) {
    console.log("Scheduling packages...");

    // Create a graph where each node represents a package, and each edge represents a delivery location
    // Nodes are connected to the depot node (depot node is the starting point and end point), and 5 nearest neighbors
    const graph = await createGraph(packagesData, { lat: 53.403782, lng: -2.971970 }, true);

    if (graph) {
        console.log("Graph created successfully!");
    } else {
        console.error("Error creating graph!");
    }

    // Initialize an empty array to hold delivery schedules for each vehicle
    let schedules: DeliverySchedule[] = [];

    const vrpSolution = await roundRobinAllocation(graph, vehiclesData, 8);

    for (const route of vrpSolution.routes) {
        let schedule: DeliverySchedule = {
            vehicle_id: route.vehicle.vehicle_id,
            vehicle: route.vehicle,
            package_order: route.nodes.map(node => node.pkg as Package),
            delivery_date: date,
            start_time: date,
            status: DeliveryStatus.Scheduled,
            num_packages: route.nodes.length-2, // minus 2 to exclude depot nodes
            estimated_duration_mins: estimateDuration(route.totalCost),
            actual_duration_mins: 0,
            distance_miles: route.totalCost.toFixed(2) as unknown as number,
            load_weight: route.currentWeight,
            load_volume: route.currentVolume,
            created_at: new Date()
        };

        schedules.push(schedule);
    }

    console.log("Schedules: ", schedules);
    return schedules;
}

// Function to estimate duration to travel from miles, average speed
export function estimateDuration(distance: number): number {
    const averageSpeed = 10; // mph
    return (distance / averageSpeed) * 60; // minutes
}

export async function createGraphAndSolutionFromSchedule(schedules: DeliverySchedule[]): Promise<[Graph, VRPSolution]> {
    const graph = new Graph();
    const solution = new VRPSolution();

    // Create nodes for depot, assuming all schedules share the same depot
    const depotCoordinates = { lat: 53.403782, lng: -2.971970 }; 
    const depotNode = new Node(null, depotCoordinates, true);
    graph.addNode(depotNode);
    console.log(schedules)

    // Create nodes for packages and edges from depot to each package
    for (const schedule of schedules) {
        console.log(schedule.package_order)

        for (const pkg of schedule.package_order) {
            const coordinates = { lat: pkg.recipient_address_lat as number, lng: pkg.recipient_address_lng as number };
            const pkgNode = new Node(pkg, coordinates);
            graph.addNode(pkgNode);
            graph.addEdge(new Edge(depotNode, pkgNode, calculateDistance(depotNode, pkgNode)));
        }
    }

    // Create VehicleRoutes and VRPSolution from schedules
    for (const schedule of schedules) {
        const route = new VehicleRoute(schedule.vehicle, depotNode);
        for (const pkg of schedule.package_order) {
            const pkgNode = graph.nodes.find(node => node.pkg?.package_id === pkg.package_id);
            if (pkgNode) {
                const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], pkgNode);
                route.addNode(pkgNode, travelCost, 0);  // Assume timeRequired is 0 for simplicity
            }
        }
        route.closeRoute(depotNode);
        solution.addRoute(route);
    }

    return [graph, solution];
}