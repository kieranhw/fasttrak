import * as z from "zod";

const isValidNumberString = (str: string) => {
    const trimmedStr = str.trim();
    const num = parseFloat(trimmedStr);
    return !isNaN(num) && trimmedStr === num.toString();
};

const nameRegex = /^[a-zA-Z\s]+$/;
const addressRegex = /^[a-zA-Z0-9\s,'-]*$/;
const phoneRegex = /^[0-9]{10,15}$/;

const PackageSchema = z.object({
    recipient_name: z.string()
        .min(1, "Required")
        .refine(value => nameRegex.test(value), {
            message: "Recipient name must contain only letters and spaces",
        }),
    recipient_address_1: z.string()
        .min(1, "Required")
        .refine(value => addressRegex.test(value), {
            message: "Address contains invalid characters",
        }),
    recipient_address_2: z.string()
        .refine(value => addressRegex.test(value), {
            message: "Address contains invalid characters",
        }).optional(),
    recipient_postcode: z.string()
        .min(5, "Postcode requires minimum 5 characters")
        .max(8, "Postcode requires maximum 8 characters")
        .refine(value => addressRegex.test(value), {
            message: "Postcode contains invalid characters",
        }),
    recipient_phone: z.string()
        .min(1, "Required")
        .refine(value => phoneRegex.test(value), {
            message: "Number must be between 10 and 15 digits",
        }),
    sender_name: z.string()
        .min(1, "Required")
        .refine(value => nameRegex.test(value), {
            message: "Name must contain only letters and spaces",
        }),
    sender_address_1: z.string()
        .min(1, "Required")
        .refine(value => addressRegex.test(value), {
            message: "Address contains invalid characters",
        }),
    sender_address_2: z.string()
        .refine(value => addressRegex.test(value), {
            message: "Address contains invalid characters",
        }).optional(),
    sender_postcode: z.string()
        .min(5, "Postcode requires minimum 5 characters")
        .max(8, "Postcode requires maximum 8 characters")
        .refine(value => addressRegex.test(value), {
            message: "Postcode contains invalid characters",
        }),
    sender_phone: z.string()
        .min(1, "Required")

        .refine(value => phoneRegex.test(value), {
            message: "Number must be between 10 and 15 digits",
        }),
    weight: z.string()
        .min(1, "Required")
        .refine(isValidNumberString, {
            message: "Weight must be a valid number",
        }),
    volume: z.string()
        .min(1, "Required")
        .refine(isValidNumberString, {
            message: "Volume must be a valid number",
        }),
    fragile: z.boolean(),
    priority: z.string().refine(value => ["Express", "Standard"].includes(value), {
        message: "Priority must be either 'Express' or 'Standard'",
    }),
    delivery_notes: z.string().max(100, "Delivery notes can't exceed 100 characters").optional(),
});

export default PackageSchema;
