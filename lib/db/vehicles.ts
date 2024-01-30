import { supabase } from "@/lib/supabase/client";
import { Vehicle } from "@/types/vehicle";
import { db } from "./db";
import { UserProfile } from "@/types/user-profile";
import { UUID } from "crypto";

const fetchVehicles = async (): Promise<Vehicle[] | null> => {
    try {
        const { data: userProfile, error: userProfileError } = await db.profiles.fetch.profile();

        if (userProfileError || !userProfile || !userProfile.store_id) {
            console.error("Error fetching user profile or store_id is missing:", userProfileError);
            return null;
        }

        // Fetch vehicles for store which user is attached to
        const { data: vehicles, error: vehicleError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('store_id', userProfile.store_id);

        if (vehicleError) {
            throw new Error(`Error fetching vehicles: ${vehicleError.message}`);
        }

        return vehicles as Vehicle[] ?? null;
    } catch (error) {
        console.error("Error in fetchVehicles:", error);
        return null;
    }
};


// Fetch vehicle by ID
const fetchVehicleById = async (id: UUID): Promise<Vehicle | null> => {
    try {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('vehicle_id', id)
            .single();

        if (error) {
            throw new Error(`Error fetching vehicle: ${error.message}`);
        }

        return data ?? null;
    } catch (error) {
        console.error("Error in fetchVehicleById:", error);
        return null;
    }
}

// Delete vehicle by ID
const deleteVehicleById = async (id: UUID): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('vehicle_id', id);

        if (error) {
            throw new Error(`Error deleting vehicle: ${error.message}`);
        }

        return true;
    } catch (error) {
        console.error("Error in deleteVehicleById:", error);
        return false;
    }
}

export const vehicles = {
    fetch: {
        all: fetchVehicles,
        byId: fetchVehicleById,
    },
    delete: {
        byId: deleteVehicleById,
    }
};
