'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AddPackage() {

  return (
    <div className="flex flex-col w-full justify-start gap-2 mx-auto p-4 max-w-[1500px]">
        <div className="inline-flex justify-between">
            <h1 className="text-foreground font-bold text-3xl my-auto">Add Package</h1>
        </div>
    </div>
)
}
