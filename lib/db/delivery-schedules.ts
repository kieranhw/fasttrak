import { supabase } from "@/pages/api/supabase-client";
import { Package } from "@/types/package";
import { DeliverySchedule } from "@/types/delivery-schedule";
import { UUID } from "crypto";
import { fetchPackagesByIds } from "./packages";
import { fetchVehicleById } from "./vehicles";


// Fetch all schedules for a date
export const fetchSchedulesByDate = async () => {
    let { data: schedules, error } = await supabase
        .from('delivery_schedules')
        .select('*')
        //.eq('delivery_date', new Date())
        // add store id
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching bins: ", error);
        return;
    } else {
        // For all schedules, convert the array of packageId UUIDs to array of Package objects using fetchPackagesByIds
        if (schedules) {
            for (let i = 0; i < schedules.length; i++) {
                schedules[i].package_order = await fetchPackagesByIds(schedules[i].package_order);
                schedules[i].vehicle = await fetchVehicleById(schedules[i].vehicle_id);
            }


        }
        
        const deliverySchedule: DeliverySchedule[] = schedules as DeliverySchedule[];

        return deliverySchedule;
    }
}



