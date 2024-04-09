import { Package } from "@/types/db/Package";
import { Vehicle } from "@/types/db/Vehicle";
import { Graph } from "@/lib/routing/model/Graph";
import { RouteNode } from '@/lib/routing/model/RouteNode';
import { Edge } from '@/lib/routing/model/Edge';
import { VRPSolution } from "@/lib/routing/model/VRPSolution";
import { VehicleRoute } from "@/lib/routing/model/VehicleRoute";
import { calculateTraversalMins } from "../../../scheduling/create-schedules";
import { ScheduleProfile } from "@/types/db/ScheduleProfile";
import { calculateDistance } from "@/lib/utils/calculate-distance";

/***
 * Round Robin Allocation 2
 * 
 * Sort packages into FIFO, then allocate to vehicles in a round robin fashion
 * Group packages that are going to the same address and find vehicle, if no vehicle then split group into smaller groups
 * 
 * Constraints: time window, vehicle capacity (weight and volume)
 * 
 * @param graph Graph of packages and depot
 * @param vehicles Array of available vehicles
 * @param timeWindow Number of hours to deliver packages
 * @returns VRPSolution, results in the minimum required number of vehicles to service all packages
 */
export async function roundRobinAllocation(graph: Graph, vehicles: Vehicle[], profile: ScheduleProfile, distanceMultiplier: number, avgSpeed: number): Promise<VRPSolution> {

    const solution = new VRPSolution();
    const availableVehicles = [...vehicles];
    const remainingPackages = [];

    const timeWindow = profile.time_window - 0.25;
    const deliveryTime = profile.delivery_time;

    // Sort packages by date added (FIFO) and filter out depot node
    let sortedPackages = graph.nodes
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
            const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], pkgGroup[0], distanceMultiplier);
            const timeRequired = calculateTraversalMins(travelCost, avgSpeed) + deliveryTime;
            console.log(route.canAddGroup(pkgGroup, timeRequired, timeWindow))
            solution.loadMetrics(avgSpeed, distanceMultiplier);

            // Half fill the vehicles, to prevent early overloading
            if (route.canAddGroup(pkgGroup, timeRequired, timeWindow)) {
                for (const pkgNode of pkgGroup) {
                    const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], pkgNode, distanceMultiplier);
                    const timeRequired = calculateTraversalMins(travelCost, avgSpeed) + deliveryTime;
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
                remainingPackages.push(pkgGroup[0]);
            }
        }
    }

    // Close routes back to depot
    for (const route of solution.routes) {
        route.closeRoute(graph.depot as RouteNode);
        route.updateMeasurements(profile.delivery_time);
    }

    console.log("RANDOM REMAINING PACKAGES: " + remainingPackages.length)
    console.log("RANDOM SOLUTION PACKAGES: " + solution.numberOfPackages)

    return solution;
}

