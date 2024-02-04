"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { FaCopy } from "react-icons/fa"
import { IoMdRefresh } from "react-icons/io";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db } from "@/lib/db/db"
import { Store } from "@/types/store"
import { PostgrestError } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { generateIC } from "@/lib/utils/generate-ids"
import { geocodeAddress as geocoder } from "@/lib/utils/geocoder"
import { sanitizeFloat } from "@/lib/utils/validation"
import { Depot } from "@/types/depot"

export const depotFormSchema = z.object({
    name: z.string({
        required_error: "Please enter a depot name.",
    })
        .min(1, "Depot name cannot be empty.")
        .max(30, {
            message: "Depot name must not be longer than 30 characters.",
        })
        .regex(/^[a-zA-Z0-9 ]*$/, {
            message: "Depot name must contain only alphanumeric characters and spaces.",
        }),
    address_1: z.string().max(160).min(0),
    address_2: z.string().max(160).optional(),
    postcode: z.string().max(160).min(0),
    depot_lat: z.string().max(160).min(0),
    depot_lng: z.string().max(160).min(0),
    days_active: z.string().max(160).min(0),
    dispatch_time: z.string().max(160).min(0),
})

type DepotFormValues = z.infer<typeof depotFormSchema>

export function CreateDepotForm() {
    const form = useForm<DepotFormValues>({
        resolver: zodResolver(depotFormSchema),
        defaultValues: {
            name: "",
            address_1: "",
            address_2: "",
            depot_lat: "",
            depot_lng: "",
            postcode: "",
            days_active: "",
            dispatch_time: "",
        },
        mode: "onSubmit",
    });

    const { setValue, getValues, control, watch } = form;

    async function onSubmit(data: DepotFormValues) {
        const depot: Depot = {
            depot_name: data.name,
            depot_lat: parseFloat(data.depot_lat),
            depot_lng: parseFloat(data.depot_lng),
            days_active: ["M", "T"],
            dispatch_time: "7:00"
        };

        try {
            const { data: createdDepot, error } = await db.depots.create(depot);
            console.log("Created depot: " + createdDepot)

            if (error) {
                alert("Error occurred while creating depot: " + error);
            }
        } catch (error) {
            alert("An unexpected error occurred: " + error);
        }
    }

    // Initialize state to track if address fields have been entered
    const [addressEntered, setAddressEntered] = useState(false);
    const [coordinatesEntered, setCoordinatesEntered] = useState(false);
    const [canGeocode, setCanGeocode] = useState(false);
    const [fieldsComplete, setFieldsComplete] = useState(false);
    const [isGeocodeComplete, setIsGeocodeComplete] = useState(false);

    const watchFields = watch(['address_1', 'address_2', 'postcode', 'depot_lat', 'depot_lng', 'name']);

    useEffect(() => {
        // Logic based on watched fields
        const anyAddressField = watchFields[0] !== "" || watchFields[1] !== "" || watchFields[2] !== "";
        const anyCoordinate = watchFields[3] !== "" || watchFields[4] !== "";
        const mandatoryAddressFields = watchFields[0] !== "" && watchFields[2] !== "";
        const fieldsComplete = watchFields[3] != "" && watchFields[4] != "" && watchFields[5] != "";
        setAddressEntered(anyAddressField);
        setCoordinatesEntered(anyCoordinate);
        setCanGeocode(mandatoryAddressFields)
        setFieldsComplete(fieldsComplete)
    }, [watchFields]);

    async function handleGeocode() {
        const address = `${getValues("address_1")}, ${getValues("address_2")}, ${getValues("postcode")}`;
        try {
            const result = await geocoder(address);

            if (result) {
                setValue("depot_lat", result[0].geometry.location.lat().toString());
                setValue("depot_lng", result[0].geometry.location.lng().toString());
                setIsGeocodeComplete(true); // Disable inputs upon successful geocoding
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            alert("Failed to fetch geocode for the address.");
        }
    }

    async function resetForm() {
        form.reset()
        setIsGeocodeComplete(false)
        setAddressEntered(false)
    }

    const onCoordinateChange = (name: any, e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target

        // Sanitize the input: allow numbers and a single decimal point
        const sanitizedValue = value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');

        // Only update the value if it's not empty and is a valid float number
        if (sanitizedValue === '' || isNaN(parseFloat(sanitizedValue))) {
            setValue(name, ''); // Reset the field if the input is not a valid number
        } else {
            setValue(name, sanitizedValue);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Tabs defaultValue="info">
                    <TabsList className="w-full my-2">
                        <TabsTrigger value="info" className="flex-grow">Information</TabsTrigger>
                        <TabsTrigger value="settings" className="flex-grow">Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="info">
                        <div className="flex flex-col gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Depot Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Depot" autoComplete="disabled" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-4 gap-2">
                                <FormField
                                    control={form.control}
                                    name="address_1"
                                    render={({ field }) => (
                                        <FormItem className="col-span-4">
                                            <FormLabel>Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Address Line 1" disabled={isGeocodeComplete || coordinatesEntered} autoComplete="disabled" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address_2"
                                    render={({ field }) => (
                                        <FormItem className="col-span-4">
                                            <FormControl>
                                                <Input placeholder="Address Line 2 (Optional)" disabled={isGeocodeComplete || coordinatesEntered} autoComplete="disabled" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="postcode"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormControl>
                                                <Input placeholder="Postcode" disabled={isGeocodeComplete || coordinatesEntered} autoComplete="disabled" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button variant="secondary"
                                    type="button"
                                    className="col-span-2"
                                    disabled={isGeocodeComplete || coordinatesEntered || !canGeocode}
                                    onClick={e => handleGeocode()}>
                                    Find Coordinates
                                </Button>
                                {!isGeocodeComplete &&
                                    <p className="text-sm text-muted-foreground col-span-4">Generate coordinates from your address or enter them directly.</p>
                                }
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                <FormLabel className="col-span-4 pb-1">Coordinates</FormLabel>

                                <FormField
                                    control={form.control}
                                    name="depot_lat"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Latitude"
                                                    disabled={addressEntered || isGeocodeComplete}
                                                    onChange={e => onCoordinateChange('depot_lat', e)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="depot_lng"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Longitude"
                                                    disabled={addressEntered || isGeocodeComplete}
                                                    onChange={e => onCoordinateChange('depot_lng', e)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {isGeocodeComplete &&
                                    <p className="text-sm text-muted-foreground col-span-4">Coordinates succesfully found from address.</p>
                                }
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="settings">Settings</TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2">
                    <Button type="reset" variant="secondary" onClick={e => resetForm()}>Reset</Button>
                    <Button type="submit" disabled={!fieldsComplete}>Create Depot</Button>
                </div>

            </form>
        </Form >
    )
}