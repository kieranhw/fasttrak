
'use client'

import React, { useEffect, useState } from 'react';

import { Vehicle } from '@/types/vehicle'
import { DataTable } from './components/data-table'
import { columns } from './components/columns'
import { db } from '@/lib/db/db';

export default function Vehicles() {
    const [data, setData] = useState<Vehicle[]>([]);
    const [reload, setReload] = useState(false); 

    useEffect(() => {
        async function fetchData() {
            const vehicles = await db.vehicles.fetch.all();
            if (vehicles) {
                setData(vehicles);
            }
        }
        fetchData();
    }, [reload]);  

    const refreshData = () => setReload(prev => !prev);

    return (
        <div className="flex flex-col w-full justify-start gap-4 mx-auto p-4 max-w-[1600px]">
            <div className="inline-flex justify-between">
                <h1 className="text-foreground font-bold text-3xl my-auto">Vehicles</h1>
            </div>
            <DataTable columns={columns(refreshData)} data={data} refreshData={refreshData} />
        </div>
    )
}
