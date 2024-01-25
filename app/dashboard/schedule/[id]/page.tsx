'use client'

import { fetchSchedulesByDate } from "@/utils/db/delivery-schedules";
import { createGraphAndSolutionFromSchedule } from "@/utils/scheduling/schedules-to-graph";
import { DeliverySchedule } from "@/types/delivery-schedule";
import { useState, useEffect } from "react";
import { date } from "zod";
import { DataTable } from "./components/data-table"
import { columns } from "./components/columns"
import { db } from "@/utils/db/db";
import { UUID } from "crypto";
import { Package } from "@/types/package";
import { Graph } from "@/utils/routing/model/graph";
import { VRPSolution } from "@/utils/routing/model/vrp";
import { displayGraph } from "../../../../utils/utils/cytoscape-data";
import { CytoscapeGraph } from "../../../../components/CytoscapeGraph";
import { BreadcrumbLink } from "@/components/ui/breadcrumb-link";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { MdRefresh } from "react-icons/md";
import { Button } from "@/components/ui/button";

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
                buildGraph(schedule);
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

    const formatDateUrl = (date: Date | undefined) => {
        // Format date url as DDMMYYY
        if (!date) {
            return "No date";
        } else {
            return new Date(date).toLocaleDateString().replaceAll("/", "");
        }
    }

    async function buildGraph(schedule: DeliverySchedule | undefined) {

        if (!schedule) {
            return;
        }

        const [graph, solution] = await createGraphAndSolutionFromSchedule(schedule);
        setGraph(graph);
        setSolution(solution);
    }



    return (
        <TooltipProvider delayDuration={100}>
            <div className="flex flex-col w-full justify-start gap-4 mx-auto p-4 max-w-[1600px]">
                <div className="justify-start inline-flex">
                    <BreadcrumbLink text="Schedule" />
                    <BreadcrumbLink href={`/dashboard/schedule?date=${formatDateUrl(deliverySchedule?.delivery_date!)}`} text={formatDate(deliverySchedule?.delivery_date!)} />
                    <BreadcrumbLink href="/dashboard/schedule" text={`Route ${deliverySchedule?.route_number}`} lastItem />
                </div>
                <div className="inline-flex justify-between">
                    <h1 className="text-foreground font-bold text-3xl">Route Details</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="">
                        <DataTable columns={columns(refreshData)} data={packages!} />
                    </div>
                    <div className="">
                        <div className="border-x border-t rounded-t-md inline-flex justify-between w-full items-center p-1 h-12">
                            <p className="text-muted-foreground font-medium text-sm m-2">Delivery Network</p>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={e => buildGraph(deliverySchedule)}>
                                        <MdRefresh className="text-muted-foreground" size={18} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Refresh</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="border rounded-t-none rounded-md border-divider h-[436px]">
                            {graph && solution &&
                                <CytoscapeGraph graph={graph} solution={solution} />
                            }
                        </div>
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
                        <br />
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
        </TooltipProvider>

    )
}
