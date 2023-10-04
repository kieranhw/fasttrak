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

export const columns: ColumnDef<Package>[] = [
    {
        accessorKey: "tracking_id",
        header: "Tracking ID",
    },
    {
        accessorKey: "weight",
        header: "Weight (kg)",
    },
    {
        accessorKey: "volume",
        header: () => (
            <div className="text-left">
                Volume (cm<sup>3</sup>)
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
        accessorKey: "created_at",
        header: "Date Added",
        cell: ({ row }) => {
            const timezone = row.getValue("created_at")?.toString()

            const extractedDate = timezone?.substring(0, 10)
            const formattedDate = new Date(extractedDate!).toLocaleDateString()

            return formattedDate;
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const p = row.original

            return (
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
                        <DropdownMenuItem>Edit Information</DropdownMenuItem>
                        <DropdownMenuItem>Remove Package</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
