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
        .min(1, "Recipient name is required")
        .refine(value => nameRegex.test(value), {
            message: "Recipient name must contain only letters and spaces",
        }),
    recipient_address: z.string()
        .min(51, "Recipient address is required")
        .refine(value => addressRegex.test(value), {
            message: "Recipient address contains invalid characters",
        }),
    recipient_phone: z.string()
        .refine(value => phoneRegex.test(value), {
            message: "Recipient phone number must be between 10 and 15 digits",
        }),
    sender_name: z.string()
        .min(1, "Sender name is required")
        .refine(value => nameRegex.test(value), {
            message: "Sender name must contain only letters and spaces",
        }),
    sender_address: z.string()
        .min(5, "Sender address is required")
        .refine(value => addressRegex.test(value), {
            message: "Sender address contains invalid characters",
        }),
    sender_phone: z.string()
        .refine(value => phoneRegex.test(value), {
            message: "Sender phone number must be between 10 and 15 digits",
        }),
    weight: z.string()
        .refine(isValidNumberString, {
            message: "Weight must be a valid number",
        }),
    volume: z.string()
        .refine(isValidNumberString, {
            message: "Volume must be a valid number",
        }),
    fragile: z.boolean(),
    priority: z.string().refine(value => ["Express", "Standard"].includes(value), {
        message: "Priority must be either 'Express' or 'Standard'",
    }),
    delivery_notes: z.string().max(500, "Delivery notes can't exceed 500 characters").optional(),
});

export default PackageSchema;
