import { VRPSolution } from "../routing/model/vrp";

/**
 * Calculates efficiency metrics for a VRP solution. Metrics include:
 * - TE (Time Efficiency): Average delivery time per package.
 * - EE (Environmental Efficiency): Number of packages delivered per mile driven, indicating fuel efficiency.
 * - SE (Space Utilization Efficiency): Assessment of vehicle capacity usage, combining volume and weight utilization.
 * - TWE (Time Window Efficiency): Number of packages delivered within total driving time
 * - Overall Efficiency Score: Averages the normalized values of TE, EE, and SE for a comprehensive performance metric.
 * - A higher score indicates better efficiency.
 * @param {VRPSolution} vrpSolution The VRP solution object containing vehicle routes and delivery nodes.
 * @returns An object containing the calculated TE, EE, SE, and overall efficiency score.
 */
export function calculateEfficiencyScores(vrpSolution: VRPSolution): EfficiencyScores {
    let totalDrivingTimeMins = 0; // Total time for all routes
    let totalMilesDriven = 0; // Total distance for all routes
    let totalPackagesDelivered = 0; // Total packages delivered across all routes
    let volumeUtilised = 0; // Total volume used across all routes
    let volumeCapacity = 0; // Total volume capacity across all vehicles
    let weightUtilised = 0; // Total weight used across all routes
    let weightCapacity = 0; // Total weight capacity across all vehicles

    vrpSolution.updateRouteMeasurements();
    
    vrpSolution.routes.forEach(route => {
        totalDrivingTimeMins += route.actualTimeMins;
        totalMilesDriven += route.actualDistanceMiles;
        totalPackagesDelivered += route.nodes.filter(node => node.pkg !== null).length;
        volumeUtilised += route.currentVolume;
        volumeCapacity += route.vehicle.max_volume;
        weightUtilised += route.currentWeight;
        weightCapacity += route.vehicle.max_load;
    });

    // Parcels delivered per unit distance
    const DE = totalPackagesDelivered / totalMilesDriven * 100;

    // Parcels delivered per unit time
    const TE = totalPackagesDelivered / totalDrivingTimeMins * 100;

    // Volume Utilization
    const VU = volumeUtilised / volumeCapacity * 100;

    // Weight Utilization
    const WU = weightUtilised / weightCapacity * 100;

    // Calculate overall efficiency score as an average of the normalized values
    // Assuming equal importance for simplicity
    const overallEfficiency = (DE + TE + VU + WU) / 4;

    return {
        DE,
        TE,
        VU,
        WU,
        overallEfficiency
    };
}

export interface EfficiencyScores {
    DE: number;
    TE: number;
    VU: number;
    WU: number;
    overallEfficiency: number;
}
