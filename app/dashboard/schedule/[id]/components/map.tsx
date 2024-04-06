import { DeliverySchedule } from '@/types/delivery-schedule';
import { APIProvider, AdvancedMarker, Map, Marker } from '@vis.gl/react-google-maps';
import MarkerWithInfowindow from './marker';

export function PackageMap({ deliverySchedule }: { deliverySchedule: DeliverySchedule }) {
    const packages = deliverySchedule.package_order;


    const depotLocation: { lat: number, lng: number } = { lat: deliverySchedule.depot_lat, lng: deliverySchedule.depot_lng };


    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!} libraries={['marker']}>
            <Map
                mapId={'bf51a910020fa25a'}
                defaultZoom={12}
                defaultCenter={depotLocation}
                gestureHandling={'greedy'}
                disableDefaultUI>
                <MarkerWithInfowindow
                    lat={depotLocation.lat}
                    lng={depotLocation.lng}
                    title={'Depot'}
                    depot={true}
                />

                {/* map through packageLocations and add a markerwithinfowindow */}
                {packages.map((pkg, index) => (
                    <MarkerWithInfowindow
                        key={index}
                        lat={pkg.recipient_address_lat}
                        lng={pkg.recipient_address_lng}
                        title={`Package ${index + 1}`}
                        depot={false}
                        pkg={pkg}
                    />
                ))}
            </Map>
        </APIProvider>
    );
};