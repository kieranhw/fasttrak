'use client'

import { useEffect, useState } from 'react';
import { Package } from '@/types/package';
import { PackagesTable } from '../(components)/packages-table';
import { columns } from './components/columns';
import { db } from '@/lib/db/db';

export default function ManagePackage() {
  const [data, setData] = useState<Package[]>([]);
  const [reload, setReload] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const packages = await db.packages.fetch.history();
      if (packages) {
        // Sort packages by delivery date in descending order
        packages.sort((a, b) => {
          if (a.date_delivered && b.date_delivered) {
            return new Date(b.date_delivered).getTime() - new Date(a.date_delivered).getTime();
          }
          return 0;
        });
        
        setData(packages);
        console.log(packages);
      }
    }
    fetchData();
  }, [reload]);

  const refreshData = () => setReload(prev => !prev);

  return (
    <div className="flex flex-col w-full justify-start gap-4 mx-auto p-4 max-w-[1400px]">
      <div className="flex flex-col justify-between">
        <h1 className="text-foreground font-bold text-3xl">History</h1>
        <p className="text-md text-muted-foreground">
          Manage all of the packages which have been delivered.
        </p>
      </div>
      <PackagesTable columns={columns(refreshData)} data={data} refreshData={refreshData} />
    </div>
  )
}
