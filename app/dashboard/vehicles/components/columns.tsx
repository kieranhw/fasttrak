"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Vehicle } from '@/types/db/Vehicle'

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
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VehicleForm } from "./add-vehicle-form/vehicle-form"
import { VehicleSchema } from "./add-vehicle-form/vehicle-schema"
import { supabase } from "@/lib/supabase/client"
import { z } from "zod"
import { UUID } from "crypto"
import { db } from "@/lib/db/db"
import { VehicleDialogContent } from "./vehicle-dialog-content"
import { toast } from "@/components/ui/use-toast"

export const columns = (refreshData: () => void): ColumnDef<Vehicle>[] => [
    {
        accessorKey: "registration",
        header: "Registration",
    },
    {
        accessorKey: "manufacturer",
        header: "Manufacturer",
    },

    {
        accessorKey: "model",
        header: "Model",
    },

    {
        accessorKey: "max_load",
        header: "Max Load (kg)",
    },
    {
        accessorKey: "max_volume",
        header: () => (
            <div className="text-left">
                Volume (m<sup>3</sup>)
            </div>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const vehicle = row.original
            const [editDialogOpen, setEditDialogOpen] = useState(false)
            const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
            const [submitting, setSubmitting] = useState(false)

            async function onEditSubmit(values: z.infer<typeof VehicleSchema>) {
                setSubmitting(true)
                //TODO : update vehicle instead of create new
                const { data, error } = await db.vehicles.update.byId(
                    vehicle.vehicle_id,
                    {
                        registration: values.registration,
                        manufacturer: values.manufacturer,
                        model: values.model,
                        manufacture_year: values.manufacture_year,
                        status: "Available",
                        max_load: values.max_load,
                        max_volume: values.max_volume,
                    });
                if (error) {
                    alert(error.message);
                } else {
                    refreshData();
                }
                setSubmitting(false)
            }

            async function onRemoveVehicle(id: UUID) {

                const res = await db.vehicles.delete.byId(id);

                if (res) {
                    console.log("Vehicle removed successfully.")
                } else {
                    console.warn("Failed to remove vehicle.");
                }

                refreshData();
                setRemoveDialogOpen(false);
            }

            async function onUpdateAvailability() {
                const vehicle = row.original;
                const status = vehicle.status === "Available" ? "Unavailable" : "Available";

                const res = await db.vehicles.update.byId(vehicle.vehicle_id, { status: status });

                if (res.error) {
                    toast({
                        title: "Unable to update vehicle availability, please try again later.",
                    });
                } else {
                    toast({
                        title: "Success!",
                        description: "Your vehicle availability has been updated.",
                    });
                    refreshData();
                }
            }



            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Vehicle</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onUpdateAvailability}>
                            Make {vehicle.status === "Available" ? "Unavailable" : "Available"}
                        </DropdownMenuItem>
                        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start relative h-8 font-normal text-black bg-card flex cursor-default select-none items-center rounded-sm px-2 py-1 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                    Edit Information
                                </Button>
                            </DialogTrigger>
                            <VehicleDialogContent
                                vehicle={vehicle}
                                open={editDialogOpen}
                                onOpenChange={setEditDialogOpen}
                                onSubmit={onEditSubmit}
                                dialogTitle="Edit Vehicle Information"
                                dialogDescription="Make your changes and click 'save' to update the details."
                                submitting={submitting}
                            />
                        </Dialog>
                        <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="relative w-full justify-start h-8 font-normal text-black bg-card flex cursor-default select-none items-center rounded-sm px-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                    Remove
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Vehicle</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will remove the vehicle from
                                        the system and cancel any scheduled deliveries.
                                    </AlertDialogDescription>
                                    <AlertDialogDescription
                                        className="text-muted-foreground hover:underline hover:text-blue-500 hover:cursor-pointer w-fit"
                                        onClick={() => {
                                            setRemoveDialogOpen(false);
                                            setEditDialogOpen(true);
                                        }}>
                                        Made a mistake? Amend the vehicle information instead.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onRemoveVehicle(vehicle.vehicle_id)}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu >
            )
        },
    },
]
