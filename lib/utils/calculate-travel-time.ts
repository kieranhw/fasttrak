/**
 * Calculate estimated time to travel a given distance. Uses the average speed metric to return the estimated time
 * in a non-Euclidean context, if provided.
 * @param distance Distance in miles (Euclidean or non-Euclidean)
 * @param averageSpeed Average speed metric in miles per hour
 * @returns Estimated time to travel distance in minutes
 */
export function calculateTravelTime(distance: number, averageSpeed?: number): number {
    if (!averageSpeed || averageSpeed == 0) {
        averageSpeed = 20; // estimated travel time at miles per hour
    }

    const estimatedDuration = (distance / averageSpeed) * 60;

    return estimatedDuration;
}