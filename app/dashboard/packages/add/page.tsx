'use client'

import * as z from "zod"

import PackageSchema from "./add-package-form/package-schema";
import { PackageForm } from "./add-package-form/package-form";
import { supabase } from "@/pages/api/supabase-client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { generateId } from "@/lib/generate-id";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { generatePackages } from "@/lib/scheduling/generate-packages";


export default function AddPackage() {

  // Add Package Form
  const form = useForm<z.infer<typeof PackageSchema>>({
    resolver: zodResolver(PackageSchema),
    defaultValues: {
      recipient_name: "",
      recipient_address: "",
      recipient_phone: "",
      sender_name: "",
      sender_address: "",
      sender_phone: "",
      weight: "",
      volume: "",
      fragile: undefined,
      priority: "",
      delivery_notes: "",
    },
  })

  const [formKey, setFormKey] = useState<number>(0);

  async function onSubmit(values: z.infer<typeof PackageSchema>) {
    console.log("submitted")
    console.log(values)
    const { error } = await supabase
      .from('packages')
      .insert({
        tracking_id: generateId("FT"),
        recipient_name: values.recipient_name,
        recipient_phone: values.recipient_phone,
        recipient_address: values.recipient_address,
        sender_name: values.sender_name,
        sender_phone: values.sender_phone,
        sender_address: values.sender_address,
        status: "Pending",
        weight: Number(values.weight).toFixed(2),
        volume: Number(values.volume).toFixed(2),
        fragile: values.fragile,
        priority: values.priority,
        // TODO: Add delivery notes
      })
    if (error) {
      alert(error.message)
    } else {
      form.reset();
      // Increment key to re-render component
      setFormKey(prevKey => prevKey + 1);
    }
  }

  // Generate Packages
  const [loadingPackages, setLoadingPackages] = useState<boolean>(false);

  async function handleGeneratePackages() {
    setLoadingPackages(true);
    const packages = generatePackages(1);

    const { error } = await supabase
      .from('packages')
      .insert(packages)
    if (error) {
      alert(error.message)
    }

    // wait 2 seconds
    setTimeout(() => {
      setLoadingPackages(false);
    }, 1000);
  }

  return (
    <div className="flex flex-col w-full justify-start gap-2 mx-auto p-4 max-w-[1500px]">
      <div className="inline-flex justify-between">
        <h1 className="text-foreground font-bold text-3xl my-auto">Add Package</h1>
      </div>

      <div className="inline-flex gap-2 pt-2">

        <div className="h-10 rounded-md bg-secondary items-center w-full justify-between text-black text-md p-2 truncate">
          <b>DEMO: </b>
          Generate 10 packages
        </div>


        {loadingPackages == true &&
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating
          </Button>
        }

        {loadingPackages == false &&
          <Button onClick={e => handleGeneratePackages()}>Generate</Button>
        }

      </div>


      <div className="w-full h-4" />
      {/* TODO: Add success / error messages */}
      <PackageForm key={formKey} onSubmit={onSubmit} form={form} />

    </div>
  )
}
