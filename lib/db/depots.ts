import { supabase } from "@/lib/supabase/client";
import { UserProfile } from "@/types/user-profile";
import { UUID } from "crypto";
import { db } from "./db";
import { Depot } from "@/types/depot";
import { cookies } from "next/headers";
import { PostgrestError } from "@supabase/supabase-js";

// Create new Depot
const createDepot = async (depot: Omit<Depot, 'id'>): Promise<{ data: Depot | null, error: PostgrestError | null }> => {
    const store = await db.stores.fetch.forUser();

    if (!store.data?.store_id) {
        return { data: null, error: { message: 'Store ID not found for the user', details: '', hint: '', code: '' } };
    }

    // Add store_id to the depot object
    const depotWithStoreId = { ...depot, store_id: store.data?.store_id };

    const { data, error } = await supabase
        .from('depots') 
        .insert([depotWithStoreId])
        .select()
        .single();

    return { data, error };
}

export const depots = {
    fetch: {
        //forUser: fetchDepotsForUser,
    },
    create: createDepot,
    //update: {
    //    byId: updateStoreById,
        
    //}
    

};