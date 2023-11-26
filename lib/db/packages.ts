import { supabase } from "@/pages/api/supabase-client";
import { Package } from "@/types/package";
import { UUID } from "crypto";
import { db } from "./db";

// Fetch all packages for a user
const fetchPackages = async () => {

    // Fetch store for user
    const store = await db.stores.fetch.store.forUser();

    if (!store) {
        console.error("User not atatched to store");
        return;
    }

    let { data: packages, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false })
        .eq('store_id', store.store_id);
    if (error) {
        console.error("Error fetching packages: ", error);
        return;
    } else {
        return (packages as Package[]);
    }
}

// Fetch all packages for a user where "status" is "Pending" (i.e. not scheduled for delivery)
const fetchPackagesByPending = async () => {
    // Fetch store for user
    const store = await db.stores.fetch.store.forUser();

    if (!store) {
        console.error("User not atatched to store");
        return;
    }

    let { data: packages, error } = await supabase
        .from('packages')
        .select('*')
        .eq('status', 'Pending')
        .order('created_at', { ascending: false })
        .eq('store_id', store.store_id);
    if (error) {
        console.error("Error fetching packages: ", error);
        return;
    } else {
        return (packages as Package[]);
    }
}

// Fetch packages by Ids
const fetchPackagesByIds = async (ids: UUID[]) => {
    if (!ids) {
        return ([] as Package[]);
    }

    // Fetch store for user
    const store = await db.stores.fetch.store.forUser();

    if (!store) {
        console.error("User not atatched to store");
        return;
    }

    let { data: packages, error } = await supabase
        .from('packages')
        .select('*')
        .in('package_id', ids)
        .eq('store_id', store.store_id);
    if (error) {
        console.error("Error fetching packages: ", error);
        return;
    } else {
        return (packages as Package[]);
    }
}


// Remove package by ID
// TODO: Ensure data consistency by removing package from all delivery schedules
const removePackageById = async (id: UUID) => {
    console.log("Removing package: " + id)

    // Fetch store for user
    const store = await db.stores.fetch.store.forUser();

    if (!store) {
        console.error("User not atatched to store");
        return;
    }

    const { error } = await supabase
        .from('packages')
        .delete()
        .eq('package_id', id)
        .eq('store_id', store.store_id);
    if (error) {
        console.error("Error removing package: ", error);
        return
    } else {
        return
    }
}

// Update package status by IDs
const updatePackageStatusByIds = async (ids: UUID[], status: string) => {
    // Fetch store for user
    const store = await db.stores.fetch.store.forUser();

    if (!store) {
        console.error("User not atatched to store");
        return;
    }

    const { error } = await supabase
        .from('packages')
        .update({ status: status })
        .eq('package_id', ids)
        .eq('store_id', store.store_id);
    if (error) {
        console.error("Error updating package status: ", error);
        return
    } else {
        return
    }
}


export const packages = {
    fetch: {
        all: fetchPackages,
        pending: fetchPackagesByPending,
        byIds: fetchPackagesByIds,
    },
    update: {
        status: updatePackageStatusByIds,
    },
    remove: {
        byId: removePackageById,
    }
};