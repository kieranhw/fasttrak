'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StoreForm } from './components/store-form';
import { db } from '@/lib/db/db';
import { Store } from '@/types/store';
import { CreateStoreForm } from './components/create-store-form';
import { CreateDepotForm } from './components/create-depot-form-single';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';

export default function Depot() {
  const [store, setStore] = useState<Store | null>();
  const [loading, setLoading] = useState(true);

  // Fetch store upon page load, if store set store, else set store as null
  useEffect(() => {
    async function fetchData() {
      const { data: store, error: storeError } = await db.stores.fetch.forUser();
      if (store) {
        setStore(store);
      } else {
        setStore(null);
        console.error("Unable to retrieve user store. " + storeError)
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleStoreUpdate = (updatedStore: Store) => {
    setStore(updatedStore);
  };

  return (
    <div className="flex flex-col w-full justify-start gap-2 mx-auto p-4 max-w-[1400px]">

      <div className="flex flex-col mb-2">
        <h3 className="text-foreground font-bold text-3xl">Store</h3>
        <p className="text-md text-muted-foreground">
          Manage your store and depot information.
        </p>
      </div>


      {store && !loading &&
        <StoreForm store={store} onStoreUpdate={handleStoreUpdate} />
      }
      {loading &&
        <StoreForm store={null} onStoreUpdate={handleStoreUpdate} />
      }

      {!store && !loading &&
        <div className="my-2 border p-8 rounded-lg gap-4 flex flex-col bg-background">
          <div>
            <h2 className="text-foreground font-bold text-2xl">Create Store</h2>
            <p className="text-md text-muted-foreground">You currently have no store, create one or join existing to get started.</p>
          </div>
          <Tabs defaultValue="new">
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

      <div className="my-2 border p-8 rounded-lg gap-4 flex flex-col bg-background min-h-[300px]">
        <div>
          <div className="flex flex-col justify-between gap-4">

            <div className="flex flex-col w-full">
              <h2 className="text-foreground font-bold text-2xl">Depot</h2>
              <p className="text-sm text-muted-foreground">You currently have no depot, create one to get started.</p>
            </div>

            <CreateDepotForm />


            {/* use dialog when implemented multi depots, for now just single form

            <Dialog>
              <DialogTrigger asChild>
                <Button type="submit">Create Depot</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Depot</DialogTitle>
                  <DialogDescription>
                    Add a new depot to your store.
                  </DialogDescription>
                  <CreateDepotForm />
                </DialogHeader>
              </DialogContent>
            </Dialog>
            */}

          </div>
        </div>

      </div>



    </div>
  );
}