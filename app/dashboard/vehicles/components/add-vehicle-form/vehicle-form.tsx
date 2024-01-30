import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { VehicleSchema } from "./vehicle-schema";
import { Vehicle } from "@/types/vehicle";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface VehicleFormProps {
    onSubmit: (values: z.infer<typeof VehicleSchema>) => void;
    submitting?: boolean;
    vehicle?: Vehicle;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ onSubmit, vehicle, submitting }) => {
    const form = useForm<z.infer<typeof VehicleSchema>>({
        resolver: zodResolver(VehicleSchema),
        defaultValues: {
            manufacturer: "",
            model: "",
            manufacture_year: undefined,
            registration: "",
            max_load: undefined,
            max_volume: undefined,
        },
    })

    const { setValue } = form;

    // If vehicle, set values to vehicle values and update the form to show in the inputs
    useEffect(() => {
        if (vehicle) {
            setValue("manufacturer", vehicle.manufacturer);
            setValue("model", vehicle.model);
            setValue("manufacture_year", vehicle.manufacture_year);
            setValue("registration", vehicle.registration);
            setValue("max_load", vehicle.max_load);
            setValue("max_volume", vehicle.max_volume);
        }
    }, [vehicle]);


    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setValue(name as keyof z.infer<typeof VehicleSchema>, parseFloat(value));
    };

    const preventNonNumericInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const yearInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        preventNonNumericInput(e);
        // If the input is not empty, prevent more than 4 digits in the input, allow backspace, tab and arrow keys
        if (e.currentTarget.value !== '' && e.currentTarget.value.length >= 4 && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
            e.preventDefault();
        }
    }

    const capitalizeWords = (str: string) => {
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    const onTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const capitalizedValue = capitalizeWords(value);
        setValue(name as keyof z.infer<typeof VehicleSchema>, capitalizedValue);
    };

    const onRegistrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement;

        // Prevent input from having more than 7 chars and prevent spaces
        if (target.value.length > 7 || target.value.includes(' ')) {
            e.preventDefault();
            return;
        }

        const { name, value } = target;
        const upperCaseValue = value.toUpperCase();

        setValue(name as keyof z.infer<typeof VehicleSchema>, upperCaseValue);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-2 gap-x-4 py-2">
                    <FormField
                        control={form.control}
                        name="manufacturer"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Manufacturer</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value || ''}
                                        placeholder="Vehicle Manufacturer"
                                        onChange={onTextChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Model</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value || ''}
                                        placeholder="Vehicle Model"
                                        onChange={onTextChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-x-4 py-2">

                    <FormField
                        control={form.control}
                        name="manufacture_year"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Year of Manufacture</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={Number(field.value) || ''}
                                        placeholder="YYYY"
                                        type="number"
                                        onKeyDown={yearInput}
                                        onChange={onInputChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="registration"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Registration</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value?.toString() || ''}
                                        type="text"
                                        placeholder="AB72CDE"
                                        onChange={onRegistrationChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-x-4 py-2">
                    <FormField
                        control={form.control}
                        name="max_load"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Max Load (kg)</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value?.toString() || ''}
                                        type="number"
                                        placeholder="Weight Limit"
                                        onKeyDown={preventNonNumericInput}
                                        onChange={onInputChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="max_volume"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Max Volume (m<sup>3</sup>)</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value?.toString() || ''}
                                        type="number"
                                        placeholder="Cargo Volume Capacity"

                                        onKeyDown={preventNonNumericInput}
                                        onChange={onInputChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end pt-2">
                    {!submitting &&
                        <Button type="submit" >Submit</Button>
                    }
                    {submitting &&
                        <Button type="submit" disabled={true} className="flex gap-2">
                            <Loader2 size={16} className="animate-spin" /> Submitting
                        </Button>
                    }
                </div>
            </form>
        </Form>
    );
};
