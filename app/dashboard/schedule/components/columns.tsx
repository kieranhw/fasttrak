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

export const columns = (refreshData: () => void): ColumnDef<DeliverySchedule>[] => [
    {
        accessorKey: "vehicle",
        header: "Vehicle",
        cell: ({ row }) => {
            const vehicle: Vehicle = row.getValue("vehicle")

            return (
                <div className="flex flex-col w-fit">
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <Link href={`/dashboard/vehicles/record/${vehicle.vehicle_id}`}>
                                <p className="hover:text-blue-500 hover:underline hover:cursor-pointer">{vehicle.registration}</p>
                            </Link>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-50">
                            <div className="flex justify-between space-x-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold">{vehicle.registration}</h4>
                                    <p className="text-sm">
                                        {vehicle.manufacturer} {vehicle.model} {vehicle.manufacture_year}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Max load: {vehicle.max_load} kg
                                        <br />
                                        Max volume: {vehicle.max_volume} m<sup>3</sup>
                                    </p>
                                </div>
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                    <p className="text-sm text-foreground/50 w-fit">{vehicle.manufacturer} {vehicle.model}</p>
                </div>
            )
        }
    },
    {
        accessorKey: "package_order",
        header: "Packages",
        cell: ({ row }) => {
            const packages: Package[] = row.getValue("package_order")

            return (
                <div className="flex flex-col w-fit">
                    <p>{packages.length}</p>
                </div>
            )
        }
    },
    {
        accessorKey: "distance_miles",
        header: () => (
            <div className="text-left">
                Distance
            </div>
        ),
        cell: ({ row }) => {
            const distance = row.getValue("distance_miles")?.toString()

            return (
                <div className="flex flex-col w-fit">
                    <p>{distance} mi</p>
                </div>
            )
        }
    },
    {
        accessorKey: "estimated_duration_mins",
        header: () => (
            <div className="text-left">
                Driving Time
            </div>
        ),
        cell: ({ row }) => {
            const time = row.getValue("estimated_duration_mins")?.toString()

            // convert minutes to hours and minutes (e.g. 90 minutes = 1h 30)
            const hours = Math.floor(parseInt(time!) / 60);
            const minutes = parseInt(time!) % 60;

            return (
                <div className="flex flex-col w-fit">
                    <p>{hours}h {minutes}m</p>
                </div>
            )
        }
    },
    {
        accessorKey: "status",
        header: "Status",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const schedule = row.original
            const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
            const [inProgressAlertOpen, setInProgressAlertOpen] = useState(false)
            const [completeAlertOpen, setCompleteAlertOpen] = useState(false)




            async function handleUpdateStatus(id: UUID, status: DeliveryStatus) {

                // Update schedule status
                const res = await db.schedules.update.status(id, status)

                if (res) {
                    console.log("Delivery status updated successfully.")

                    let packageIds: UUID[] = []
                    let packageStatus = ""

                    schedule.package_order.forEach(e => {
                        // Add package IDs to array
                        packageIds.push(e.package_id)
                    });

                    if (status == DeliveryStatus.InProgress) {
                        packageStatus = "In Transit"
                    } else if (status == DeliveryStatus.Completed) {
                        packageStatus = "Delivered"
                    }

                    // Update packages from schedule to updated status
                    const packages = await db.packages.update.status(packageIds, packageStatus)

                } else {
                    console.warn("Failed to update delivery status.");
                }

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

                            <AlertDialog open={inProgressAlertOpen} onOpenChange={setInProgressAlertOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        disabled={schedule.status != DeliveryStatus.Scheduled}
                                        variant="ghost"
                                        className="relative w-full justify-start h-8 font-normal flex cursor-default select-none items-center rounded-sm px-2 py-1 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                    >
                                        Set In-Progress
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delivery In Progress</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure? This update cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction disabled={schedule.status != DeliveryStatus.Scheduled}
                                            onClick={() => handleUpdateStatus(schedule.schedule_id!, DeliveryStatus.InProgress)}
                                        >
                                            Continue
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {/* TODO: Show dialog to select any packages which were failed to be delivered */}
                            <AlertDialog open={completeAlertOpen} onOpenChange={setCompleteAlertOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        disabled={schedule.status == DeliveryStatus.Scheduled || schedule.status == DeliveryStatus.Completed || schedule.status == DeliveryStatus.Cancelled}
                                        variant="ghost"
                                        className="relative w-full justify-start h-8 font-normal flex cursor-default select-none items-center rounded-sm px-2 py-1 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                    >
                                        Mark Complete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delivery Complete</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure? This update cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleUpdateStatus(schedule.schedule_id!, DeliveryStatus.Completed)}
                                        >
                                            Continue
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <DropdownMenuSeparator />
                            <Link href={`/dashboard/schedule/${schedule.schedule_id}`}>
                                <DropdownMenuItem>Route Details</DropdownMenuItem>
                            </Link>

                            <DropdownMenuItem>Export Directions</DropdownMenuItem>

                            {/* If delivery already in progress, show dialog to select any items that have already been delivered */}
                            {/* else, show alert dialog to confirm that the delivery will be cancelled */}

                            <DropdownMenuItem>Cancel Deliveries</DropdownMenuItem>

                        </DropdownMenuContent>
                    </DropdownMenu>
                </>

            )
        },
    },
]
