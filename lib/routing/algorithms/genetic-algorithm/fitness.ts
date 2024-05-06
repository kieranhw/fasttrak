import { ScheduleProfile, OptimisationProfile  } from "@/types/db/ScheduleProfile";
import { VRPSolution } from "@/lib/routing/model/VRPSolution";
import { VehicleRoute } from "@/lib/routing/model/VehicleRoute";
import { GeneticAlgorithm } from "./genetic-algorithm";

export function routeFitness(route: VehicleRoute): number {
    const TimeWindowMins = (route.scheduleProfile.time_window * 60); // Time window in mins

    // Adjust weights based on optimisation profile - must equal 12
    if (route.scheduleProfile.optimisation_profile === OptimisationProfile.Eco) {
        var w1 = 5, w2 = 1, w3 = 3, w4 = 3;
    } else if (route.scheduleProfile.optimisation_profile === OptimisationProfile.Space) {
        var w1 = 1, w2 = 1, w3 = 5, w4 = 5;
    } else if (route.scheduleProfile.optimisation_profile === OptimisationProfile.Time) {
        var w1 = 2, w2 = 4, w3 = 3, w4 = 3;
    } else {
        var w1 = 3, w2 = 3, w3 = 3, w4 = 3;
    }

    const p1 = 500; // Penalty for space violation
    const p2 = 500; // Penalty for load violation
    const p3 = 500; // Penalty for time window violation

    const packageCount = (route.nodes.length - 2); // Ensure no division by zero
    const distance = route.actualDistanceMiles / packageCount; // Calculate average distance per package
    const time = route.currentTimeMins / packageCount; // Calculate average actual time per package
   
    // Ensure efficiencies are calculated such that lower values are better
    let spaceEfficiency = route.vehicle.max_volume / route.currentVolume;
    let loadEfficiency = route.vehicle.max_load / route.currentWeight;

    const spacePenalty = spaceEfficiency < 1 ? p1 : 0;
    const loadPenalty = loadEfficiency < 1 ? p2 : 0;
    const timeWindowPenalty = route.currentTimeMins > TimeWindowMins ? p3 : 0;

    const fitnessInfo = {
        distance: w1 * distance,
        time: w2 * time,
        spaceEfficiency: w3 * spaceEfficiency,
        loadEfficiency: w4 * loadEfficiency,
        spacePenalty: spacePenalty,
        loadPenalty: loadPenalty,
        timeWindowPenalty: timeWindowPenalty
    };

    // Calculate the fitness of the route, to be minimised
    return (w1 * distance) + (w2 * time) + (w3 * spaceEfficiency) + (w4 * loadEfficiency)
        + spacePenalty + loadPenalty + timeWindowPenalty;
}