import { supabase } from "@/lib/supabase/client";
import { UserProfile } from "@/types/user-profile";
import { UUID } from "crypto";
import { db } from "./db";
import { Store } from "@/types/store";
import { cookies } from "next/headers";
import { PostgrestError } from "@supabase/supabase-js";

// Fetch store as type Store from store id saved in user profile
const fetchStoreForUser = async () => {
    
    const user = await db.profiles.fetch.profile();
    console.log("User in store " + user?.user_id)
    console.log("Store ID in store " + user?.store_id)

    if (!user) {
        console.error("User not found");
        return;
    }

    // fetch store from userprofile store id
    const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('store_id', user.store_id);
    if (error) {
        console.error("Error fetching store: ", error);
        return;
    }

    if (!data) {
        return null;
    }

    // Set store as data
    const store = data[0] as Store;
    return store;
}

const createStore = async (store: Store): Promise<{ data: Store | null, error: PostgrestError | null }> => {
    const { data, error } = await supabase
        .from('stores')
        .insert([store])
        .select()
        .single();

    return { data: data ?? null, error };
}

const updateStoreById = async (id: UUID, updatedStore: Store): Promise<{ data: Store | null, error: PostgrestError | null }> => {
    const { data, error } = await supabase
        .from('stores')
        .update(updatedStore)
        .eq('store_id', id)
        .select()
        .single();

    return { data: data ?? null, error };
}


export const stores = {
    fetch: {
        forUser: fetchStoreForUser,
   
    },
    create: createStore,
    update: {
        byId: updateStoreById,
        
    }
    

};