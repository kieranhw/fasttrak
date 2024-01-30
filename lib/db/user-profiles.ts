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

export const profiles = {
    fetch: {
        profile: fetchUserProfile,
    },
    update: {
        store: updateUserStore,
    }
};
