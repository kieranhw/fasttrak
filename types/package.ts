import { UUID } from "crypto"

export type PriorityType = "Redelivery" | "Express" | "Standard" | "Return";


export type Package = {
    package_id: UUID
    store_id?: UUID
    tracking_id: string;
    recipient_name: string
    recipient_address: string
    recipient_phone: string
    sender_name: string
    sender_address: string
    sender_phone: string
    status: "Pending" | "In Transit" | "Delivered"
    weight: string
    volume: string
    fragile?: boolean
    priority: PriorityType
    delivery_notes: string
    date_added: Date
    //date_modified?: Date
    //date_delivered?: Date
    //date_dispatched?: Date
}
  