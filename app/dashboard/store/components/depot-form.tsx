"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"

import { cn } from "@/lib/utils/utils"
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
import { geocodeAddress as geocoder } from "@/lib/google-maps/geocoder"
import { sanitizeFloat } from "@/lib/utils/validation"
import { Depot } from "@/types/depot"
import { Loader2 } from "lucide-react"
import { MdEdit } from "react-icons/md"

const DaySelector = ({ control, name }: { control: any, name: any }) => {
    const daysOfWeek = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

    return (
        <Controller
            control={control}
            name={name}
            render={({ field: { value, onChange } }) => (
                <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                        <Button
                            key={day}
                            type="button"
                            variant={value.includes(day) ? "default" : "secondary"}
                            className={`w-10 h-10 rounded-full shadow font-semibold tracking-tight text-sm flex items-center justify-center`}
                            onClick={() => {
                                const newValue = value.includes(day) ? value.filter((d: string) => d !== day) : [...value, day];
                                onChange(newValue);
                            }}
                        >
                            {day}
                        </Button>
                    ))}
                </div>
            )}
        />
    );
};

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
    days_active: z.string().array().min(1, "Please select at least one day.").max(7, "Please select no more than 7 days."),
    dispatch_time: z.string().max(160).min(0),
})

type DepotFormValues = z.infer<typeof depotFormSchema>

interface CreateDepotFormProps {
    depot: Depot | null;
    onDepotUpdate: (depot: Depot) => void;
    refreshData: () => void;
}

export const CreateDepotForm: React.FC<CreateDepotFormProps> = ({ depot, onDepotUpdate, refreshData }) => {
    const form = useForm<DepotFormValues>({
        resolver: zodResolver(depotFormSchema),
        defaultValues: {
            name: "",
            address_1: "",
            address_2: "",
            depot_lat: "",
            depot_lng: "",
            postcode: "",
            days_active: [],
        },
        mode: "onSubmit",
    });

    const { setValue, getValues, control } = form;
    const [isFormChanged, setIsFormChanged] = useState(false);

    useEffect(() => {
        if (depot) {
            setValue("name", depot.depot_name);
            setValue("address_1", depot.address_1 ?? "");
            setValue("address_2", depot.address_2 ?? "");
            setValue("postcode", depot.postcode ?? "");
            setValue("depot_lat", depot.depot_lat.toString());
            setValue("depot_lng", depot.depot_lng.toString());
            setValue("days_active", depot.days_active);
            setValue("dispatch_time", depot.dispatch_time);
        }
    }, [depot]);

    async function onSubmit(data: DepotFormValues) {
        setIsSubmitting(true);
        // TODO: Handle errors and add popups if there is an error

        // Update depot
        const updatedDepot: Depot = {
            depot_name: data.name,
            depot_lat: parseFloat(data.depot_lat),
            depot_lng: parseFloat(data.depot_lng),
            address_1: data.address_1 ?? "",
            address_2: data.address_2 ?? "",
            postcode: data.postcode ?? "",
            days_active: data.days_active,
            dispatch_time: data.dispatch_time,
        };

        try {
            if (depot && depot.depot_id) {
                // Update depot
                const { data: returnedDepot, error } = await db.depots.update.byId(depot.depot_id, updatedDepot);
                if (error) {
                    console.log("Error occurred while updating depot:", error);
                } else if (returnedDepot) {
                    // Update store in state
                    onDepotUpdate(returnedDepot);
                    toast({
                        title: "Success!",
                        description: "Your depot has been updated.",
                    })
                } else {
                    throw new Error("An unexpected error occurred.");
                }
            } else {
                // Create new depot
                const { data: createdDepot, error } = await db.depots.create(updatedDepot);
                if (error) {
                    console.log("Error occurred while creating depot:", error);
                } else if (createdDepot) {
                    // Update store in state
                    onDepotUpdate(createdDepot);
                    toast({
                        title: "Success!",
                        description: "Your depot has been created.",
                    })
                } else {
                    throw new Error("An unexpected error occurred.");
                }
            }
        } catch (error) {
            console.error("An unexpected error occurred:", error);
        }

        setIsSubmitting(false);
        setEditAddressSelected(false);
    }

    // Initialize state to track if address fields have been entered
    const [addressEntered, setAddressEntered] = useState(false);
    const [coordinatesEntered, setCoordinatesEntered] = useState(false);
    const [canGeocode, setCanGeocode] = useState(false);
    const [fieldsComplete, setFieldsComplete] = useState(false);
    const [isGeocodeComplete, setIsGeocodeComplete] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editAddressSelected, setEditAddressSelected] = useState(false);
    const watchedFields = form.watch();

    useEffect(() => {
        // Logic based on watched fields
        const anyAddressField = watchedFields.address_1 !== "" || watchedFields.address_2 !== "" || watchedFields.postcode !== "";
        const anyCoordinate = watchedFields.depot_lat !== "" || watchedFields.depot_lng !== "";
        const mandatoryAddressFields = watchedFields.address_1 !== "" && watchedFields.postcode !== "";
        // Assuming days_active is an array of values. Adjust accordingly if it's not.
        const fieldsComplete = watchedFields.depot_lat !== "" && watchedFields.depot_lng !== "" && watchedFields.name !== "" && watchedFields.days_active.some((field: string) => field !== "") && watchedFields.dispatch_time !== "";

        setAddressEntered(anyAddressField);
        setCoordinatesEntered(anyCoordinate);
        setCanGeocode(mandatoryAddressFields);
        setFieldsComplete(fieldsComplete);
    }, [watchedFields]); // Dependency array now watches the 'watched' object instead of 'watchedFields'


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
        setEditAddressSelected(false);
    }

    async function resetForm() {
        form.reset();
        setIsGeocodeComplete(false);
        setAddressEntered(false);
        setEditAddressSelected(false);
    }


    async function revertForm() {
        // Reverse values back to the original depot that was loaded in
        if (depot) {
            setValue("name", depot.depot_name);
            setValue("depot_lat", depot.depot_lat.toString());
            setValue("depot_lng", depot.depot_lng.toString());
            if (depot.address_1) setValue("address_1", depot.address_1);
            if (depot.address_2) setValue("address_2", depot.address_2);
            if (depot.postcode) setValue("postcode", depot.postcode);
            setValue("days_active", depot.days_active);
            setValue("dispatch_time", depot.dispatch_time);
        }
        setEditAddressSelected(false);
    }

    useEffect(() => {
        if (depot) {
            const formChanged = depot.depot_name !== watchedFields.name ||
                depot.depot_lat !== parseFloat(watchedFields.depot_lat) ||
                depot.depot_lng !== parseFloat(watchedFields.depot_lng) ||
                JSON.stringify(depot.days_active.sort()) !== JSON.stringify(watchedFields.days_active.sort()) ||
                depot.dispatch_time !== watchedFields.dispatch_time ||
                depot.address_1 !== watchedFields.address_1 ||
                depot.address_2 !== watchedFields.address_2 ||
                depot.postcode !== watchedFields.postcode;
            setIsFormChanged(formChanged);

        }
        console.log()
    }, [watchedFields, depot]);


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

    const editAddress = () => {
        setEditAddressSelected(true);
        setIsGeocodeComplete(false);

        // clear coordinates
        setValue("depot_lat", "");
        setValue("depot_lng", "");
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-24">
                    <div className="flex flex-col gap-8">
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
                                            <Input placeholder="Address Line 1"
                                                disabled={isGeocodeComplete || coordinatesEntered}
                                                autoComplete="disabled"
                                                {...field} />
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
                                            <Input placeholder="Address Line 2 (Optional)"
                                                disabled={isGeocodeComplete || coordinatesEntered}
                                                autoComplete="disabled"
                                                {...field} />
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
                                            <Input placeholder="Postcode"
                                                disabled={isGeocodeComplete || coordinatesEntered}
                                                autoComplete="disabled"
                                                {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex col-span-2 gap-2">
                                <Button variant="secondary"
                                    type="button"
                                    className="flex-grow"
                                    disabled={isGeocodeComplete || coordinatesEntered || !canGeocode}
                                    onClick={e => handleGeocode()}>
                                    Find Coordinates
                                </Button>
                                {depot &&
                                    <Button size="icon" type="button" variant="secondary" onClick={e => editAddress()} disabled={editAddressSelected}>
                                        <MdEdit />
                                    </Button>
                                }
                            </div>

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

                    {/* Day Selector Integration */}
                    <div className="flex flex-col gap-8">
                        <FormField
                            control={form.control}
                            name="days_active"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Active Days</FormLabel>
                                    <FormControl>
                                        <DaySelector control={control} name="days_active" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dispatch_time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dispatch Time</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a schedule deadline" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="04:00">04:00</SelectItem>
                                            <SelectItem value="05:00">05:00</SelectItem>
                                            <SelectItem value="06:00">06:00</SelectItem>
                                            <SelectItem value="07:00">07:00</SelectItem>
                                            <SelectItem value="08:00">08:00</SelectItem>
                                            <SelectItem value="09:00">09:00</SelectItem>
                                            <SelectItem value="10:00">10:00</SelectItem>
                                            <SelectItem value="11:00">11:00</SelectItem>
                                            <SelectItem value="12:00">12:00</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        This information is used for reminders, you can still schedule outside of these times.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                    </div>
                </div>


                <div className="flex justify-end gap-2">

                    {!depot &&
                        <>
                            <Button type="reset" variant="secondary" onClick={e => resetForm()}>Reset</Button>
                            {!isSubmitting &&
                                <Button type="submit" disabled={!fieldsComplete}>Create Depot</Button>

                            }
                            {isSubmitting &&
                                <Button type="submit" disabled={true} className="flex gap-2">
                                    <Loader2 size={16} className="animate-spin" /> Submitting...
                                </Button>
                            }
                        </>
                    } {depot &&
                        <>
                            <Button type="reset" disabled={!isFormChanged} variant="secondary" onClick={e => revertForm()}>Reset</Button>
                            {isSubmitting &&
                                <Button type="submit" disabled={true} className="flex gap-2">
                                    <Loader2 size={16} className="animate-spin" /> Saving...
                                </Button>
                            } {!isSubmitting &&
                                <Button type="submit" disabled={!fieldsComplete || !isFormChanged}>Save Changes</Button>
                            }
                        </>
                    }
                </div>

            </form>
        </Form >
    )
}