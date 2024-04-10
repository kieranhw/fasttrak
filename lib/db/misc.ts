import { Depot } from "@/types/db/Depot"
import { Store } from "@/types/db/Store"
import { UserProfile } from "@/types/db/UserProfile"
import { PostgrestError } from "@supabase/supabase-js"
import { db } from "./db"
import { supabase } from "../supabase/client"
import { DeliverySchedule } from "@/types/db/DeliverySchedule"
import { DashboardInfo } from "@/types/DashboardInfo"


const fetchDashboardInfo = async (): Promise<{ data: DashboardInfo | null, error: PostgrestError | null }> => {
    const store = await db.stores.fetch.forUser();
    if (!store.data || store.error) {
        return { data: null, error: { message: 'Store ID not found for the user', details: '', hint: '', code: '' } };
    }
    // Fetch schedules for store id where delivery_date is between start and end of the current month
    const { data, error: schedulesError } = await supabase
        .from('delivery_schedules')
        .select('*')
        .eq('store_id', store.data.store_id)
        .gte('delivery_date', new Date(new Date().getFullYear(), new Date().getMonth()).toISOString().split('T')[0])
        .lte('delivery_date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);
    if (schedulesError) return { data: null, error: schedulesError };

    let schedules = data as DeliverySchedule[];

    // Count number of schedules created by taking length of schedules array, then sum to get the number of packages scheduled
    const schedulesCount = schedules.length;
    const scheduledPackagesCount = schedules.reduce((acc, schedule) => acc + schedule.package_order.length, 0);
    const milesDriven = schedules.reduce((acc, schedule) => acc + schedule.actual_distance_miles, 0);
    const timeTakenMins = schedules.reduce((acc, schedule) => acc + schedule.actual_duration_mins, 0);
    const timeTakenHours = timeTakenMins / 60;
    
    const deliveryEfficiency = (scheduledPackagesCount / milesDriven * timeTakenHours) as unknown as number;
    
    // If NaN then set to 0
    const deliveryEfficiencyOutput = isNaN(deliveryEfficiency) ? 0 : deliveryEfficiency.toFixed(2);

    if (milesDriven > 999 && milesDriven < 9998) {
        // Convert number to string and add comma, rounding any decimals to nearest decimal, not adding a k but a comma between first and second num
        var milesDrivenOutput = milesDriven.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else if (milesDriven > 9999) {
        // Convert to number to string and add comma, rounding any decimals to nearest decimal
        // e.g. 21506.32 => 21.5k
        var milesDrivenOutput = (milesDriven / 1000).toFixed(1) + "k";
    } else {
        var milesDrivenOutput = milesDriven.toFixed(2);
    }


    // Construct object
    const dashboardInfo: DashboardInfo = {
        store: store.data,
        schedules_created: schedulesCount,
        packages_scheduled: scheduledPackagesCount,
        miles_driven: milesDrivenOutput,
        delivery_efficiency: deliveryEfficiencyOutput
    }

    return { data: dashboardInfo, error: null }
}


export const misc = {
    fetch: {
        dashboardInfo: fetchDashboardInfo,
    }
};