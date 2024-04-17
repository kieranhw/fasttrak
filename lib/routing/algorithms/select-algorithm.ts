import { Graph } from '../model/Graph';
import { VRPSolution } from "@/lib/routing/model/VRPSolution";
import { VehicleRoute } from "@/lib/routing/model/VehicleRoute";
import { ScheduleProfile } from "@/types/db/ScheduleProfile";
import { GeneticAlgorithm } from "./genetic-algorithm/genetic-algorithm";
import { Vehicle } from "@/types/db/Vehicle";
import { roundRobinAllocation } from './rr-fifo/rr-fifo';
import { EfficiencyScores, calculateEfficiencyScores } from '@/lib/utils/calculate-efficiency';
import { initialiseMetrics as computeMetrics, calculateActualTravel as calculateActualTravelClient } from '../../google-maps/client/directions';
import { calculateActualTravel as calculateActualTravelServer } from '@/lib/google-maps/server/directions';
import { generateMetrics } from './rr-fifo/generate-metrics';
import { geospatialClustering as KMeansClustering } from './k-means/k-means';
import { ScheduleInitialiser, ScheduleOptimiser, ScheduleReport } from '@/types/db/ScheduleReport';
import { initKMeans } from './k-means/init-k-means';
import { initRandom } from './rr-fifo/init-rr-fifo';
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export type VRPMetrics = {
    solution: VRPSolution;
    distanceMultiplier: number;
    avgSpeed: number;
}

/**
 * Direct selection for which algorithm to use based on the profile settings. Four settings are available to be selected for 
 * from the schedules page. This offers an alternative to the hybrid algorithm, which automatically selects the most efficient solution.
 * 
 * @param graph - Graph of nodes: packages and depot
 * @param vehicles - Array of available vehicles
 * @param profile - Schedule profile of configuration settings
 * @returns 
 */
export async function selectAlgorithm(graph: Graph, vehicles: Vehicle[], profile: ScheduleProfile, metrics: VRPMetrics, server: boolean):
    Promise<{ finalSolution: VRPSolution | null, scheduleReport: ScheduleReport | null }> {

    const originalVehicles = vehicles.slice(); // Clone the vehicles array

    // Generate a random solution to estimate the maximum number of vehicles required
    let randomOnly = await roundRobinAllocation(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
    randomOnly.loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);
    const randomOnlyEfficiency: EfficiencyScores = calculateEfficiencyScores(randomOnly);

    // If selected, estimate the maximum number of vehicles required to deliver all packages 
    if (profile.auto_selection == true) {
        // Estimate the amount of vehicles needed to deliver all pending packages
        const totalWeightCapacityNeeded = graph.nodes.reduce((acc, node) => acc + (node.pkg?.weight ?? 0), 0);
        const totalVolumeCapacityNeeded = graph.nodes.reduce((acc, node) => acc + (node.pkg?.volume ?? 0), 0);

        // Create a clone of the vehicles array
        const startingVehicles = vehicles.slice();
        let maximumVehiclesRequired: Vehicle[] = [];

        // Find maximum number of vehicles required to fit all packages based on weight and volume
        let weightAvailable = 0;
        let volumeAvailable = 0;

        for (const vehicle in startingVehicles) {
            // If the total weight and volume capacity needed exceeds the available capacity, add more vehicles
            if (weightAvailable < totalWeightCapacityNeeded && volumeAvailable < totalVolumeCapacityNeeded) {
                // Add the vehicle's capacity to the available capacity
                weightAvailable += startingVehicles[vehicle].max_load
                volumeAvailable += startingVehicles[vehicle].max_volume

                // Add the vehicle to the maximum vehicles required array
                maximumVehiclesRequired.push(startingVehicles[vehicle]);
                startingVehicles.splice(parseInt(vehicle), 1);
            }
        }

        const EFFICIENCY_INCREASE = 0.5 // Estimated routing efficiency increase between the random solution and the final solution

        let currentTimeWindowMins = (profile.time_window * maximumVehiclesRequired.length) * 60; // Current time window available
        const averageTimePerPackage = (randomOnly.actualTime * EFFICIENCY_INCREASE) / randomOnly.numberOfPackages;
        const estimatedTravelTimeMins = averageTimePerPackage * graph.nodes.length - 1; // Estimated (worst case) time to deliver all packages

        // From the remaining vehicles, add more vehicles if required based on the estimated time to deliver
        for (const vehicle in startingVehicles) {
            const travelTimeExceedsTimeWindow = estimatedTravelTimeMins > currentTimeWindowMins;

            if (travelTimeExceedsTimeWindow) {
                maximumVehiclesRequired.push(startingVehicles[vehicle]);
                startingVehicles.splice(parseInt(vehicle), 1);
                currentTimeWindowMins += (profile.time_window * 60); // Account for new vehicle's time window
            }
        }
        vehicles = maximumVehiclesRequired;
    }

    // FIFO RR only solution
    if (profile.initialisation_algorithm == ScheduleInitialiser.Random && profile.optimisation_algorithm == ScheduleOptimiser.None) {

        // Calculate actual travel time
        for (const route of randomOnly.routes) {
            if (server) {
                await calculateActualTravelServer(route);
            }
            else {
                await calculateActualTravelClient(route);
            }
        }

        // Generate report
        const randomOnlyReport: ScheduleReport = {
            initialiser: ScheduleInitialiser.Random,
            optimiser: ScheduleOptimiser.None,
            distance_multiplier: metrics.distanceMultiplier,
            average_speed: metrics.avgSpeed,
            vehicles_available: originalVehicles,
            vehicles_used: randomOnly.routes.map(route => route.vehicle),
            total_packages_count: graph.nodes.reduce((acc, node) => acc + (node.pkg ? 1 : 0), 0),
            scheduled_packages_count: randomOnly.numberOfPackages,
            total_distance_miles: randomOnly.actualDistance,
            total_duration_hours: randomOnly.actualTime / 60,
            // Schedule Profile
            auto_minimise: profile.auto_selection,
            optimisation_profile: profile.optimisation_profile,
            time_window_hours: profile.time_window,
            est_delivery_time: profile.delivery_time,
            TE: randomOnlyEfficiency.TE,
            DE: randomOnlyEfficiency.DE,
            WU: randomOnlyEfficiency.WU,
            VU: randomOnlyEfficiency.VU,
        }

        return { finalSolution: randomOnly, scheduleReport: randomOnlyReport };
    }

    // K Means only solution
    else if (profile.initialisation_algorithm == ScheduleInitialiser.KMeans && profile.optimisation_algorithm == ScheduleOptimiser.None) {
        let kMeansOnly = await KMeansClustering(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
        kMeansOnly[0].loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);
        const kMeansOnlyEfficiency: EfficiencyScores = calculateEfficiencyScores(kMeansOnly[0]);

        for (const route of kMeansOnly[0].routes) {
            if (server) {
                await calculateActualTravelServer(route);
            }
            else {
                await calculateActualTravelClient(route);
            }
        }

        const kMeansOnlyReport: ScheduleReport = {
            initialiser: ScheduleInitialiser.KMeans,
            optimiser: ScheduleOptimiser.None,
            distance_multiplier: metrics.distanceMultiplier,
            average_speed: metrics.avgSpeed,
            vehicles_available: originalVehicles,
            vehicles_used: kMeansOnly[0].routes.map(route => route.vehicle),
            total_packages_count: graph.nodes.reduce((acc, node) => acc + (node.pkg ? 1 : 0), 0),
            scheduled_packages_count: kMeansOnly[0].numberOfPackages,
            total_distance_miles: kMeansOnly[0].actualDistance,
            total_duration_hours: kMeansOnly[0].actualTime / 60,
            // Schedule Profile
            auto_minimise: profile.auto_selection,
            optimisation_profile: profile.optimisation_profile,
            time_window_hours: profile.time_window,
            est_delivery_time: profile.delivery_time,
            TE: kMeansOnlyEfficiency.TE,
            DE: kMeansOnlyEfficiency.DE,
            WU: kMeansOnlyEfficiency.WU,
            VU: kMeansOnlyEfficiency.VU,
        }

        return { finalSolution: kMeansOnly[0], scheduleReport: kMeansOnlyReport };
    }

    // Random initialsied Genetic Algorithm solution
    else if (profile.initialisation_algorithm == ScheduleInitialiser.Random && profile.optimisation_algorithm == ScheduleOptimiser.GA) {
        let randomInitial = await initRandom(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
        randomInitial[0].loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);


        // Random Initialised
        const gaRandomInit = new GeneticAlgorithm(randomInitial[0], randomInitial[1], profile, profile.generations);
        const randomOptimised = gaRandomInit.evolve();
        const randomOptimisedEfficiency: EfficiencyScores = calculateEfficiencyScores(randomOptimised);

        // Calculate actual travel time and distance for each route
        for (const route of randomOptimised.routes) {
            if (server) {
                await calculateActualTravelServer(route);
            }
            else {
                await calculateActualTravelClient(route);
            }
        }

        const randomOptimisedReport: ScheduleReport = {
            initialiser: ScheduleInitialiser.Random,
            optimiser: ScheduleOptimiser.GA,
            iterations: profile.generations,
            distance_multiplier: metrics.distanceMultiplier,
            average_speed: metrics.avgSpeed,
            vehicles_available: originalVehicles,
            vehicles_used: randomOptimised.routes.map(route => route.vehicle),
            total_packages_count: graph.nodes.reduce((acc, node) => acc + (node.pkg ? 1 : 0), 0),
            scheduled_packages_count: randomOptimised.numberOfPackages,
            total_distance_miles: randomOptimised.actualDistance,
            total_duration_hours: randomOptimised.actualTime / 60,
            // Schedule Profile
            auto_minimise: profile.auto_selection,
            optimisation_profile: profile.optimisation_profile,
            time_window_hours: profile.time_window,
            est_delivery_time: profile.delivery_time,
            TE: randomOptimisedEfficiency.TE,
            DE: randomOptimisedEfficiency.DE,
            WU: randomOptimisedEfficiency.WU,
            VU: randomOptimisedEfficiency.VU,
        }

        return { finalSolution: randomOptimised, scheduleReport: randomOptimisedReport };
    }

    // KMeans initialised Genetic Algorithm solution
    else if (profile.initialisation_algorithm == ScheduleInitialiser.KMeans && profile.optimisation_algorithm == ScheduleOptimiser.GA) {
        // KMeans Initial Solution
        let KMeansInitial = await initKMeans(graph, vehicles, profile, metrics.distanceMultiplier, metrics.avgSpeed);
        KMeansInitial[0].loadMetrics(metrics.avgSpeed, metrics.distanceMultiplier);
        console.log("----------------------")
        console.log("Calculated Conversion Metrics")
        console.log("Average Speed: " + metrics.avgSpeed)
        console.log("Distance Multiplier: " + metrics.distanceMultiplier)
        console.log("----------------------")


        // kMeans Initialised GA
        const gaKMeansInit = new GeneticAlgorithm(KMeansInitial[0], KMeansInitial[1], profile, profile.generations);
        const kMeansOptimised = gaKMeansInit.evolve();
        const kMeansOptimisedEfficiency: EfficiencyScores = calculateEfficiencyScores(kMeansOptimised);

        console.log("Euclidean Values")
        console.log("Distance (miles): " + kMeansOptimised.euclideanDistance.toFixed(2))
        console.log("Time (hrs): " + (kMeansOptimised.euclideanTime / 60).toFixed(2))
        console.log("----------------------")
        console.log("Estimated Real-World Values")
        console.log("Distance (miles): " + kMeansOptimised.actualDistance.toFixed(2))
        console.log("Time (hrs): " + (kMeansOptimised.actualTime / 60).toFixed(2))
        console.log("----------------------")

        // Calculate actual travel time and distance for each route
        for (const route of kMeansOptimised.routes) {
            if (server) {
                await calculateActualTravelServer(route);
            }
            else {
                await calculateActualTravelClient(route);
            }
        }

        console.log("Actual Real-World Values")
        console.log("Distance (miles): " + kMeansOptimised.realDistance.toFixed(2))
        console.log("Time (hrs): " + (kMeansOptimised.realTime / 60).toFixed(2))
        console.log("----------------------")

        const kMeansOptimisedReport: ScheduleReport = {
            initialiser: ScheduleInitialiser.KMeans,
            optimiser: ScheduleOptimiser.GA,
            iterations: profile.generations,
            distance_multiplier: metrics.distanceMultiplier,
            average_speed: metrics.avgSpeed,
            vehicles_available: originalVehicles,
            vehicles_used: kMeansOptimised.routes.map(route => route.vehicle),
            total_packages_count: graph.nodes.reduce((acc, node) => acc + (node.pkg ? 1 : 0), 0),
            scheduled_packages_count: kMeansOptimised.numberOfPackages,
            total_distance_miles: kMeansOptimised.actualDistance,
            total_duration_hours: kMeansOptimised.actualTime / 60,
            // Schedule Profile
            auto_minimise: profile.auto_selection,
            optimisation_profile: profile.optimisation_profile,
            time_window_hours: profile.time_window,
            est_delivery_time: profile.delivery_time,
            // Efficiency Scores
            TE: kMeansOptimisedEfficiency.TE,
            DE: kMeansOptimisedEfficiency.DE,
            WU: kMeansOptimisedEfficiency.WU,
            VU: kMeansOptimisedEfficiency.VU,
        }

        return { finalSolution: kMeansOptimised, scheduleReport: kMeansOptimisedReport };
    }

    // No solution to be returned
    else {
        return { finalSolution: null, scheduleReport: null };
    }
}


