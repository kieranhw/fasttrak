import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import bgFull from '@/public/images/bgFull.jpg'

export const metadata: Metadata = {
    title: "Register",
    description: "Register a new account for the FastTrak dashboard.",
}

export default function AuthenticationPage() {
    return (
        <>
            <div className="container relative h-[200px] md:h-[700px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
                <div className="relative hidden h-full flex-col bg-muted p-10 pt-5 text-white lg:flex dark:border-r" >
                    <div className="absolute inset-0 bg-zinc-900" />
                    <div className="relative z-20 flex items-center text-xl font-bold text-primary">
                        <Link href="/">
                            FastTrak
                        </Link>

                    </div>
                </div>

            </div>
        </>
    )
}