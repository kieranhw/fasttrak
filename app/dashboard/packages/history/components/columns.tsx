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
import { db } from "@/lib/db/db"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export const columns = (refreshData: () => void): ColumnDef<Package>[] => [
    {
        accessorKey: "tracking_id",
        header: "Tracking ID",
        cell: ({ row }) => {
            const trackingId = row.getValue("tracking_id")?.toString()

            return (
                <div className="flex flex-col w-fit">
                    <p>{trackingId}</p>
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
        accessorKey: "date_delivered",
        header: "Delivery Date",
        cell: ({ row }) => {
            const date = row.getValue("date_delivered")?.toString()
            return date ? new Date(date).toLocaleDateString() : ""
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
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 font-normal text-black bg-card flex cursor-default select-none items-center rounded-sm px-2 py-1 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                        View Information
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Package Information</DialogTitle>
                                        <DialogDescription>Tracking ID: {p.tracking_id}</DialogDescription>
                                    </DialogHeader>
                                    <div className="flex flex-col my-2">
                                        <div className="flex flex-col gap-1 border-t py-2">
                                            <p className="text-sm font-semibold">Package</p>
                                            <p className="text-sm">Weight: {Number(p.weight).toFixed(2)} kg</p>
                                            <p className="text-sm">Volume: {Number(p.volume).toFixed(2)} m<sup>3</sup></p>
                                            <p className="text-sm">Fragility: {p.fragile ? "Fragile" : "Not Fragile"}</p>
                                            <p className="text-sm">Priority: {p.priority}</p>
                                        </div>
                                        <div className="flex flex-col gap-1 border-y py-2">
                                            <p className="text-sm font-semibold">Recipient</p>
                                            <p className="text-sm">Name: {p.recipient_name}</p>
                                            <p className="text-sm">Address: {p.recipient_address}</p>
                                            <p className="text-sm">Phone: {p.recipient_phone}</p>
                                        </div>
                                        <div className="flex flex-col gap-1 border-b py-2">
                                            <p className="text-sm font-semibold">Sender</p>
                                            <p className="text-sm">Name: {p.sender_name}</p>
                                            <p className="text-sm">Address: {p.sender_address}</p>
                                            <p className="text-sm">Phone: {p.sender_phone}</p>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" variant="secondary">
                                                Close
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

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
