
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



const resources = [
  {
    title: 'Package Scheduling',
    subtitle:
      'Easily schedule your packages for efficient and timely delivery. Prioritize packages, and auto-schedule them based on custom criteria.',
    icon: <BiPackage size={32} />,
  },
  {
    title: 'Algorithmic Routing',
    subtitle:
      'Optimize your delivery routes with our advanced algorithms, ensuring quick, cost-effective deliveries while considering real-time conditions and constraints.',
    icon: <TbRoute size={32} />,
  },
  {
    title: 'Vehicle Optimisation',
    subtitle:
      'Monitor and manage your fleet with performance reports and recommendations. Schedule maintenance, track vehicle status, and ensure optimal fleet performance for reliable deliveries.',
    icon: <FaTruck size={32} />,
  },
];

export default async function Index() {
  const {
    data: { user },
  } = await supabase.auth.getUser();


  return (
    <div className="w-full flex flex-col items-center h-screen overflow-hidden">
      <div className="w-full flex justify-center h-16 absolute top-0 z-30 bg-black" />
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

      <div className="flex flex-col w-full h-full bg-black"
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

        <div className="hidden xl:flex  flex-col items-start px-36">
          <div className="w-full flex ">
            <div className="w-2/5 z-50 pt-32">
              <h1 className="scroll-m-20 text-6xl font-extrabold tracking-tight lg:text-7xl text-primary drop-shadow-xl">
                FastTrak
              </h1>
              <h1 className="scroll-m-20 text-6xl font-extrabold tracking-tight lg:text-7xl text-gray-100 drop-shadow-xl">
                Vehicle Routing
              </h1>
              <p className="text-gray-200 mt-2 text-md tracking-tight lg:text-xl max-w-xl drop-shadow-xl" >
                Last mile delivery optimisation
              </p>

              <div className="flex gap-2 mx-auto my-4 justify-start items-center w-full">
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>


                <Link href="/demo">
                  <Button variant="secondary">View Demo</Button>
                </Link>
              </div>
            </div>



            <div className="flex justify-end w-full pr-36 pt-32 h-full absolute right-0 overflow-y-scroll">

              <div className="grid gap-6 grid-cols-2 w-1/2 max-w-[700px] z-40">
                <div className="col-span-2 rounded-lg drop-shadow-lg">
                  <Image priority src="/images/ss1.jpg" width={1920} height={1440} alt="Image demonstrating the FastTrak dashboard" className="w-full h-full rounded-lg" />
                </div>



                <div className="rounded-lg dropshadow-lg bg-gray-100/5 border-gray-100/25 border backdrop-blur-lg">
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

                <div className="rounded-lg dropshadow-lg bg-gray-100/5 border-gray-100/25 border backdrop-blur-lg">
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
                  <Image priority src="/images/ss2.jpg" width={1920} height={1440} alt="Image demonstrating the FastTrak dashboard" className="w-full h-full rounded-lg" />
                </div>

                <div className="rounded-lg dropshadow-lg bg-gray-100/5 border-gray-100/25 border backdrop-blur-lg">
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

                <div className="rounded-lg dropshadow-lg bg-gray-100/5 border-gray-100/25 border backdrop-blur-lg">
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


        {/* Mobile */}
        <div className="flex xl:hidden flex-col items-center px-8">
          <div className="my-32 text-center">
            <h1 className="scroll-m-20 text-6xl font-extrabold tracking-tight lg:text-7xl text-primary">
              FastTrak
            </h1>
            <h1 className="scroll-m-20 text-6xl font-extrabold tracking-tight lg:text-7xl text-gray-100">
              Vehicle Routing
            </h1>
            <p className="text-gray-200 mt-2 text-md tracking-tight lg:text-xl max-w-xl">
              Delivery optimisation made simple.
            </p>

            <div className="flex gap-2 mx-auto my-4 justify-center items-center w-full">
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>

              <Link href="/demo">
                <Button variant="secondary">View Demo</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
