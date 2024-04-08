"use client"

import { Button } from "@/components/ui/button"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { AiFillTool } from "react-icons/ai"
import { useState } from "react";
import { generatePackages } from "@/lib/data/generatePackages";
import { createClient } from "@/lib/supabase/client";
import evenData from "@/lib/data/experiment-1/even-data.json";
import { Package } from "@/types/db/Package";

export default function DemoTools() {
    const supabase = createClient();

    // Generate Packages
    const [loadingPackages, setLoadingPackages] = useState<boolean>(false);

    async function handleGeneratePackages(numPackages: number) {
        setLoadingPackages(true);
        const packages = await generatePackages(numPackages);

        const { error } = await supabase
            .from('packages')
            .insert(packages)
        if (error) {
            alert(error.message)
        }
    }

    // Function to handle package generation and save them
    async function handleSavePackages(num: number) {
        setLoadingPackages(true); // Set loading state to true
        try {
            const packages = await generatePackages(num); // Generate packages
            const json = JSON.stringify(packages); // Convert to JSON string
            const blob = new Blob([json], { type: "application/json" }); // Create a Blob from the JSON
            const url = URL.createObjectURL(blob); // Create a URL for the Blob
            const a = document.createElement("a"); // Create a temporary anchor element
            a.href = url;
            a.download = "new.json"; // Set the download filename
            document.body.appendChild(a); // Append the anchor to the body
            a.click(); // Programmatically click the anchor to trigger the download
            document.body.removeChild(a); // Clean up by removing the anchor
            URL.revokeObjectURL(url); // Revoke the blob URL
        } catch (error) {
            console.error("Error generating packages", error);
            alert("Failed to generate packages");
        } finally {
            setLoadingPackages(false); // Ensure loading state is reset even if there's an error
        }
    }
    

    async function handleLoadData(dataset: any) {
        // Fetch local file with packages data from local file location @/lib/data/experiment-1/random-data.json

        // Parse JSON data into Package objects
        const packages: Package[] = dataset;

        const { error } = await supabase
            .from('packages')
            .insert(packages)
        if (error) {
            alert(error.message)
        }
    }


    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-foreground gap-2"><AiFillTool /> Demo</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mr-4">
                <DropdownMenuLabel>Demo Tools</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={e => handleGeneratePackages(1)}>Create Sample Package</DropdownMenuItem>
                <DropdownMenuItem onClick={e => handleGeneratePackages(10)}>Create 10 Sample Packages</DropdownMenuItem>
                <DropdownMenuItem onClick={e => handleSavePackages(300)}>Create 300 Sample Packages</DropdownMenuItem>
                <DropdownMenuItem onClick={e => handleLoadData(evenData)}>Experiment 1 Even Data</DropdownMenuItem>
                <DropdownMenuItem onClick={e => handleLoadData(evenData)}>Experiment 1 Random Data</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Experiment 1 Dataset</DropdownMenuItem>
                <DropdownMenuItem>Experiment 2 Dataset</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Clear Packages Data</DropdownMenuItem>
                <DropdownMenuItem>Clear Vehicles Data</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

    )

}