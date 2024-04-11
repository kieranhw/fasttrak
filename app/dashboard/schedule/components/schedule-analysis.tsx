'use client'

import { SetStateAction, useEffect, useState } from "react";
import { columns } from "./data-table/columns";
import { DataTable } from "./data-table/data-table";
import { DeliverySchedule, DeliveryStatus } from "@/types/db/DeliverySchedule";
import { createClient } from "@/lib/supabase/client";

import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader, Loader2, SeparatorHorizontal } from "lucide-react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"


import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"

import { createSchedules } from "@/lib/scheduling/create-schedules";
import { createGraphAndSolutionFromScheduleArray } from "@/lib/utils/schedules-to-graph";

import { db } from "@/lib/db/db";
import { displayGraph } from "@/lib/utils/cytoscape-data";
import { CytoscapeGraph } from "@/components/CytoscapeGraph";
import { MdRefresh } from "react-icons/md"
import { useRouter, useSearchParams } from "next/navigation";
import { ScheduleDialogContent } from "./create-schedule-dialog";
import { ScheduleProfile } from "@/types/db/ScheduleProfile";
import { CurrentState, PackageStatus } from "@/types/db/Package";
import { BreadcrumbLink } from "@/components/ui/breadcrumb-link";
import { ScheduleReport } from "./pdf-generation";
import { GetServerSideProps } from 'next';
import { Store } from "@/types/db/Store";
import { Depot } from "@/types/db/Depot";



interface ScheduleAnalysisProps {
    mode: string
    schedules: DeliverySchedule[]
    setSchedules: (schedules: DeliverySchedule[]) => void
    store: Store | undefined
    depot: Depot | undefined
}


export const ScheduleAnalysis: React.FC<ScheduleAnalysisProps> = (props) => {

    // Date Handling
    const router = useRouter();
    const searchParams = useSearchParams()
    

    useEffect(() => {
        async function fetchData() {
            // Get the date from the URL
            const dateParam = searchParams?.get('date'); // ddMMyyyy
            const date = dateParam ? new Date(`${dateParam.slice(2, 4)}/${dateParam.slice(0, 2)}/${dateParam.slice(4, 8)}`) : undefined;

            // If date is not more than 1 day in the future, or invalid date format
            if (date && date > new Date(Date.now() + 24 * 60 * 60 * 1000)) {
                router.push(`/dashboard/schedule`)
            }
         

            // If valid date fetch schedules
            if (date) {
                let schedules = await db.schedules.fetch.byDate(date);

                if (schedules && schedules.length > 0) {
                    // If schedules exist, set them
                    props.setSchedules(schedules);
                    //console.log(schedules)
                    setIsReportLoading(false);
                } else {
                    // If no schedules exist, redirect to schedule page
                    router.push(`/dashboard/schedule`)
                }
            } else {
                router.push(`/dashboard/schedule`)
            }
        }

        if (!props.schedules || props.schedules.length === 0 || !props.store || !props.depot) {
            fetchData();
        } else {
            setIsReportLoading(false);
        }
    }, [])

    // Data
    const [isReportLoading, setIsReportLoading] = useState(true);



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

    return (
        <>
            <div className="justify-start inline-flex">
                <BreadcrumbLink text="Schedule" />
                <BreadcrumbLink href={isReportLoading ? `` : `/dashboard/schedule?date=${formatDateUrl(props.schedules[0]?.delivery_date)}`} text={isReportLoading ? "Loading..." : formatDate(props.schedules[0]?.delivery_date)} />
                <BreadcrumbLink href="/dashboard/schedule" text={`Analysis`} lastItem />
            </div>
            <div className="flex flex-col">
                <h1 className="text-foreground font-bold text-3xl">Schedule Analysis</h1>
            </div>

            {!isReportLoading &&
                <ScheduleReport schedules={props.schedules} store={props.store} depot={props.depot} />
            }
            {isReportLoading &&
                <div className="flex flex-col items-center justify-center gap-2 h-[400px]">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <p className="text-md text-muted-foreground">Generating report...</p>
                </div>
            }
        </>

    );
};
