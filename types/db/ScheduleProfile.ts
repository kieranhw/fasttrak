import { ScheduleInitialiser, ScheduleOptimiser } from "./ScheduleReport";
import { Vehicle } from "./Vehicle";

export enum OptimisationProfile {
    Eco = "Eco",
    Space = "Space",
    Time = "Time",
}

export type ScheduleProfile = {
    selected_vehicles: Vehicle[],
    auto_selection: boolean,
    optimisation_profile: OptimisationProfile,
    time_window: number, // time window in hours
    delivery_time: number, // est time to deliver each parcel in minutes
    // Advanced
    select_optimal: boolean,
    initialisation_algorithm: ScheduleInitialiser,
    optimisation_algorithm: ScheduleOptimiser,
    generations: number
}