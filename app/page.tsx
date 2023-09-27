import Link from 'next/link';
import LogoutButton from '../components/LogoutButton';
import { supabase } from '@/pages/api/supabase-server';
import { Button } from '@/components/ui/button';
import { BiPackage } from 'react-icons/bi';
import { TbRoute } from 'react-icons/tb'
import { FaTruck } from 'react-icons/fa';

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
    title: 'Vehicle Management',
    subtitle:
      'Monitor and manage your fleet in real-time. Schedule maintenance, track vehicle status, and ensure optimal fleet performance for reliable deliveries.',
    icon: <FaTruck size={32} />,
  },
];

export default async function Index() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="w-full flex flex-col items-center px-2">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-7xl flex justify-between items-center p-3 text-sm text-foreground">
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
                <Button variant="secondary">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="flex flex-col gap-16 max-w-4xl px-3 py-16 lg:py-24 text-foreground">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-6xl lg:text-7xl mx-auto max-w-4xl text-center font-extrabold">
            <p className="text-primary">FastTrak</p>{' '}
            <p className="p-2 bg-gradient-to-t from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Vehicle Routing
            </p>
          </h1>
          <p className="text-lg lg:text-xl mx-auto max-w-xl text-center opacity-50 animate-fadeIn50 animation-duration[200ms]">
            Parcel logistics and tracking made simple.
          </p>
          <div className="flex gap-2 mx-auto justify-center items-center w-full">
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

        <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

        <div className="flex flex-col gap-8 text-foreground">
          <h2 className="text-lg font-bold text-center text-foreground">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map(({ title, subtitle, icon }) => (
              <div
                key={title}
                className="relative flex flex-col group rounded-lg border p-6 hover:border-foreground"
                rel="noreferrer"
              >
                <h3 className="font-bold min-h-[20px] lg:min-h-[40px]">
                  {title}
                </h3>
                <p className="my-4 text-sm opacity-70">{subtitle}</p>
                <div className="mt-4">
                  {icon}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center items-center text-center mt-10 text-xs">
          <p>
            Created by{' '}
            <Link href="https://kieranhardwick.com/" target="_blank" className="font-bold">
              <Button className="p-0 m-0 text-sm" variant="link">
                Kieran Hardwick
              </Button>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
