import { VRPSolution } from "../routing/models/vrp";

/**
 * Calculates efficiency metrics for a VRP solution. Metrics include:
 * - TE (Time Efficiency): Average delivery time per package.
 * - EE (Environmental Efficiency): Number of packages delivered per mile driven, indicating fuel efficiency.
 * - SE (Space Utilization Efficiency): Assessment of vehicle capacity usage, combining volume and weight utilization.
 * - Overall Efficiency Score: Averages the normalized values of TE, EE, and SE for a comprehensive performance metric.
 *
 * @param {VRPSolution} vrpSolution The VRP solution object containing vehicle routes and delivery nodes.
 * @returns An object containing the calculated TE, EE, SE, and overall efficiency score.
 */
export function calculateEfficiencyScores(vrpSolution: VRPSolution): { TE: number, EE: number, SE: number, overallEfficiency: number } {
    let totalDrivingTime = 0;
    let totalMilesDriven = 0;
    let totalPackagesDelivered = 0;
    let volumeUtilised = 0;
    let volumeCapacity = 0;
    let weightUtilised = 0;
    let weightCapacity = 0;

    vrpSolution.routes.forEach(route => {
        totalDrivingTime += route.eucTimeMins;
        totalMilesDriven += route.eucDistanceMiles;
        totalPackagesDelivered += route.nodes.filter(node => node.pkg !== null).length;
        volumeUtilised += route.currentVolume;
        volumeCapacity += route.vehicle.max_volume;
        weightUtilised += route.currentWeight;
        weightCapacity += route.vehicle.max_load;
    });

    // Calculate individual metrics
    const TE = totalDrivingTime / totalPackagesDelivered; // Time Efficiency
    const EE = totalMilesDriven / totalPackagesDelivered; // Environmental Efficiency (distance)
    const SE = 0.5 * ((volumeUtilised / volumeCapacity) + (weightUtilised / weightCapacity)); // Space Efficiency

    // Calculate overall efficiency score
    const overallEfficiency = (TE + EE + SE) / 3;

    return {
        TE,
        EE,
        SE,
        overallEfficiency
    };
}
