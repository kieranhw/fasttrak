import { supabase } from "@/pages/api/supabase-client";
import { Package } from "@/types/package";
import { DeliverySchedule } from "@/types/delivery-schedule";
import { UUID } from "crypto";
import { db } from "./db";

// Fetch all schedules for a date
export const fetchSchedulesByDate = async (date: Date) => {
    const formattedDate = date.toISOString().slice(0, 10);

    let { data: schedules, error } = await supabase
        .from('delivery_schedules')
        .select('*')
        .eq('delivery_date', formattedDate)
        // TODO: add store id
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching schedules: ", error);
        return;
    } else {
        // For all schedules, convert the array of packageId UUIDs to array of Package objects using fetchPackagesByIds
        if (schedules) {
            for (let i = 0; i < schedules.length; i++) {
                schedules[i].package_order = await db.packages.fetch.byIds(schedules[i].package_order);
                schedules[i].vehicle = await db.vehicles.fetch.byId(schedules[i].vehicle_id);
            }


        }

        const deliverySchedule: DeliverySchedule[] = schedules as DeliverySchedule[];

        return deliverySchedule;
    }
}

// Update schedule status by ID
const updateScheduleStatus = async (scheduleId: UUID, status: string) => {
    let { data: packages, error } = await supabase
        .from('delivery_schedules')
        .update({ status: status })
        .eq('schedule_id', scheduleId);

    if (error) {
        console.error("Error updating package status: ", error);
        return("Error updating package status");
    } else {
        return true;
    }
}



export const schedules = {
    fetch: {
    },
    remove: {
    },
    update: {
        status: updateScheduleStatus,
    }
};