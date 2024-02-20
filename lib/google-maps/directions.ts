import { VRPSolution, VehicleRoute } from "../routing/models/vrp";
import { Package } from "@/types/package";
import { Loader } from '@googlemaps/js-api-loader';
import { Node, calculateDistance } from "../routing/models/graph";
import { calculateTraversalMins } from "../scheduling/create-schedules";
const loader = new Loader({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
    version: "weekly",
    libraries: ["routes"],
});

let service: google.maps.DirectionsService;

const initDirectionsService = async () => {
    await loader.importLibrary("routes");
    service = new google.maps.DirectionsService();
};

export async function initialiseMetrics(solution: VRPSolution): Promise<VRPSolution> {
    if (!service) {
        await initDirectionsService();
    }

    const responses = [];
    let totalActualDistance = 0;
    let totalActualDuration = 0;
    let totalEucDistance = 0;
    let totalEucDuration = 0;

    for (const route of solution.routes) {
        // Determine the indices of the nodes to be selected

        // Filter out route nodes which have duplicate addresses
        const uniqueNodes: Node[] = route.nodes.filter((node, index, self) => {
            const firstIndex = self.findIndex(n => n.pkg?.recipient_address === node.pkg?.recipient_address);
            return firstIndex === index;
        },);

        const selectedIndices = createEvenlySpreadIndices(uniqueNodes.length);

        const nodes: Node[] = selectedIndices.map(index => uniqueNodes[index]);

        // Get total euclidean distance for the selected nodes
        for (let i = 0; i < nodes.length - 1; i++) {
            const node = nodes[i];
            const nextNode = nodes[i + 1];
            const distance = calculateDistance(node, nextNode);
            totalEucDistance += distance;
            totalEucDuration += calculateTraversalMins(distance);
        }

        const origin = new google.maps.LatLng(route.nodes[0].coordinates.lat, route.nodes[0].coordinates.lng); // Starting at node 0 (depot)
        const destinations = nodes.map(pkg => new google.maps.LatLng(pkg.coordinates.lat, pkg.coordinates.lng));

        await service.route(
            {
                origin: origin,
                destination: origin,
                waypoints: destinations.map(destination => ({ location: destination })),
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.IMPERIAL,
                avoidHighways: false,
                avoidTolls: true,
                drivingOptions: {
                    departureTime: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1, 7),
                    trafficModel: google.maps.TrafficModel.PESSIMISTIC,
                },
            },
            (response, status) => {
                if (status !== "OK") {
                    console.error("Error:", status);
                } else if (response) {
                    console.log(response);
                    responses.push(response);


                    response.routes[0].legs.forEach((element, index) => {
                        const distanceMeters = element.distance?.value; // returns in meters
                        const durationSeconds = element.duration?.value; // returns in seconds
                        if (distanceMeters && durationSeconds) {
                            totalActualDistance += distanceMeters / 1609;  // convert to miles
                            totalActualDuration += durationSeconds / 3600; // convert to hours
                        }
                    });

                }
            }
        );


    }

    // calculate average speed
    const avgSpeed = totalActualDistance / totalActualDuration;
    console.log("Average speed: ", avgSpeed);
    const distanceMultiplier = totalActualDistance / totalEucDistance;
    const timeMultiplier = (totalActualDuration * 60) / totalEucDuration;

    console.log("distance multiplier: ", distanceMultiplier);
    console.log("time multiplier: ", timeMultiplier);

    solution.initMetrics(avgSpeed, distanceMultiplier, timeMultiplier);

    return solution; // This will be handled by the API route function below
}


function createEvenlySpreadIndices(length: number, maxIndices: number = 25): number[] {
    const indices: number[] = [0]; // Start with index 0
    const lastIndex = length - 1; // Adjust for zero-based indexing

    // Ensure the array includes the last index by adjusting the length
    if (length <= maxIndices) {
        // If the length is less than or equal to maxIndices, return a range from 0 to length
        for (let i = 1; i <= lastIndex; i++) {
            indices.push(i);
        }
    } else {
        // Calculate step to evenly distribute indices, ensuring to include the last index
        const step = lastIndex / (maxIndices - 1);

        for (let i = 1; i < maxIndices - 1; i++) {
            // Use Math.round to ensure indices are integers
            const index = Math.round(i * step);
            if (!indices.includes(index)) {
                indices.push(index);
            }
        }

        // Ensure the last index is included
        if (!indices.includes(lastIndex)) {
            indices.push(lastIndex);
        }
    }

    return indices;
}