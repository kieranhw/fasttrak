import { DeliverySchedule, DeliveryStatus } from "@/types/db/DeliverySchedule";
import { Package } from "@/types/db/Package";
import { Vehicle } from "@/types/db/Vehicle";
import { roundRobinAllocation } from "../routing/algorithms/rr-fifo/rr-fifo";
import { geospatialClustering } from "../routing/algorithms/k-means/k-means";
import { Graph } from "@/lib/routing/model/Graph";
import { RouteNode } from '@/lib/routing/model/RouteNode';
import { Edge } from '@/lib/routing/model/Edge';
import { calculateDistance } from '@/lib/utils/calculate-distance';
import { VRPSolution } from "@/lib/routing/model/VRPSolution";
import { VehicleRoute } from "@/lib/routing/model/VehicleRoute";
import { UUID } from "crypto";
import axios from 'axios';
import { ScheduleProfile } from "@/types/db/ScheduleProfile";
import { db } from "../db/db";
import { VRPMetrics, hybridAlgorithm } from "../routing/algorithms/hybrid-algorithm";
import { ScheduleReport } from "@/types/db/ScheduleReport";
import { initRandomMetrics } from "../routing/algorithms/rr-fifo/init-random-metrics";
import { initialiseMetrics } from "../google-maps/directions";

// API Gateway endpoint URL
const apiGatewayEndpoint = 'https://e266yv3o3eojn6auayc5za77c40pmdhb.lambda-url.eu-north-1.on.aws/';

export async function createSchedules(vehiclesData: Vehicle[], packagesData: Package[], date: Date, profile: ScheduleProfile): Promise<{ schedules: DeliverySchedule[], report: ScheduleReport } | undefined> {
    console.log("Scheduling packages...");
    if (packagesData.length === 0) {
        console.log("No packages to schedule.");
        return;
    }

    if (vehiclesData.length === 0) {
        console.log("No vehicles to schedule.");
        return;
    }

    // Profile
    console.log("profile:", profile)

    // TODO: Get depot here, set to variable to be used in createGraph
    const depot = await db.depots.fetch.forUser();

    if (!depot || !depot.data?.depot_lat || !depot.data?.depot_lng) {
        return;
    }

    // TODO: Run the VRP algorithm to generate a solution, send to calculate average speed utils
    //const vrpSolution = await randomRoutes(graph, vehiclesData, 8);
    // 1. Generate a solution without any metrics to be used for calculating the metrics
    const graph = new Graph(packagesData, { lat: depot.data.depot_lat, lng: depot.data.depot_lng }, true);

    const metricsOnlySolution = await initRandomMetrics(graph, vehiclesData, profile);

    // Calculate metrics using the solution
    const metrics: VRPMetrics = await initialiseMetrics(metricsOnlySolution);


    let vrpSolution = new VRPSolution();
    let scheduleReport: ScheduleReport | undefined = undefined;


    // RUN SERVER SIDE 
    const data1 = {
        packagesData: packagesData,
        depot: { lat: depot.data.depot_lat, lng: depot.data.depot_lng },
        vehiclesData: vehiclesData,
        profile: profile,
        metrics: metrics,
    };

    type Response = {
        vrpSolution: VRPSolution,
        scheduleReport: ScheduleReport
    }

    try {
        const response = await axios.post('/api/run-hybrid-algorithm', JSON.stringify(data1), {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // With axios, the response data is accessed with response.data
        const result: Response = response.data;
        vrpSolution = result.vrpSolution;
        scheduleReport = result.scheduleReport;
        console.log("RESPONSE", result); // Process your result here
    } catch (error) {
        // With axios, the error response can be accessed via error.response
        if ((error as any).response) {
            console.error(`HTTP error! Status: ${(error as any).response.status}`, (error as any).response.data);
        } else {
            console.error('Error making POST request:', (error as any).message);
        }
    }



    // TODO: Add 30 second timeout for local processing
    /** 
    if (vrpSolution.routes.length === 0) {
        if (graph.nodes.length === 0) {
            console.log("No packages to schedule.");
            return;
        }

        const response = await hybridAlgorithm(graph, vehiclesData, profile, metrics, false);
        vrpSolution = response.finalSolution;
        scheduleReport = response.scheduleReport;
    }
*/

    // Initialize an empty array to hold delivery schedules for each vehicle
    let schedules: DeliverySchedule[] = [];

    // Map vehicle routes to delivery schedules
    for (const route of vrpSolution.routes) {
        let schedule: DeliverySchedule = {
            vehicle_id: route.vehicle.vehicle_id,
            store_id: undefined as unknown as UUID,
            vehicle: route.vehicle,
            depot_lat: depot.data.depot_lat,
            depot_lng: depot.data.depot_lng,
            package_order: route.nodes.map(node => node.pkg as Package),
            delivery_date: date,
            route_number: schedules.length + 1,
            start_time: date,
            status: DeliveryStatus.Scheduled,
            num_packages: route.nodes.length - 1, // Subtract 1 to account for depot marker
            estimated_duration_mins: route.eucTimeMins,
            actual_duration_mins: route.actualTimeMins,
            euclidean_distance_miles: route.eucDistanceMiles.toFixed(2) as unknown as number,
            actual_distance_miles: route.actualDistanceMiles.toFixed(2) as unknown as number,
            load_weight: route.currentWeight,
            load_volume: route.currentVolume,
            created_at: new Date()
        };

        schedules.push(schedule);
    }

    if (schedules && schedules.length > 0 && scheduleReport) {
        return { schedules: schedules, report: scheduleReport };
    } else {
        return
    }

}

// Estimate duration based on distance and time to deliver each package
export function calculateTraversalMins(distance: number, averageSpeed?: number): number {
    if (!averageSpeed || averageSpeed == 0) {
        averageSpeed = 20; // miles per hour
    }
    // estimated time to travel distance in minutes 
    const estimatedDuration = (distance / averageSpeed) * 60;

    return estimatedDuration;
}
