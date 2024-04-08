import { UUID } from "crypto";
import { Vehicle } from "./Vehicle";


export enum ScheduleInitialiser {
    None = "None",
    Random = "Random",
    KMeans = "KMeans",
}

export enum ScheduleOptimiser {
    None = "None",
    GA = "Genetic Algorithm",
}

export type ScheduleReport = {
    report_id?: UUID,
    initialiser: ScheduleInitialiser,
    optimiser: ScheduleOptimiser,
    // GA Specific
    iterations?: number;
    distance_multiplier: number, // conversion from euclidean distance to actual distance
    average_speed: number, // miles per hour
    vehicles_available: Vehicle[], // UUID in the database
    vehicles_used: Vehicle[], // UUID in the database
    total_packages_count: number,
    scheduled_packages_count: number,
    total_distance_miles: number,
    total_duration_hours: number,
    // Schedule Profile
    auto_minimise?: boolean;
    optimisation_profile?: string;
    time_window_hours?: number;
    est_delivery_time?: number;
    other_solutions?: ScheduleReport[];
    // Efficiency
    TE: number;
    DE: number;
    WU: number;
    VU: number;
}

