import { supabase } from "@/lib/supabase/client";
import { Vehicle } from "@/types/db/Vehicle";
import { db } from "./db";
import { UserProfile } from "@/types/db/UserProfile";
import { UUID } from "crypto";

const fetchVehicles = async (): Promise<Vehicle[] | null> => {
    try {
        const { data: userProfile, error: userProfileError } = await db.profiles.fetch.current();

        if (userProfileError || !userProfile || !userProfile.store_id) {
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
        return false;
    }
}

export const createVehicle = async (vehicleData: Partial<Vehicle>): Promise<{ data: Vehicle | null, error: Error | null }> => {
    try {
        const { data: userProfile, error: userProfileError } = await db.profiles.fetch.current();

        if (userProfileError || !userProfile || !userProfile.store_id) {
            throw new Error("User profile not found or store_id is missing");
        }

        // Validate vehicleData fields
        if (!vehicleData.registration || !vehicleData.manufacturer || !vehicleData.model) {
            throw new Error("Missing required vehicle fields");
        }

        // Add store_id to the vehicle data
        const completeVehicleData = { ...vehicleData, store_id: userProfile.store_id };

        const { data, error } = await supabase
            .from('vehicles')
            .insert([completeVehicleData])
            .single();

        if (error) throw new Error(`Error creating vehicle: ${error.message}`);

        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

const updateVehicleById = async (vehicleId: UUID, vehicleData: Partial<Vehicle>): Promise<{ data: Vehicle | null, error: Error | null }> => {
    try {
        const { data, error } = await supabase
            .from('vehicles')
            .update(vehicleData)
            .eq('vehicle_id', vehicleId)
            .single();

        if (error) throw new Error(`Error updating vehicle: ${error.message}`);

        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};



export const vehicles = {
    create: createVehicle,
    fetch: {
        all: fetchVehicles,
        byId: fetchVehicleById,
    },
    update: {
        byId: updateVehicleById,
    },
    delete: {
        byId: deleteVehicleById,
    },
    
};
