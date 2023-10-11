import { UUID } from "crypto";
import { Package } from "./package";
import { Vehicle } from "./vehicle";

export enum DeliveryStatus {
    Pending = "Pending",
    Scheduled = "Scheduled",
    InProgress = "In Progress",
    Completed = "Completed",
    Cancelled = "Cancelled"
}

export type DeliverySchedule = {
    schedule_id: UUID;
    vehicle_id: UUID;
    vehicle: Vehicle; // Convert UUID to store Vehicle object
    store_id: UUID;
    package_order: Package[];  // Convert array of UUIDs to array of Package objects
    delivery_date: Date;
    start_time: Date;
    status: DeliveryStatus;
    num_packages: number;
    estimated_duration_mins: number;
    actual_duration_mins: number;
    distance_miles: number;
    created_at: Date;
};
