import { Vehicle } from "@/types/vehicle";
import { calculateDistance } from "./graph";
import { Package } from "@/types/package";
import { Node } from "./graph";
import { estimateDuration } from "../../scheduling/create-schedules";

// Model of one individual vehicle route
export class VehicleRoute {
    public nodes: Node[] = [];
    public totalCost: number = 0; // distance in miles
    public currentWeight: number = 0;
    public currentVolume: number = 0;
    public totalTime: number = 0;  // in minutes

    constructor(
        public vehicle: Vehicle,
        public depotNode: Node, // depot node
    ) {
        this.nodes.push(depotNode);
    }

    // Check if the vehicle can add a package to the route
    canAddPackage(pkg: Package, pkgNode: Node, timeRequired: number, timeWindow: number): boolean {
        // calculate distance to travel from last node to depot
        const travelCost = calculateDistance(pkgNode, this.depotNode);

        // calculate time required to travel from last node to depot
        const timeRequiredToDepot = estimateDuration(travelCost);

        return (
            this.currentWeight + pkg.weight <= this.vehicle.max_load &&
            this.currentVolume + pkg.volume <= this.vehicle.max_volume &&
            this.totalTime + timeRequired + timeRequiredToDepot <= (timeWindow * 60) // convert timeWindow to minutes
        );
    }

    // Check if the vehicle can add a group of packages to the route
    canAddGroup(pkgGroup: Node[], timeRequired: number, timeWindow: number): boolean {
        let groupWeight = 0;
        let groupVolume = 0;

        // All packages have same address so cost is the same
        const travelCost = calculateDistance(pkgGroup[0], this.depotNode);

        // calculate time required to travel from last node to depot
        const timeRequiredToDepot = estimateDuration(travelCost);

        // Total up the weight and volume of the group
        for (const pkgNode of pkgGroup) {
            if (!pkgNode.pkg) continue;

            // add up weight and volume of group
            groupWeight += pkgNode.pkg.weight;
            groupVolume += pkgNode.pkg.volume;
        }

        return (
            this.currentWeight + groupWeight <= this.vehicle.max_load &&
            this.currentVolume + groupVolume <= this.vehicle.max_volume &&
            this.totalTime + timeRequired + timeRequiredToDepot <= (timeWindow * 60) // convert timeWindow to minutes
        );
    }


    addNode(node: Node, cost: number, timeRequired: number): void {
        this.nodes.push(node);
        this.totalCost += cost;
        this.totalTime += timeRequired;
        if (node.pkg) {
            this.currentWeight += node.pkg.weight;
            this.currentVolume += node.pkg.volume;
        }
    }

    // Close the route by adding the depot node
    closeRoute(depot: Node): void {
        const lastNode = this.nodes[this.nodes.length - 1];
        const cost = calculateDistance(lastNode, depot);
        this.totalCost += cost;
        this.nodes.push(depot);
    }
}

export class VRPSolution {
    public routes: VehicleRoute[] = [];

    addRoute(route: VehicleRoute): void {
        this.routes.push(route);
    }

    get totalCost(): number {
        return this.routes.reduce((sum, route) => sum + route.totalCost, 0);
    }
}