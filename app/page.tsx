
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
    <div className="w-full flex flex-col items-center overflow-hidden h-[100vh]">
      <nav className="w-full flex justify-center h-16 border-b border-white/25 absolute top-0 z-50 bg-transparent backdrop-blur-lg">
        <div className="w-full px-8 lg:px-36 flex justify-between items-center p-3 text-sm text-white">
          <Link href="/">
            <p className="text-primary text-xl font-bold">FastTrak</p>
          </Link>
          {user ? (
            <div className="flex gap-2 items-center">
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

      <div className="flex flex-col w-full h-full overflow-y-scroll no-scrollbar"
        style={{
          backgroundImage: `url(${bgFull.src})`,
          width: '100%',
          height: '100%',
          backgroundPosition: 'left bottom',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          position: 'absolute',
          backgroundPositionY: '10%',
        }}>

        <div className="flex-col items-start px-8 lg:px-36">
          <div className="w-full flex flex-col xl:flex-row  ">
            <div className="w-full xl:w-2/5 z-40 pt-32 flex flex-col items-center xl:items-start">
              <h1 className="scroll-m-20 text-6xl font-extrabold tracking-tight lg:text-7xl text-primary drop-shadow-xl">
                FastTrak
              </h1>
              <h1 className="scroll-m-20 text-6xl font-extrabold tracking-tight lg:text-7xl text-gray-100 drop-shadow-xl text-center xl:text-start">
                Vehicle Routing
              </h1>
              <p className="text-white mt-2 text-md tracking-tight lg:text-xl max-w-xl drop-shadow-md text-center xl:text-start" >
                Network optimisation for 'last mile' delivery services.
              </p>
              <div className="flex gap-2 my-4">
                <Link href="/demo">
                  <Button>View Demo</Button>
                </Link>
                {user ? (
                  <div className="flex gap-2 items-center">
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

              <div className="relative xl:absolute xl:bottom-10 inline-flex items-center gap-2 mt-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                <p className="text-gray-300 text-sm">Software project created by
                  <Link href="https://github.com/Kieran260/fasttrak" className="pl-1 text-primary hover:underline" target="_blank" rel="noopener noreferrer">Kieran Hardwick</Link>
                </p>
              </div>
            </div>



            <div className="flex justify-center xl:justify-end w-full pt-40 md:pt-32 xl:pr-36 h-full xl:absolute right-0 overflow-y-scroll no-scrollbar">


              <div className="grid gap-6 grid-cols-2 w-full xl:w-1/2 max-w-[700px] z-40">
                <div className="col-span-2 rounded-lg drop-shadow-lg">
                  <Image priority src="/images/ss1.jpg" width={1920} height={1440} alt="Image demonstrating the FastTrak dashboard" className="w-full h-full rounded-lg" />
                </div>
                <div className="rounded-lg dropshadow-lg bg-gray-100/5 border-gray-100/25 border backdrop-blur-lg col-span-2 md:col-span-1">
                  <div className="flex flex-col items-start justify-start h-full p-4">
                    <div className="w-full flex justify-start items-center gap-4">
                      <div className="flex items-center justify-center rounded-full bg-primary w-12 h-12">
                        <TbRoute size={24} className="text-white" />
                      </div>
                      <h3 className="text-white  text-start text-xl font-bold">Route Optimisation</h3>
                    </div>
                    <p className="text-white mt-4 text-start text-neutral-200">
                      Optimise delivery routes with our advanced algorithms, ensuring cost effective routing networks.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg dropshadow-lg bg-gray-100/5 border-gray-100/25 border backdrop-blur-lg col-span-2 md:col-span-1">
                  <div className="flex flex-col items-start justify-start h-full p-4">
                    <div className="w-full flex justify-start items-center gap-4">
                      <div className="flex items-center justify-center rounded-full bg-primary w-12 h-12">
                        <MdLowPriority size={24} className="text-white" />
                      </div>
                      <h3 className="text-white  text-start text-xl font-bold">Priority Scheduling</h3>
                    </div>
                    <p className="text-white mt-4 text-start text-neutral-200">
                      Packages are scheduled based on their priority, delivering the most important packages first.
                    </p>
                  </div>
                </div>

                <div className="col-span-2 rounded-lg drop-shadow-lg">
                  <Image src="/images/ss2.jpg" width={1920} height={1440} alt="Image demonstrating the FastTrak dashboard" className="w-full h-full rounded-lg" />
                </div>

                <div className="rounded-lg dropshadow-lg bg-gray-100/5 border-gray-100/25 border backdrop-blur-lg col-span-2 md:col-span-1">
                  <div className="flex flex-col items-start justify-start h-full p-4">
                    <div className="w-full flex justify-start items-center gap-4">
                      <div className="flex items-center justify-center rounded-full bg-primary w-12 h-12">
                        <LiaClipboardListSolid size={24} className="text-white" />
                      </div>
                      <h3 className="text-white  text-start text-xl font-bold">Robust Forms</h3>
                    </div>
                    <p className="text-white mt-4 text-start text-neutral-200">
                      Fully validated package creation with detailed criteria. Easily create packages with our intuitive forms.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg dropshadow-lg bg-gray-100/5 border-gray-100/25 border backdrop-blur-lg col-span-2 md:col-span-1">
                  <div className="flex flex-col items-start justify-start h-full p-4">
                    <div className="w-full flex justify-start items-center gap-4">
                      <div className="flex items-center justify-center rounded-full bg-primary w-12 h-12">
                        <FaSearchLocation size={24} className="text-white" />
                      </div>
                      <h3 className="text-white  text-start text-xl font-bold">Address Validation</h3>
                    </div>
                    <p className="text-white mt-4 text-start text-neutral-200">
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
