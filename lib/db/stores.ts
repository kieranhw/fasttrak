import { supabase } from "@/pages/api/supabase-client";
import { UserProfile } from "@/types/user-profile";
import { UUID } from "crypto";
import { db } from "./db";
import { Store } from "@/types/store";

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

export const stores = {
    fetch: {
        store: {
            forUser: fetchStoreForUser,
        }
    },
};