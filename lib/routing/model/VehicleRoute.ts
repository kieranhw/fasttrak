import { Vehicle } from "@/types/db/Vehicle";
import { Package } from "@/types/db/Package";
import { Graph } from "@/lib/routing/model/Graph";
import { RouteNode } from '@/lib/routing/model/RouteNode';
import { Edge } from '@/lib/routing/model/Edge';
import { calculateDistance } from '@/lib/utils/calculate-distance';
import { calculateTravelTime } from '@/lib/utils/calculate-travel-time';
import { ScheduleProfile } from "@/types/db/ScheduleProfile";

/**
 * VehicleRoute class to model a single vehicle route in the vehicle routing problem.
 */
export class VehicleRoute {
    public nodes: RouteNode[] = [];

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
    public actualTimeCalculated: boolean = false;

    constructor(
        public vehicle: Vehicle,
        public depotNode: RouteNode, // depot node
        public scheduleProfile: ScheduleProfile,
    ) {
        this.nodes.push(depotNode);
    }

    clone(): VehicleRoute {
        const clonedRoute = new VehicleRoute(this.vehicle, this.depotNode.clone(), this.scheduleProfile);
        // Properly clone each RouteNode
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
    canAddPackage(pkg: Package, pkgNode: RouteNode, timeRequired: number, timeWindowhours: number): boolean {
        // update measurements
        this.updateMeasurements(this.scheduleProfile.delivery_time);

        // Convert tw to minutes
        const timeWindowMins = (timeWindowhours * 60);

        // calculate distance to travel from potential new node to depot
        const actualDistanceToDepot = calculateDistance(pkgNode, this.depotNode, this.distanceMultiplier);
        const timeToDepot = calculateTravelTime(actualDistanceToDepot, this.avgSpeed);

        return (
            this.currentWeight + pkg.weight < this.vehicle.max_load &&
            this.currentVolume + pkg.volume < this.vehicle.max_volume &&
            this.actualTimeMins + timeRequired + timeToDepot <= timeWindowMins
        );
    }

    /**
     * Check if the vehicle can add a group of packages to the route by comparing against the vehicle's capacity,
     * the time required to deliver the group, and the time window for the delivery.
     * @param pkgGroup 
     * @param timeRequiredMins 
     * @param timeWindowHours 
     * @returns 
     */
    canAddGroup(pkgGroup: RouteNode[], timeRequiredMins: number, timeWindowHours?: number): boolean {
        this.updateMeasurements(this.scheduleProfile.delivery_time);
        const timeWindowMins = (timeWindowHours ?? this.scheduleProfile.time_window) * 60;

        // Calculate distance to travel from potential new node to the depot node
        const actualDistanceToDepot = calculateDistance(pkgGroup[0], this.depotNode, this.distanceMultiplier);
        const timeToDepot = calculateTravelTime(actualDistanceToDepot, this.avgSpeed);

        // Total up the weight and volume of the group
        let groupWeight = 0;
        let groupVolume = 0;

        for (const pkgNode of pkgGroup) {
            if (!pkgNode.pkg) continue;

            // add up weight and volume of group
            groupWeight += pkgNode.pkg.weight;
            groupVolume += pkgNode.pkg.volume;
        }

        return (
            this.currentWeight + groupWeight <= this.vehicle.max_load &&
            this.currentVolume + groupVolume <= this.vehicle.max_volume &&
            this.actualTimeMins + timeRequiredMins + timeToDepot <= timeWindowMins
        );
    }


    addNode(node: RouteNode, timeRequired: number): void {
        this.nodes.push(node);
        this.updateMeasurements(this.scheduleProfile.delivery_time);
    }

    // Close the route by adding the depot node
    closeRoute(depot: RouteNode): void {
        const lastNode = this.nodes[this.nodes.length - 1];
        const cost = calculateDistance(lastNode, depot);
        const timeRequired = calculateTravelTime(cost, this.avgSpeed);
        this.eucTimeMins += timeRequired;
        this.eucDistanceMiles += cost;
        this.nodes.push(depot);
        this.updateMeasurements(this.scheduleProfile.delivery_time);
    }

    /***
     * Update all measurements of the route, to be used during the optimisation process
     * and when analysing the actual time and distance of the final solution.
     * 
     * @param deliveryTime - time required to deliver a package
     * @returns void
     */
    updateMeasurements(deliveryTime: number): void {
        // Do not recalculate if already finalised with real metrics
        if (this.actualTimeCalculated == true) {
            this.actualTimeMins = this.actualTimeMins + this.scheduleProfile.delivery_time * this.nodes.length;
            return
        }

        this.eucTimeMins = 0;
        this.eucDistanceMiles = 0;
        this.currentVolume = 0;
        this.currentWeight = 0;
        this.actualDistanceMiles = 0;
        this.actualTimeMins = 0;

        // Sum euclidean time, euclidean distance, volume, weight
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const nextNode = this.nodes[i + 1];

            this.currentWeight += node.pkg?.weight ?? 0;
            this.currentVolume += node.pkg?.volume ?? 0;

            // Break if no next node, allowing the weight and volume to still be calculated
            if (!nextNode) break;

            const distance = calculateDistance(node, nextNode);
            const traversalTime = calculateTravelTime(distance, this.avgSpeed);

            let timeRequired = 0;
            if (nextNode.isDepot) {
                timeRequired = traversalTime;
            } else {
                timeRequired = traversalTime + deliveryTime;
            }

            // Add the total time and distance
            this.eucTimeMins += timeRequired;
            this.eucDistanceMiles += distance;
        }

        if (this.avgSpeed !== 0 && this.distanceMultiplier !== 0) {
            this.actualDistanceMiles = this.eucDistanceMiles * this.distanceMultiplier;
            this.actualTimeMins = ((this.actualDistanceMiles / this.avgSpeed) * 60); // calculate time in minutes
            this.actualTimeMins += this.scheduleProfile.delivery_time * this.nodes.length;
        }
    }

}