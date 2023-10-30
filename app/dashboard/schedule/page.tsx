'use client'

import { useEffect, useState } from "react";
import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { Package } from "@/types/package";
import { DeliverySchedule } from "@/types/delivery-schedule";
import { supabase } from "@/pages/api/supabase-client";
import { fetchSchedulesByDate } from "@/lib/db/delivery-schedules";

import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { HiOutlineCog } from "react-icons/hi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

import { createGraphAndSolutionFromSchedule, createSchedules } from "@/lib/routing/create-schedules";
import { db } from "@/lib/db/db";
import { UUID } from "crypto";
import { displayGraph } from "@/lib/routing/model/cytoscape";

export default function ScheduleDeliveries() {

  // Date Picker
  const [date, setDate] = useState<Date>(new Date());

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

  useEffect(() => {
    setDate(new Date())
  }, [])

  // Data
  const [data, setData] = useState<DeliverySchedule[]>([]);
  const [reload, setReload] = useState(false);
  const [isScheduledToday, setIsScheduledToday] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);


  useEffect(() => {
    async function fetchData() {
      setIsLoading(true); // Set loading to true when starting to fetch data

      let schedules = await fetchSchedulesByDate(date);

      if (schedules && schedules.length > 0) {
        setData(schedules as DeliverySchedule[]);
        setIsScheduledToday(true);
      } else {
        setData([]);
        setIsScheduledToday(false);
      }

      const [graph, solution] = await createGraphAndSolutionFromSchedule(schedules as DeliverySchedule[]);
      displayGraph(graph, solution);


      setIsLoading(false); // Set loading to false after fetching data
    }

    fetchData();
  }, [reload, date]);




  const refreshData = () => setReload(prev => !prev);

  // Schedule
  async function handleScheduleDelivery() {
    setIsLoading(true);
    setIsScheduling(true);

    // fetch vehicles
    let vehicles = await db.vehicles.fetch.all();
    console.log(vehicles)

    // fetch packages
    let packages = await db.packages.fetch.pending();
    console.log(packages)

    let deliverySchedule: DeliverySchedule[] = [];
    console.log("Scheduling for date:", date)
    // schedule packages
    if (vehicles && packages) {
      deliverySchedule = await createSchedules(vehicles, packages, date);
      console.log(deliverySchedule)
    }

    if (deliverySchedule && deliverySchedule.length > 0) {
      for (const schedule in deliverySchedule) {
        let packageOrderIds = [];

        for (const pkg in deliverySchedule[schedule].package_order) {
          if (deliverySchedule[schedule].package_order[pkg]) {
            packageOrderIds.push(deliverySchedule[schedule].package_order[pkg].package_id)
          }
        }

        // Try upload schedules to database
        const { error } = await supabase
          .from('delivery_schedules')
          .insert({
            vehicle_id: deliverySchedule[schedule].vehicle_id,
            package_order: packageOrderIds,
            delivery_date: deliverySchedule[schedule].delivery_date,
            start_time: deliverySchedule[schedule].start_time,
            status: deliverySchedule[schedule].status,
            num_packages: deliverySchedule[schedule].num_packages,
            estimated_duration_mins: deliverySchedule[schedule].estimated_duration_mins,
            distance_miles: deliverySchedule[schedule].distance_miles,
            load_weight: deliverySchedule[schedule].load_weight,
            load_volume: deliverySchedule[schedule].load_volume,
          })
        if (error) {
          alert(error.message)
        } else {
          // If successfully scheduled, update scheduledPackageIds status to scheduled
          const { error } = await supabase
            .from('packages')
            .update({ status: 'Scheduled' })
            .in('package_id', packageOrderIds)
          if (error) {
            alert(error.message)
          }
        }
      }
    }
    refreshData();
    setIsLoading(false);
    setIsScheduling(false);
  }

  async function handleDeleteSchedule() {
    if (data && data.length > 0) {
      for (const schedule in data) {
        let packageOrderIds = [];

        for (const pkg in data[schedule].package_order) {
          packageOrderIds.push(data[schedule].package_order[pkg].package_id)
        }

        // update scheduledPackageIds status to scheduled
        const { error } = await supabase
          .from('packages')
          .update({ status: 'Pending' })
          .in('package_id', packageOrderIds)
        if (error) {
          alert(error.message)
        } else {
          // delete schedule from supabase
          const { error } = await supabase
            .from('delivery_schedules')
            .delete()
            .match({ schedule_id: data[schedule].schedule_id })

          if (error) {
            alert(error.message)
          }
        }
      }
    }
    refreshData();
  }


  return (
    <div className="flex flex-col w-full justify-start gap-2 mx-auto p-4 max-w-[1500px]">
      <div className="inline-flex justify-between">
        <h1 className="text-foreground font-bold text-3xl my-auto">Delivery Schedule</h1>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="inline-flex justify-between w-full">
          <div className="inline-flex justify-between gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
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
                  selected={date}
                  onSelect={(selectedDate) => {
                    if (selectedDate instanceof Date) {
                      setDate(selectedDate);
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
                className="w-10 h-10 p-0"
                variant="outline"
                onClick={e => {
                  const newDate = new Date(date || new Date());
                  newDate.setDate(newDate.getDate() - 1);
                  setDate(newDate);
                }}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" onClick={e => setDate(new Date())}>
                Today
              </Button>
              <Button
                className="w-10 h-10 p-0"
                variant="outline"
                disabled={!isNextDateValid()}
                onClick={e => {
                  if (date) {
                    const newDate = new Date(date);
                    newDate.setDate(date.getDate() + 1);
                    if (isDateWithinLimit(newDate)) {
                      setDate(newDate);
                    }
                  }
                }}
              >
                <ChevronRight size={16} />
              </Button>

            </div>
          </div>

          <div className="inline-flex justify-between gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline"
                    disabled={isLoading == true || isScheduledToday == false || date < new Date((new Date()).valueOf() - 1000 * 3600 * 24) || date < new Date("1900-01-01")}
                    onClick={e => handleDeleteSchedule()}
                  >
                    Delete
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete all schedules</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>



            <Button className="" variant="outline">Info</Button>
            <div className="inline-flex">
              <Button className="w-10 p-0 rounded-r-none border-r-0" variant="outline">
                <HiOutlineCog size={16} />
              </Button>

              {isScheduling == true &&
                <Button disabled className="rounded-l-none border-l-none border-y border-r">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling
                </Button>
              }

              {isScheduling == false &&
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button className="rounded-l-none border-l-none border-y border-r"
                        disabled={isLoading == true || date < new Date((new Date()).valueOf() - 1000 * 3600 * 24) || date < new Date("1900-01-01") || isScheduledToday != false}
                        onClick={e => handleScheduleDelivery()}
                      >
                        Schedule
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Schedule deliveries</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              }
            </div>
          </div>
        </div>
      </div>

      <DataTable columns={columns(refreshData)} data={data} />


      <div className="inline-flex justify-between mt-8">
        <h1 className="text-foreground font-bold text-xl my-auto">Analysis</h1>
      </div>
      <div id="cy" className="w-1/2 h-[600px] border-divider border rounded-md my-2"></div>


    </div>
  )
}
