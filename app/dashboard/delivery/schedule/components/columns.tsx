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
            const p = row.original
            const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
            const [inProgressAlertOpen, setInProgressAlertOpen] = useState(false)
            const [completeAlertOpen, setCompleteAlertOpen] = useState(false)


            async function handleRemovePackage(id?: UUID) {
                if (!id) {
                    console.warn("Schedule ID is undefined. Cannot remove package.");
                    return;
                }
                await db.packages.remove.byId(id);
                refreshData();
            }

            async function handleUpdateStatus(id: UUID, status: DeliveryStatus) {
                console.log(id)
                const res = await db.schedules.update.status(id, status)
                if (res) {
                    console.log("Delivery status updated successfully.")
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
                                        disabled={p.status != DeliveryStatus.Scheduled}
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
                                        <AlertDialogAction disabled={p.status != DeliveryStatus.Scheduled}
                                            onClick={() => handleUpdateStatus(p.schedule_id!, DeliveryStatus.InProgress)}
                                        >
                                            Continue
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog open={completeAlertOpen} onOpenChange={setCompleteAlertOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        disabled={p.status == DeliveryStatus.Scheduled || p.status == DeliveryStatus.Completed || p.status == DeliveryStatus.Cancelled}
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
                                            onClick={() => handleUpdateStatus(p.schedule_id!, DeliveryStatus.Completed)}
                                        >
                                            Continue
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Export Directions</DropdownMenuItem>
                            <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 font-normal flex cursor-default select-none items-center rounded-sm px-2 py-1 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">Remove Package</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Package</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will remove the package from
                                            the system and cancel any scheduled deliveries.
                                        </AlertDialogDescription>
                                        <AlertDialogDescription className="text-foreground/50 hover:underline hover:text-blue-500 hover:cursor-pointer w-fit">
                                            Made a mistake? Amend the package instead.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemovePackage(p.schedule_id)}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>

            )
        },
    },
]
