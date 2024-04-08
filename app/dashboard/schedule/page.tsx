'use client'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { ScheduleDetails } from "./components/schedule-details";
import { useEffect, useState } from "react";
import { ScheduleAnalysis } from "./components/schedule-analysis";
import { useSearchParams } from "next/navigation";
import { DeliverySchedule } from "@/types/db/DeliverySchedule";
import { Store } from "@/types/db/Store";
import { db } from "@/lib/db/db";
import { Depot } from "@/types/db/Depot";

export default function ScheduleDeliveries() {
  // TODO: Fetch schedules here instead of in details
  // Refactoring this is necessary for increased performance, however it currently works 

  const searchParams = useSearchParams();
  let mode = searchParams?.get('mode');
  let date = searchParams?.get('date');

  if (!mode) mode = "details";

  const [deliverySchedules, setDeliverySchedules] = useState<DeliverySchedule[]>([]);
  const [store, setStore] = useState<Store>();
  const [depot, setDepot] = useState<Depot>();

  useEffect(() => {
    async function fetchStore() {
      const res = await db.stores.fetch.forUser();

      if (res.data) {
        setStore(res.data);

        const depot = await db.depots.fetch.forStore(res.data);
        if (depot.data) {
          setDepot(depot.data[0]);
        }
      }
    }
    fetchStore();
  }, []);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col w-full justify-start gap-4 mx-auto p-4 max-w-[1400px]">

        {mode === "details" &&
          <ScheduleDetails mode={mode} schedules={deliverySchedules} setSchedules={setDeliverySchedules} />
        }
        {mode === "analysis" &&
          <ScheduleAnalysis mode={mode} schedules={deliverySchedules} setSchedules={setDeliverySchedules} store={store} depot={depot} />
        }
      </div>
    </TooltipProvider >
  )
}

