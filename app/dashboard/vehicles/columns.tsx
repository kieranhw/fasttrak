"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Vehicle } from '@/types/vehicle'

export const columns: ColumnDef<Vehicle>[] = [
    {
        accessorKey: "vehicle_id",
        header: () => (
            <div
                className="text-left max-w-[100px]"
            >
                ID
            </div>
        ),
        cell: ({ row }) => {
            const formatted = row.original.vehicle_id
            return <div className="text-left truncate max-w-[100px] font-medium">{formatted}</div>
        },
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
        accessorKey: "status",
        header: "Status",
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
    }
]
