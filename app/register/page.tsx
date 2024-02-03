import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
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

        // Check if the email is valid
        if (!validator.isEmail(email)) {
            return redirect("/register?message=Email format is invalid");
        }


        // Check if the password is strong enough
        // TODO: Implement client side
        /*
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
            return redirect("/register?message=Weak password");
        }
        */

        // Check if the password and confirmPassword match
        if (password !== confirmPassword) {
            return redirect("/register?message=Passwords do not match");
        }

        // Check if the firstName and lastName are not empty
        if (!firstName || !lastName) {
            return redirect("/register?message=First name and last name are required");
        }


        const { data: user, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });
        if (!error && user.user) {
            console.log("Creating user")
            console.log(firstName)
            console.log(lastName)
            const profileCreationResult = await db.profiles.create.byUser(user.user, firstName, lastName);
            if (profileCreationResult.error) {
                console.error("Error creating user profile:", profileCreationResult.error);
            } else {
                // log user in
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (!error) {
                    return redirect("/dashboard");
                }
            }
        }
        if (error) {
            console.log(error.message)
            //return redirect("/login?message=Could not authenticate user");
        }

        // Used for email confirmation
        //return redirect("/login?message=Check email to continue sign in process");
    };

    const validateEmail = async (email: string): Promise<Boolean> => {
        "use server";
        if (!validator.isEmail(email)) return false

        return true
    }

    const signOut = async () => {
        "use server";

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        await supabase.auth.signOut();

        return redirect("/login");
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