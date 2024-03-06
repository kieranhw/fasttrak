'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StoreForm } from './components/store-form';
import { db } from '@/lib/db/db';
import { Store } from '@/types/store';
import { CreateStoreForm } from './components/create-store-form';
import { CreateDepotForm } from './components/depot-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Depot } from '@/types/depot';
import { JoinStoreForm } from './components/join-store-form';

export default function Store() {
  const [store, setStore] = useState<Store | null>();
  const [depot, setDepot] = useState<Depot | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeRefreshKey, setStoreRefreshKey] = useState(0);
  const [depotRefreshKey, setDepotRefreshKey] = useState(0);

  // Update store from DB
  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      const { data: store, error: storeError } = await db.stores.fetch.forUser();
      if (store) {
        setStore(store);
      } else {
        console.error("Unable to retrieve user store.", storeError);
        setStore(null);
      }
      setLoading(false);
    };

    if (storeRefreshKey > 0) fetchStore();
  }, [storeRefreshKey]);

  // Update depot from DB
  useEffect(() => {
    const fetchDepot = async () => {
      if (!store) {
        setDepot(null);
        return;
      }
      setLoading(true);
      const { data: depot, error: depotError } = await db.depots.fetch.forStore(store);
      if (depot) {
        setDepot(depot[0]);
      } else {
        console.error("Unable to retrieve user depot.", depotError);
        setDepot(null);
      }
      setLoading(false);
    };

    if (depotRefreshKey > 0) fetchDepot();
  }, [depotRefreshKey]);

  // Fetch data on load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: store, error: storeError } = await db.stores.fetch.forUser();
      if (store) {
        setStore(store);
        const { data: depot, error: depotError } = await db.depots.fetch.forStore(store);
        if (depot) {
          setDepot(depot[0]);
        } else {
          console.error("Unable to retrieve user depot.", depotError);
          setDepot(null);
        }
      } else {
        console.error("Unable to retrieve user store.", storeError);
        setStore(null);
      }
      setLoading(false)
    }
    fetchData();
  }, []);

  // Update store state via query to DB
  const refreshStore = () => {
    setStoreRefreshKey(oldKey => oldKey + 1);
  }

  // Update depot state via query to DB
  const refreshDepot = () => {
    setDepotRefreshKey(oldKey => oldKey + 1);
  }

  // Update store state locally without querying DB
  const handleStoreUpdate = (updatedStore: Store) => {
    setStore(updatedStore);
  };

  // Update depot state locally without querying DB
  const handleDepotUpdate = (updatedDepot: Depot) => {
    setDepot(updatedDepot);
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
        <StoreForm store={store} onStoreUpdate={handleStoreUpdate} refreshStore={refreshStore} />
      }
      {loading &&
        <StoreForm store={null} onStoreUpdate={handleStoreUpdate} refreshStore={refreshStore} />
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
              <CreateStoreForm refreshStore={refreshStore} refreshDepot={refreshDepot} />
            </TabsContent>
            <TabsContent value="join">
              <JoinStoreForm refreshStore={refreshStore} refreshDepot={refreshDepot} />
            </TabsContent>
          </Tabs>
        </div>
      }

      {store && !loading &&
        <div className="my-2 border p-8 rounded-lg gap-4 flex flex-col bg-background min-h-[300px]">
          <div>
            <div className="flex flex-col justify-between gap-4">
              <div className="flex flex-col w-full">
                {!depot &&
                  <>
                    <h2 className="text-foreground font-bold text-2xl">Create Depot</h2>
                    <p className="text-sm text-muted-foreground">You currently have no depot, create one to get started. </p>
                  </>
                }
                {depot &&
                  <>
                    <h2 className="text-foreground font-bold text-2xl">Depot</h2>
                  </>
                }
              </div>

              {!loading && <CreateDepotForm depot={depot} onDepotUpdate={handleDepotUpdate} refreshData={refreshDepot} />}
              {loading && <CreateDepotForm depot={null} onDepotUpdate={handleDepotUpdate} refreshData={refreshDepot} />}
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
      }

    </div>
  );
}