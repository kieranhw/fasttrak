'use client'

import { fetchSchedulesByDate } from "@/lib/db/delivery-schedules";
import { createGraphAndSolutionFromSchedule } from "@/lib/routing/create-schedules";
import { DeliverySchedule } from "@/types/delivery-schedule";
import { useState, useEffect } from "react";
import { date } from "zod";
import { DataTable } from "./components/data-table"
import { columns } from "./components/columns"
import { db } from "@/lib/db/db";
import { UUID } from "crypto";
import { Package } from "@/types/package";
import { Graph } from "@/lib/routing/model/graph";
import { VRPSolution } from "@/lib/routing/model/vrp";
import { displayGraph } from "../../../../lib/cytoscape-data";
import { CytoscapeGraph } from "../../../../components/CytoscapeGraph";
import { BreadcrumbLink } from "@/components/ui/breadcrumb-link";


export default function ScheduleDetails() {

    // Data
    const [deliverySchedule, setDeliverySchedule] = useState<DeliverySchedule>();
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
                setDeliverySchedule(schedule as DeliverySchedule);
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


    // Format date as local date, e.g. DD/MM/YY or MM/DD/YY
    const formatDate = (date: Date | undefined) => {
        if (!date) {
            return "No date";
        } else {
            return new Date(date).toLocaleDateString();
        }
    }



    return (
        <div className="flex flex-col w-full justify-start gap-2 mx-auto p-4 max-w-[1500px]">
            <div>
                <BreadcrumbLink href="/dashboard/schedule" text="Schedule" />
                <BreadcrumbLink text={formatDate(deliverySchedule?.delivery_date!)} />
                <BreadcrumbLink href="/dashboard/schedule" text={`Route ${deliverySchedule?.route_number}`} lastItem />
            </div>
            <div className="inline-flex justify-between">
                <h1 className="text-foreground font-bold text-2xl my-2">Route</h1>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                <div className="flex flex-col border rounded-md border-divider min-h-[200px] p-4">
                    <h1 className="font-bold text-xl">Vehicle</h1>
                    <p>Registration</p>
                    <p className="text-sm text-muted-foreground">Manufacturer Model Year</p>
                    <br />
                    <p className="text-sm">250 / 300 kg utilised</p>
                    <p className="text-sm">12 / 15 m<sup>3</sup> utilised</p>
                </div>
                <div className="flex flex-col border rounded-md border-divider min-h-[200px] p-4">
                    <h1 className="font-bold text-xl">Packages</h1>
                    <p className="text-md">X Packages</p>
                    <br />
                    <p className="text-sm">Average Weight / Package: Xkg</p>
                    <p className="text-sm">Average Volume / Package: Xkg</p>
                </div>
                <div className="flex flex-col border rounded-md border-divider min-h-[200px] p-4">
                    <h1 className="font-bold text-xl">Route</h1>
                    <p className="text-md">X Stops (Distinct Locations)</p>
                    <br/>
                    <p className="text-sm">Driving Time: Xh Xm</p>
                    <p className="text-sm">Driving Distance: X miles</p>
                </div>
                <div className="flex flex-col border rounded-md border-divider min-h-[200px] p-4">
                    <h1 className="font-bold text-xl">Optimisation</h1>
                    <p className="text-md">Lowest Distance</p>
                    <br />
                    <p className="text-sm">This route has been optimised to reduce the amount of
                    total distance travelled.</p>
                </div>




            </div>
        </div >
    )
}
