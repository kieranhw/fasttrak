export type Vehicle = {
    vehicle_id: string
    store_id: string
    manufacturer: string
    model: string
    manufacture_year: number
    status: "available" | "unavailable"
    max_load: number
    max_volume: number
}