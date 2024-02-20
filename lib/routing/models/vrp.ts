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
    public eucTimeMins: number = 0;  // euclidean time in minutes
    public eucDistanceMiles: number = 0; // euclidean distance in miles
    public currentWeight: number = 0; // in kg
    public currentVolume: number = 0; // in cubic meters

    // actual measurements
    public avgSpeed: number = 0; // in miles per hour (V bar)
    public distanceMultiplier: number = 0; // DM
    public actualTimeMins: number = 0;  // in minutes
    public actualDistanceMiles: number = 0; // distance in miles

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

        clonedRoute.eucTimeMins = this.eucTimeMins;
        clonedRoute.eucDistanceMiles = this.eucDistanceMiles;
        clonedRoute.currentWeight = this.currentWeight;
        clonedRoute.currentVolume = this.currentVolume;

        clonedRoute.avgSpeed = this.avgSpeed;
        clonedRoute.distanceMultiplier = this.distanceMultiplier;
        clonedRoute.actualTimeMins = this.actualTimeMins;
        clonedRoute.actualDistanceMiles = this.actualDistanceMiles;

        return clonedRoute;
    }

    // Check if the vehicle can add a package to the route
    canAddPackage(pkg: Package, pkgNode: Node, timeRequired: number, timeWindow: number, driverBreak: number): boolean {

        // Convert tw to minutes
        const timeWindowMins = (timeWindow * 60) - driverBreak;

        // calculate distance to travel from potential new node to depot
        const costToDepot = calculateDistance(pkgNode, this.depotNode);
        const timeRequiredToDepot = calculateTraversalMins(costToDepot, this.avgSpeed);

        return (
            this.currentWeight + pkg.weight <= this.vehicle.max_load &&
            this.currentVolume + pkg.volume <= this.vehicle.max_volume &&
            this.actualTimeMins + timeRequired + timeRequiredToDepot <= timeWindowMins
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
        const timeRequiredToDepot = calculateTraversalMins(travelCost, this.avgSpeed);

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
            this.eucTimeMins + timeRequired + timeRequiredToDepot <= timeWindowMins  // convert timeWindow to minutes
        );
    }


    addNode(node: Node, cost: number, timeRequired: number): void {
        this.nodes.push(node);
        this.eucDistanceMiles += cost;
        this.eucTimeMins += timeRequired;
        if (node.pkg) {
            this.currentWeight += node.pkg.weight;
            this.currentVolume += node.pkg.volume;
        }
    }

    // Close the route by adding the depot node
    closeRoute(depot: Node): void {
        const lastNode = this.nodes[this.nodes.length - 1];
        const cost = calculateDistance(lastNode, depot);
        const timeRequired = calculateTraversalMins(cost, this.avgSpeed);
        this.eucTimeMins += timeRequired;
        this.eucDistanceMiles += cost;
        this.nodes.push(depot);
    }

    updateEuclideanTime(deliveryTime: number): void {
        this.eucTimeMins = 0;
        this.eucDistanceMiles = 0;
        for (let i = 0; i < this.nodes.length - 1; i++) {
            const node = this.nodes[i];
            const nextNode = this.nodes[i + 1];
            const distanceMiles = calculateDistance(node, nextNode);
            const travelTimeMins = calculateTraversalMins(distanceMiles, this.avgSpeed);

            let timeRequired = 0;
            if (nextNode.isDepot) {
                timeRequired = travelTimeMins;
            } else {
                timeRequired = travelTimeMins + deliveryTime;
            }
            this.eucTimeMins += timeRequired;
            this.eucDistanceMiles += distanceMiles;
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
        this.eucTimeMins = 0;
        this.eucDistanceMiles = 0;
        this.currentVolume = 0;
        this.currentWeight = 0;

        // Sum euclidean time, euclidean distance, volume, weight
        for (let i = 0; i < this.nodes.length - 1; i++) {
            const node = this.nodes[i];
            const nextNode = this.nodes[i + 1];
            const distance = calculateDistance(node, nextNode);
            const traversalTime = calculateTraversalMins(distance, this.avgSpeed);

            let timeRequired = 0;
            if (nextNode.isDepot) {
                timeRequired = traversalTime;
            } else {
                timeRequired = traversalTime + deliveryTime;
            }

            // Add the total time and distance
            this.eucTimeMins += timeRequired;
            this.eucDistanceMiles += distance;

            // Add up the weight and volume measurements
            if (node.pkg) {
                this.currentWeight += node.pkg.weight;
                this.currentVolume += node.pkg.volume;
            }
        }

        //console.log("UPDATING")
        //console.log("Average Speed: ", this.avgSpeed)
        //console.log("Distance Multiplier: ", this.distanceMultiplier)
        //console.log("Distance: ", this.eucDistanceMiles)
        //console.log("Time: ", this.eucTimeMins)
//
        // Update the actual time
        if (this.avgSpeed !== 0 && this.distanceMultiplier !== 0) {
            this.actualDistanceMiles = this.eucDistanceMiles * this.distanceMultiplier;
            this.actualTimeMins = ((this.actualDistanceMiles / this.avgSpeed) * 60); // calculate time in minutes
            this.actualTimeMins += 3 * this.nodes.length; // add 3 minutes for each package TODO: add real time
        }
        //console.log("RESULTS")
        //console.log("Actual Distance: ", this.actualDistanceMiles)
        //console.log("Actual Time: ", this.actualTimeMins)

    }

}

export class VRPSolution {
    public routes: VehicleRoute[] = [];
    public avgSpeed: number = 0; // V bar
    public distanceMultiplier: number = 0; // DM

    addRoute(route: VehicleRoute): void {
        this.routes.push(route);
    }

    initMetrics(speed: number, distanceMultiplier: number, timeMultiplier: number): void {
        // set metrics in routes
        this.routes.forEach(route => {
            route.avgSpeed = speed;
            route.distanceMultiplier = distanceMultiplier;
        });

        // set metrics in this 
        this.avgSpeed = speed;
        this.distanceMultiplier = distanceMultiplier;

        this.updateRouteMetrics();
    }

    updateRouteMetrics(): void {
        this.routes.forEach(route => {
            route.updateMeasurements(3);
        });
    }

    get euclideanDistance(): number {
        return this.routes.reduce((sum, route) => sum + route.eucDistanceMiles, 0);
    }

    get actualDistance(): number {
        return this.routes.reduce((sum, route) => sum + route.actualDistanceMiles, 0);
    }

    // Clone including metrics
    clone(): VRPSolution {
        const clonedSolution = new VRPSolution();
        clonedSolution.avgSpeed = this.avgSpeed;
        clonedSolution.distanceMultiplier = this.distanceMultiplier;

        // Clone routes and ensure they are updated with the solution's metrics
        this.routes.forEach(route => {
            const clonedRoute = route.clone();
            clonedRoute.avgSpeed = this.avgSpeed;
            clonedRoute.distanceMultiplier = this.distanceMultiplier;
            clonedSolution.addRoute(clonedRoute);
        });

        // Ensure all route metrics are updated according to the solution metrics
        clonedSolution.updateRouteMetrics();

        return clonedSolution;
    }
}