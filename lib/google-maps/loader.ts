import { Loader } from "@googlemaps/js-api-loader";

export const loader = new Loader({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
    version: "weekly",
    libraries: ["routes", "geocoding"],
});