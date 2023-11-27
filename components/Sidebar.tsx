'use client'

import { usePathname } from 'next/navigation'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { BiSolidDashboard, BiSolidReport, BiSolidTruck } from 'react-icons/bi'
import { PiPackageBold } from 'react-icons/pi'
import { RiRouteFill } from 'react-icons/ri'
import { FaWarehouse } from 'react-icons/fa'
import { useEffect } from 'react'

export default function Sidebar() {
    const router = usePathname();

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return router === "/dashboard";
        }
        return router?.startsWith(href);
    }

    useEffect(() => {
        // Get all sidebar items
        const sidebarItems = document.querySelectorAll('.sidebar-item');

        // Disable dragging for each sidebar item
        sidebarItems.forEach(item => {
            item.setAttribute('draggable', 'false');
        });
    }, []);

    const buttonStyle = "sidebar-item inline-flex items-center gap-2 font-medium hover:bg-primary/50 p-2 px-3 rounded-md transition-colors w-full"
    const activeButton = "sidebar-item inline-flex items-center gap-2 font-medium bg-accent hover:bg-primary/50 p-2 px-3 full transition-colors";

    const linkStyle = "sidebar-item inline-flex font-medium text-foreground hover:text-primary p-2 w-full justify-start ml-4 transition-none"
    const activeLink = "sidebar-item inline-flex font-medium text-primary p-2 w-full justify-start ml-4 transition-none";

    return (
        <aside className="min-w-[220px] max-w-[220px] border-r px-4">
            <div className="flex justify-between items-center min-h-[60px] max-h-[60px]">
                <p className="text-primary text-2xl font-bold">FastTrak</p>
            </div>

            <div className="text-foreground flex flex-col gap-2 pt-6">
                <Link draggable="false" href="/dashboard">
                    <div className={`${buttonStyle} ${isActive("/dashboard") ? activeButton : ''}`}>
                        <BiSolidDashboard />
                        <p>Dashboard</p>
                    </div>
                </Link>
                <Link draggable="false" href="/dashboard/schedule">
                    <div className={`${buttonStyle} ${isActive("/dashboard/schedule") ? activeButton : ''}`}>
                        <RiRouteFill />
                        <p>Schedule</p>
                    </div>
                </Link>
                <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                        <AccordionTrigger className={`${buttonStyle} ${isActive("/dashboard/packages") ? activeButton : ''}`}>
                            <div className="inline-flex justify-start items-center gap-2">
                                <PiPackageBold />
                                Packages
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="mt-2 h-[120px]">
                            <Link draggable="false" href="/dashboard/packages/add">
                                <Button className={`${linkStyle} ${isActive("/dashboard/packages/add") ? activeLink : ''}`} variant="link">Add Package</Button>
                            </Link>
                            <Link draggable="false" href="/dashboard/packages/inventory">
                                <Button className={`${linkStyle} ${isActive("/dashboard/packages/inventory") ? activeLink : ''}`} variant="link">Inventory</Button>
                            </Link>
                            <Link draggable="false" href="/dashboard/packages/history">
                                <Button className={`${linkStyle} ${isActive("/dashboard/packages/history") ? activeLink : ''}`} variant="link">History</Button>
                            </Link>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <Link draggable="false" href="/dashboard/vehicles">
                    <div className={`${buttonStyle} ${isActive("/dashboard/vehicles") ? activeButton : ''}`}>
                        <BiSolidTruck />
                        <p>Vehicles</p>
                    </div>
                </Link>
                <Link draggable="false" href="/dashboard/depot">
                    <div className={`${buttonStyle} ${isActive("/dashboard/depot") ? activeButton : ''}`}>
                        <FaWarehouse />
                        <p>Depot</p>
                    </div>
                </Link>
                <Link draggable="false" href="/dashboard/reports">
                    <div className={`${buttonStyle} ${isActive("/dashboard/reports") ? activeButton : ''}`}>
                        <BiSolidReport />
                        <p>Reports</p>
                    </div>
                </Link>



            </div>
        </aside>
    )
}