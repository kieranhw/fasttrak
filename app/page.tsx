
import Link from 'next/link'
import LogoutButton from '../components/LogoutButton'
import SupabaseLogo from '../components/SupabaseLogo'
import NextJsLogo from '../components/NextJsLogo'
import { supabase } from '@/pages/api/supabase-server'
import { Button } from '@/components/ui/button'
export const dynamic = 'force-dynamic'

const resources = [
  {
    title: 'Feature 1',
    subtitle:
      'Feature 1',
    icon: 'M7 4V20M17 4V20M3 8H7M17 8H21M3 12H21M3 16H7M17 16H21M4 20H20C20.5523 20 21 19.5523 21 19V5C21 4.44772 20.5523 4 20 4H4C3.44772 4 3 4.44772 3 5V19C3 19.5523 3.44772 20 4 20Z',
  },
  {
    title: 'Feature 2',
    subtitle:
      'Feature 2',
    icon: 'M10 20L14 4M18 8L22 12L18 16M6 16L2 12L6 8',
  },
  {
    title: 'Feature 3',
    subtitle:
      'Feature 3',
    icon: 'M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528',
  },
]


export default async function Index() {

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="w-full flex flex-col items-center">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-4xl flex justify-between items-center p-3 text-sm text-foreground">
          <div />
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                Hey, {user.email}!
                <LogoutButton />
              </div>
            ) : (
              <Link
                href="/login"
              >
                <Button variant="secondary">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="flex flex-col gap-16 max-w-4xl px-3 py-16 lg:py-24 text-foreground">

        <div className="flex flex-col items-center gap-8">
          <h1 className="text-6xl lg:text-7xl mx-auto max-w-4xl text-center font-extrabold"><p className="text-primary">FastTrak</p> <p className="p-2 bg-gradient-to-t from-foreground to-gray-600 bg-clip-text text-transparent">Vehicle Routing</p></h1>
          <p className="text-lg lg:text-xl mx-auto max-w-xl text-center opacity-50">
            Parcel logistics and tracking made simple.
          </p>
          <div className="flex gap-2 mx-auto justify-center items-center w-full">
            <Button>
              Demo
            </Button>
            <Button variant="secondary">
              Login
            </Button>
          </div>

        </div>

        <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

        <div className="flex flex-col gap-8 text-foreground">
          <h2 className="text-lg font-bold text-center">
            Everything you need
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {resources.map(({ title, subtitle, icon }) => (
              <a
                key={title}
                className="relative flex flex-col group rounded-lg border p-6 hover:border-foreground"
                target="_blank"
                rel="noreferrer"
              >
                <h3 className="font-bold mb-2  min-h-[40px] lg:min-h-[60px]">
                  {title}
                </h3>
                <div className="flex flex-col grow gap-4 justify-between">
                  <p className="text-sm opacity-70">{subtitle}</p>
                  <div className="flex justify-between items-center">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="opacity-80 group-hover:opacity-100"
                    >
                      <path
                        d={icon}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>



        <div className="flex justify-center items-center text-center mt-20 text-xs">
          <p>
            Created by {' '}
            <Link
              href="https://kieranhardwick.com/"
              target="_blank"
              className="font-bold"
            >
              <Button className="p-0 m-0 text-sm" variant="link">
                Kieran Hardwick
              </Button>
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
