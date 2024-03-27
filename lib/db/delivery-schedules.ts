import { supabase } from "@/lib/supabase/client";
import { Package } from "@/types/package";
import { DeliverySchedule, DeliveryStatus } from "@/types/delivery-schedule";
import { UUID } from "crypto";
import { db } from "./db";
import { Vehicle } from "@/types/vehicle";
import { PostgrestError } from "@supabase/supabase-js";

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

        const { data: schedules, error } = await supabase
            .from('delivery_schedules')
            .select('*')
            .eq('delivery_date', formattedDate)
            .eq('store_id', store.store_id);

        if (error) throw new Error(`Error fetching schedules: ${error.message}`);
        if (!schedules) return null;

        for (const schedule of schedules) {
            schedule.package_order = await fetchPackagesForSchedule(schedule.package_order);
            schedule.schedule_report = await fetchScheduleReportForSchedule(schedule.schedule_report);
            schedule.vehicle = await db.vehicles.fetch.byId(schedule.vehicle_id);
        }

        return schedules as DeliverySchedule[];
    } catch (error) {
        console.error("Error in fetchSchedulesByDate:", error);
        return null;
    }
};

// Returns all schedules from date1 to date2, stored in the database as yyyy-MM-DD
export const fetchSchedulesByDateRange = async (date1: String, date2: String): Promise<{ data: DeliverySchedule[] | null, error: PostgrestError | null }> => {
    try {
        const store = await fetchStoreAndHandleError();

        const { data: schedules, error } = await supabase
            .from('delivery_schedules')
            .select('*')
            .gte('delivery_date', date1)
            .lte('delivery_date', date2)
            .eq('store_id', store.store_id);

        if (error) throw new Error(`Error fetching schedules: ${error.message}`);
        if (!schedules) return { data: null, error: null };

        // Process each schedule to fetch additional information like package order and vehicle details
        for (const schedule of schedules) {
            schedule.package_order = await fetchPackagesForSchedule(schedule.package_order);
            schedule.schedule_report = await fetchScheduleReportForSchedule(schedule.schedule_report);
            schedule.vehicle = await db.vehicles.fetch.byId(schedule.vehicle_id);
        }

        return { data: schedules, error: null };
    } catch (error) {
        console.error("Error in fetchSchedulesByDateRange:", error);
        return { data: null, error: { message: (error as Error).message, details: '', hint: '', code: '' } }
    };
};



// Helper function to fetch packages for a schedule
const fetchPackagesForSchedule = async (packageIds: UUID[]): Promise<Package[]> => {
    const packages = await db.packages.fetch.byIds(packageIds);
    if (!packages) throw new Error("Error fetching packages for schedule");

    // Sort packages in the same order as they are saved in the database
    return packageIds.map(id => packages.find(pkg => pkg.package_id === id) as Package);
};

const fetchScheduleReportForSchedule = async (reportId: UUID): Promise<any> => {
    const scheduleReport = await supabase
        .from('schedule_reports')
        .select('*')
        .eq('report_id', reportId)

    if (scheduleReport && scheduleReport.data) {
        return scheduleReport.data[0];
    } else {
        return null;
    }
}

// Fetch schedule by ID
export const fetchScheduleById = async (scheduleId: UUID): Promise<DeliverySchedule | null> => {
    try {
        const { data: schedule, error } = await supabase
            .from('delivery_schedules')
            .select('*')
            .eq('schedule_id', scheduleId)
            .single();

        if (error) throw new Error(`Error fetching schedule: ${error.message}`);
        if (!schedule) return null;

        schedule.package_order = await fetchPackagesForSchedule(schedule.package_order);
        schedule.schedule_report = await fetchScheduleReportForSchedule(schedule.schedule_report);
        schedule.vehicle = await db.vehicles.fetch.byId(schedule.vehicle_id);

        return schedule;
    } catch (error) {
        console.error("Error in fetchScheduleById:", error);
        return null;
    }
};

// Update schedule status by ID
const updateScheduleStatus = async (
    scheduleId: UUID,
    status: DeliveryStatus
): Promise<{ data: DeliverySchedule | null, error: PostgrestError | null }> => {
    try {
        const { error } = await supabase
            .from('delivery_schedules')
            .update({ status: status })
            .eq('schedule_id', scheduleId);

        if (error) throw new Error(`Error updating schedule status: ${error.message}`);

        // Fetch the updated schedule
        const updatedSchedule = await fetchScheduleById(scheduleId);
        if (!updatedSchedule) throw new Error('Failed to fetch the updated schedule');

        // Update package statuses
        const packageIds = updatedSchedule.package_order.map(pkg => pkg.package_id);
        await db.packages.update.status.byIds(packageIds, status);

        return { data: updatedSchedule, error: null };
    } catch (error) {
        console.error("Error in updateScheduleStatus:", error);
        return {
            data: null,
            error: {
                message: `Error updating schedule status: ${(error as Error).message}`,
                details: '',
                hint: '',
                code: ''
            },
        };
    }
};

export const schedules = {
    fetch: {
        byId: fetchScheduleById,
        byDate: fetchSchedulesByDate,
        byDateRange: fetchSchedulesByDateRange,
    },
    update: {
        status: updateScheduleStatus,
    }
};
