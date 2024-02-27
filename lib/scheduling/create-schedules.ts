import { DeliverySchedule, DeliveryStatus } from "@/types/delivery-schedule";
import { Package } from "@/types/package";
import { Vehicle } from "@/types/vehicle";
import { roundRobinAllocation } from "../routing/algorithms/rr-fifo";
import { geospatialClustering } from "../routing/algorithms/k-means";
import { Edge, Graph, Node, calculateDistance, createGraph } from "../routing/models/graph";
import { VRPSolution, VehicleRoute } from "../routing/models/vrp";
import { UUID } from "crypto";
import axios from 'axios';
import { ScheduleProfile } from "@/types/schedule-profile";
import { db } from "../db/db";
import { hybridAlgorithm } from "../routing/algorithms/hybrid-algorithm";

// API Gateway endpoint URL
const apiGatewayEndpoint = 'https://e266yv3o3eojn6auayc5za77c40pmdhb.lambda-url.eu-north-1.on.aws/';

export async function createSchedules(vehiclesData: Vehicle[], packagesData: Package[], date: Date, profile: ScheduleProfile) {
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
    const averageSpeed = 5; // miles per hour
    
    // TODO: update lambda code to accept profile
    // schedule packages on AWS Lambda
    const data = {
        packages: packagesData,
        vehicles: vehiclesData,
        depot: depot,
        averageSpeed: averageSpeed,
        timeWindow: 8
    };

    let vrpSolution = new VRPSolution();


    // Make a POST request
    /*
    await fetch(apiGatewayEndpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            vrpSolution = data;
            console.log("AWS Lambda Success!")
        })
        .catch(error => {
            console.error('Error:', error);
        });
        */

    // If Lambda request fails, run algorithm locally
    // TODO: Add 30 second timeout for local processing
    if (vrpSolution.routes.length === 0) {
        const graph = await createGraph(packagesData, { lat: depot.data.depot_lat, lng: depot.data.depot_lng}, true);
        if (graph.nodes.length === 0) {
            console.log("No packages to schedule.");
            return;
        }
        
        //const res = await geospatialClustering(graph, vehiclesData, profile)
        //vrpSolution = res[0];
        
        vrpSolution = await hybridAlgorithm(graph, vehiclesData, profile);
        console.log("scheduling locally")

        console.log(vrpSolution)
    }

    // Initialize an empty array to hold delivery schedules for each vehicle
    let schedules: DeliverySchedule[] = [];

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
            num_packages: route.nodes.length - 2, // minus 2 to exclude depot nodes
            estimated_duration_mins: route.actualTimeMins, 
            actual_duration_mins: 0,
            distance_miles: route.actualDistanceMiles.toFixed(2) as unknown as number,
            load_weight: route.currentWeight,
            load_volume: route.currentVolume,
            created_at: new Date()
        };

        schedules.push(schedule);
    }

    console.log("Schedules: ", schedules);
    return schedules;
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
