"use client"
import { useState } from "react"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  VisibilityState,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import * as z from "zod"

import { VehicleForm } from "./add-vehicle-form/vehicle-form";
import { VehicleSchema } from "./add-vehicle-form/vehicle-schema";
import { supabase } from "@/lib/supabase/client";
import { db } from "@/lib/db/db"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  refreshData: () => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  refreshData,
}: DataTableProps<TData, TValue>) {
  // Dialog
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Data Table
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnVisibility,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  })

  async function onSubmit(values: z.infer<typeof VehicleSchema>) {
    setSubmitting(true)
    const { data, error } = await db.vehicles.create({
      registration: values.registration,
      manufacturer: values.manufacturer,
      model: values.model,
      manufacture_year: values.manufacture_year,
      status: "Available",
      max_load: values.max_load,
      max_volume: values.max_volume,
    });

    if (error) {
      alert(error.message);
    } else {
      refreshData();
      setOpen(false);
    }
    setSubmitting(false)
  }



  return (
    <>
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search by Registration..."
          value={(table.getColumn("registration")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("registration")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="ml-2">
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Vehicle</DialogTitle>
              <DialogDescription>
                Add a new vehicle to your fleet.
              </DialogDescription>
              <VehicleForm onSubmit={onSubmit} submitting={submitting} />
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="border-t flex items-center justify-between space-x-2 py-4 px-4">
          <div className="text-muted-foreground text-sm">
            {table.getFilteredRowModel().rows?.length || 0}
            {table.getFilteredRowModel().rows?.length === 1 ? ' Vehicle' : ' Vehicles'}
          </div>

          <div className="inline-flex items-center space-x-2">
            {table.getPageCount() > 0 &&
              <div className="text-muted-foreground text-sm pr-2">Page {table.getState().pagination.pageIndex + 1} of{" "} {table.getPageCount()}</div>
            }
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>

          </div>

        </div>
      </div>
    </>
  )
}

