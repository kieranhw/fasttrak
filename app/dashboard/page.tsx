'use client'

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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IoAnalytics } from "react-icons/io5";
import { BsQuestionCircleFill } from "react-icons/bs";

import {
  Calculator,
  CreditCard,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Image from "next/image";
import { db } from "@/lib/db/db";
import { DashboardInfo } from "@/types/misc";
import { Skeleton } from "@/components/ui/skeleton"
import { set } from "date-fns";
import { FaWarehouse } from "react-icons/fa";
import { IoMdNotifications } from "react-icons/io";
import { Notification } from "@/types/misc";
import { getNotifications } from "@/lib/utils/notification-gen";


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
                  <Tooltip>
                    <TooltipTrigger className="cursor-default flex gap-1 items-center w-full">
                      <p className="text-xs text-muted-foreground">
                        Delivery Efficiency
                      </p>
                      <BsQuestionCircleFill className="text-muted-foreground h-3 my-0 hover:text-primary transition" />
                    </TooltipTrigger>
                    <TooltipContent className="w-3/4">
                      <p>Delivery efficiency is calculated as:</p>
                      <Image priority src="/images/eff-equation.png" width={698} height={160} alt="Image demonstrating the FastTrak dashboard" className="w-full h-full" />
                    </TooltipContent>
                  </Tooltip>
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

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="cursor-default flex gap-1 items-center w-full">
                      <p className="text-xs text-muted-foreground">
                        Delivery Efficiency
                      </p>
                      <BsQuestionCircleFill className="text-muted-foreground h-3 my-0 hover:text-primary transition" />
                    </TooltipTrigger>
                    <TooltipContent className="w-3/4">
                      <p>Delivery efficiency is calculated as:</p>
                      <Image priority src="/images/eff-equation.png" width={698} height={160} alt="Image demonstrating the FastTrak dashboard" className="w-full h-full" />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
              <CommandItem>
                <span>Register a new vehicle</span>
              </CommandItem>
              <CommandItem>
                <span>Add a new package</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Delivery Scheduling" className="mx-4">
              <CommandItem>
                <span>Schedule a delivery for today</span>
              </CommandItem>
              <CommandItem>
                <span>Schedule a delivery for tomorrow</span>
              </CommandItem>
              <CommandItem>
                <span>View delivery analytics</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Data Management" className="mx-4">
              <CommandItem>
                <span>View package inventory</span>
              </CommandItem>
              <CommandItem>
                <span>View package delivery history</span>
              </CommandItem>
              <CommandItem>
                <span>View vehicle fleet</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings" className="mx-4">
              <CommandItem>
                <span>Edit store information</span>
              </CommandItem>
              <CommandItem>
                <span>Edit depot information</span>
              </CommandItem>
              <CommandItem>
                <span>Edit user profile</span>
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
      if (cachedNotifications) {
        setNotifications(JSON.parse(cachedNotifications));
      }

      // Always fetch updates
      try {
        const res = await getNotifications();
        if (!res.error && res.data) {
          setNotifications(res.data);
          localStorage.setItem('notifications', JSON.stringify(res.data));
        } else {
          // Handle the case where fetching fails but cached data is available
          if (!cachedNotifications) {
            setNotifications([]); // No cache and fetch failed, set to empty
          }
        }
      } catch (error) {
        console.error("Fetching notifications failed:", error);
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
                <TableCaption>There are no notifications.</TableCaption>
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

export default function Dashboard() {


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
          {renderShortcutsCard()}
        </div>


        <div className="mt-2">
          <h1 className="text-foreground font-bold text-2xl">Analytics</h1>
          <div className="flex justify-between">
            <p className="text-md text-muted-foreground">
              A short overview of your system's performance.
            </p>
            <div className="flex items-center gap-2 justify-end text-sm text-muted-foreground hover:underline hover:cursor-pointer my-2">
              <IoAnalytics size={16} />View detailed analytics
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
