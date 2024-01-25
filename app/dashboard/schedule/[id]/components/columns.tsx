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
import { db } from "@/db/db"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

export const columns = (refreshData: () => void): ColumnDef<Package>[] => [
    {
        header: "Order",
        cell: ({ row }) => {
            // set delivery number based on number of row in the table
            const deliveryNumber = row.index + 1            

            return (
                <div className="flex flex-col w-5">
                    <p className="text-muted-foreground">{deliveryNumber}</p>
                </div>
            )
        }
    },
    {
        accessorKey: "tracking_id",
        header: "Tracking ID",
        cell: ({ row }) => {
            const trackingId = row.getValue("tracking_id")?.toString()

            return (
                <div className="flex flex-col w-fit">
                    <p>{trackingId}</p>
                    <Link target="_blank" href={`/track/${trackingId}`}>
                        <p className="text-sm text-muted-foreground hover:text-blue-500 hover:underline w-fit">View Tracking</p>
                    </Link>
                </div>
            )
        }
    },
    {
        header: "Load",
        cell: ({ row }) => {
            const weight = row.original.weight?.toString();
            const volume = row.original.volume?.toString();
            
            return (
                <div className="flex flex-col w-fit">
                    <p>{weight} kg</p>
                    <p>{volume} m<sup>3</sup></p>

                </div>
            )
        }
    },
    {
        accessorKey: "recipient_address",
        header: "Postcode",
        cell: ({ row }) => {
            // Extract postcode from address using regex for uk postcode [A-Za-z]{1,2}[0-9Rr][0-9A-Za-z]? [0-9][ABD-HJLNP-UW-Zabd-hjlnp-uw-z]{2}
            const address = row.getValue("recipient_address")?.toString()
            const postcode = address?.match(/[A-Za-z]{1,2}[0-9Rr][0-9A-Za-z]? [0-9][ABD-HJLNP-UW-Zabd-hjlnp-uw-z]{2}/)?.toString()

            return postcode;
        }
    },
    
]
