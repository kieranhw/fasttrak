import { supabase } from "@/pages/api/supabase-client";
import { Package } from "@/types/package";
import { UUID } from "crypto";


// Fetch all packages for a user
export const fetchPackages = async () => {

    let { data: packages, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching bins: ", error);
        return;
    } else {
        return (packages as Package[]);
    }
}

// Remove package by ID
export const removePackageById = async (id: UUID) => {
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