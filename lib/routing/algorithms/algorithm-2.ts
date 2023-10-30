

import { DeliverySchedule, DeliveryStatus } from "@/types/delivery-schedule";
import { Package } from "@/types/package";
import { Vehicle } from "@/types/vehicle";
import { Graph, Node, Edge, createGraph, calculateDistance } from '../graph';
import { VehicleRoute, VRPSolution } from '../vrp';
import { estimateDuration } from "../create-schedules";



export function roundRobinAllocation(
    graph: Graph,
    vehicles: Vehicle[],
    timeWindow: number,
): VRPSolution {
    const solution = new VRPSolution();
    const availableVehicles = [...vehicles];
    const sortedPackages = graph.nodes
        .filter(node => !node.isDepot)
        .sort((a, b) =>
            (new Date(a.pkg?.date_added || 0).getTime()) - (new Date(b.pkg?.date_added || 0).getTime())
        );

    let vehicleIndex = 0;

    for (const pkgNode of sortedPackages) {
        let vehiclesChecked = 0;
        while (vehiclesChecked < availableVehicles.length) {
            const route = solution.routes[vehicleIndex] || new VehicleRoute(availableVehicles[vehicleIndex], graph.depot as Node);
            const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], pkgNode);
            const timeRequired = estimateDuration(travelCost); 
            if (route.canAddPackage(pkgNode.pkg as Package, pkgNode, timeRequired, timeWindow)) {
                route.addNode(pkgNode, travelCost, timeRequired);
                if (!solution.routes[vehicleIndex]) {
                    solution.addRoute(route);
                }
                break;
            } else {
                vehicleIndex = (vehicleIndex + 1) % availableVehicles.length;
                vehiclesChecked++;
            }
        }
        if (vehiclesChecked === availableVehicles.length) {
            console.error('No available vehicle for package:', pkgNode.pkg);
        }
    }

    // Return back to depot
    for (const route of solution.routes) {
        route.closeRoute(graph.depot as Node);
    }

    return solution;
}

