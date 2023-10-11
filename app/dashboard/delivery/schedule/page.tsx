'use client'

import { useEffect, useState } from "react";
import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { Package } from "@/types/package";
import { DeliverySchedule } from "@/types/delivery-schedule";
import { supabase } from "@/pages/api/supabase-client";
import { fetchSchedulesByDate } from "@/lib/db/delivery-schedules";


export default function DeliverySchedule() {
  const [data, setData] = useState<DeliverySchedule[]>([]);
  const [reload, setReload] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // Fetch delivery schedules
      let schedules = await fetchSchedulesByDate();

      if (schedules) {
        setData(schedules as DeliverySchedule[]);
        console.log(schedules);
      } else {
        console.log("no schedules")
      }
    }
    fetchData();
  }, [reload]);

  const refreshData = () => setReload(prev => !prev);
  
  return (
    <div className="flex flex-col w-full justify-start gap-2 mx-auto p-4 max-w-[1500px]">
      <div className="inline-flex justify-between">
        <h1 className="text-foreground font-bold text-3xl my-auto">Schedule</h1>
      </div>

      <DataTable columns={columns(refreshData)} data={data} />


    </div>
  )
}
