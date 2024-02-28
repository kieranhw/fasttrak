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
import { MdError } from "react-icons/md";
import { MouseEvent, useState } from "react";
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

export type Notification = {
  severity: number;
  title: string;
  description: string;
  onClickLink?: string;
}

const notifications: Notification[] = [
  {
    severity: 3,
    title: "No Store",
    description: "Click here to create or join a store",
    onClickLink: "/dashboard/store",
  },
  {
    severity: 2,
    title: "Warning",
    description: "Vehicle RX21 ABE is unavailable today",
  },
  {
    severity: 1,
    title: "Delivery schedule complete",
    description: "Schedule for 27/02/24 completed",
  },
  {
    severity: 1,
    title: "Delivery schedule complete",
    description: "Schedule for 27/02/24 completed",
  },
]

function renderInfoCard() {

  return (
    <Card className="col-span-2 h-[320px]">
      <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-2">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-lg font-medium">
            Store Name
          </CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <CardDescription>
          Key statistics for this month
        </CardDescription>
      </CardHeader>
      <CardContent className="border-t my-2 p-0 h-[230px]">
        <div className="w-full h-[230px] flex flex-col justify-between">
          <div className="flex flex-wrap h-full">
            <div className="items-start w-1/2 justify-center flex flex-col text-start border-r border-b pl-8">
              <div className="text-3xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Schedules Created
              </p>
            </div>
            <div className="items-start w-1/2 justify-center flex flex-col text-start border-b pl-8">
              <div className="text-3xl font-bold">288</div>
              <p className="text-xs text-muted-foreground">
                Packages Delivered
              </p>
            </div>
            <div className="items-start w-1/2 justify-center flex flex-col text-start border-r pl-8">
              <div className="text-3xl font-bold">1048 mi</div>
              <p className="text-xs text-muted-foreground">
                Miles Driven
              </p>
            </div>
            <div className="items-start w-1/2 justify-center flex flex-col text-start pl-8">
              <div className="text-3xl font-bold">52.5</div>

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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
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
  return (
    <Card className="col-span-2 h-[320px]">
      <CardHeader className="flex flex-col items-start justify-between space-y-0 pb-2">
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-lg font-medium">
            Notifications
          </CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <CardDescription>
          Items requiring your attention
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 border-t mt-2">
        <div className="h-[230px] no-scrollbar overflow-y-auto">
          <Table>
            {notifications.length === 0 &&
              <TableCaption>There are no notifications.</TableCaption>
            }
            <TableBody>
              {notifications.map((notification, index) => (
                <NotificationItem key={index} notification={notification} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const name = "User"

  return (
    <div className="flex flex-col w-full justify-start gap-2 mx-auto p-4">

      <div className="flex flex-col gap-4">
        <div className="">
          <h1 className="text-foreground font-bold text-3xl">Dashboard</h1>
          <div className="flex justify-between">
            <p className="text-md text-muted-foreground">
              Hello {name}, here's an overview of your delivery system.
            </p>
          </div>
        </div>


        <div className="grid grid-cols-4 xl:grid-cols-6 gap-4">
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
