'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react';
import { Package } from '@/types/package';
import { supabase } from '@/lib/supabase/client';
import { PackagesTable } from '../(components)/packages-table';
import { columns } from './components/columns';
import { db } from '@/lib/db/db';

export default function ManagePackage() {
  const [data, setData] = useState<Package[]>([]);
  const [reload, setReload] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // TODO: Fetch delivered packages only
      const packages = await db.packages.fetch.history();
      if (packages) {
        setData(packages);
        console.log(packages);
      }
    }
    fetchData();
  }, [reload]);

  const refreshData = () => setReload(prev => !prev);

  return (
    <div className="flex flex-col w-full justify-start gap-4 mx-auto p-4 max-w-[1400px]">
      <div className="inline-flex justify-between">
        <h1 className="text-foreground font-bold text-3xl">History</h1>
      </div>
      <PackagesTable columns={columns(refreshData)} data={data} refreshData={refreshData} />
    </div>
  )
}
