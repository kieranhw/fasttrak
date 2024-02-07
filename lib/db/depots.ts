import { supabase } from "@/lib/supabase/client";
import { UserProfile } from "@/types/user-profile";
import { UUID } from "crypto";
import { db } from "./db";
import { Depot } from "@/types/depot";
import { cookies } from "next/headers";
import { PostgrestError } from "@supabase/supabase-js";
import { Store } from "@/types/store";

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

// Fetch depots for the store
const fetchDepotsForStore = async (store: Store): Promise<{ data: Depot[] | null, error: PostgrestError | null }> => {
    const { data, error } = await supabase
        .from('depots')
        .select()
        .eq('store_id', store.store_id);

    return { data, error };
}

const updateDepotById = async (id: UUID, updatedDepot: Depot): Promise<{ data: Depot | null, error: PostgrestError | null }> => {
    const { data, error } = await supabase
        .from('depots')
        .update(updatedDepot)
        .eq('depot_id', id)
        .select()
        .single();

    return { data: data ?? null, error };
}

export const depots = {
    fetch: {
        //forUser: fetchDepotsForUser,
        forStore: fetchDepotsForStore,
    },
    create: createDepot,
    update: {
        byId: updateDepotById,
        
    }
    

};