'use client'

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import './mapbox-overrides.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StoreForm } from './store-form';
import { DepotForm } from './depot-form';

export default function Depot() {

  return (
    <div className="flex flex-col w-full justify-start gap-4 mx-auto p-4 max-w-[1600px]">
      
      <div className="flex flex-col mb-2">
        <h3 className="text-foreground font-bold text-3xl">Store</h3>
        <p className="text-md text-muted-foreground">
          Manage your store and depot information.
        </p>
      </div>


      <div className="my-2 border p-8 rounded-lg gap-4 flex flex-col bg-background">
        <h3 className="text-foreground font-bold text-2xl">Store</h3>
        <StoreForm />
      </div>

      <div className="my-2 border p-8 rounded-lg gap-4 flex flex-col bg-background">
        <h3 className="text-foreground font-bold text-2xl">Depot</h3>
        <DepotForm />
      </div>


    </div>
  );
}