"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
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
import { Loader2 } from "lucide-react"

type StoreFormValues = z.infer<typeof joinStoreSchema>

const joinStoreSchema = z.object({
    passcode: z.string({
        required_error: "Please enter an invite code.",
    })
        .min(12, {
            message: "Invite code must be 12 characters.",
        })
        .max(12, {
            message: "Invite code must be 12 characters.",
        })
        .regex(/^IC[a-zA-Z0-9]{10}$/, {
            message: "Invite code must start with 'IC' followed by 10 alphanumeric characters.",
        }),        
});

// This can come from your database or API.
const defaultValues: Partial<StoreFormValues> = {
    passcode: "",
}

interface StoreFormProps {
    refreshStore: () => void;
    refreshDepot: () => void;
}

export const JoinStoreForm: React.FC<StoreFormProps> = ({ refreshStore, refreshDepot }) => {
    const form = useForm<StoreFormValues>({
        resolver: zodResolver(joinStoreSchema),
        defaultValues,
        mode: "onSubmit",
    })

    const [isSubmitting, setIsSubmitting] = useState(false)

    async function onSubmit(data: StoreFormValues) {
        setIsSubmitting(true);
        const inviteCode = data.passcode;
        console.log("submit clicked")

        try {
            const { data: joinedStore, error } = await db.stores.join(inviteCode);

            if (error) {
                console.log("Error occurred while creating store:", error);
                // Handle the error case here
            } else if (joinedStore && joinedStore.store_id) {
                // Here you have the created store with the UUID
                // Wait 2 sec
                await new Promise(r => setTimeout(r, 2000));

                refreshStore();
                refreshDepot(); // Clear previous states if page not refreshed
            } else {
                // Handle the case where the store was not returned
                console.log("Store was not joined.");
            }
        } catch (error) {
            console.error("An unexpected error occurred:", error);
        }

        setIsSubmitting(false);
    }


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-24">
                    <FormField
                        control={form.control}
                        name="passcode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Invite Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter Code" {...field} />
                                </FormControl>
                                <FormDescription>
                                    This code is available from the owner's store page.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="w-full justify-end flex gap-2">
                    {!isSubmitting &&
                        <Button type="submit">Save Changes</Button>
                    }
                    {isSubmitting &&
                        <Button type="submit" disabled={true} className="flex gap-2">
                            <Loader2 size={16} className="animate-spin" /> Submitting
                        </Button>
                    }
                </div>

            </form>
        </Form >
    )
}