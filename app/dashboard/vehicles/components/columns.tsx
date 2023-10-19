"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Vehicle } from '@/types/vehicle'

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
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VehicleForm } from "./add-vehicle-form/vehicle-form"
import { VehicleSchema } from "./add-vehicle-form/vehicle-schema"
import { supabase } from "@/pages/api/supabase-client"
import { z } from "zod"

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

            async function onSubmit(values: z.infer<typeof VehicleSchema>) {

                console.log("on Submit called")
                console.log(values)
                console.log(vehicle.vehicle_id)
                
                const { error } = await supabase
                    .from('vehicles')
                    .update({
                        registration: values.registration,
                        manufacturer: values.manufacturer,
                        model: values.model,
                        manufacture_year: values.manufacture_year,
                        status: "Available",
                        max_load: values.max_load,
                        max_volume: values.max_volume,
                    })
                    .eq('vehicle_id', vehicle.vehicle_id)
                if (error) {
                    alert(error.message)
                } else {
                    refreshData();
                    setEditDialogOpen(false);
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
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start relative h-8 font-normal text-black bg-card flex cursor-default select-none items-center rounded-sm px-2 py-1 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                    Edit Vehicle
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Vehicle Information</DialogTitle>
                                    <DialogDescription>
                                        Make your changes and click 'save' to update the details.
                                    </DialogDescription>
                                    <VehicleForm vehicle={vehicle} onSubmit={onSubmit} />

                                </DialogHeader>
                                <DialogFooter>
                                    {/*<Button variant="outline" onClick={e => setEditDialogOpen(!editDialogOpen)}>Cancel</Button>*/}

                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <DropdownMenuItem>Schedule Maintenance</DropdownMenuItem>
                        <DropdownMenuItem>Remove Vehicle</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
