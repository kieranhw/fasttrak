import { supabase } from "@/lib/supabase/client";
import { UserProfile } from "@/types/user-profile";
import { PostgrestError, User } from "@supabase/supabase-js";

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

const createProfileByUser = async (user: User, firstName: string, lastName: string): Promise<{ data: UserProfile | null, error: PostgrestError | null }> => {
    const email = user.email;
    const userId = user.id;

    // Check if email and userId are not undefined
    if (!email || !userId) {
        console.error("User email or ID is missing");
        return { data: null, error: { message: "User email or ID is missing" } as PostgrestError };
    }

    try {
        // Attempt to insert the new user profile into the 'user_profiles' table
        const { data, error } = await supabase
            .from('user_profiles')
            .insert([
                { user_id: userId, email: email, first_name: firstName, last_name: lastName }
            ])
            .single(); // Assuming you are inserting a single record and want to return it

        if (error) {
            console.error("Error creating user profile: ", error);
            return { data: null, error };
        }

        console.log("Profile created successfully:", data);
        return { data, error: null };
    } catch (error) {
        console.error("Exception when creating user profile: ", error);
        return { data: null, error: error as PostgrestError };
    }
};


export const profiles = {
    create: {
        byUser: createProfileByUser,
    },
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