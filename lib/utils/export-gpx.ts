import { DeliverySchedule } from '@/types/db/DeliverySchedule';
import { Package } from '@/types/db/Package';
import { format } from 'date-fns';

export function downloadGPX(schedule: DeliverySchedule): void {
    let gpxData = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="FastTrak" xmlns="http://www.topografix.com/GPX/1/1">
`;

    // Start of the track
    gpxData += `<trk>\n  <name>Delivery Route</name>\n  <trkseg>\n`;

    // Add depot as the start of the track if available
    if (schedule.depot_lat && schedule.depot_lng) {
        gpxData += `    <trkpt lat="${schedule.depot_lat}" lon="${schedule.depot_lng}">
      <name>Depot Start</name>
    </trkpt>\n`;
    }

    // Add each package as a track point in the order they appear in the schedule
    schedule.package_order.forEach((pkg: Package) => {
        gpxData += `    <trkpt lat="${pkg.recipient_address_lat}" lon="${pkg.recipient_address_lng}">
      <name>${pkg.recipient_name}</name>
      <desc>${pkg.recipient_address}</desc>
    </trkpt>\n`;
    });

    // Add depot as the end point of the track if available
    if (schedule.depot_lat && schedule.depot_lng) {
        gpxData += `    <trkpt lat="${schedule.depot_lat}" lon="${schedule.depot_lng}">
      <name>Depot End</name>
    </trkpt>\n`;
    }

    // Close the track segment and the GPX file
    gpxData += `  </trkseg>\n</trk>\n</gpx>`;

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
