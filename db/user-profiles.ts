import { UserProfile } from "@/types/user-profile";
import { supabase } from "@/lib/supabase/client";

// Fetch user profile from user
const fetchUserProfile = async () => {
    // Get user id from session
    const user = await supabase.auth.getUser();

    if (!user.data.user?.id) {
        console.error("User not found");
        return;
    }     

    const userId = user.data.user?.id;
    console.log(userId)

    // fetch user profile from user id
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error("Error fetching user profile: ", error);
        return;
    } else if (data && data.length > 0) {
        // Convert user profile to UserProfile type
        const userProfile: UserProfile = data[0] as UserProfile;
        return userProfile;
    }
}

export const profiles = {
    fetch: {
        profile: fetchUserProfile,
    },
};