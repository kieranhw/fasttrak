import { UUID } from "crypto"

export type PriorityType = "Express" | "Standard";
export type PackageStatus = "Pending" | "In-Transit" | "Delivered";
export enum CurrentState {
    Pending = "Pending",
    Scheduled = "Scheduled",
    InTransit = "In-Transit",
    Return = "Return",
    Delivered = "Delivered"
}

export type Package = {
    package_id: UUID
    store_id: UUID
    tracking_id: string;
    recipient_name: string
    recipient_address: string
    recipient_address_lat: number
    recipient_address_lng: number
    recipient_phone: string
    sender_name: string
    sender_address: string
    sender_address_lat?: number
    sender_address_lng?: number
    sender_phone: string
    status: PackageStatus
    current_state: CurrentState
    delivery_attempts: number
    weight: number
    volume: number
    fragile?: boolean
    priority: PriorityType
    effective_priority?: number
    delivery_notes: string
    date_added: Date
    //date_modified?: Date
    //date_delivered?: Date
    //date_dispatched?: Date
}
  