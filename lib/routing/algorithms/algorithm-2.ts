import { Package } from "@/types/package";
import { Vehicle } from "@/types/vehicle";
import { Graph, Node, Edge, createGraph, calculateDistance } from '../model/graph';
import { VehicleRoute, VRPSolution } from '../model/vrp';
import { estimateDuration } from "../create-schedules";

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
export async function roundRobinAllocation(graph: Graph, vehicles: Vehicle[], timeWindow: number): Promise<VRPSolution> {
    const solution = new VRPSolution();
    const availableVehicles = [...vehicles];

    const sortedPackages = graph.nodes
        .filter(node => !node.isDepot)
        .sort((a, b) =>
            (new Date(a.pkg?.date_added || 0).getTime()) - (new Date(b.pkg?.date_added || 0).getTime())
        );

    // Group packages by recipient address
    const addressToPackagesMap: Record<string, Node[]> = {};
    for (const pkgNode of sortedPackages) {
        const address = pkgNode.pkg?.recipient_address || '';
        if (!addressToPackagesMap[address]) {
            addressToPackagesMap[address] = [];
        }
        addressToPackagesMap[address].push(pkgNode);
    }

    const groupedPackages: Node[][] = Object.values(addressToPackagesMap);

    let vehicleIndex = 0;

    for (const pkgGroup of groupedPackages) {
        let vehiclesChecked = 0;
        while (vehiclesChecked < availableVehicles.length) {
            const route = solution.routes[vehicleIndex] || new VehicleRoute(availableVehicles[vehicleIndex], graph.depot as Node);
            const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], pkgGroup[0]);
            const timeRequired = estimateDuration(travelCost);

            if (route.canAddGroup(pkgGroup, timeRequired, timeWindow)) {
                for (const pkgNode of pkgGroup) {
                    const travelCost = calculateDistance(route.nodes[route.nodes.length - 1], pkgNode);
                    const timeRequired = estimateDuration(travelCost);
                    route.addNode(pkgNode, travelCost, timeRequired);
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
            
            // If group size more than 1, split group into two and try again
            if (pkgGroup.length > 1) {
                const halfIndex = Math.ceil(pkgGroup.length / 2);
                const firstHalf = pkgGroup.slice(0, halfIndex);
                const secondHalf = pkgGroup.slice(halfIndex);
                groupedPackages.push(firstHalf);
                groupedPackages.push(secondHalf);
                console.warn(`No space for package group of size ${pkgGroup.length} . Splitting in two`)
            } else {
                console.error('No available vehicle for package:', pkgGroup.map(pkg => pkg.pkg));
            }
        }
    }

    // Close routes back to depot
    for (const route of solution.routes) {
        route.closeRoute(graph.depot as Node);
    }

    return solution;
}

