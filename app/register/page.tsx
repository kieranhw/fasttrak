import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils/utils"
import { buttonVariants } from "@/components/ui/button"
import bgFull from '@/public/images/bgFull.jpg'
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RegisterForm from "./register-form"
import { db } from "@/lib/db/db"
import { useState } from "react"
import { EmailChecker } from "./email-checker"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import validator from "validator"

export const metadata: Metadata = {
    title: "Register",
    description: "Register a new account for the FastTrak dashboard.",
}

export default function Login({
    searchParams,
}: {
    searchParams: { message: string };
}) {
    const signUp = async (email: string, password: string, confirmPassword: string, firstName: string, lastName: string) => {
        "use server";
        console.log("Sign up called")

        const origin = headers().get("origin");
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // Server side validation

        // Minimum 8 characters, include one special character
        const passwordValid = password.length >= 8 && /[^A-Za-z0-9]/.test(password);

        // Check if the email is valid
        if (!validator.isEmail(email)) return redirect("/register?message=Email format is invalid");

        // Check password requirements
        if (!passwordValid) return redirect("/register?message=Password is weak");

        // Check password matches
        if (password !== confirmPassword) return redirect("/register?message=Passwords do not match");

        // Check first and last name exist
        if (!firstName || !lastName) return redirect("/register?message=First name and last name are required");

        // Check first and last name are valid
        if (!validator.isAlpha(firstName) || !validator.isAlpha(lastName)) return redirect("/register?message=Name format is invalid")

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

                // TODO: Remove user's auth if profile cannot be created
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
        if (!validator.isEmail(email)) return false

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