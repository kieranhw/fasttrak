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

import { vehicleSchema } from "./vehicle-schema";

interface VehicleFormProps {
    onSubmit: (values: z.infer<typeof vehicleSchema>) => void;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ onSubmit }) => {
    const form = useForm<z.infer<typeof vehicleSchema>>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            manufacturer: "",
            model: "",
            manufacture_year: undefined,
            max_load: undefined,
            max_volume: undefined,
        },
    })

    const { setValue } = form;

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setValue(name as keyof z.infer<typeof vehicleSchema>, parseFloat(value));
    };

    const preventNonNumericInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const capitalizeWords = (str: string) => {
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    };

    const onTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const capitalizedValue = capitalizeWords(value);
        setValue(name as keyof z.infer<typeof vehicleSchema>, capitalizedValue);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Manufacturer</FormLabel>
                            <FormControl>
                                <Input {...field} value={field.value || ''} onChange={onTextChange} />
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
                                <Input {...field} value={field.value || ''} onChange={onTextChange} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="manufacture_year"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Year of Manufacture</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} value={field.value?.toString() || ''} onKeyDown={preventNonNumericInput} onChange={onInputChange} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-x-4 ">
                    <FormField
                        control={form.control}
                        name="max_load"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Max Load (kg)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} value={field.value?.toString() || ''} onKeyDown={preventNonNumericInput} onChange={onInputChange} />
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
                                <FormLabel>Max Volume (cm<sup>3</sup>)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} value={field.value?.toString() || ''} onKeyDown={preventNonNumericInput} onChange={onInputChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end">
                    <Button type="submit">Submit</Button>
                </div>
            </form>
        </Form>
    );
};
