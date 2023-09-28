import * as z from "zod";

export const vehicleSchema = z.object({
    manufacturer: z.string()
        .nonempty({ message: "Manufacturer is required" })
        .max(50, { message: "Manufacturer name should not exceed 50 characters" })
        .regex(/^[a-zA-Z0-9 ]+$/, { message: "Manufacturer can only contain alphanumeric characters and spaces" }),
    model: z.string()
        .nonempty({ message: "Model is required" })
        .max(50, { message: "Model name should not exceed 50 characters" })
        .regex(/^[a-zA-Z0-9 ]+$/, { message: "Model can only contain alphanumeric characters and spaces" }),
    manufacture_year: z.number()
        .int({ message: "Manufacture year must be a valid integer" })
        .min(1886, { message: "Manufacture year must be 1886 or later" })
        .max(new Date().getFullYear(), { message: "Manufacture year cannot be in the future" }),
    max_load: z.number()
        .positive({ message: "Max load must be a positive number" })
        .max(50000, { message: "Max load cannot exceed 50000 kg" }),
    max_volume: z.number()
        .positive({ message: "Max volume must be a positive number" })
        .max(100000, { message: "Max volume cannot exceed 100000 cm³" }),
});
