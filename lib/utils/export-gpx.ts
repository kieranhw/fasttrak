import { DeliverySchedule } from '@/types/db/DeliverySchedule';
import { Package } from '@/types/db/Package';
import { format } from 'date-fns';

export function downloadGPX(schedule: DeliverySchedule): void {
    let gpxData = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="FastTrak" xmlns="http://www.topografix.com/GPX/1/1">
`;

    // Start of the route
    gpxData += `<rte>\n  <name>Delivery Route</name>\n`;

    // Aggregate packages by address
    const addressMap: { [key: string]: { packages: Package[]; lat: number; lng: number } } = {};
    schedule.package_order.forEach(pkg => {
        const addressKey = `${pkg.recipient_address_lat},${pkg.recipient_address_lng}`;
        if (!addressMap[addressKey]) {
            addressMap[addressKey] = { packages: [], lat: pkg.recipient_address_lat, lng: pkg.recipient_address_lng };
        }
        addressMap[addressKey].packages.push(pkg);
    });

    // Add aggregated packages as route points
    Object.entries(addressMap).forEach(([key, { packages, lat, lng }]) => {
        const isMultipleDeliveries = packages.length > 1;
        const names = packages.map(p => p.recipient_name).join(", ");
        const firstPackage = packages[0];

        gpxData += `  <rtept lat="${lat}" lon="${lng}">
    <name>${isMultipleDeliveries ? 'Multiple Deliveries' : firstPackage.recipient_name}</name>
    <desc>${firstPackage.recipient_address}${isMultipleDeliveries ? ` - Deliveries for: ${names}` : ''}</desc>
  </rtept>\n`;
    });

    // Close the route and the GPX file
    gpxData += `</rte>\n</gpx>`;

    // Convert the GPX data to a Blob and initiate download
    const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FT-Schedule-${schedule.vehicle.registration}-${format(new Date(schedule.delivery_date), 'ddMMyy')}.gpx`;
    document.body.appendChild(link);
    link.click();

    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
}
