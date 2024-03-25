'use client'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { ScheduleDetails } from "./components/schedule-details";
import { useState } from "react";
import { ScheduleAnalysis } from "./components/schedule-analysis";
import { useSearchParams } from "next/navigation";
import { DeliverySchedule } from "@/types/delivery-schedule";

export default function ScheduleDeliveries() {
  // TODO: Fetch schedules here instead of in details
  // Refactoring this is necessary for increased performance, however it currently works 

  const searchParams = useSearchParams();
  let mode = searchParams?.get('mode');
  if (!mode) mode = "details";

  const [deliverySchedules, setDeliverySchedules] = useState<DeliverySchedule[]>([]);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col w-full justify-start gap-4 mx-auto p-4 max-w-[1400px]">

        {mode === "details" &&
          <ScheduleDetails mode={mode} schedules={deliverySchedules} setSchedules={setDeliverySchedules} />
        }
        {mode === "analysis" && 
          <ScheduleAnalysis mode={mode} schedules={deliverySchedules} />
        }
      </div>
    </TooltipProvider >
  )
}

