import { VehicleRoute } from "./VehicleRoute";
import { RouteNode } from "./RouteNode";

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
        // Return number of packages that are nodes which are not depots
        return this.routes.reduce((sum, route) => sum + route.nodes.filter(node => !node.isDepot).length, 0);
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