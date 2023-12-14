import { DeliverySchedule } from "@/types/delivery-schedule";
import { Edge, Graph, Node, calculateDistance, createGraph } from "../routing/model/graph";
import { VRPSolution, VehicleRoute } from "../routing/model/vrp";

export async function createGraphAndSolutionFromScheduleArray(schedules: DeliverySchedule[]): Promise<[Graph, VRPSolution]> {
    const graph = new Graph();
    const solution = new VRPSolution();

    // TODO: Get real depot coords
    // Create nodes for depot, assuming all schedules share the same depot
    const depotCoordinates = { lat: 53.403782, lng: -2.971970 };
    const depotNode = new Node(null, depotCoordinates, true);
    graph.addNode(depotNode);
    console.log(schedules)

    // Create nodes for packages and edges from depot to each package
    for (const schedule of schedules) {
        console.log(schedule.package_order)

        for (const pkg of schedule.package_order) {
            // catch error if pkg.recipient_address_lat or lng is null

            if (pkg) {
                const coordinates = { lat: pkg.recipient_address_lat as number, lng: pkg.recipient_address_lng as number };
                const pkgNode = new Node(pkg, coordinates);
                graph.addNode(pkgNode);
                graph.addEdge(new Edge(depotNode, pkgNode, calculateDistance(depotNode, pkgNode)));
            }

        }
    }

    // Create VehicleRoutes and VRPSolution from schedules
    for (const schedule of schedules) {
        const route = new VehicleRoute(schedule.vehicle, depotNode);
        for (const pkg of schedule.package_order) {
            if (pkg) {
                const pkgNode = graph.nodes.find(node => node.pkg?.package_id === pkg.package_id);
                if (pkgNode) {
                    const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], pkgNode);
                    route.addNode(pkgNode, travelCost, 0);  // Assume timeRequired is 0 for simplicity
                }
            }

        }
        route.closeRoute(depotNode);
        solution.addRoute(route);
    }

    return [graph, solution];
}

// Create graph and solution from singular schedule
export async function createGraphAndSolutionFromSchedule(schedule: DeliverySchedule): Promise<[Graph, VRPSolution]> {
    const graph = new Graph();
    const solution = new VRPSolution();

    // Create nodes for depot, assuming all schedules share the same depot
    // TODO: Change depot coordinates by pulling from DB
    const depotCoordinates = { lat: 53.403782, lng: -2.971970 };
    const depotNode = new Node(null, depotCoordinates, true);
    graph.addNode(depotNode);

    // Create nodes for packages and edges from depot to each package
    for (const pkg of schedule.package_order) {
        const coordinates = { lat: pkg.recipient_address_lat as number, lng: pkg.recipient_address_lng as number };
        const pkgNode = new Node(pkg, coordinates);
        graph.addNode(pkgNode);
        graph.addEdge(new Edge(depotNode, pkgNode, calculateDistance(depotNode, pkgNode)));
    }

    // Create VehicleRoute and VRPSolution from schedule
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

    return [graph, solution];
}