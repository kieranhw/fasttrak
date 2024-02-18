import { Vehicle } from "@/types/vehicle";
import { calculateDistance } from "./graph";
import { Package } from "@/types/package";
import { Node } from "./graph";
import { calculateTraversalMins } from "../../scheduling/create-schedules";
import { ScheduleProfile } from "@/types/schedule-profile";

// Model of one individual vehicle route
export class VehicleRoute {
    public nodes: Node[] = [];

    // measurements
    public totalTime: number = 0;  // in minutes
    public totalDistance: number = 0; // distance in miles
    public currentWeight: number = 0; // in kg
    public currentVolume: number = 0; // in cubic meters

    constructor(
        public vehicle: Vehicle,
        public depotNode: Node, // depot node
    ) {
        this.nodes.push(depotNode);
    }

    clone(): VehicleRoute {
        const clonedRoute = new VehicleRoute(this.vehicle, this.depotNode.clone());
        // Properly clone each Node
        clonedRoute.nodes = this.nodes.map(node => node.clone());
        clonedRoute.totalDistance = this.totalDistance;
        clonedRoute.currentWeight = this.currentWeight;
        clonedRoute.currentVolume = this.currentVolume;
        clonedRoute.totalTime = this.totalTime;
        return clonedRoute;
    }

    // Check if the vehicle can add a package to the route
    canAddPackage(pkg: Package, pkgNode: Node, timeRequired: number, timeWindow: number, driverBreak: number): boolean {

        // Convert tw to minutes
        const timeWindowMins = (timeWindow * 60) - driverBreak;

        // calculate distance to travel from potential new node to depot
        const costToDepot = calculateDistance(pkgNode, this.depotNode);
        const timeRequiredToDepot = calculateTraversalMins(costToDepot);

        return (
            this.currentWeight + pkg.weight <= this.vehicle.max_load &&
            this.currentVolume + pkg.volume <= this.vehicle.max_volume &&
            this.totalTime + timeRequired + timeRequiredToDepot <= timeWindowMins
        );
    }

    // Check if the vehicle can add a group of packages to the route
    canAddGroup(pkgGroup: Node[], timeRequired: number, timeWindow: number, driverBreak: number): boolean {
        let groupWeight = 0;
        let groupVolume = 0;

        let timeWindowMins = (timeWindow * 60) - driverBreak;

        // All packages have same address so cost is the same
        const travelCost = calculateDistance(pkgGroup[0], this.depotNode);

        // calculate time required to travel from last node to depot
        const timeRequiredToDepot = calculateTraversalMins(travelCost);

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
            this.totalTime + timeRequired + timeRequiredToDepot <= timeWindowMins  // convert timeWindow to minutes
        );
    }


    addNode(node: Node, cost: number, timeRequired: number): void {
        this.nodes.push(node);
        this.totalDistance += cost;
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
        const timeRequired = calculateTraversalMins(cost);
        this.totalTime += timeRequired;
        this.totalDistance += cost;
        this.nodes.push(depot);
    }

    updateTime(deliveryTime: number): void {
        this.totalTime = 0;
        for (let i = 0; i < this.nodes.length - 1; i++) {
            const node = this.nodes[i];
            const nextNode = this.nodes[i + 1];
            const cost = calculateDistance(node, nextNode);
            const travelTime = calculateTraversalMins(cost);

            let timeRequired = 0;
            if (nextNode.isDepot) {
                timeRequired = travelTime;
            } else {
                timeRequired = travelTime + deliveryTime;
            }
            this.totalTime += timeRequired;
        }
    }

    /***
     * Update all measurements of the route, to be used only during the genetic algorithm
     * when the route is being modified i.e. crossover, mutation, insertion
     * 
     * @param deliveryTime - time required to deliver a package
     * @returns void
     */
    updateMeasurements(deliveryTime: number): void {
        this.totalTime = 0;
        this.totalDistance = 0;
        this.currentVolume = 0;
        this.currentWeight = 0;
        for (let i = 0; i < this.nodes.length - 1; i++) {
            const node = this.nodes[i];
            const nextNode = this.nodes[i + 1];
            const distance = calculateDistance(node, nextNode);
            const travelTime = calculateTraversalMins(distance);

            let timeRequired = 0;
            if (nextNode.isDepot) {
                timeRequired = travelTime;
            } else {
                timeRequired = travelTime + deliveryTime;
            }
            
            // Add the total time and distance
            this.totalTime += timeRequired;
            this.totalDistance += distance;

            // Add up the weight and volume measurements
            if (node.pkg) {
                this.currentWeight += node.pkg.weight;
                this.currentVolume += node.pkg.volume;
            }
        }
    }

}

export class VRPSolution {
    public routes: VehicleRoute[] = [];

    addRoute(route: VehicleRoute): void {
        this.routes.push(route);
    }

    get totalCost(): number {
        return this.routes.reduce((sum, route) => sum + route.totalDistance, 0);
    }

    clone(): VRPSolution {
        const clonedSolution = new VRPSolution();
        this.routes.forEach(route => {
            clonedSolution.addRoute(route.clone());
        });
        return clonedSolution;
    }
}