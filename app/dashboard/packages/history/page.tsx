'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react';
import { Package } from '@/types/package';
import { supabase } from '@/lib/supabase/client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { db } from '@/db/db';

export default function ManagePackage() {
  const [data, setData] = useState<Package[]>([]);
  const [reload, setReload] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // TODO: Fetch delivered packages only
      const packages = await db.packages.fetch.all();
      if (packages) {
        setData(packages);
        console.log(packages);
      }
    }
    fetchData();
  }, [reload]);

  const refreshData = () => setReload(prev => !prev);

  return (
    <div className="flex flex-col w-full justify-start gap-4 mx-auto p-4 max-w-[1600px]">
      <div className="inline-flex justify-between">
        <h1 className="text-foreground font-bold text-3xl">History</h1>
      </div>
      <DataTable columns={columns(refreshData)} data={data} refreshData={refreshData} />

    </div>
  )
}
