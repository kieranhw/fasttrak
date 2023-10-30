import { Vehicle } from "@/types/vehicle";
import { calculateDistance } from "./graph";
import { Package } from "@/types/package";
import { Node } from "./graph";
import { estimateDuration } from "../create-schedules";

export class VehicleRoute {
    public nodes: Node[] = [];
    public totalCost: number = 0; // distance
    public currentWeight: number = 0;
    public currentVolume: number = 0;
    public totalTime: number = 0;  // in minutes

    constructor(
        public vehicle: Vehicle,
        public depotNode: Node, // depot node
    ) {
        this.nodes.push(depotNode);
    }

    canAddPackage(pkg: Package, pkgNode: Node, timeRequired: number, timeWindow: number): boolean {
        console.log({
            vehicle: this.vehicle,
            pkg,
            currentWeight: this.currentWeight,
            currentVolume: this.currentVolume,
            maxLoad: this.vehicle.max_load,
            maxVolume: this.vehicle.max_volume
        });

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

    addNode(node: Node, cost: number, timeRequired: number): void {
        this.nodes.push(node);
        this.totalCost += cost;
        this.totalTime += timeRequired;
        if (node.pkg) {
            this.currentWeight += node.pkg.weight;
            this.currentVolume += node.pkg.volume;
        }
    }

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