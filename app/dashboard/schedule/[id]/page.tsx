'use client'

import { fetchSchedulesByDate } from "@/lib/db/delivery-schedules";
import { createGraphAndSolutionFromSchedule } from "@/lib/routing/create-schedules";
import { displayGraph } from "@/lib/routing/model/cytoscape";
import { DeliverySchedule } from "@/types/delivery-schedule";
import { useState, useEffect } from "react";
import { date } from "zod";
import { DataTable } from "../components/data-table"
import { columns } from "./components/columns"
import { db } from "@/lib/db/db";
import { UUID } from "crypto";
import { Package } from "@/types/package";

export default function ScheduleDetails() {

    // Data
    const [data, setData] = useState<DeliverySchedule>();
    const [packages, setPackages] = useState<Package[]>([]);
    const [reload, setReload] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [graph, setGraph] = useState<any>(null);
    const [solution, setSolution] = useState<any>(null);

    useEffect(() => {
        
        async function fetchData() {
            setIsLoading(true); // Set loading to true when starting to fetch data

            const id = window.location.pathname.split("/")[3]
            
            let schedule = await db.schedules.fetch.byId(id as UUID);

            if (schedule) {
                setData(schedule as DeliverySchedule);

                let packages = schedule.package_order;

                if (packages) {
                    setPackages(packages);
                }
            } else {
                setData(undefined);
            }

            setIsLoading(false); // Set loading to false after fetching data
        }

        fetchData();
    }, [reload]);

    // Generate graph once data is loaded
    useEffect(() => {
        if (graph && solution) {
            displayGraph(graph, solution);
        }
    }, [graph, solution])

    const refreshData = () => setReload(prev => !prev);

    return (
        <div className="flex flex-col w-full justify-start gap-2 mx-auto p-4 max-w-[1500px]">
            <p>Schedule &gt; 31/05/23 &gt; ABCD12E</p>
            <div className="inline-flex justify-between">
                <h1 className="text-foreground font-bold text-2xl my-auto">Route</h1>
            </div>

            <DataTable columns={columns(refreshData)} data={packages!} />
        </div>
    )
}
