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

export const metadata: Metadata = {
    title: "Register",
    description: "Register a new account for the FastTrak dashboard.",
}

export default function Login({
    searchParams,
}: {
    searchParams: { message: string };
}) {
    const signUp = async (email: string, password: string) => {
        "use server";

        const origin = headers().get("origin");
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        if (error) {
            return redirect("/login?message=Could not authenticate user");
        }

        return redirect("/login?message=Check email to continue sign in process");
    };

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
                <Link
                    href="/"
                    className="absolute left-3 top-2 p-2 rounded-md no-underline text-muted-foreground hover:text-foreground transition-colors bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1"
                    >
                        <polyline points="15 18 9 12 15 6" />
                    </svg>{" "}
                    Back
                </Link>
                <div className="h-[80px] flex justify-center items-center">
                    <div className="h-12 w-12 border rounded-lg drop-shadow-sm bg-card flex justify-center items-center font-bold text-2xl text-primary">
                        <i>FT</i>
                    </div>
                </div>
                <div className="flex w-full flex-col justify-center space-y-6">

                    <div>
                        <EmailChecker signUp={signUp} />
                    </div>
                </div>
            </div>
        </div>
    );
}