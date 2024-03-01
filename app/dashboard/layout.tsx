import DemoTools from "@/components/DemoTools"
import Sidebar from "@/components/Sidebar"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"
import { ProfileDropdown } from "@/components/ui/profile-dropdown"
import { createClient } from "@/lib/supabase/server";

export const metadata = {
    title: 'FastTrak | Dashboard',
    description: 'Parcel logistics and tracking made simple.',
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const signOut = async () => {
        "use server";

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        await supabase.auth.signOut();

        return redirect("/login");
    }

    return (
        <div className="h-screen w-full flex overflow-hidden">
            <Sidebar />
            <div className="w-full flex flex-col">
                <header className="min-h-[60px] max-h-[60px] w-full flex items-center px-4 border-b justify-end gap-4">
                    <DemoTools/>
                    <ProfileDropdown signOut={signOut}/>
                </header>
                <div className="flex flex-grow overflow-hidden">
                    <div className="flex-grow p-4 overflow-y-auto bg-accent_background">
                        {children}
                    </div>
                    <Toaster />
                </div>
            </div>
        </div>

    )
}
