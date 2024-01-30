'use client'

import React, { useEffect, useRef, useState } from 'react';
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
import { StoreForm } from './components/store-form';
import { DepotForm } from './components/depot-form';
import { db } from '@/lib/db/db';
import { Store } from '@/types/store';
import { CreateStoreForm } from './components/create-store-form';

export default function Depot() {
  const [store, setStore] = useState<Store | null>();
  const [loading, setLoading] = useState(true);

  // Fetch store upon page load, if store set store, else set store as null
  useEffect(() => {
    async function fetchData() {
      const store = await db.stores.fetch.forUser();
      if (store) {
        setStore(store);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleStoreUpdate = (updatedStore: Store) => {
    setStore(updatedStore);
  };




  return (
    <div className="flex flex-col w-full justify-start gap-4 mx-auto p-4 max-w-[1600px]">

      <div className="flex flex-col mb-2">
        <h3 className="text-foreground font-bold text-3xl">Store</h3>
        <p className="text-md text-muted-foreground">
          Manage your store and depot information.
        </p>
      </div>


      {store &&
        <StoreForm store={store} onStoreUpdate={handleStoreUpdate} />
      }

      {!store &&
        <div className="my-2 border p-8 rounded-lg gap-4 flex flex-col bg-background">
          <div>
            <h3 className="text-foreground font-bold text-2xl">Create Store</h3>
            <p className="text-md text-muted-foreground">You currently have no store, create one or join existing to get started.</p>
          </div>
          <Tabs defaultValue="new" className="">
            <TabsList>
              <TabsTrigger value="new">Create New</TabsTrigger>
              <TabsTrigger value="join">Join Existing</TabsTrigger>
            </TabsList>
            <TabsContent value="new">
              <CreateStoreForm />
            </TabsContent>
            <TabsContent value="join"></TabsContent>
          </Tabs>
        </div>
      }

      <div className="my-2 border p-8 rounded-lg gap-4 flex flex-col bg-background">
        <h3 className="text-foreground font-bold text-2xl">Depot</h3>
        <DepotForm />
      </div>


    </div>
  );
}