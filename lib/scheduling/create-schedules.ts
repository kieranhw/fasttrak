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
import { generateMetrics as generateMetrics } from "../routing/algorithms/generate-metrics";
import { initialiseMetrics } from "../google-maps/directions";

// API Gateway endpoint URL
const apiGatewayEndpoint = 'https://e266yv3o3eojn6auayc5za77c40pmdhb.lambda-url.eu-north-1.on.aws/';

export async function createSchedules(vehiclesData: Vehicle[], packagesData: Package[], date: Date, profile: ScheduleProfile): Promise<{ schedules: DeliverySchedule[], report: ScheduleReport } | undefined> {
    const depot = await db.depots.fetch.forUser();

    switch (true) {
        case packagesData.length === 0:
            alert("No packages to schedule.");
            return;
        case vehiclesData.length === 0:
            alert("No vehicles available.");
            return;
        case !depot || !depot.data?.depot_lat || !depot.data?.depot_lng:
            alert("No depot location available.");
            return;
    }


    // Create fully connected graph from packages and depot
    const graph = new Graph(packagesData, { lat: depot.data.depot_lat, lng: depot.data.depot_lng }, true);

    // Calculate the conversion metrics for the delivery network
    const metrics: VRPMetrics = await generateMetrics(graph, vehiclesData, profile);

    // Call the hybrid algorithm to process the data via API 
    let vrpSolution = new VRPSolution();
    let scheduleReport: ScheduleReport | undefined = undefined;

    const data = {
        packagesData: packagesData,
        depot: { lat: depot.data.depot_lat, lng: depot.data.depot_lng },
        vehiclesData: vehiclesData,
        profile: profile,
        metrics: metrics,
    };

    try {
        // Call the API endpoint with the data
        const response = await axios.post('/api/run-hybrid-algorithm', JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });

        const result: { vrpSolution: VRPSolution, scheduleReport: ScheduleReport } = response.data;
        vrpSolution = result.vrpSolution;
        scheduleReport = result.scheduleReport;
    } catch (error) {
        // Handle error and validate data before processing locally
        console.error('Error processing data via API:', error);
        console.warn('Processing locally...');

        // Process the solution locally as a fallback
        const response = await hybridAlgorithm(graph, vehiclesData, profile, metrics, false);
        vrpSolution = response.finalSolution;
        scheduleReport = response.scheduleReport;
    }

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
