import { UUID } from "crypto"

export type Depot = {
    depot_id?: UUID
    store_id?: UUID
    address_1?: string
    address_2?: string
    postcode?: string
    depot_name: string
    depot_lat: number
    depot_lng: number
    days_active: string[]
    dispatch_time: string
}
  