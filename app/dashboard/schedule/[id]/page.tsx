'use client'

import { fetchSchedulesByDate } from "@/lib/db/delivery-schedules";
import { createGraphAndSolutionFromSchedule } from "@/lib/scheduling/schedules-to-graph";
import { DeliverySchedule } from "@/types/delivery-schedule";
import { useState, useEffect } from "react";
import { date } from "zod";
import { DataTable } from "./components/data-table"
import { columns } from "./components/columns"
import { db } from "@/lib/db/db";
import { UUID } from "crypto";
import { Package } from "@/types/package";
import { Graph } from "@/lib/routing/models/graph";
import { VRPSolution } from "@/lib/routing/models/vrp";
import { displayGraph } from "../../../../lib/utils/cytoscape-data";
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
import { PackageMap } from "./components/map";

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
            <div className="flex flex-col w-full justify-start gap-4 mx-auto p-4 max-w-[1400px]">
                <div className="justify-start inline-flex">
                    <BreadcrumbLink text="Schedule" />
                    <BreadcrumbLink href={`/dashboard/schedule?date=${formatDateUrl(deliverySchedule?.delivery_date!)}`} text={formatDate(deliverySchedule?.delivery_date!)} />
                    <BreadcrumbLink href="/dashboard/schedule" text={`Route ${deliverySchedule?.route_number}`} lastItem />
                </div>
                <div className="inline-flex justify-between">
                    <h1 className="text-foreground font-bold text-3xl">Route Details</h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="w-full lg:w-1/2">
                        <DataTable columns={columns(refreshData)} data={packages!} />
                    </div>
                    <div className="w-full lg:w-1/2">
                        <div className="border-x border-t rounded-t-md inline-flex justify-between w-full items-center p-1 h-12 bg-background">
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
                        <div className="border bg-background rounded-t-none rounded-md border-divider h-[590px]">
                            {graph && solution &&
                                <CytoscapeGraph graph={graph} solution={solution} />
                            }
                        </div>
                    </div>
                </div>
                {deliverySchedule &&

                    <div className="h-[90vh]">
                        <div className="border-x border-t rounded-t-md inline-flex justify-between w-full items-center p-1 h-12 bg-background">
                            <p className="text-muted-foreground font-medium text-sm m-2">Customer Locations Map</p>
                        </div>
                        <div className="border bg-background rounded-t-none rounded-md border-divider h-[80vh]">
                            <PackageMap deliverySchedule={deliverySchedule} />
                        </div>
                    </div>
                }
            </div>
        </TooltipProvider>

    )
}
