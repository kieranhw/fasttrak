import Link from 'next/link';
import LogoutButton from '../components/LogoutButton';
import { supabase } from '@/pages/api/supabase-server';
import { Button } from '@/components/ui/button';
import { BiPackage } from 'react-icons/bi';
import { TbRoute } from 'react-icons/tb'
import { FaTruck } from 'react-icons/fa';
import './globals.css'

import bg from '@/lib/bgimg.jpg'
import hero from '@/lib/hero.jpg'

export const dynamic = 'force-dynamic';

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
      <div className="w-full flex justify-center h-16 absolute top-0 z-30 bg-black"/>
      <nav className="w-full flex justify-center h-16 border-b border-white/25 absolute top-0 z-50 bg-transparent backdrop-blur-lg">
        <div className="w-full px-8 lg:px-36 flex justify-between items-center p-3 text-sm text-white">
          <Link href="/">
            <p className="text-primary text-xl font-bold">FastTrak</p>
          </Link>
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                Hey, {user.email}! <LogoutButton />
              </div>
            ) : (
              <Link href="/login">
                <Button variant="secondary" className="drop-shadow-md">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="flex flex-col w-full h-full"
        style={{
          backgroundImage: `url(${bg.src})`,
          width: '100%',
          height: '100%',
          backgroundPosition: 'left bottom',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          position: 'absolute',     
          backgroundPositionY: '10%',    
        }}>

        <div className="hidden xl:flex  flex-col items-start px-36 ">
          <div className="w-full flex ">
            <div className="w-2/5 z-50 pt-36">
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
                {user ? (
                  <Link href="/dashboard">
                    <Button>Dashboard</Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button>Get Started</Button>
                  </Link>
                )}

                <Link href="/demo">
                  <Button variant="secondary">View Demo</Button>
                </Link>
              </div>
            </div>



            <div className="flex justify-end w-full pr-36 pt-36 h-full absolute right-0 overflow-y-scroll">

              <div className="grid gap-4 grid-cols-2 w-1/2 max-w-[700px] z-40">
                <div className="col-span-2 rounded-lg drop-shadow-lg">
                  <img src={hero.src} className="w-full h-full rounded-lg" />

                </div>
                <div className="h-[600px]">
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
              {user ? (
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button>Get Started</Button>
                </Link>
              )}

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
