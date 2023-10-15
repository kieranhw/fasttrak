import { supabase } from "@/pages/api/supabase-client";
import { Vehicle } from "@/types/vehicle";
import { UUID } from "crypto";

// Fetch Vehicles
const fetchVehicles = async () => {

    const { data, error } = await supabase
        .from('vehicles')
        .select('*');

    if (error) {
        console.error("Error fetching vehicles: ", error);
        return null;
    } else if (data && data.length > 0) {
        // Convert vehicles to Vehicle type
        const vehicles: Vehicle[] = data as Vehicle[];
        return vehicles;
    }

    return null;
}

// Fetch vehicle by ID
const fetchVehicleById = async (id: UUID[]) => {

    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('vehicle_id', id);

    if (error) {
        console.error("Error fetching vehicle: ", error);
        return null;
    } else if (data && data.length > 0) {
        // Convert vehicle to Vehicle type
        const vehicle: Vehicle = data[0] as Vehicle;
        return vehicle;
    }

    return null;
}



export const vehicles = {
    fetch: {
        all: fetchVehicles,
        byId: fetchVehicleById,
    }
};