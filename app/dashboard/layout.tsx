
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

import Sidebar from "@/components/Sidebar"


export const metadata = {
    title: 'FastTrak | Dashboard',
    description: 'Parcel logistics and tracking made simple.',
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {



    return (
        <div className="min-h-screen w-full flex flex-col">

            <header className="h-16 w-full text-white flex items-center px-4 border-b">
                <p className="text-primary text-xl font-bold">FastTrak</p>
            </header>
            <div className="flex flex-grow">
                <Sidebar />
                <div className="flex-grow bg-secondary p-4 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}
