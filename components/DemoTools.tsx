"use client"

import { Button } from "@/components/ui/button"
import { v4 as uuidv4 } from 'uuid';

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
import { Package } from "@/types/db/Package";
import { db } from "@/lib/db/db";
import { Vehicle } from "@/types/db/Vehicle";
import { UUID } from "crypto";

export default function DemoTools() {
    const supabase = createClient();

    // Generate Packages
    const [loadingPackages, setLoadingPackages] = useState<boolean>(false);

    async function handleGenerateMore(num: number, distribution: string) {
        for (let i = 0; i < num; i++) {
            await handleGeneratePackages(10, distribution);
        }
    }

    async function handleGeneratePackages(numPackages: number, distribution: string) {
        setLoadingPackages(true);
        const packages = await generatePackages(numPackages, distribution);

        const { error } = await supabase
            .from('packages')
            .insert(packages)
        if (error) {
            alert(error.message)
        }
    }

    async function handleCreateVehicles() {
        // Create 40 vehicles
    
        // Start registration from "VE30ABC"
        let registrationNumber = 70;
    
        for (let i = 0; i < 11; i++) {
            const reg = `VE${registrationNumber}ABC`;
            const vehicleData: Vehicle = {
                vehicle_id: (uuidv4()) as UUID,
                registration: reg,
                store_id: (await db.stores.fetch.forUser()).data?.store_id!,
                manufacturer: "Test",
                model: "Vehicle",
                manufacture_year: 2024,
                status: "Available",
                max_load: 1000,
                max_volume: 15
            };
    
            // Insert one vehicle at a time
            await db.vehicles.create(vehicleData);
    
            // Increment registration number
            registrationNumber++;
        }
    }

    // Function to handle package generation and save them
    async function handleSavePackages(num: number) {
        setLoadingPackages(true); // Set loading state to true
        try {
            const packages = await generatePackages(num, "even"); // Generate packages
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
                <DropdownMenuLabel>Create Packages</DropdownMenuLabel>
                <DropdownMenuItem onClick={e => handleGeneratePackages(1, "random")}>Sample Package (Random)</DropdownMenuItem>
                <DropdownMenuItem onClick={e => handleGenerateMore(30, "random")}>300 Sample Packages (Random)</DropdownMenuItem>
                <DropdownMenuItem onClick={e => handleGenerateMore(10, "random")}>100 Sample Packages (Random)</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={e => handleGeneratePackages(1, "even")}>Sample Package (Even)</DropdownMenuItem>
                <DropdownMenuItem onClick={e => handleGeneratePackages(10, "even")}>10 Sample Packages (Even)</DropdownMenuItem>
                <DropdownMenuItem onClick={e => handleGenerateMore(10, "even")}>100 Sample Packages (Even)</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={e => alert("Vehicle generation currently disabled.")}>40 Sample Vehicles</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

    )

}