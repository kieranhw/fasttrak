"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Package } from '@/types/package'

import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { useState } from "react"
import { UUID } from "crypto"
import { DeliverySchedule, DeliveryStatus } from "@/types/delivery-schedule"
import { Vehicle } from "@/types/vehicle"
import { db } from "@/lib/db/db"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

export const columns = (refreshData: () => void): ColumnDef<Package>[] => [
    {
        accessorKey: "tracking_id",
        header: "Tracking ID",
        cell: ({ row }) => {
            const trackingId = row.getValue("tracking_id")?.toString()

            return (
                <div className="flex flex-col w-fit">
                    <p>{trackingId}</p>
                    <Link target="_blank" href={`/track/${trackingId}`}>
                        <p className="text-sm text-foreground/50 hover:text-blue-500 hover:underline w-fit">View Tracking</p>
                    </Link>
                </div>
            )
        }
    },
    {
        accessorKey: "weight",
        header: "Weight (kg)",
    },
    {
        accessorKey: "volume",
        header: () => (
            <div className="text-left">
                Volume (m<sup>3</sup>)
            </div>
        ),
    },
    {
        accessorKey: "priority",
        header: "Priority",
    },
    {
        accessorKey: "status",
        header: "Status",
    },
    {
        accessorKey: "recipient_address",
        header: "Postcode",
        cell: ({ row }) => {
            // Extract postcode from address in printed format
            const address = row.getValue("recipient_address")?.toString()
            const postcode = address?.substring(address.length - 7)


            return postcode;
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const p = row.original
            const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
            const [editDialogOpen, setEditDialogOpen] = useState(false)


            async function handleRemovePackage(id?: UUID) {
                if (!id) {
                    console.warn("Schedule ID is undefined. Cannot remove package.");
                    return;
                }
                await db.packages.remove.byId(id);
                refreshData();
            }


            return (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 font-normal text-black bg-card flex cursor-default select-none items-center rounded-sm px-2 py-1 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                        Remove Package
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Package</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will remove the package from
                                            the system and cancel any scheduled deliveries.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemovePackage(p.package_id)}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Remove Package Alert */}

                </>

            )
        },
    },
]
