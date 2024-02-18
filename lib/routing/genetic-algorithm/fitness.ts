import { VRPSolution, VehicleRoute } from "../models/vrp";
import { GeneticAlgorithm } from "./genetic-algorithm";

export function routeFitness(route: VehicleRoute): number {
    const TimeWindowMins = 60 * 8; // Example time window in minutes
    const w1 = 1; // Weight for distance - minimise distance
    const w2 = 1; // Weight for time - minimise time
    const w3 = 1; // Weight for space - maximise space efficiency
    const w4 = 1; // Weight for load - maximise load efficiency

    const p1 = 500; // Penalty for space violation
    const p2 = 500; // Penalty for load violation
    const p3 = 500; // Penalty for time window violation

    const packageCount = Math.max(route.nodes.length - 2, 1); // Ensure no division by zero
    const distance = route.totalDistance / packageCount;
    const time = route.totalTime / packageCount;

    // Ensure efficiencies are calculated such that higher values are better
    let spaceEfficiency = (route.currentVolume / route.vehicle.max_volume);
    let loadEfficiency = (route.currentWeight / route.vehicle.max_load);

    const spacePenalty = spaceEfficiency > 1 ? spaceEfficiency = p1 : 0;
    const loadPenalty = loadEfficiency > 1 ? loadEfficiency = p2 : 0;
    const timeWindowViolation = Math.max(0, route.totalTime - TimeWindowMins); // Ensure it's non-negative
    const timeWindowPenalty = p3 * timeWindowViolation; // This should always be a positive addition to the fitness score

    const fitnessInfo = {
        distance: w1 * distance,
        time: w2 * time,
        spaceEfficiency: w3 * spaceEfficiency,
        loadEfficiency: w4 * loadEfficiency,
        spacePenalty: spacePenalty,
        loadPenalty: loadPenalty,
        timeWindowPenalty: timeWindowPenalty
    };

    //console.log(fitnessInfo);

    // Calculate the fitness of the route, to be minimised
    return (w1 * distance) + (w2 * time) + (w3 * spaceEfficiency) + (w4 * loadEfficiency)
        + spacePenalty + loadPenalty + timeWindowPenalty;
}

