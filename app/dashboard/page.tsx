'use client'

import { Bar, BarChart, CartesianGrid, Tooltip, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IoAnalytics } from "react-icons/io5";
import { BsQuestionCircleFill } from "react-icons/bs";

import {
  Calculator,
  CreditCard,
  Loader2,
  Settings,
  Smile,
  User,
} from "lucide-react"

import {
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

import { Button } from "@/components/ui/button"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronDownIcon } from "lucide-react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MdError, MdShortcut, MdSwitchAccessShortcut } from "react-icons/md";
import { MouseEvent, useEffect, useState } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import NotificationItem from "@/components/ui/notification-item";
import { Calendar } from "@/components/ui/calendar"
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Image from "next/image";
import { db } from "@/lib/db/db";
import { DashboardInfo } from "@/types/misc";
import { Skeleton } from "@/components/ui/skeleton"
import { format, add, set } from 'date-fns';
import { FaWarehouse } from "react-icons/fa";
import { IoMdNotifications } from "react-icons/io";
import { Notification } from "@/types/misc";
import { getNotifications } from "@/lib/utils/notification-gen";
import { supabase } from "@/lib/supabase/client";
import { Package, PriorityType } from "@/types/package";
import { DeliverySchedule } from "@/types/delivery-schedule";
import { TbPackageExport } from "react-icons/tb";
import { FaTruckFast } from "react-icons/fa6";

// Calculate days based on the selected range
const subtractDaysBy = (selection: Selection) => {
  switch (selection) {
    case Selection.Last7:
      return -7;
    case Selection.Last30:
      return -30;
    case Selection.Last90:
      return -90;
    case Selection.Last180:
      return -180;
    default:
      return -7;
  }
}

function renderInfoCard() {
  const [info, setInfo] = useState<DashboardInfo | undefined | null>(undefined);
  const [noStore, setNoStore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    async function getInfo() {
      const res = await db.misc.fetch.dashboardInfo();
      if (res.error) {
        setInfo(null);
        setNoStore(true);
      } else if (res.data) {
        localStorage.setItem('dashboardInfo', JSON.stringify(res.data));
        setInfo(res.data!);
        setNoStore(false);
      }
    }

    const cachedInfo = localStorage.getItem('dashboardInfo');
    if (cachedInfo) {
      setInfo(JSON.parse(cachedInfo));
    }
    getInfo(); // Update the cache
    setIsLoading(false);
  }, []);

  return (
    <Card className="col-span-2 h-[320px]">
      <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-2">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-lg font-medium">
            Store Overview
          </CardTitle>
          <FaWarehouse size={18} />

        </div>
        {noStore && !isLoading &&
          <CardDescription className="text-red-500">
            You have no store, create or join one first.
          </CardDescription>
        }

        {info && !noStore &&
          <CardDescription>
            Your store's statistics for this month
          </CardDescription>
        }

        {isLoading &&
          <CardDescription>
            Loading...
          </CardDescription>
        }

      </CardHeader>
      {info &&
        <CardContent className="border-t my-2 p-0 h-[230px]">
          <div className="w-full h-[230px] flex flex-col justify-between">
            <div className="flex flex-wrap h-full">
              <div className="items-start w-1/2 justify-center flex flex-col text-start border-r border-b pl-8">
                <div className="text-3xl font-bold">{info?.schedules_created || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Schedules Created
                </p>
              </div>
              <div className="items-start w-1/2 justify-center flex flex-col text-start border-b pl-8">
                <div className="text-3xl font-bold">{info?.packages_scheduled || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Packages Scheduled
                </p>
              </div>
              <div className="items-start w-1/2 justify-center flex flex-col text-start border-r pl-8">
                <div className="text-3xl font-bold">{info?.miles_driven || 0} <span className="text-lg">mi</span></div>
                <p className="text-xs text-muted-foreground">
                  Miles Driven
                </p>
              </div>
              <div className="items-start w-1/2 justify-center flex flex-col text-start pl-8">
                <div className="text-3xl font-bold">{info?.delivery_efficiency || 0}</div>

                <TooltipProvider>
                  <TooltipUI>
                    <TooltipTrigger className="cursor-default flex gap-1 items-center w-full">
                      <p className="text-xs text-muted-foreground">
                        Delivery Efficiency
                      </p>
                      <BsQuestionCircleFill className="text-muted-foreground h-3 my-0 hover:text-primary transition" />
                    </TooltipTrigger>
                    <TooltipContent className="w-1/2">
                      <p>Delivery efficiency is calculated as:</p>
                      <Image priority src="/images/eff-equation.png" width={698} height={160} alt="Image demonstrating the FastTrak dashboard" className="w-full h-full" />
                    </TooltipContent>
                  </TooltipUI>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      }
      {noStore &&
        <CardContent className="border-t my-2 p-0 h-[230px]">
          <div className="w-full h-[230px] flex flex-col justify-between">
            <div className="flex flex-wrap h-full">
              <div className="items-start w-1/2 justify-center flex flex-col text-start border-r border-b pl-8">
                <div className="text-3xl font-bold">{info?.schedules_created || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Schedules Created
                </p>
              </div>
              <div className="items-start w-1/2 justify-center flex flex-col text-start border-b pl-8">
                <div className="text-3xl font-bold">{info?.packages_scheduled || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Packages Scheduled
                </p>
              </div>
              <div className="items-start w-1/2 justify-center flex flex-col text-start border-r pl-8">
                <div className="text-3xl font-bold">{info?.miles_driven || 0} <span className="text-lg">mi</span></div>
                <p className="text-xs text-muted-foreground">
                  Miles Driven
                </p>
              </div>
              <div className="items-start w-1/2 justify-center flex flex-col text-start pl-8">
                <div className="text-3xl font-bold">{info?.delivery_efficiency || 0}</div>
              </div>
            </div>
          </div>
        </CardContent>
      }

      {!info && !noStore &&
        <CardContent className="border-t my-2 p-0 h-[230px]">
          <div className="w-full h-[230px] flex flex-col justify-between">
            <div className="flex flex-wrap h-full">
              <div className="items-start w-1/2 justify-center flex flex-col text-start border-r border-b pl-8">
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
              <div className="items-start w-1/2 justify-center flex flex-col text-start border-b pl-8">
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
              <div className="items-start w-1/2 justify-center flex flex-col text-start border-r pl-8">
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
              <div className="items-start w-1/2 justify-center flex flex-col text-start pl-8">
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
            </div>
          </div>
        </CardContent>}

    </Card>
  )
}

function renderShortcutsCard() {
  return (
    <Card className="col-span-2 h-[320px]">
      <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-2">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-lg font-medium">
            Shortcuts
          </CardTitle>
          <MdSwitchAccessShortcut size={20} />
        </div>
        <CardDescription>
          Choose an action to begin
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Command className="rounded-b-lg rounded-t-none border-t mt-2 h-[230px] w-full">
          <CommandInput placeholder="I want to..." />
          <CommandList className="no-scrollbar">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Create New" className="mx-4">
              <CommandItem className="hover:cursor-pointer">
                <Link href={`/dashboard/vehicles`}>
                  <span>Register a new vehicle</span>
                </Link>
              </CommandItem>
              <CommandItem className="hover:cursor-pointer">
                <Link href={`/dashboard/packages/add`}>
                  <span>Add a new package</span>
                </Link>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Delivery Scheduling" className="mx-4">
              <CommandItem className="hover:cursor-pointer">
                <Link href={`/dashboard/schedule?date=${format(new Date(), 'ddMMyyyy')}`}>
                  <span>Schedule a delivery for today</span>
                </Link>
              </CommandItem>
              <CommandItem className="hover:cursor-pointer">
                <Link href={`/dashboard/schedule?date=${format(add(new Date(), { days: 1 }), 'ddMMyyyy')
                  }`}>
                  <span>Schedule a delivery for tomorrow</span>
                </Link>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Data Management" className="mx-4">
              <CommandItem className="hover:cursor-pointer">
                <Link href={`/dashboard/packages/inventory`}>
                  <span>View package inventory</span>
                </Link>
              </CommandItem>
              <CommandItem className="hover:cursor-pointer">
                <Link href={`/dashboard/packages/history`}>
                  <span>View package delivery history</span>
                </Link>
              </CommandItem>
              <CommandItem className="hover:cursor-pointer">
                <Link href={`/dashboard/vehicles`}>
                  <span>View vehicle fleet</span>
                </Link>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings" className="mx-4">
              <CommandItem className="hover:cursor-pointer">
                <Link href={`/dashboard/store`}>
                  <span>Edit store information</span>
                </Link>
              </CommandItem>
              <CommandItem className="hover:cursor-pointer">
                <Link href={`/dashboard/store`}>
                  <span>Edit depot information</span>
                </Link>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CardContent>
    </Card>
  )
}

function renderNotificationsCard() {
  const [notifications, setNotifications] = useState<Notification[] | undefined>(undefined);

  useEffect(() => {
    async function fetchData() {
      // Initial cache attempt
      const cachedNotifications = localStorage.getItem('notifications');
      //if (cachedNotifications) {
      //setNotifications(JSON.parse(cachedNotifications));
      //}

      // Always fetch updates
      try {
        const res = await getNotifications();
        if (!res.error && res.data) {
          setNotifications(res.data);
          //localStorage.setItem('notifications', JSON.stringify(res.data));
        } else {
          // Handle the case where fetching fails but cached data is available
          if (!cachedNotifications) {
            setNotifications([]); // No cache and fetch express, set to empty
          }
        }
      } catch (error) {
        console.error("Fetching notifications express:", error);
        // Fallback to empty if no cache and fetch fails
        if (!cachedNotifications) setNotifications([]);
      }
    }

    fetchData();
  }, []);

  if (notifications == undefined) {
    return (
      <Card className="col-span-2 h-[320px]">
        <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-2">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-lg font-medium">
              Notifications
            </CardTitle>
            <IoMdNotifications size={20} />

          </div>
          <CardDescription>
            Items requiring your attention
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t mt-2">
          <div className="h-[230px] no-scrollbar overflow-y-auto">
            <Table>
              <TableBody>
                <TableRow className={``}>
                  <TableCell className="font-medium">
                    <div className={`h-3 w-3 rounded-full ml-2`} />
                  </TableCell>
                  <TableCell className="w-full">
                    <div className="h-10 flex flex-col justify-center ">
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow className={``}>
                  <TableCell className="font-medium">
                    <div className={`h-3 w-3 rounded-full ml-2`} />
                  </TableCell>
                  <TableCell className="w-full">
                    <div className="h-10 flex flex-col justify-center ">
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow className={``}>
                  <TableCell className="font-medium">
                    <div className={`h-3 w-3 rounded-full ml-2`} />
                  </TableCell>
                  <TableCell className="w-full">
                    <div className="h-10 flex flex-col justify-center ">
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }
  else {
    return (
      <Card className="col-span-2 h-[320px]">
        <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-2">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-lg font-medium">
              Notifications
            </CardTitle>
            <IoMdNotifications size={20} />

          </div>
          <CardDescription>
            Items requiring your attention
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t mt-2">
          <div className="h-[230px] no-scrollbar overflow-y-auto">
            <Table>
              {notifications && notifications.length === 0 &&
                <TableCaption className="mt-8">You have no notifications.</TableCaption>
              }
              <TableBody>
                {notifications && notifications.map((notification, index) => (
                  <NotificationItem key={index} notification={notification} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }
}

function renderAnalyticsCard2(selection: Selection) {
  type ScheduleStatistics = { milesDriven: number; timeDrivenHours: number; };
  type ScheduleStatsMap = { [date: string]: ScheduleStatistics; };

  const [scheduleStats, setScheduleStats] = useState<ScheduleStatsMap>({});
  const [isLoading, setIsLoading] = useState<Boolean>(true);

  const dataForChart = Object.entries(scheduleStats).map(([date, counts]) => ({
    date: date,
    milesDriven: counts.milesDriven.toFixed(2),
    timeDrivenHours: counts.timeDrivenHours.toFixed(2),
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const fetchSchedules = async (startDate: string, endDate: string): Promise<ScheduleStatsMap> => {
    const { data: schedules, error } = await db.schedules.fetch.byDateRange(startDate, endDate);

    let scheduleStatsMap: ScheduleStatsMap = {};

    if (error) {
      console.error('Error fetching schedules:', error);
      return scheduleStatsMap;
    }

    if (!schedules) {
      return scheduleStatsMap;
    }

    schedules.forEach(schedule => {
      const dateStr = format(new Date(schedule.delivery_date), 'dd/MM/yy');
      scheduleStatsMap[dateStr] = scheduleStatsMap[dateStr] || { milesDriven: 0, timeDrivenHours: 0 };

      // Sample logic for determining if a package is standard or express
      schedule.package_order.forEach(pkg => {
        scheduleStatsMap[dateStr].milesDriven += schedule.actual_distance_miles;
        scheduleStatsMap[dateStr].timeDrivenHours += schedule.actual_duration_mins / 60;
      });
    });

    // Ensure all dates in the range are included, even if no packages are scheduled
    const start = new Date(startDate);
    const end = new Date(endDate);
    let currentDate = start;
    while (currentDate <= end) {
      const formattedDate = format(currentDate, 'dd/MM/yy');
      scheduleStatsMap[formattedDate] = scheduleStatsMap[formattedDate] || { milesDriven: 0, timeDrivenHours: 0 };
      currentDate = add(currentDate, { days: 1 });
    }

    return scheduleStatsMap;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const endDate = new Date();
      const startDate = add(endDate, { days: subtractDaysBy(selection) });

      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      const packageCountMap = await fetchSchedules(formattedStartDate, formattedEndDate);

      if (packageCountMap) {
        // Sort by date
        const sortedPackageCountMap: ScheduleStatsMap = {};
        Object.keys(packageCountMap).sort().forEach(date => {
          sortedPackageCountMap[date] = packageCountMap[date];
        });
        setScheduleStats(sortedPackageCountMap);
      } else {
        console.error('Error fetching package count map');
      }
      setIsLoading(false);
    };

    fetchData();
  }, [selection]);


  return (
    <Card className="">
      <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-2">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-lg font-medium">
            Driving Statistics
          </CardTitle>
          <FaTruckFast size={20} />
        </div>
        <CardDescription>
          Total miles and hours driven across all schedules
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-6 p-0">
        {!isLoading &&
          <ResponsiveContainer width="100%" height={300}>
            <LineChart width={730} height={250} data={dataForChart}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => value.slice(0, 5)} tickMargin={5} />
              <YAxis dataKey="milesDriven" yAxisId="left" />
              <YAxis dataKey="timeDrivenHours" yAxisId="right" orientation="right" />
              <Legend verticalAlign="bottom" />
              <Tooltip wrapperClassName="border-divider rounded-md text-sm shadow-md" />
              <Line yAxisId="left" name="Miles" type="monotone" dataKey="milesDriven" stroke="#8884d8" />
              <Line yAxisId="right" name="Hours" type="monotone" dataKey="timeDrivenHours" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        }
        {isLoading &&
          <div className="h-72 w-full flex items-center justify-center">
            <div className="flex gap-2 items-center justify-center text-sm text-muted-foreground"><Loader2 size={18} className="animate-spin" />Loading...</div>
          </div>
        }
      </CardContent>
    </Card>
  )
}

function renderAnalyticsCard1(selection: Selection) {
  type PackageCounts = { standard: number; express: number; };
  type PackageCountMap = { [date: string]: PackageCounts; };

  const [packageCountMap, setPackageCountMap] = useState<PackageCountMap>({});
  const [isLoading, setIsLoading] = useState<Boolean>(true);

  const dataForChart = Object.entries(packageCountMap).map(([date, counts]) => ({
    date: date,
    standard: counts.standard,
    express: counts.express,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const fetchPackageCountMap = async (startDate: string, endDate: string): Promise<PackageCountMap> => {
    const { data: schedules, error } = await db.schedules.fetch.byDateRange(startDate, endDate);

    let packageCountMap: PackageCountMap = {};

    if (error) {
      console.error('Error fetching schedules:', error);
      return packageCountMap;
    }

    if (!schedules) {
      return packageCountMap;
    }

    schedules.forEach(schedule => {
      const dateStr = format(new Date(schedule.delivery_date), 'dd/MM/yy');
      packageCountMap[dateStr] = packageCountMap[dateStr] || { standard: 0, express: 0 };

      // Sample logic for determining if a package is standard or express
      schedule.package_order.forEach(pkg => {
        if (pkg.priority === PriorityType.Express) {
          packageCountMap[dateStr].express++;
        } else {
          packageCountMap[dateStr].standard++;
        }
      });
    });

    // Ensure all dates in the range are included, even if no packages are scheduled
    const start = new Date(startDate);
    const end = new Date(endDate);
    let currentDate = start;
    while (currentDate <= end) {
      const formattedDate = format(currentDate, 'dd/MM/yy');
      packageCountMap[formattedDate] = packageCountMap[formattedDate] || { standard: 0, express: 0 };
      currentDate = add(currentDate, { days: 1 });
    }

    return packageCountMap;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const endDate = new Date();

      const startDate = add(endDate, { days: subtractDaysBy(selection) });

      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      const packageCountMap = await fetchPackageCountMap(formattedStartDate, formattedEndDate);

      if (packageCountMap) {
        // Sort by date
        const sortedPackageCountMap: PackageCountMap = {};
        Object.keys(packageCountMap).sort().forEach(date => {
          sortedPackageCountMap[date] = packageCountMap[date];
        });
        setPackageCountMap(sortedPackageCountMap);
      } else {
        console.error('Error fetching package count map');
      }
      setIsLoading(false);
    };

    fetchData();
  }, [selection]);


  return (
    <Card className="">
      <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-2">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-lg font-medium">
            Packages Scheduled
          </CardTitle>
          <TbPackageExport size={20} />
        </div>
        <CardDescription>
          Number of packages scheduled for delivery
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-6 pl-0">
        {!isLoading &&
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataForChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => value.slice(0, 5)} tickMargin={5} />
              <YAxis />
              <Legend />
              <Tooltip wrapperClassName="border-divider rounded-md text-sm shadow-md" />
              <Bar name="Standard" dataKey="standard" stackId="a" fill="#8884d8" />
              <Bar name="Express" dataKey="express" stackId="a" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        }
        {isLoading &&
          <div className="h-72 w-full flex items-center justify-center">
            <div className="flex gap-2 items-center justify-center text-sm text-muted-foreground"><Loader2 size={18} className="animate-spin" />Loading...</div>
          </div>
        }
      </CardContent>
    </Card>
  )
}

enum Selection {
  Last7 = 'last-7',
  Last30 = 'last-30',
  Last90 = 'last-90',
  Last180 = 'last-180',
}


export default function Dashboard() {
  const [selection, setSelection] = useState<Selection>(Selection.Last7);

  useEffect(() => {
    console.log('Selection:', selection);
  }, [selection]);

  // Define the event handler for the select component
  const handleSelectChange = (newValue: Selection) => {
    setSelection(newValue);
  };

  return (
    <div className="flex flex-col w-full justify-start gap-2 mx-auto p-4">

      <div className="flex flex-col gap-4">
        <div className="">
          <h1 className="text-foreground font-bold text-3xl">Dashboard</h1>
          <div className="flex justify-between">
            <p className="text-md text-muted-foreground">
              Here's an overview of your delivery system.
            </p>
          </div>
        </div>


        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {renderInfoCard()}
          {renderNotificationsCard()}
          <div className="block md:hidden xl:block col-span-2">
            {renderShortcutsCard()}
          </div>
        </div>


        <div className="mt-4">
          <h1 className="text-foreground font-bold text-2xl">Analytics</h1>
          <div className="flex justify-between">
            <p className="text-md text-muted-foreground">
              An overview of your system's performance this week.
            </p>
            {/**  
            <Select value={selection} onValueChange={(value) => handleSelectChange(value as Selection)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter date" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Date Range</SelectLabel>
                  <SelectItem value={Selection.Last7}>Last 7 days</SelectItem>
                  <SelectItem value={Selection.Last30}>Last 30 days</SelectItem>
                  <SelectItem value={Selection.Last90}>Last 3 months</SelectItem>
                  <SelectItem value={Selection.Last180}>Last 6 Months</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            */}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 mt-4 gap-4">
            {renderAnalyticsCard1(selection)}
            {renderAnalyticsCard2(selection)}

          </div>
        </div>
      </div>
    </div>
  )
}
