import { Package } from "@/types/db/Package";
import { Vehicle } from "@/types/db/Vehicle";
import { Graph } from "@/lib/routing/model/Graph";
import { RouteNode } from '@/lib/routing/model/RouteNode';
import { Edge } from '@/lib/routing/model/Edge';
import { VRPSolution } from "@/lib/routing/model/VRPSolution";
import { VehicleRoute } from "@/lib/routing/model/VehicleRoute";
import { calculateTravelTime } from "@/lib/utils/calculate-travel-time";
import { ScheduleProfile } from "@/types/db/ScheduleProfile";
import { calculateDistance } from "@/lib/utils/calculate-distance";

/***
 * RR FIFO Allocation
 * 
 * Sort packages into FIFO order, then allocate to vehicles in a round robin fashion.
 * Group packages that are going to the same address and find vehicle, if no vehicle then split group into smaller groups.
 * 
 * @param graph Graph of packages and depot
 * @param vehicles Array of available vehicles
 * @param timeWindow Number of hours to deliver packages
 * @returns VRPSolution of VehicleRoutes.
 */
export async function roundRobinAllocation(routeNodes: RouteNode[], vehicles: Vehicle[], profile: ScheduleProfile, distanceMultiplier: number, avgSpeed: number): Promise<VRPSolution> {
    // Initialise solution and load metrics
    const solution = new VRPSolution();
    solution.loadMetrics(avgSpeed, distanceMultiplier);
    const timeWindowHours = profile.time_window * 0.95; // Time window with 5% buffer
    const deliveryTime = profile.delivery_time;

    const availableVehicles = [...vehicles];
    const remainingPackages = []; // Packages that could not be allocated

    // Sort nodes containing packages by date added (FIFO) and filter out depot node
    const sortedPackageNodes = routeNodes
        .filter(node => !node.isDepot)
        .sort((a, b) =>
            (new Date(a.pkg?.date_added || 0).getTime()) - (new Date(b.pkg?.date_added || 0).getTime())
        );
    
    const depot = routeNodes.find(node => node.isDepot)!;

    // Group packages by recipient address
    const addressToPackagesMap: Record<string, RouteNode[]> = {};
    for (const pkgNode of sortedPackageNodes) {
        const address = pkgNode.pkg?.recipient_address || '';
        if (!addressToPackagesMap[address]) {
            addressToPackagesMap[address] = [];
        }
        addressToPackagesMap[address].push(pkgNode);
    }

    const groupedPackages: RouteNode[][] = Object.values(addressToPackagesMap);

    /**
     * For each package group, check all available vehicles for one that can fit the group
     * If no vehicle can fit, split group into two and try again
     * If no vehicle can fit a single package, package is not allocated
     */
    let currVehicle = 0;
    for (const pkgGroup of groupedPackages) {
        let vehiclesChecked = 0;

        while (vehiclesChecked < availableVehicles.length) {
            // Get the vehicles route or create a new one
            const route = solution.routes[currVehicle] || new VehicleRoute(availableVehicles[currVehicle], depot, profile);

            // Calculate time required to travel from last node in the route to the potential new node
            const distanceMiles = calculateDistance(route.nodes[route.nodes.length - 1], pkgGroup[0], distanceMultiplier);
            const timeRequiredMins = calculateTravelTime(distanceMiles, avgSpeed) + deliveryTime;
            solution.loadMetrics(avgSpeed, distanceMultiplier);

            // Check if the route can accommodate the package group
            if (route.canAddGroup(pkgGroup, timeRequiredMins, timeWindowHours)) {
                // Add each package in the group to the route
                for (const pkgNode of pkgGroup) {
                    const distanceMiles = calculateDistance(route.nodes[route.nodes.length - 1], pkgNode, distanceMultiplier);
                    const timeRequiredMins = calculateTravelTime(distanceMiles, avgSpeed) + deliveryTime;
                    route.addNode(pkgNode, timeRequiredMins);
                }

                // Add route to solution if not already added
                if (!solution.routes[currVehicle]) {
                    solution.addRoute(route);
                }

                // Move to next package group
                break;
            } else {
                // Move to next vehicle
                currVehicle = (currVehicle + 1) % availableVehicles.length;
                vehiclesChecked++;
            }
        }

        // If all vehicles checked, and they can't fit the package group
        if (vehiclesChecked === availableVehicles.length) {
            if (pkgGroup.length > 1) {
                // Split into two groups and try again
                const halfIndex = Math.ceil(pkgGroup.length / 2);
                const firstHalf = pkgGroup.slice(0, halfIndex);
                const secondHalf = pkgGroup.slice(halfIndex);
                groupedPackages.push(firstHalf);
                groupedPackages.push(secondHalf);
            } else {
                // Package can't be allocated - add to remaining packages
                remainingPackages.push(pkgGroup[0]);
            }
        }
    }

    solution.cleanRoutes();

    // Close routes back to depot
    for (const route of solution.routes) {
        route.closeRoute(depot as RouteNode);
        route.updateMeasurements(profile.delivery_time);
    }

    return solution;
}

