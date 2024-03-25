'use client'

import { SetStateAction, useEffect, useState } from "react";
import { columns } from "./data-table/columns";
import { DataTable } from "./data-table/data-table";
import { DeliverySchedule, DeliveryStatus } from "@/types/delivery-schedule";
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
import { createGraphAndSolutionFromScheduleArray } from "@/lib/scheduling/schedules-to-graph";

import { db } from "@/lib/db/db";
import { displayGraph } from "@/lib/utils/cytoscape-data";
import { CytoscapeGraph } from "@/components/CytoscapeGraph";
import { MdRefresh } from "react-icons/md"
import { useRouter, useSearchParams } from "next/navigation";
import { ScheduleDialogContent } from "./create-schedule-dialog";
import { ScheduleProfile } from "@/types/schedule-profile";
import { CurrentState, PackageStatus } from "@/types/package";
import { BreadcrumbLink } from "@/components/ui/breadcrumb-link";
import { ScheduleReport } from "./pdf-generation";
import { GetServerSideProps } from 'next';



interface ScheduleAnalysisProps {
    mode: string
    schedules: DeliverySchedule[]
}


export const ScheduleAnalysis: React.FC<ScheduleAnalysisProps> = (props) => {

    // Date Handling
    const router = useRouter();
    const searchParams = useSearchParams()

    // Use Effect which runs on first render
    useEffect(() => {
        if (!props.schedules || props.schedules.length === 0) {

            // Get the date from the URL
            const dateParam = searchParams?.get('date');
            if (dateParam) {
                router.push(`/dashboard/schedule?date=${dateParam}`)
            } else {
                router.push(`/dashboard/schedule`)
            }
        }
    }, [])

    // Data
    const [isReportLoading, setIsScheduleLoading] = useState(false);



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
                <BreadcrumbLink href={`/dashboard/schedule?date=${formatDateUrl(props.schedules[0]?.delivery_date)}`} text={formatDate(props.schedules[0]?.delivery_date)} />
                <BreadcrumbLink href="/dashboard/schedule" text={`Analysis`} lastItem />
            </div>
            <div className="flex flex-col">
                <h1 className="text-foreground font-bold text-3xl">Schedule Analysis</h1>
            </div>

            {!isReportLoading &&
                <ScheduleReport schedules={props.schedules} />
            }




        </>

    );
};
