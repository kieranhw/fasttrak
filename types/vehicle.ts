export type Vehicle = {
    vehicle_id: string
    store_id: string
    manufacturer: string
    model: string
    manufacture_year: number
    status: "Available" | "Unavailable"
    max_load: number
    max_volume: number
}