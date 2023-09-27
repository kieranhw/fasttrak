
import React, { useEffect, useState } from 'react';


import { Vehicle } from '@/types/vehicle'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { Button } from '@/components/ui/button';


export const deliveryVehicles: Vehicle[] = [
    {
        vehicle_id: "1",
        store_id: "1",
        manufacturer: "Ford",
        model: "Model 1",
        manufacture_year: 2021,
        status: "available",
        max_load: 1000,
        max_volume: 1000
    },
    {
        vehicle_id: "2",
        store_id: "2",
        manufacturer: "Ford",
        model: "Model 2",
        manufacture_year: 2021,
        status: "available",
        max_load: 1000,
        max_volume: 1000
    },
]

async function getData(): Promise<Vehicle[]> {
    // Fetch data from your API here.
    return deliveryVehicles
}


export default async function Vehicles() {

    const data = await getData()

    return (
        <div className="flex flex-col w-full justify-start gap-4 mx-auto max-w-[800px]">
            <div className="inline-flex justify-between">
                <h1 className="text-foreground font-medium text-2xl">Vehicles</h1>
                <Button className="h-10">Add Vehicle</Button>
            </div>
            <DataTable columns={columns} data={data} />

        </div>
    )
}
