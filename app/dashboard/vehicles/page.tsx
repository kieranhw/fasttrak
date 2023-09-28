
import React, { useEffect, useState } from 'react';


import { Vehicle } from '@/types/vehicle'
import { DataTable } from './components/data-table'
import { columns } from './components/columns'
import { Button } from '@/components/ui/button';

const deliveryVehicles: Vehicle[] = [
    {
        vehicle_id: "1",
        registration: "AB72CDE",
        store_id: "1",
        manufacturer: "Ford",
        model: "Model 1",
        manufacture_year: 2021,
        status: "Available",
        max_load: 1000,
        max_volume: 1000
    },
]

async function getData(): Promise<Vehicle[]> {
    // Fetch data from API endpoint
    return deliveryVehicles
}


export default async function Vehicles() {

    const data = await getData()

    return (
        <div className="flex flex-col w-full justify-start gap-2 mx-auto p-4 max-w-[1500px]">
            <div className="inline-flex justify-between">
                <h1 className="text-foreground font-bold text-3xl my-auto">Vehicles</h1>
            </div>
            <DataTable columns={columns} data={data} />

        </div>
    )
}
