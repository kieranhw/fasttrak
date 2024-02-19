import { VRPSolution, VehicleRoute } from "../routing/models/vrp";
import { Package } from "@/types/package";
import { Loader } from '@googlemaps/js-api-loader';

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

export async function calculateAverageSpeed(solution: VRPSolution): Promise<number> {
    if (!service) {
        await initDirectionsService();
    }

    const responses = [];
    let totalActualDistance = 0;
    let totalActualDuration = 0;

    for (const route of solution.routes) {
        console.log("route " + route.currentVolume);
        const packages: Package[] = [];
        for (let node of route.nodes) {
            if (node.pkg) {
                packages.push(node.pkg);
            }
            if (packages.length === 25) break;
        }

        const origin = new google.maps.LatLng(route.nodes[0].coordinates.lat, route.nodes[0].coordinates.lng); // Starting at node 0 (depot)
        const destinations = packages.map(pkg => new google.maps.LatLng(pkg.recipient_address_lat, pkg.recipient_address_lng));

        await service.route(
            {
                origin: origin,
                destination: origin,
                waypoints: destinations.map(destination => ({ location: destination })),
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.IMPERIAL,
                avoidHighways: false,
                avoidTolls: true,
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
                            totalActualDistance += distanceMeters/1609;  // convert to miles
                            totalActualDuration += durationSeconds/3600 ; // convert to hours
                        }
                    });
                    
                }
            }
        );
    }

    // calculate average speed
    const avgSpeed = totalActualDistance / totalActualDuration;
    console.log("Average speed: ", avgSpeed);

    return avgSpeed; // This will be handled by the API route function below
}