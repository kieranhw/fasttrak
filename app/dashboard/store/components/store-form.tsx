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
import { Store } from "@/types/store"
import { SetStateAction, useEffect, useState } from "react"
import { db } from "@/lib/db/db"
import { generateIC } from "@/lib/utils/generate-ids"
import { Loader2 } from "lucide-react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { GrLogout } from "react-icons/gr";

export const storeFormSchema = z.object({
    name: z.string({
        required_error: "Please enter a store name.",
    })
        .min(2, {
            message: "Store name must be at least 2 characters.",
        })
        .max(30, {
            message: "Store name must not be longer than 30 characters.",
        })
        .regex(/^[a-zA-Z0-9 ]*$/, {
            message: "Store name must contain only alphanumeric characters and spaces.",
        }),
    passcode: z.string({
        required_error: "Please generate an invite code.",
    })
        .min(2, {
            message: "Invite code must be at least 12 characters.",
        })
        .max(30, {
            message: "Invite code must not be longer than 12 characters.",
        }),
});

type StoreFormValues = z.infer<typeof storeFormSchema>

interface StoreFormProps {
    store: Store | null;
    onStoreUpdate: (store: Store) => void;
    refreshStore: () => void;
}

// This can come from your database or API.
const defaultValues: Partial<StoreFormValues> = {
    name: "",
    passcode: "",
}

export const StoreForm: React.FC<StoreFormProps> = ({ store, onStoreUpdate, refreshStore }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<StoreFormValues>({
        resolver: zodResolver(storeFormSchema),
        defaultValues,
        mode: "onChange",
    });

    // Subscribe to form value changes
    const watchedFields = form.watch();
    const [isFormChanged, setIsFormChanged] = useState(false);

    useEffect(() => {
        if (store) {
            setIsFormChanged(
                store.store_name !== watchedFields.name ||
                store.invite_code !== watchedFields.passcode
            );
        }
    }, [watchedFields, store]);


    // Set form fields
    useEffect(() => {
        async function setFields() {
            if (store?.store_id) {
                form.setValue("name", store.store_name);
                form.setValue("passcode", store.invite_code);
            }
        }
        setFields();
    }, [store])

    async function onSubmit(data: StoreFormValues) {
        setIsSubmitting(true);

        // Update store
        const updatedStore: Store = {
            store_name: data.name,
            invite_code: data.passcode,
        };

        try {
            if (store && store.store_id) {
                const { data: returnedStore, error } = await db.stores.update.byId(store.store_id, updatedStore);
                if (error) {
                    console.log("Error occurred while updating store:", error);
                } else if (returnedStore) {
                    // Update store in state
                    onStoreUpdate(returnedStore);
                } else {
                    throw new Error("An unexpected error occurred.");
                }
            }
        } catch (error) {
            console.error("An unexpected error occurred:", error);
        }

        // Show toast notification depending on what was updated
        if (store && store.store_name !== data.name && store.invite_code !== data.passcode) {
            toast({
                title: "Success!",
                description: "Your store name and invite code have been updated.",
            })
        } else if (store && store.store_name !== data.name) {
            toast({
                title: "Success!",
                description: "Your store name has been updated.",
            })
        } else if (store && store.invite_code !== data.passcode) {
            toast({
                title: "Success!",
                description: "Your invite code has been updated.",
            })
        }

        setIsSubmitting(false);
    }

    async function leaveStore() {
        const storeName = store?.store_name;
        const res = await db.profiles.leaveStore();

        if (res.error) {
            console.log("Error occurred while leaving store:", res.error);
        } else {
            refreshStore();
            toast({
                title: "Success",
                description: storeName ? `You have successfully left the store: ${storeName}.` : "You have successfully left the store.",
            });
        }
    }


    return (
        <div className="my-2 border p-8 rounded-lg gap-4 flex flex-col bg-background">
            <h3 className="text-foreground font-bold text-2xl">Store</h3>
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
                                        <>
                                            {store === null &&
                                                <div className="flex justify-start border items-center p-2 px-3 h-10 shadow-sm text-start text-sm text-muted-foreground rounded-md flex-grow gap-2">
                                                    <Loader2 size={16} className="animate-spin" /> Loading...
                                                </div>
                                            }
                                            {store != null &&
                                                <Input placeholder="Store" {...field} />
                                            }
                                        </>
                                    </FormControl>
                                    <FormDescription>
                                        This is the name of your organisation.
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
                                            {store === null &&
                                                <div className="flex justify-start border items-center p-2 px-3 h-10 shadow-sm text-start text-sm text-muted-foreground rounded-md flex-grow gap-2">
                                                    <Loader2 size={16} className="animate-spin" /> Loading...
                                                </div>
                                            }
                                            {store != null &&
                                                <div className="flex justify-start border items-center p-2 px-3 h-10 shadow-sm text-start text-sm text-muted-foreground rounded-md flex-grow">{field.value}</div>
                                            }
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                onClick={e => (
                                                    navigator.clipboard.writeText(field.value),
                                                    toast({
                                                        title: "Copied!",
                                                        description: "Your invite code has been copied to your clipboard.",
                                                    })
                                                )}>
                                                <FaCopy size={16} />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                onClick={e => form.setValue("passcode", generateIC())}>
                                                <IoMdRefresh size={16} />
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        This code is required for new users to join your store. Click the refresh button to generate a new code.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>


                    <div className="flex justify-between">
                        <div className="w-full justify-start flex">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    {store && store.store_id &&
                                        <Button type="button" variant="link" className="p-0 text-sm font-normal text-muted-foreground hover:text-destructive transition-none gap-2">Leave Store <GrLogout /></Button>
                                    }
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will remove you from the store and revoke access to any store information. You may <b>not</b> be able to re-join using the same invite code.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={e => leaveStore()}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        <div className="w-full justify-end flex gap-2">

                            <Button type="reset" variant="secondary" disabled={!isFormChanged || isSubmitting}
                                onClick={e => {
                                    if (store && store.store_id) {
                                        form.setValue("name", store.store_name);
                                        form.setValue("passcode", store.invite_code);
                                    }
                                    form.clearErrors();
                                }}>
                                Reset
                            </Button>
                            {!isSubmitting &&
                                <Button type="submit" disabled={!isFormChanged}>Save Changes</Button>
                            }
                            {isSubmitting &&
                                <Button type="submit" disabled={true} className="flex gap-2">
                                    <Loader2 size={16} className="animate-spin" /> Submitting
                                </Button>
                            }
                        </div>
                    </div>




                </form>
            </Form >
        </div>
    )
}