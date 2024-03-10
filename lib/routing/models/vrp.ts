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
        public scheduleProfile: ScheduleProfile,
    ) {
        this.nodes.push(depotNode);
    }

    clone(): VehicleRoute {
        const clonedRoute = new VehicleRoute(this.vehicle, this.depotNode.clone(), this.scheduleProfile);
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
    canAddPackage(pkg: Package, pkgNode: Node, timeRequired: number, timeWindowhours: number): boolean {
        // update measurements
        this.updateMeasurements(this.scheduleProfile.delivery_time);
        
        // Convert tw to minutes
        const timeWindowMins = (timeWindowhours * 60);

        // calculate distance to travel from potential new node to depot
        const actualDistanceToDepot = calculateDistance(pkgNode, this.depotNode, this.distanceMultiplier);
        const timeToDepot = calculateTraversalMins(actualDistanceToDepot, this.avgSpeed);

        return (
            this.currentWeight + pkg.weight < this.vehicle.max_load &&
            this.currentVolume + pkg.volume < this.vehicle.max_volume &&
            this.actualTimeMins + timeRequired + timeToDepot <= timeWindowMins
        );
    }

    // Check if the vehicle can add a group of packages to the route
    canAddGroup(pkgGroup: Node[], timeRequired: number, timeWindowHours: number): boolean {
        let groupWeight = 0;
        let groupVolume = 0;

        let timeWindowMins = (timeWindowHours * 60);

        // All packages have same address so cost is the same
        const actualDistanceToDepot = calculateDistance(pkgGroup[0], this.depotNode, this.distanceMultiplier);

        // calculate time required to travel from last node to depot
        const timeToDepot = calculateTraversalMins(actualDistanceToDepot, this.avgSpeed);

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
            this.actualTimeMins + timeRequired + timeToDepot <= timeWindowMins
        );
    }


    addNode(node: Node, timeRequired: number): void {
        this.nodes.push(node);
        this.updateMeasurements(this.scheduleProfile.delivery_time);
    }

    // Close the route by adding the depot node
    closeRoute(depot: Node): void {
        const lastNode = this.nodes[this.nodes.length - 1];
        const cost = calculateDistance(lastNode, depot);
        const timeRequired = calculateTraversalMins(cost, this.avgSpeed);
        this.eucTimeMins += timeRequired;
        this.eucDistanceMiles += cost;
        this.nodes.push(depot);
        this.updateMeasurements(this.scheduleProfile.delivery_time);
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
        this.actualDistanceMiles = 0;
        this.actualTimeMins = 0;

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
            this.actualTimeMins += this.scheduleProfile.delivery_time * this.nodes.length; // add 3 minutes for each package TODO: add real time
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

    loadMetrics(speed: number, distanceMultiplier: number): void {
        // set metrics in routes
        this.routes.forEach(route => {
            route.avgSpeed = speed;
            route.distanceMultiplier = distanceMultiplier;
        });

        // set metrics in this 
        this.avgSpeed = speed;
        this.distanceMultiplier = distanceMultiplier;

        this.updateRouteMeasurements();
    }

    updateRouteMeasurements(): void {
        this.routes.forEach(route => {
            route.updateMeasurements(route.scheduleProfile.delivery_time);
        });
    }

    get euclideanDistance(): number {
        return this.routes.reduce((sum, route) => sum + route.eucDistanceMiles, 0);
    }


    get totalVolume(): number {
        this.updateRouteMeasurements();
        return this.routes.reduce((sum, route) => sum + route.currentVolume, 0);
    }

    get totalWeight(): number {
        this.updateRouteMeasurements();
        return this.routes.reduce((sum, route) => sum + route.currentWeight, 0);
    }

    get actualTime(): number {
        this.updateRouteMeasurements();
        return this.routes.reduce((sum, route) => sum + route.actualTimeMins, 0);
    }

    get actualDistance(): number {
        this.updateRouteMeasurements();
        return this.routes.reduce((sum, route) => sum + route.actualDistanceMiles, 0);
    }

    get numberOfPackages(): number {
        return this.routes.reduce((sum, route) => sum + route.nodes.length - 1, 0);
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
        clonedSolution.updateRouteMeasurements();

        return clonedSolution;
    }
}