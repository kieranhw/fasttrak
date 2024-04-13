"use server";
import { Metadata } from "next"
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/db"
import { EmailChecker } from "./email-checker"
import validator from "validator"

export const metadata: Metadata = {
    title: "Register",
    description: "Register a new account for the FastTrak dashboard.",
}

export default function Register({
    searchParams,
}: {
    searchParams: { message: string };
}) {
    const signUp = async (email: string, password: string, confirmPassword: string, firstName: string, lastName: string) => {
        "use server";

        const origin = headers().get("origin");
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // Server side validation

        // Minimum 8 characters, include one special character
        const passwordValid = password.length >= 8 && /[^A-Za-z0-9]/.test(password);

        // Check if the email is valid format
        if (!validator.isEmail(email)) return redirect("/register?message=Email format is invalid");

        // Check if password meets requirements
        if (!passwordValid) return redirect("/register?message=Password is weak");

        // Check password matches confirm password
        if (password !== confirmPassword) return redirect("/register?message=Passwords do not match");

        // Check first and last name exist in request
        if (!firstName || !lastName) return redirect("/register?message=First name and last name are required");

        // Check first and last name are valid format
        if (!validator.isAlpha(firstName) || !validator.isAlpha(lastName)) return redirect("/register?message=Name format is invalid")

        // Sign up user to auth service
        const { data: user, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        // Sign up to auth service success
        if (!error && user.user) {
            // Create user profile from user auth
            const profileCreationResult = await db.profiles.create.byUser(user.user, firstName, lastName);
            if (profileCreationResult.error) {
                console.error("Error creating user profile:", profileCreationResult.error);
            } else {
                // If success, log user in and redirect to dashboard
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (!error) {
                    return redirect("/dashboard");
                }
            }
        }

        // Error signing up user to auth service
        if (error) {
            return redirect("/register?message=Could not register user, please try again.");
        }
    };

    const validateEmail = async (email: string): Promise<Boolean> => {
        "use server";

        // Check if email is valid format
        if (!validator.isEmail(email)) return false

        // Check if email exists in database
        if (await db.profiles.fetch.profile.byEmail(email).then(res => res.found)) return false

        return true
    }

    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-[450px] justify-center gap-2">
            <div className="p-8 border rounded-lg drop-shadow-sm bg-gradient-to-b from-primary/25 via-card via-20% to-card">

                <div className="flex w-full flex-col justify-center space-y-6">
                    <div>
                        <EmailChecker validateEmail={validateEmail} signUp={signUp} errorMsg={searchParams.message} />
                    </div>
                </div>
            </div>
        </div>
    );
}