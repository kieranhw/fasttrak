import { Vehicle } from "@/types/db/Vehicle";
import { Graph } from "@/lib/routing/model/Graph";
import { RouteNode } from '@/lib/routing/model/RouteNode';
import { calculateDistance } from '@/lib/utils/calculate-distance';
import { VRPSolution } from "@/lib/routing/model/VRPSolution";
import { VehicleRoute } from "@/lib/routing/model/VehicleRoute";
import { calculateTravelTime } from "@/lib/utils/calculate-travel-time";
import { ScheduleProfile } from "@/types/db/ScheduleProfile";
import { VRPMetrics } from "../hybrid-algorithm";
import { initialiseMetrics } from "@/lib/google-maps/client/directions";

/***
 * Generate VRP metrics using random initialisation.
 * 
 * Generates a VRPSolution using the same approach as the RR FIFO algorithm, without respecting time constraints. Uses the solution
 * to calculate the average speed and distance multiplier metrics.

 * @param graph Graph of packages and depot
 * @param vehicles Array of available vehicles
 * @param timeWindow Number of hours to deliver packages
 * @returns VRPSolution of VehicleRoutes.
 */
export async function generateMetrics(graph: Graph, vehicles: Vehicle[], profile: ScheduleProfile): Promise<VRPMetrics> {
    const solution = new VRPSolution();
    const availableVehicles = [...vehicles];

    const timeWindowHours = profile.time_window; // Double the time window to allocate packages as many as possible
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

    for (const pkgGroup of groupedPackages) {
        let vehiclesChecked = 0;
        while (vehiclesChecked < availableVehicles.length) {
            const route = solution.routes[vehicleIndex] || new VehicleRoute(availableVehicles[vehicleIndex], graph.depot as RouteNode, profile);
            const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], pkgGroup[0]);
            const timeRequired = calculateTravelTime(travelCost) + deliveryTime;

            if (route.canAddGroup(pkgGroup, timeRequired, timeWindowHours)) {
                for (const pkgNode of pkgGroup) {
                    const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], pkgNode);
                    const timeRequired = calculateTravelTime(travelCost) + deliveryTime;
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

    const metrics: VRPMetrics = await initialiseMetrics(solution);

    return metrics;
}

