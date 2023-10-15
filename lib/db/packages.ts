import { supabase } from "@/pages/api/supabase-client";
import { Package } from "@/types/package";
import { UUID } from "crypto";


// Fetch all packages for a user
const fetchPackages = async () => {

    let { data: packages, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching packages: ", error);
        return;
    } else {
        return (packages as Package[]);
    }
}

// Fetch all packages for a user where "status" is "Pending" (i.e. not scheduled for delivery)
const fetchPackagesByPending = async () => {

    let { data: packages, error } = await supabase
        .from('packages')
        .select('*')
        .eq('status', 'Pending')
        .order('created_at', { ascending: false });

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

    let { data: packages, error } = await supabase
        .from('packages')
        .select('*')
        .in('package_id', ids);

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
    const { error } = await supabase
        .from('packages')
        .delete()
        .eq('package_id', id);

    if (error) {
        console.error("Error removing package: ", error);
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
    remove: {
        byId: removePackageById,
    }
};