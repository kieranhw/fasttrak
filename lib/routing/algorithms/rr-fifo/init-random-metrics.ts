import { Package } from "@/types/db/Package";
import { Vehicle } from "@/types/db/Vehicle";
import { Graph } from "@/lib/routing/model/Graph";
import { RouteNode } from '@/lib/routing/model/RouteNode';
import { Edge } from '@/lib/routing/model/Edge';
import { calculateDistance } from '@/lib/utils/calculate-distance';
import { VRPSolution } from "@/lib/routing/model/VRPSolution";
import { VehicleRoute } from "@/lib/routing/model/VehicleRoute";
import { calculateTraversalMins } from "../../../scheduling/create-schedules";
import { ScheduleProfile } from "@/types/db/ScheduleProfile";

/***
 * Initialise random metrics
 * 
 * This algorithm is a simple round-robin allocations which allocates the packages to the vehicles as first in first out.
 * 
 * The only use of this is to generate the average speed and distance multiplier metrics as part of the real world travel
 * estimation algorithm. 
 * 
 * This has not been designed to generate a full solution or fully respect the constraints because the real world travel
 * times are dependent on being supplied the average speed and distance multiplier. These multipliers are given as 
 * parameters to the subsequent algorithms.
 * 
 * @param graph Graph of nodes: packages and depot
 * @param vehicles Array of available vehicles
 * @param timeWindow Number of hours to deliver packages
 * @returns VRPSolution
 */
export async function initRandomMetrics(graph: Graph, vehicles: Vehicle[], profile: ScheduleProfile): Promise<VRPSolution> {
    const solution = new VRPSolution();
    const availableVehicles = [...vehicles];

    const timeWindow = profile.time_window;
    const deliveryTime = profile.delivery_time;

    // Sort packages by date added (FIFO) and filter out depot node
    const sortedPackages = graph.nodes
        .filter(node => !node.isDepot)
        .sort((a, b) =>
            (new Date(a.pkg?.date_added || 0).getTime()) - (new Date(b.pkg?.date_added || 0).getTime())
        );

    // Group packages by recipient address
    const addressToPackagesMap: Record<string, RouteNode[]> = {};
    for (const pkgNode of sortedPackages) {
        const address = pkgNode.pkg?.recipient_address || '';
        if (!addressToPackagesMap[address]) {
            addressToPackagesMap[address] = [];
        }
        addressToPackagesMap[address].push(pkgNode);
    }

    const groupedPackages: RouteNode[][] = Object.values(addressToPackagesMap);

    let vehicleIndex = 0;

    // Round robin allocation
    // For each group of packages, find a vehicle that can fit the group
    // If no vehicle, split group into two and try again
    // If no vehicle can fit package, package is not allocated
    for (const pkgGroup of groupedPackages) {
        let vehiclesChecked = 0;
        while (vehiclesChecked < availableVehicles.length) {
            const route = solution.routes[vehicleIndex] || new VehicleRoute(availableVehicles[vehicleIndex], graph.depot as RouteNode, profile);
            const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], pkgGroup[0]);
            const timeRequired = calculateTraversalMins(travelCost) + deliveryTime;

            if (route.canAddGroup(pkgGroup, timeRequired, timeWindow)) {
                for (const pkgNode of pkgGroup) {
                    const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], pkgNode);
                    const timeRequired = calculateTraversalMins(travelCost) + deliveryTime;
                    route.addNode(pkgNode, timeRequired);
                }
                if (!solution.routes[vehicleIndex]) {
                    solution.addRoute(route);
                }
                break;
            } else {
                vehicleIndex = (vehicleIndex + 1) % availableVehicles.length;
                vehiclesChecked++;
            }
        }
        // If all vehicles checked and no fit
        if (vehiclesChecked === availableVehicles.length) {
            if (pkgGroup.length > 1) {
                // Split group into two and try again
                const halfIndex = Math.ceil(pkgGroup.length / 2);
                const firstHalf = pkgGroup.slice(0, halfIndex);
                const secondHalf = pkgGroup.slice(halfIndex);
                groupedPackages.push(firstHalf);
                groupedPackages.push(secondHalf);
            } else {
                // Add to remaining packages array
            }
        }
    }

    // Close routes back to depot
    for (const route of solution.routes) {
        route.closeRoute(graph.depot as RouteNode);
    }
    
    return solution;
}

