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
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-foreground gap-2"><AiFillTool /> Demo</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mr-4">
                <DropdownMenuLabel>Demo Tools</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={e => handleGeneratePackages(1)}>Create Sample Package</DropdownMenuItem>
                <DropdownMenuItem onClick={e => handleGeneratePackages(5)}>Create 5 Sample Packages</DropdownMenuItem>
                <DropdownMenuItem>Create Sample Vehicle</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Insert Test Data Set 1</DropdownMenuItem>
                <DropdownMenuItem>Insert Test Data Set 2</DropdownMenuItem>
                <DropdownMenuItem>Insert Test Data Set 3</DropdownMenuItem>
                <DropdownMenuItem>Clear All Data</DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>

    )

}