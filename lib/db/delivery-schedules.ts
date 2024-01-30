import { createClient } from "@/lib/supabase/client";
import { Package } from "@/types/package";
import { DeliverySchedule, DeliveryStatus } from "@/types/delivery-schedule";
import { UUID } from "crypto";
import { db } from "./db";
import { Vehicle } from "@/types/vehicle";

// Helper function to fetch store and handle errors
const fetchStoreAndHandleError = async () => {
    const { data: store, error } = await db.stores.fetch.forUser();
    if (error || !store) {
        console.error("Error fetching store or store not found: ", error);
        throw new Error("Store fetching failed");
    }
    return store;
};

// Fetch all schedules for a date
export const fetchSchedulesByDate = async (date: Date): Promise<DeliverySchedule[] | null> => {
    try {
        const store = await fetchStoreAndHandleError();
        const formattedDate = date.toISOString().slice(0, 10);
        const supabase = createClient();

        const { data: schedules, error } = await supabase
            .from('delivery_schedules')
            .select('*')
            .eq('delivery_date', formattedDate)
            .eq('store_id', store.store_id);

        if (error) throw new Error(`Error fetching schedules: ${error.message}`);
        if (!schedules) return null;

        for (const schedule of schedules) {
            schedule.package_order = await fetchPackagesForSchedule(schedule.package_order);
            schedule.vehicle = await db.vehicles.fetch.byId(schedule.vehicle_id);
        }

        return schedules;
    } catch (error) {
        console.error("Error in fetchSchedulesByDate:", error);
        return null;
    }
};

// Helper function to fetch packages for a schedule
const fetchPackagesForSchedule = async (packageIds: UUID[]): Promise<Package[]> => {
    const packages = await db.packages.fetch.byIds(packageIds);
    if (!packages) throw new Error("Error fetching packages for schedule");

    // Sort packages in the same order as they are saved in the database
    return packageIds.map(id => packages.find(pkg => pkg.package_id === id) as Package);
};

// Fetch schedule by ID
export const fetchScheduleById = async (scheduleId: UUID): Promise<DeliverySchedule | null> => {
    try {
        const supabase = createClient();
        const { data: schedule, error } = await supabase
            .from('delivery_schedules')
            .select('*')
            .eq('schedule_id', scheduleId)
            .single();

        if (error) throw new Error(`Error fetching schedule: ${error.message}`);
        if (!schedule) return null;

        schedule.package_order = await fetchPackagesForSchedule(schedule.package_order);
        schedule.vehicle = await db.vehicles.fetch.byId(schedule.vehicle_id);

        return schedule;
    } catch (error) {
        console.error("Error in fetchScheduleById:", error);
        return null;
    }
};

// Update schedule status by ID
const updateScheduleStatus = async (scheduleId: UUID, status: DeliveryStatus): Promise<boolean | string> => {
    try {
        const supabase = createClient();
        const { error } = await supabase
            .from('delivery_schedules')
            .update({ status: status })
            .eq('schedule_id', scheduleId);

        if (error) throw new Error(`Error updating schedule status: ${error.message}`);

        const schedule = await fetchScheduleById(scheduleId);
        if (schedule) {
            const packageIds = schedule.package_order.map(pkg => pkg.package_id);
            await db.packages.update.status.byIds(packageIds, status);
        }

        return true;
    } catch (error) {
        console.error("Error in updateScheduleStatus:", error);
        return `Error updating schedule status: ${error}`;
    }
};

export const schedules = {
    fetch: {
        byId: fetchScheduleById,
        byDate: fetchSchedulesByDate,
    },
    update: {
        status: updateScheduleStatus,
    }
};
