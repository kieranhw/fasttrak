import { DeliverySchedule, DeliveryStatus } from "@/types/db/DeliverySchedule";
import { Package } from "@/types/db/Package";
import { Vehicle } from "@/types/db/Vehicle";
import { Graph } from "@/lib/routing/model/Graph";
import { VRPSolution } from "@/lib/routing/model/VRPSolution";
import { UUID } from "crypto";
import axios from 'axios';
import { ScheduleProfile } from "@/types/db/ScheduleProfile";
import { db } from "../db/db";
import { VRPMetrics, hybridAlgorithm } from "../routing/algorithms/hybrid-algorithm";
import { ScheduleReport } from "@/types/db/ScheduleReport";
import { generateMetrics as generateMetrics } from "../routing/algorithms/rr-fifo/generate-metrics";
import { selectAlgorithm } from "../routing/algorithms/select-algorithm";
import { RouteNode } from "../routing/model/RouteNode";

/**
 * The main function to create delivery schedules for a given set of vehicles and packages.
 * 
 * Processes the data via the hybrid algorithm and returns the delivery schedules and a report.
 * 
 * @param vehiclesData The available vehicles to be scheduled
 * @param packagesData The packages to be scheduled
 * @param date The date of the delivery schedule
 * @param profile The schedule profile containing configuration settings
 * @returns array of delivery schedules and a schedule report
 */
export async function createSchedules(vehiclesData: Vehicle[], packagesData: Package[], date: Date, profile: ScheduleProfile):
    Promise<{ schedules: DeliverySchedule[], report: ScheduleReport } | null> {

    // Validate data before processing
    const depot = await db.depots.fetch.forUser();

    if (!vehiclesData || vehiclesData.length === 0) {
        alert("No vehicles available.");
        return null;
    }

    if (!packagesData || packagesData.length === 0) {
        alert("No packages to schedule.");
        return null;
    }

    if (!depot || !depot.data || !depot.data.depot_lat || !depot.data.depot_lng) {
        alert("No depot location available.");
        return null;
    }

    // Create array of route nodes to represent the delivery network
    const routeNodes: RouteNode[] = new Array();

    // Add depot node
    const depotNode = new RouteNode(null, { lat: depot.data.depot_lat, lng: depot.data.depot_lng }, true);
    routeNodes.push(depotNode);

    // Add package nodes
    for (const pkg of packagesData) {
        const pkgNode = new RouteNode(pkg, { lat: pkg.recipient_address_lat, lng: pkg.recipient_address_lng }, false);
        routeNodes.push(pkgNode);
    }

    // Calculate the conversion metrics for the delivery network
    const metrics: VRPMetrics = await generateMetrics(routeNodes, vehiclesData, profile);

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

    /**
    try {
        // Requires Vercel premium to be activated run this code on the server, therefore it will run locally
        // as the demonstration period has passed. This has been documented in my project demo video.

        
        const response = await axios.post('/api/run-hybrid-algorithm', JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(response);

        const result: { vrpSolution: VRPSolution, scheduleReport: ScheduleReport } = response.data;
        vrpSolution = result.vrpSolution;
        scheduleReport = result.scheduleReport;
        


    } catch (error) {
        // Handle error and validate data before processing locally
        console.error('Error processing data via API:', error);
        console.warn('Processing locally...');

        if (profile.select_optimal) {
            // Run hybrid algorithm with server settings
            const response = await hybridAlgorithm(routeNodes, vehiclesData, profile, metrics, false);
            vrpSolution = response.finalSolution;
            scheduleReport = response.scheduleReport;

        } else {
            // Run select algorithm with server settings
            const response = await selectAlgorithm(routeNodes, vehiclesData, profile, metrics, false);
            if (response.finalSolution && response.scheduleReport) {
                vrpSolution = response.finalSolution;
                scheduleReport = response.scheduleReport;
            } else {
                alert("Error processing schedules.")
            }
        }
    }
    */

    // Choose between running the hybrid algorithm or the select algorithm
    if (profile.select_optimal) {
        // Run hybrid algorithm with server settings
        const response = await hybridAlgorithm(routeNodes, vehiclesData, profile, metrics, false);
        vrpSolution = response.finalSolution;
        scheduleReport = response.scheduleReport;


    } else {
        // Run select algorithm with server settings
        const response = await selectAlgorithm(routeNodes, vehiclesData, profile, metrics, false);
        if (response.finalSolution && response.scheduleReport) {
            vrpSolution = response.finalSolution;
            scheduleReport = response.scheduleReport;
        } else {
            alert("Error processing schedules.")
        }
    }


    // Initialize an empty array to hold delivery schedules for each vehicle
    let schedules: DeliverySchedule[] = [];

    // Map vehicle routes to DeliverySchedule objects
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
            actual_duration_mins: route.currentTimeMins,
            euclidean_distance_miles: route.eucDistanceMiles.toFixed(2) as unknown as number,
            actual_distance_miles: route.estimatedRoadDistanceMiles.toFixed(2) as unknown as number,
            load_weight: route.currentWeight,
            load_volume: route.currentVolume,
            metric_distance_multiplier: route.distanceMultiplier,
            metric_avg_speed: route.avgSpeed,
            created_at: new Date()
        };

        schedules.push(schedule);
    }

    if (schedules && schedules.length > 0 && scheduleReport) {
        return { schedules: schedules, report: scheduleReport };
    } else {
        return null;
    }

}
