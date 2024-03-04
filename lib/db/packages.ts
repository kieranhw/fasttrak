import { supabase } from "@/lib/supabase/client";
import { Package, CurrentState } from "@/types/package";
import { UUID } from "crypto";
import { db } from "./db";
import { DeliveryStatus } from "@/types/delivery-schedule";
import { cookies } from "next/headers";

// Fetch all packages for a user
const fetchPackages = async () => {

    // Fetch store for user
    const { data: store, error } = await db.stores.fetch.forUser();

    if (!store) {
        console.error("User not atatched to store");
        return;
    } if (error) {
        console.error("Error fetching store: ", error);
        return;
    } else {

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
}

// Fetch all packages for a user where "status" is "Pending" (i.e. not scheduled for delivery)
const fetchPackagesByPending = async () => {
    // Fetch store for user

    // Fetch store for user
    const { data: store, error } = await db.stores.fetch.forUser();

    if (!store) {
        console.error("User not atatched to store");
        return;
    } if (error) {
        console.error("Error fetching store: ", error);
        return;
    } else {

        let { data: packages, error } = await supabase
            .from('packages')
            .select('*')
            .eq('current_state', 'Pending')
            .order('created_at', { ascending: false })
            .eq('store_id', store.store_id);
        if (error) {
            console.error("Error fetching packages: ", error);
            return;
        } else {
            return (packages as Package[]);
        }
    }
}

// Fetch packages by Ids
const fetchPackagesByIds = async (ids: UUID[]) => {
    if (!ids) {
        return ([] as Package[]);
    }

    let { data: packages, error } = await supabase
        .from('packages')
        .select('*')
        .in('package_id', ids)
    if (error) {
        console.error("Error fetching packages: ", error);
        return;
    } else {
        return (packages as Package[]);
    }
}

// Fetch packages for store ID which are not delivered
const fetchPackagesInventory = async () => {

    // Get store ID
    const { data: store, error } = await db.stores.fetch.forUser();

    if (!store) {
        console.error("User not attached to store");
        return;
    } if (error) {
        console.error("Error fetching store: ", error);
        return;
    } else {
        const { data: packages, error } = await supabase
            .from('packages')
            .select('*')
            .eq('store_id', store.store_id)
            .eq('current_state', CurrentState.Pending || CurrentState.InTransit || CurrentState.Scheduled);
        if (error) {
            console.error("Error fetching packages: ", error);
            return;
        } else {
            return (packages as Package[]);
        }
    }
}

// Fetch packages for store ID, select where PackageStatus = "Pending" | "In Transit"
const fetchPackageDeliveryHistory = async () => {
    // Get store ID
    const { data: store, error } = await db.stores.fetch.forUser();

    if (!store) {
        console.error("User not attached to store");
        return;
    } if (error) {
        console.error("Error fetching store: ", error);
        return;
    } else {
        const { data: packages, error } = await supabase
            .from('packages')
            .select('*')
            .eq('store_id', store.store_id)
            .eq('current_state', CurrentState.Delivered);
        if (error) {
            console.error("Error fetching packages: ", error);
            return;
        } else {
            return (packages as Package[]);
        }
    }
}


// Remove package by ID
// TODO: Ensure data consistency by removing package from all delivery schedules
const removePackageById = async (id: UUID) => {
    console.log("Removing package: " + id)

    // Fetch store for user
    const { data: store, error } = await db.stores.fetch.forUser();

    if (!store) {
        console.error("User not atatched to store");
        return;
    } if (error) {
        console.error("Error fetching store: ", error);
        return;
    } else {
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
}

// Update package statuses by IDs
const updatePackageStatusByIds = async (ids: UUID[], status: DeliveryStatus) => {
    if (!ids) {
        return;
    }

    if (status === DeliveryStatus.Completed) {
        // Remove personal information from packages and set status to delivered
        const { error } = await supabase
            .from('packages')
            .update({
                status: "Delivered",
                recipient_name: null,
                recipient_phone: null,
                sender_name: null,
                sender_phone: null,
            })
            .in('package_id', ids)
        if (error) {
            console.error("Error updating package status: ", error);
            return
        }
    } else {
        const { error } = await supabase
            .from('packages')
            .update({ status: status })
            .in('package_id', ids)
        if (error) {
            console.error("Error updating package status: ", error);
            return
        } else {
            return
        }
    }
}


export const packages = {
    fetch: {
        all: fetchPackages,
        pending: fetchPackagesByPending,
        byIds: fetchPackagesByIds,
        inventory: fetchPackagesInventory,
        history: fetchPackageDeliveryHistory,
    },
    update: {
        status: {
            byIds: updatePackageStatusByIds,
        },
    },
    remove: {
        byId: removePackageById,
    }
};