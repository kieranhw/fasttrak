import { supabase } from "@/lib/supabase/client";
import { UserProfile } from "@/types/user-profile";
import { PostgrestError } from "@supabase/supabase-js";

const fetchUserProfile = async (): Promise<{ data: UserProfile | null, error: PostgrestError | null }> => {
    try {
        const user = await supabase.auth.getUser();
        const userId = user.data.user?.id;

        if (!userId) {
            console.error("User not found");
            return { data: null, error: null };
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        return { data: data ?? null, error };
    } catch (error) {
        console.error("Error fetching user profile: ", error);
        return { data: null, error: error as PostgrestError };
    }
}

const updateUserStore = async (storeId: string): Promise<{ data: UserProfile | null, error: PostgrestError | null }> => {
    try {
        const user = await supabase.auth.getUser();
        const userId = user.data.user?.id;

        if (!userId) {
            console.error("User not found");
            return { data: null, error: null };
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .update({ store_id: storeId })
            .eq('user_id', userId)
            .single();

        return { data: data ?? null, error };
    } catch (error) {
        console.error("Error updating user profile: ", error);
        return { data: null, error: error as PostgrestError };
    }
}

const fetchUserProfileByEmail = async (email: string): Promise<{ data: UserProfile | null, error: PostgrestError | null, found: boolean }> => {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', email) // Directly query the email column
            .single();

        if (error || !data) {
            console.error("Error fetching user profile by email or not found: ", error);
            return { data: null, error, found: false };
        }

        return { data, error: null, found: true };
    } catch (error) {
        console.error("Error fetching user profile by email: ", error);
        return { data: null, error: error as PostgrestError, found: false };
    }
};

export const profiles = {
    fetch: {
        current: fetchUserProfile,
        profile: {
            byEmail: fetchUserProfileByEmail,
        },
    },
    update: {
        store: updateUserStore,
    },
};