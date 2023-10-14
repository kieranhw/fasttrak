'use client'

import { useEffect, useState } from "react";
import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { Package } from "@/types/package";
import { DeliverySchedule } from "@/types/delivery-schedule";
import { supabase } from "@/pages/api/supabase-client";
import { fetchSchedulesByDate } from "@/lib/db/delivery-schedules";

import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
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

export default function DeliverySchedule() {

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

  useEffect(() => {
    async function fetchData() {
      // Fetch delivery schedules
      // TODO: Testing for different setups of schedules
      // TODO: Loading screens when fetching data

      let schedules = await fetchSchedulesByDate(date!);

      if (schedules) {
        setData(schedules as DeliverySchedule[]);
        console.log("schedules" + schedules);
      } else {
        console.log("no schedules")
      }
    }
    fetchData();
  }, [reload, date]);

  const refreshData = () => setReload(prev => !prev);


  return (
    <div className="flex flex-col w-full justify-start gap-2 mx-auto p-4 max-w-[1500px]">
      <div className="inline-flex justify-between">
        <h1 className="text-foreground font-bold text-3xl my-auto">Schedule</h1>
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

          <div>Log</div>
          <div>Export</div>
          <div>Info</div>
          <div className="inline-flex">
            <Button className="w-10 p-0 rounded-r-none border-r-none" variant="outline">
              <HiOutlineCog size={16} />
            </Button>
            <Button className="rounded-l-none border-l-none">
              Schedule
            </Button>
          </div>
        </div>
      </div>

      <DataTable columns={columns(refreshData)} data={data} />


    </div>
  )
}
