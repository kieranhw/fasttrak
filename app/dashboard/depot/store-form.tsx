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

const storeFormSchema = z.object({
    name: z
        .string({
            required_error: "Please enter a store name.",
        })
        .min(2, {
            message: "Store name must be at least 2 characters.",
        })
        .max(30, {
            message: "Store name must not be longer than 30 characters.",
        }),
    passcode: z
        .string({
            required_error: "Please enter a store name.",
        })
        .min(2, {
            message: "Store name must be at least 2 characters.",
        })
        .max(30, {
            message: "Store name must not be longer than 30 characters.",
        }),
    email: z
        .string({
            required_error: "Please select an email to display.",
        })
        .email(),
    bio: z.string().max(160).min(4),
    urls: z
        .array(
            z.object({
                value: z.string().url({ message: "Please enter a valid URL." }),
            })
        )
        .optional(),
})

type StoreFormValues = z.infer<typeof storeFormSchema>

// This can come from your database or API.
const defaultValues: Partial<StoreFormValues> = {
    passcode: "IC1AAG3EYYOB",
    bio: "I own a computer.",
    urls: [
        { value: "https://shadcn.com" },
        { value: "http://twitter.com/shadcn" },
    ],
}

export function StoreForm() {
    const form = useForm<StoreFormValues>({
        resolver: zodResolver(storeFormSchema),
        defaultValues,
        mode: "onChange",
    })

    const { fields, append } = useFieldArray({
        name: "urls",
        control: form.control,
    })

    function onSubmit(data: StoreFormValues) {
        toast({
            title: "You submitted the following values:",
            description: (
                <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                    <code className="text-white">{JSON.stringify(data, null, 2)}</code>
                </pre>
            ),
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-24">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Store Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Store" {...field} />
                                </FormControl>
                                <FormDescription>
                                    This is your store name which is used to identify your organisation.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="passcode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Invite Code</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <div className="flex justify-start border items-center p-2 px-3 h-10 text-start text-sm text-muted-foreground rounded-lg flex-grow">{field.value}</div>
                                        <Button type="button" variant="secondary" size="icon"><FaCopy size={16}/></Button>
                                        <Button type="button" variant="secondary" size="icon"><IoMdRefresh size={16}/></Button>
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    This code is required for new users to join your store.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit">Save Changes</Button>

            </form>
        </Form >
    )
}