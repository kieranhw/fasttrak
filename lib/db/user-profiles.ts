import { UserProfile } from "@/types/user-profile";
import { UUID } from "crypto";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Fetch user profile from user
const fetchUserProfile = async () => {

    // Create a Supabase client configured to use cookies
    const supabase = createClientComponentClient()

    // Get user id from session
    const user = await supabase.auth.getUser();


    if (!user) {
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