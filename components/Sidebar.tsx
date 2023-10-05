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

    const buttonStyle = "sidebar-item inline-flex items-center gap-2 font-medium hover:bg-primary/50 p-2 px-4 rounded-full transition-colors w-full my-1"
    const activeButton = "sidebar-item inline-flex items-center gap-2 font-medium bg-foreground/10 hover:bg-primary/50 p-2 px-4 full transition-colors";

    const linkStyle = "sidebar-item inline-flex font-medium text-foreground hover:text-primary p-2 w-full justify-start ml-4 transition-none"
    const activeLink = "sidebar-item inline-flex font-medium text-primary p-2 w-full justify-start ml-4 transition-none";

    return (
        <aside className="h-screen w-[250px] text-foreground flex flex-col p-4 border-r">
            <p className="text-primary text-2xl font-bold mx-4 mb-8">FastTrak</p>
            <Link draggable="false" href="/dashboard">
                <div className={`${buttonStyle} ${isActive("/dashboard") ? activeButton : ''}`}>
                    <BiSolidDashboard />
                    <p>Dashboard</p>
                </div>
            </Link>
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger className={`${buttonStyle} ${isActive("/dashboard/delivery") ? activeButton : ''}`}>
                        <div className="inline-flex justify-start items-center gap-2">
                            <RiRouteFill />
                            Delivery
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <Link draggable="false" href="/dashboard/delivery/schedule">
                            <Button className={`${linkStyle} ${isActive("/dashboard/delivery/schedule") ? activeLink : ''}`} variant="link">Delivery Schedule</Button>
                        </Link>
                        <Link draggable="false" href="/dashboard/delivery/manage">
                            <Button className={`${linkStyle} ${isActive("/dashboard/delivery/manage") ? activeLink : ''}`} variant="link">Route Configuration</Button>
                        </Link>
                        <Link draggable="false" href="/dashboard/delivery/history">
                            <Button className={`${linkStyle} ${isActive("/dashboard/delivery/history") ? activeLink : ''}`} variant="link">Delivery History</Button>
                        </Link>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger className={`${buttonStyle} ${isActive("/dashboard/packages") ? activeButton : ''}`}>
                        <div className="inline-flex justify-start items-center gap-2">
                            <PiPackageBold />
                            Packages
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <Link draggable="false" href="/dashboard/packages/add">
                            <Button className={`${linkStyle} ${isActive("/dashboard/packages/add") ? activeLink : ''}`} variant="link">Add Package</Button>
                        </Link>
                        <Link draggable="false" href="/dashboard/packages/manage">
                            <Button className={`${linkStyle} ${isActive("/dashboard/packages/manage") ? activeLink : ''}`} variant="link">Manage Inventory</Button>
                        </Link>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <Link draggable="false" href="/dashboard/depot">
                <div className={`${buttonStyle} ${isActive("/dashboard/depot") ? activeButton : ''}`}>
                    <FaWarehouse />
                    <p>Depot</p>
                </div>
            </Link>
            <Link draggable="false" href="/dashboard/vehicles">
                <div className={`${buttonStyle} ${isActive("/dashboard/vehicles") ? activeButton : ''}`}>
                    <BiSolidTruck />
                    <p>Vehicles</p>
                </div>
            </Link>
            <Link draggable="false" href="/dashboard/reports">
                <div className={`${buttonStyle} ${isActive("/dashboard/reports") ? activeButton : ''}`}>
                    <BiSolidReport />
                    <p>Reports</p>
                </div>
            </Link>



        </aside>
    )
}