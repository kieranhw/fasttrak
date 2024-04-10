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
import { createGraphAndSolutionFromScheduleArray } from "@/lib/utils/schedules-tograph";

import { db } from "@/lib/db/db";
import { displayGraph } from "@/lib/utils/cytoscape-data";
import { CytoscapeGraph } from "@/components/CytoscapeGraph";
import { MdRefresh } from "react-icons/md"
import { useRouter, useSearchParams } from "next/navigation";
import { ScheduleDialogContent } from "./create-schedule-dialog";
import { ScheduleProfile } from "@/types/db/ScheduleProfile";
import { CurrentState, PackageStatus } from "@/types/db/Package";
import { ScheduleInitialiser, ScheduleOptimiser, ScheduleReport } from "@/types/db/ScheduleReport";
import { error } from "console";

interface ScheduleDetailsProps {
    mode: string
    schedules: DeliverySchedule[]
    setSchedules: (schedules: DeliverySchedule[]) => void
}

export const ScheduleDetails: React.FC<ScheduleDetailsProps> = (props) => {

    // Dialog
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const supabase = createClient();

    // Date Handling
    const [date, setDate] = useState<Date | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams()

    useEffect(() => {
        const dateString = searchParams?.get('date');
        if (dateString && dateString.length === 8) {
            const day = dateString.slice(0, 2);
            const month = dateString.slice(2, 4);
            const year = dateString.slice(4, 8);
            const newDate = new Date(`${year}-${month}-${day}`);

            if (!isNaN(newDate.valueOf()) && isDateWithinLimit(newDate)) {
                // Only call handleDateChange if the new date is different from the current date
                if (!date || newDate.toDateString() !== date.toDateString()) {
                    handleDateChange(newDate);
                }
            } else {
                handleDateChange(new Date());
            }
        } else {
            handleDateChange(new Date());
        }
    }, [searchParams]);


    const handleDateChange = (selectedDate: number | SetStateAction<Date>) => {
        console.log("date called")
        if (selectedDate instanceof Date) {
            setDate(selectedDate);
            console.log("date set:", selectedDate)

            // Format the date to 'ddMMyyyy'
            const formattedDate = format(selectedDate, 'ddMMyyyy');
            // Update the URL
            router.push(`schedule/?date=${formattedDate}&mode=${props.mode}`);
        } else {
            // Set date to today
            const today = new Date();
            setDate(today);

            // Format date to 'ddMMyyyy'
            const formattedDate = format(today, 'ddMMyyyy');
            // Update the URL
            router.push(`schedule/?date=${formattedDate}&mode=${props.mode}`);
        }
    };

    const isDateWithinLimit = (newDate: Date) => {
        const tomorrow = new Date();
        tomorrow.setDate(new Date().getDate() + 1);
        return newDate <= tomorrow;
    };

    const isNextDateValid = () => {
        if (date) {
            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1);
            return isDateWithinLimit(nextDate);
        }
        return true;
    };

    // Data
    const [reload, setReload] = useState(false);
    const [isScheduledToday, setIsScheduledToday] = useState(false);
    const [isScheduleLoading, setIsScheduleLoading] = useState(true);
    const [isScheduling, setIsScheduling] = useState(false);
    const [graph, setGraph] = useState<any>(null);
    const [solution, setSolution] = useState<any>(null);

    // Schedule progress states
    const [inProgress, setInProgress] = useState(false); // Check if any schedules are in progress to disable delete button
    const [scheduleComplete, setScheduleComplete] = useState(false); // Check if all schedules are completed to enable report button

    useEffect(() => {
        async function fetchData() {
            if (!date) {
                console.log("no date"); // Return early if date is null
                return;
            }

            // Set loading state if no cached data
            setIsScheduleLoading(true);
            setInProgress(false);
            setScheduleComplete(true);

            let schedules = await db.schedules.fetch.byDate(date);

            if (schedules && schedules.length > 0) {
                props.setSchedules(schedules as DeliverySchedule[]);
                // sort data by route number
                schedules.sort((a, b) => a.route_number - b.route_number);
                setIsScheduledToday(true);

                // Check schedule status
                schedules.forEach(schedule => {
                    // Check if any schedule is in progress
                    if (schedule.status !== DeliveryStatus.Scheduled) {
                        setInProgress(true);
                    }

                    // Check all schedules for completion
                    if (schedule.status !== DeliveryStatus.Completed) {
                        setScheduleComplete(false);
                    }
                });

                buildGraph(schedules);

            } else {
                props.setSchedules([]);
                setIsScheduledToday(false);
            }
            setIsScheduleLoading(false); // Set loading to false after fetching data
        }

        fetchData();
    }, [reload, date]);


    // Generate graph once data is loaded
    useEffect(() => {
        if (graph && solution) {
            displayGraph(graph, solution);
        }
    }, [graph, solution])

    const refreshData = () => setReload(prev => !prev);

    const refreshSchedule = async (updatedSchedule: DeliverySchedule) => {
        if (updatedSchedule) {
            const updatedSchedules = props.schedules.map(schedule => {
                if (schedule.schedule_id === updatedSchedule.schedule_id) {
                    return updatedSchedule;
                }
                return schedule;
            });

            setInProgress(true);
            props.setSchedules(updatedSchedules);
            buildGraph(updatedSchedules);
        } else {
            refreshData();
        }

        // If all schedules are completed, set scheduleComplete to true
        if (props.schedules.every(schedule => schedule.status === DeliveryStatus.Completed)) {
            setScheduleComplete(true);
        }
    }

    async function buildGraph(schedules: DeliverySchedule[]) {
        // Create graph and solution
        const [graph, solution] = await createGraphAndSolutionFromScheduleArray(schedules as DeliverySchedule[]);
        setGraph(graph);
        setSolution(solution);
    }

    // Schedule
    async function handleScheduleDelivery(profile: ScheduleProfile) {
        if (!date) return; // Return early if date is null
        setIsScheduleLoading(true);
        setIsScheduling(true);

        // Fetch vehicles and packages
        let vehicles = profile.selected_vehicles;
        let packages = await db.packages.fetch.pending();
        let deliverySchedule: DeliverySchedule[] = [];
        let scheduleReport: ScheduleReport | undefined = undefined;

        // Create schedules if vehicles and packages are available
        if (vehicles && packages) {
            const response = await createSchedules(vehicles, packages, date, profile);

            if (response === null || (!response.schedules || response.schedules.length == 0) || (!response.report)) {
                setIsScheduleLoading(false);
                setIsScheduling(false);
                alert("Unable to create schedules. Please try again later.")
                return;
            } else {
                deliverySchedule = response.schedules as DeliverySchedule[];
                scheduleReport = response.report;
            }
        }

        // TODO: Optimisation required
        if (deliverySchedule && deliverySchedule.length > 0 && scheduleReport) {
            const report = await supabase
                .from('schedule_reports')
                .insert({
                    initialiser: scheduleReport.initialiser,
                    optimiser: scheduleReport.optimiser,
                    iterations: scheduleReport.iterations,
                    distance_multiplier: scheduleReport.distance_multiplier,
                    average_speed: scheduleReport.average_speed,
                    vehicles_available: scheduleReport.vehicles_available.map(vehicle => vehicle.vehicle_id),
                    vehicles_used: scheduleReport.vehicles_used.map(schedule => schedule.vehicle_id),
                    total_packages_count: scheduleReport.total_packages_count,
                    scheduled_packages_count: scheduleReport.scheduled_packages_count,
                    auto_minimise: scheduleReport.auto_minimise,
                    optimisation_profile: scheduleReport.optimisation_profile,
                    time_window_hours: scheduleReport.time_window_hours,
                    est_delivery_time: scheduleReport.est_delivery_time,
                    total_distance_miles: scheduleReport.total_distance_miles,
                    total_duration_hours: scheduleReport.total_duration_hours,
                    other_solutions: scheduleReport.other_solutions,
                    TE: scheduleReport.TE,
                    DE: scheduleReport.DE,
                    WU: scheduleReport.WU,
                    VU: scheduleReport.VU
                })
                .select();
            if (report.error) {
                console.log(report.error)
            } else {
                for (const schedule in deliverySchedule) {
                    let packageOrderIds = [];

                    for (const pkg in deliverySchedule[schedule].package_order) {
                        if (deliverySchedule[schedule].package_order[pkg]) {
                            packageOrderIds.push(deliverySchedule[schedule].package_order[pkg].package_id)
                        }
                    }

                    const { data: store, error: storeError } = await db.stores.fetch.forUser();
                    if (!store || storeError) {
                        console.error("Unable to retrieve user store.");
                        return [] as DeliverySchedule[];
                    }

                    const reportId = report.data[0].report_id

                    // Try upload schedules to database
                    const { error } = await supabase
                        .from('delivery_schedules')
                        .insert({
                            vehicle_id: deliverySchedule[schedule].vehicle_id,
                            depot_lat: deliverySchedule[schedule].depot_lat,
                            depot_lng: deliverySchedule[schedule].depot_lng,
                            store_id: store.store_id,
                            package_order: packageOrderIds,
                            delivery_date: deliverySchedule[schedule].delivery_date,
                            route_number: deliverySchedule[schedule].route_number,
                            start_time: deliverySchedule[schedule].start_time,
                            status: deliverySchedule[schedule].status,
                            num_packages: packageOrderIds.length,
                            estimated_duration_mins: deliverySchedule[schedule].estimated_duration_mins,
                            actual_duration_mins: deliverySchedule[schedule].actual_duration_mins,
                            euclidean_distance_miles: deliverySchedule[schedule].euclidean_distance_miles,
                            actual_distance_miles: deliverySchedule[schedule].actual_distance_miles,
                            load_weight: deliverySchedule[schedule].load_weight,
                            load_volume: deliverySchedule[schedule].load_volume,
                            schedule_report: reportId
                        })
                    if (error) {
                        alert(error.message)
                    } else {
                        // If successfully scheduled, update scheduledPackageIds status to scheduled
                        console.log("Successfully scheduled")
                        const { error } = await supabase
                            .from('packages')
                            .update({ status: PackageStatus.Pending, current_state: CurrentState.InTransit })
                            .in('package_id', packageOrderIds)
                        if (error) {
                            alert(error.message)
                        }
                    }



                }
            }
        }
        refreshData();
        setIsScheduleLoading(false);
        setIsScheduling(false);
    }



    async function handleDeleteSchedule() {
        if (props.schedules && props.schedules.length > 0) {
            for (const schedule in props.schedules) {
                let packageOrderIds = [];

                for (const pkg in props.schedules[schedule].package_order) {
                    packageOrderIds.push(props.schedules[schedule].package_order[pkg].package_id)
                }

                // update scheduledPackageIds status to scheduled
                const { error } = await supabase
                    .from('packages')
                    .update({ status: PackageStatus.Pending, current_state: CurrentState.Pending })
                    .in('package_id', packageOrderIds)
                if (error) {
                    alert(error.message)
                } else {
                    // delete schedule from supabase
                    const { error } = await supabase
                        .from('delivery_schedules')
                        .delete()
                        .match({ schedule_id: props.schedules[schedule].schedule_id })
                    if (error) {
                        alert(error.message)
                    }
                }
            }
        }
        refreshData();
    }

    // Function to push url to analysis mode
    async function handleAnalysis() {
        const formattedDate = date ? format(date, 'ddMMyyyy') : '';
        router.push(`schedule/?date=${formattedDate}&mode=analysis`);
    }

    return (
        <>
            <div className="flex flex-col">
                <h1 className="text-foreground font-bold text-3xl">Delivery Schedule</h1>
                <p className="text-md text-muted-foreground">
                    Create a delivery schedule or manage an existing one.
                </p>
            </div>
            <div className="flex items-center justify-between">
                <div className="inline-flex justify-between w-full">
                    <div className="inline-flex justify-between gap-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    disabled={isScheduling}
                                    variant={"outline"}
                                    className={cn(
                                        "min-w-[210px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date || new Date()}
                                    onSelect={(selectedDate) => {
                                        if (selectedDate instanceof Date) {
                                            //setDate(selectedDate);
                                            handleDateChange(selectedDate);

                                        }
                                    }}
                                    disabled={(date) =>
                                        // Disable dates in the past and more than 1 day in the future
                                        date > new Date((new Date()).valueOf() + 1000 * 3600 * 24) || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <div className="inline-flex justify-between gap-1">
                            <Button
                                disabled={isScheduling}
                                className="w-10 h-10 p-0"
                                variant="outline"
                                onClick={e => {
                                    const newDate = new Date(date || new Date());
                                    newDate.setDate(newDate.getDate() - 1);
                                    handleDateChange(newDate);
                                }}
                            >
                                <ChevronLeft size={16} />
                            </Button>
                            <Button disabled={isScheduling} variant="outline" onClick={e => handleDateChange(new Date())}>
                                Today
                            </Button>
                            <Button
                                className="w-10 h-10 p-0"
                                variant="outline"
                                disabled={!isNextDateValid() || isScheduling}
                                onClick={e => {
                                    if (date) {
                                        const newDate = new Date(date);
                                        newDate.setDate(date.getDate() + 1);
                                        if (isDateWithinLimit(newDate)) {
                                            handleDateChange(newDate);
                                        }
                                    }
                                }}>
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>

                    <div className="inline-flex justify-between gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button variant="outline"
                                        disabled={!(isScheduledToday == true) || isScheduleLoading == true || isScheduling}
                                        onClick={handleAnalysis}
                                    >
                                        Report
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {isScheduledToday == true &&
                                    <p>View schedule report</p>
                                }
                                {isScheduledToday == false &&
                                    <p>No schedule to report</p>
                                }
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button variant="outline"
                                        disabled={isScheduleLoading == true || isScheduledToday == false || date! < new Date((new Date()).valueOf() - 1000 * 3600 * 24) || date! < new Date("1900-01-01") || inProgress === true || isScheduling}
                                        onClick={e => handleDeleteSchedule()}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {inProgress == true &&
                                    <p>Unable to delete schedule <br className="lg:hidden" />with routes in progress</p>
                                }
                                {inProgress == false && isScheduledToday == false &&
                                    <p>No schedule to delete</p>
                                }
                                {inProgress == false && isScheduledToday == true &&
                                    <p>Delete schedule</p>
                                }
                            </TooltipContent>
                        </Tooltip>

                        <div className="inline-flex">
                            <div>
                                <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                                    <DialogTrigger asChild>
                                        <>
                                            {isScheduling == false &&
                                                <Button className="border hover:cursor-pointer"
                                                    onClick={e => setScheduleDialogOpen(true)}
                                                    disabled={date! < new Date((new Date()).valueOf() - 1000 * 3600 * 24) || date! < new Date("1900-01-01") || isScheduledToday != false || isScheduleLoading == true}
                                                //disabled={false} // Used for testing only
                                                >
                                                    Schedule
                                                </Button>
                                            }
                                            {isScheduling == true &&
                                                <Button disabled className="border">
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Scheduling
                                                </Button>
                                            }
                                        </>
                                    </DialogTrigger>
                                    <ScheduleDialogContent
                                        open={scheduleDialogOpen}
                                        onOpenChange={setScheduleDialogOpen}
                                        date={date}
                                        handleScheduleDelivery={handleScheduleDelivery}
                                    />
                                </Dialog>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DataTable columns={columns(refreshSchedule)} data={props.schedules} isLoading={isScheduleLoading} />

            {
                !isScheduleLoading && props.schedules.length > 0 &&
                <div className="flex flex-col justify-between">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div>
                            <div className="border-x border-t rounded-t-md inline-flex justify-between w-full items-center p-1 h-12 bg-card">
                                <p className="text-muted-foreground font-medium text-sm m-2">Delivery Network</p>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button disabled={isScheduling} variant="ghost" size="icon" onClick={e => buildGraph(props.schedules)}>
                                            <MdRefresh className="text-muted-foreground" size={18} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Refresh</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="border rounded-t-none rounded-md border-divider h-[450px]">
                                {graph && solution &&
                                    <CytoscapeGraph graph={graph} solution={solution} />
                                }
                            </div>
                        </div>

                        <div>
                            <div className="border-x border-t rounded-t-md inline-flex justify-between w-full items-center p-1 h-12 bg-card">
                                <p className="text-muted-foreground text-sm font-medium m-2">Schedule Statistics</p>
                            </div>
                            <div className="border rounded-t-none rounded-md border-divider h-[450px] bg-card">
                                <div className="grid grid-cols-2 p-8 gap-8 h-[450px]">
                                    <div>
                                        <p className="text-muted-foreground text-sm mx-2">Total Packages</p>
                                        <div className="flex items-end gap-1 mx-2 my-1">
                                            <p className="text-3xl font-semibold">
                                                {
                                                    props.schedules.reduce((acc, schedule) => {
                                                        return acc + schedule.num_packages
                                                    }, 0)
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground text-sm mx-2">Total Distance</p>
                                        <div className="flex items-end gap-1 mx-2 my-1">
                                            <p className="text-3xl font-semibold">
                                                {
                                                    Math.round(props.schedules.reduce((acc, schedule) => {
                                                        return acc + schedule.actual_distance_miles
                                                    }, 0) * 100) / 100
                                                }
                                            </p>
                                            <p className="text-lg font-semibold">miles</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground text-sm mx-2">Packages / Vehicle</p>
                                        <div className="flex items-end gap-1 mx-2 my-1">
                                            <p className="text-3xl font-semibold">
                                                {
                                                    Math.round(props.schedules.reduce((acc, schedule) => {
                                                        return acc + schedule.num_packages
                                                    }, 0) / props.schedules.length * 100) / 100
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground text-sm mx-2 whitespace-nowrap">Packages / Hour</p>
                                        <div className="flex items-end gap-1 mx-2 my-1">
                                            <p className="text-3xl font-semibold">
                                                {
                                                    Math.round(props.schedules.reduce((acc, schedule) => {
                                                        return acc + schedule.num_packages
                                                    }, 0) / props.schedules.reduce((acc, schedule) => {
                                                        return acc + schedule.actual_duration_mins
                                                    }, 0) * 60 * 100) / 100
                                                }
                                            </p>
                                            <p className="text-lg font-semibold whitespace-nowrap">per hour</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground text-sm mx-2 whitespace-nowrap">Driving Time / Vehicle</p>
                                        <div className="flex items-end gap-1 mx-2 my-1">
                                            <p className="text-3xl font-semibold">
                                                {
                                                    Math.floor(props.schedules.reduce((acc, schedule) => {
                                                        return acc + schedule.actual_duration_mins
                                                    }, 0) / props.schedules.length / 60)
                                                }h {
                                                    Math.round(props.schedules.reduce((acc, schedule) => {
                                                        return acc + schedule.actual_duration_mins
                                                    }, 0) / props.schedules.length % 60)
                                                }m
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground text-sm mx-2 whitespace-nowrap">Driving Time / Package</p>
                                        <div className="flex items-end gap-2 mx-2 my-1">
                                            <p className="text-3xl font-semibold">
                                                {
                                                    Math.floor(props.schedules.reduce((acc, schedule) => {
                                                        return acc + schedule.actual_duration_mins
                                                    }, 0) / props.schedules.reduce((acc, schedule) => {
                                                        return acc + schedule.num_packages
                                                    }, 0) / 60)
                                                }h {
                                                    Math.round(props.schedules.reduce((acc, schedule) => {
                                                        return acc + schedule.actual_duration_mins
                                                    }, 0) / props.schedules.reduce((acc, schedule) => {
                                                        return acc + schedule.num_packages
                                                    }, 0) % 60)
                                                }m
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground text-sm mx-2 whitespace-nowrap">Distance / Vehicle</p>
                                        <div className="flex items-end gap-1 mx-2 my-1">
                                            <p className="text-3xl font-semibold">
                                                {
                                                    Math.round(props.schedules.reduce((acc, schedule) => {
                                                        return acc + schedule.actual_distance_miles
                                                    }, 0) / props.schedules.length * 100) / 100
                                                }
                                            </p>
                                            <p className="text-lg font-semibold">miles</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground text-sm mx-2 whitespace-nowrap">Distance / Package</p>
                                        <div className="flex items-end gap-1 mx-2 my-1">
                                            <p className="text-3xl font-semibold">
                                                {
                                                    Math.round(props.schedules.reduce((acc, schedule) => {
                                                        return acc + schedule.actual_distance_miles
                                                    }, 0) / props.schedules.reduce((acc, schedule) => {
                                                        return acc + schedule.num_packages
                                                    }, 0) * 100) / 100
                                                }
                                            </p>
                                            <p className="text-lg font-semibold">miles</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </>




    );

};
