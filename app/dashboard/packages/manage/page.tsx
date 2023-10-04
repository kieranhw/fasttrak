'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react';
import { Package } from '@/types/package';
import { supabase } from '@/pages/api/supabase-client';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';

export default function ManagePackage() {
  const [data, setData] = useState<Package[]>([]);
  const [reload, setReload] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: packages } = await supabase.from("packages").select();
      if (packages) {
        setData(packages as Package[]);
        console.log(packages);
      }
    }
    fetchData();
  }, [reload]);

  const refreshData = () => setReload(prev => !prev);


  return (
    <div className="flex flex-col w-full justify-start gap-2 mx-auto p-4 max-w-[1500px]">
      <div className="inline-flex justify-between">
        <h1 className="text-foreground font-bold text-3xl my-auto">Inventory</h1>
      </div>
      <DataTable columns={columns} data={data} refreshData={refreshData} />

    </div>
  )
}
