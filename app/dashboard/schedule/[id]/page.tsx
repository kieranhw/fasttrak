'use client'

import { fetchSchedulesByDate } from "@/lib/db/delivery-schedules";
import { createGraphAndSolutionFromSchedule } from "@/lib/routing/create-schedules";
import { DeliverySchedule } from "@/types/delivery-schedule";
import { useState, useEffect } from "react";
import { date } from "zod";
import { DataTable } from "../components/data-table"
import { columns } from "./components/columns"
import { db } from "@/lib/db/db";
import { UUID } from "crypto";
import { Package } from "@/types/package";
import { Graph } from "@/lib/routing/model/graph";
import { VRPSolution } from "@/lib/routing/model/vrp";
import { displayGraph } from "../../../../lib/cytoscape-data";
import { CytoscapeGraph } from "../../../../components/CytoscapeGraph";

export default function ScheduleDetails() {

    // Data
    const [data, setData] = useState<DeliverySchedule>();
    const [packages, setPackages] = useState<Package[]>([]);
    const [reload, setReload] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [graph, setGraph] = useState<Graph>();
    const [solution, setSolution] = useState<VRPSolution>();

    useEffect(() => {
        async function fetchDataAndCreateGraph() {
            setIsLoading(true);
            const id = window.location.pathname.split("/")[3];
            let schedule = await db.schedules.fetch.byId(id as UUID);
            if (schedule) {
                setData(schedule as DeliverySchedule);
                let packages = schedule.package_order;
                if (packages) {
                    setPackages(packages);
                }
                const [graph, solution] = await createGraphAndSolutionFromSchedule(schedule);
                setGraph(graph);
                setSolution(solution);
            }
            setIsLoading(false);
        }
        fetchDataAndCreateGraph();
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
                <h1 className="text-foreground font-bold text-2xl my-4">Route</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <DataTable columns={columns(refreshData)} data={packages!} />
                </div>
                <div className="border rounded-md border-divider min-h-[500px]">
                    {graph && solution &&
                        <CytoscapeGraph graph={graph} solution={solution} />

                    }
                </div>
            </div>
        </div>
    )
}
