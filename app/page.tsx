
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/pages/api/supabase-server';

import { Button } from '@/components/ui/button';
import { BiPackage } from 'react-icons/bi';
import { TbRoute } from 'react-icons/tb'
import { FaSearchLocation, FaTruck } from 'react-icons/fa';
import './globals.css'

import bgFull from '@/public/images/bgFull.jpg'
import { useEffect, useState } from 'react';
import { UserProfile } from '@/types/user-profile';
import { MdLowPriority } from 'react-icons/md';
import { LiaClipboardListSolid } from "react-icons/lia";

export default async function Index() {
  const {
    data: { user },
  } = await supabase.auth.getUser();


  return (
    <div className="fixed w-full h-full overflow-hidden flex flex-col items-center">

      <nav className="fixed top-0 z-50 w-full h-16 flex justify-center items-center border-b border-white/25 bg-transparent backdrop-blur-lg">
        <div className="flex justify-between items-center w-full px-8 lg:px-36 text-sm text-white">
          <Link href="/">
            <p className="font-bold text-xl text-primary">FastTrak</p>
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="secondary" className="drop-shadow-md">Dashboard</Button>
              </Link>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="secondary" className="drop-shadow-md">Login</Button>
            </Link>
          )}
        </div>
      </nav>

      <div className="flex flex-col w-full h-full fixed no-scrollbar overscroll-none" style={{ backgroundImage: `url(${bgFull.src})`, backgroundPosition: 'left bottom', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}>
        <div className="flex flex-col items-start px-8 lg:px-36 overflow-y-scroll xl:overflow-y-hidden no-scrollbar">
          <div className="flex flex-col xl:flex-row w-full">
            <div className="flex flex-col items-center xl:items-start w-full xl:w-2/5 pt-32 z-40">
              <h1 className="font-extrabold tracking-tight text-6xl lg:text-7xl text-primary drop-shadow-xl scroll-m-20">
                FastTrak
              </h1>
              <h1 className="font-extrabold tracking-tight text-6xl lg:text-7xl text-gray-100 drop-shadow-xl text-center xl:text-start scroll-m-20">
                Vehicle Routing
              </h1>
              <p className="mt-2 text-md lg:text-xl text-white text-center xl:text-start drop-shadow-md max-w-xl">
                Network optimisation for 'last mile' delivery services.
              </p>
              <div className="my-4 flex gap-2">
                <Link href="/demo">
                  <Button>View Demo</Button>
                </Link>
                {user ? (
                  <div className="flex items-center gap-2">
                    <Link href="/dashboard">
                      <Button variant="secondary" className="drop-shadow-lg">Dashboard</Button>
                    </Link>
                  </div>
                ) : (
                  <Link href="/login">
                    <Button variant="secondary" className="drop-shadow-lg">Get Started</Button>
                  </Link>
                )}
              </div>
              <div className="mt-1 inline-flex items-center gap-2 relative xl:absolute xl:bottom-10">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                <p className="text-sm text-gray-300">
                  Software project created by
                  <Link href="https://github.com/Kieran260/fasttrak" className="pl-1 text-primary hover:underline" target="_blank" rel="noopener noreferrer">Kieran Hardwick</Link>
                </p>
              </div>
            </div>
            <div className="flex justify-center w-full pt-40 md:pt-32 xl:pr-36 xl:justify-end h-full xl:absolute right-0 overflow-y-hidden xl:overflow-y-scroll no-scrollbar">
              <div className="grid w-full xl:w-1/2 max-w-[700px] gap-6 grid-cols-2 z-40">
                <div className="col-span-2 rounded-lg drop-shadow-lg">
                  <Image priority src="/images/ss1.jpg" width={1920} height={1440} alt="Image demonstrating the FastTrak dashboard" className="w-full h-full rounded-lg" />
                </div>
                <div className="col-span-2 md:col-span-1 rounded-lg dropshadow-lg bg-gray-100/5 border border-gray-100/25 backdrop-blur-lg">
                  <div className="flex flex-col items-start justify-start h-full p-4">
                    <div className="flex justify-start items-center w-full gap-4">
                      <div className="flex items-center justify-center rounded-full bg-primary w-12 h-12">
                        <TbRoute size={24} className="text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white text-start">Route Optimisation</h3>
                    </div>
                    <p className="mt-4 text-start text-neutral-200 text-white">
                      Optimise delivery routes with our advanced algorithms, ensuring cost effective routing networks.
                    </p>
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1 rounded-lg dropshadow-lg bg-gray-100/5 border border-gray-100/25 backdrop-blur-lg">
                  <div className="flex flex-col items-start justify-start h-full p-4">
                    <div className="flex justify-start items-center w-full gap-4">
                      <div className="flex items-center justify-center rounded-full bg-primary w-12 h-12">
                        <MdLowPriority size={24} className="text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white text-start">Priority Scheduling</h3>
                    </div>
                    <p className="mt-4 text-start text-neutral-200 text-white">
                      Packages are scheduled based on their priority, delivering the most important packages first.
                    </p>
                  </div>
                </div>
                <div className="col-span-2 rounded-lg drop-shadow-lg">
                  <Image src="/images/ss2.jpg" width={1920} height={1440} alt="Image demonstrating the FastTrak dashboard" className="w-full h-full rounded-lg" />
                </div>
                <div className="col-span-2 md:col-span-1 rounded-lg dropshadow-lg bg-gray-100/5 border border-gray-100/25 backdrop-blur-lg">
                  <div className="flex flex-col items-start justify-start h-full p-4">
                    <div className="flex justify-start items-center w-full gap-4">
                      <div className="flex items-center justify-center rounded-full bg-primary w-12 h-12">
                        <LiaClipboardListSolid size={24} className="text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white text-start">Robust Forms</h3>
                    </div>
                    <p className="mt-4 text-start text-neutral-200 text-white">
                      Fully validated package creation with detailed criteria. Easily create packages with our intuitive forms.
                    </p>
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1 rounded-lg dropshadow-lg bg-gray-100/5 border border-gray-100/25 backdrop-blur-lg">
                  <div className="flex flex-col items-start justify-start h-full p-4">
                    <div className="flex justify-start items-center w-full gap-4">
                      <div className="flex items-center justify-center rounded-full bg-primary w-12 h-12">
                        <FaSearchLocation size={24} className="text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white text-start">Address Validation</h3>
                    </div>
                    <p className="mt-4 text-start text-neutral-200 text-white">
                      Reduce delivery address errors before they enter the system. All addresses are automatically geocoded and validated.
                    </p>
                  </div>
                </div>
                <div className="h-[600px]">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
