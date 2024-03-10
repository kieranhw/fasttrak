import { UUID } from "crypto";
import { supabase } from "../supabase/client";
import { DeliverySchedule, DeliveryStatus } from "@/types/delivery-schedule";
import { CurrentState, Package, PackageStatus } from "@/types/package";


export async function updatePackages(schedule: DeliverySchedule, deliveredPackages: Package[], failedPackages: Package[]) {

    // Delivered packages
    // 1. Update package status to delivered, completed etc
    // 2. Redact personal information

    // Delivered packages: Update package status to "Delivered" and redact personal information
    if (deliveredPackages.length > 0) {
        // Get array of packageIds
        const deliveredPackageIds = deliveredPackages.map(pkg => pkg.package_id);

        const { error: deliveredError } = await supabase
            .from('packages')
            .update({
                recipient_name: null,
                recipient_phone: null,
                sender_name: null,
                sender_phone: null,
                current_state: CurrentState.Delivered,
                status: PackageStatus.Delivered,
                // In format YYYY-MM-DD
                date_delivered: new Date().toISOString().split('T')[0]
            })
            .in('package_id', deliveredPackageIds);
        if (deliveredError) {
            console.error("Error updating delivered packages", deliveredError);
        }
    }

    // Update schedule to completed
    const { error: scheduleError } = await supabase
        .from('delivery_schedules')
        .update({ status: "Completed" })
        .eq('schedule_id', schedule.schedule_id);

    if (scheduleError) {
        console.error("Error updating schedule status", scheduleError);
    } else {
        schedule.status = DeliveryStatus.Completed
    }



    // Failed packages
    // 1. Update package status 
    // 2. IF attempts >= 3, return to sender by overwriting recipient address with sender address (groupA)
    // 3. IF attempts < 3, return to depot for re-delivery (groupB)
    // 4. Update package status to pending
    const groupA: Package[] = [];
    const groupB: Package[] = [];

    if (failedPackages.length > 0) {
        for (const failedPackage in failedPackages) {
            const pkg = failedPackages[failedPackage];

            if (pkg.delivery_attempts >= 3) {
                pkg.delivery_attempts += 1;
                pkg.current_state = CurrentState.Pending;
                pkg.status = PackageStatus.Return;

                // Overwrite recipient info with sender info
                pkg.recipient_address = pkg.sender_address;
                pkg.recipient_address_lat = pkg.sender_address_lat;
                pkg.recipient_address_lng = pkg.sender_address_lng;
                pkg.recipient_name = pkg.sender_name;
                pkg.recipient_phone = pkg.sender_phone;

                // Redact sender info
                pkg.sender_name = "";
                pkg.sender_phone = "";
                pkg.sender_address = "";
                pkg.sender_address_lat = NaN;
                pkg.sender_address_lng = NaN;

                // Add to groupA
                groupA.push(pkg);
            } else if (pkg.delivery_attempts < 3) {
                pkg.delivery_attempts += 1;
                pkg.current_state = CurrentState.Pending;
                pkg.status = PackageStatus.Pending;

                // Add to groupB
                groupB.push(pkg);
            }
        }
    }

    // Update failed package group A
    if (groupA.length > 0) {
        for (const pkg of groupA) {
            const { error } = await supabase
                .from('packages')
                .update({
                    recipient_address: pkg.recipient_address,
                    recipient_address_lat: pkg.recipient_address_lat,
                    recipient_address_lng: pkg.recipient_address_lng,
                    recipient_name: pkg.recipient_name,
                    recipient_phone: pkg.recipient_phone,
                    sender_name: pkg.sender_name,
                    sender_phone: pkg.sender_phone,
                    sender_address: pkg.sender_address,
                    sender_address_lat: pkg.sender_address_lat,
                    sender_address_lng: pkg.sender_address_lng,
                    delivery_attempts: pkg.delivery_attempts,
                    current_state: pkg.current_state,
                    status: pkg.status
                })
                .eq('package_id', pkg.package_id);

            if (error) {
                console.error(`Error updating package with package_id ${pkg.package_id}`, error);
            }
        }

    }

    // Update failed package group B
    if (groupB.length > 0) {
        for (const pkg of groupB) {
            const { error } = await supabase
                .from('packages')
                .update({
                    delivery_attempts: pkg.delivery_attempts,
                    current_state: pkg.current_state,
                    status: pkg.status
                })
                .eq('package_id', pkg.package_id);

            if (error) {
                console.error(`Error updating package with package_id ${pkg.package_id}`, error);
            }
        }
    }


    return schedule;
}