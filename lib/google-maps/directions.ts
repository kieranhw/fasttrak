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

interface VRP {
    solution: VRPSolution;
    distanceMultiplier: number;
    avgSpeed: number;
}

export async function initialiseMetrics(solution: VRPSolution): Promise<VRP> {
    const test = true;
    if (test == true) {
        const distanceMultiplier = 1.5;
        const avgSpeed = 20;
        solution.initMetrics(avgSpeed, distanceMultiplier);
        return {solution, distanceMultiplier ,avgSpeed};
    }

    if (!service) {
        await initDirectionsService();
    }

    const responses = [];
    let totalActualDistance = 0;
    let totalActualTime = 0;
    let totalEucDistance = 0;
    let totalEucDuration = 0;

    for (const route of solution.routes) {

        // Filter out route nodes which have duplicate addresses
        const uniqueNodes: Node[] = route.nodes.filter((node, index, self) => {
            const firstIndex = self.findIndex(n => n.pkg?.recipient_address === node.pkg?.recipient_address);
            return firstIndex === index;
        },);

        // Determine the indices of the nodes to be selected
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
                            totalActualTime += durationSeconds / 3600; // convert to hours
                        }
                    });

                }
            }
        );


    }

    // calculate average speed
    const avgSpeed = totalActualDistance / totalActualTime;
    const distanceMultiplier = totalActualDistance / totalEucDistance;

    solution.initMetrics(avgSpeed, distanceMultiplier);

    return {solution, distanceMultiplier, avgSpeed}; 
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

// Function to calculate real times between each node in the route, splits into 25 waypoints to allow for google maps api limitations
export async function calculateRealTimes(route: VehicleRoute) : Promise<void> {
    if (!service) {
        await initDirectionsService();
    }

    let totalActualDuration = 0;
    let totalActualDistance = 0;
    const origin = new google.maps.LatLng(route.nodes[0].coordinates.lat, route.nodes[0].coordinates.lng); // Starting at node 0 (depot)
    const destinations = route.nodes.map(pkg => new google.maps.LatLng(pkg.coordinates.lat, pkg.coordinates.lng));
    const responses = [];
    for (let i = 0; i < destinations.length; i += 25) {
        const chunk = destinations.slice(i, i + 25);
        await service.route(
            {
                origin: origin,
                destination: origin,
                waypoints: chunk.map(destination => ({ location: destination })),
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
                        const durationSeconds = element.duration?.value; // returns in seconds
                        const distanceMeters = element.distance?.value; // returns in meters
                        if (durationSeconds && distanceMeters) {
                            totalActualDuration += durationSeconds / 3600; // convert to hours
                            totalActualDistance += distanceMeters / 1609;  // convert to miles
                        }
                    });
                }
            }
        );
    }
    route.actualDistanceMiles = totalActualDistance;
    route.actualTimeMins = totalActualDuration * 60;
}