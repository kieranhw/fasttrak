import Link from 'next/link'
import Messages from './messages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Login() {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <Link
        href="/dashboard"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
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
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{' '}
        Back
      </Link>

      <form
        className="flex-1 flex flex-col w-full justify-center gap-6 text-foreground"
        action="/auth/sign-in"
        method="post"
      >
        <div>
          <label className="text-md" htmlFor="email">
            Email
          </label>
          <Input
            type="email"
            name="email"
            placeholder="name@email.com"
            required
          />
        </div>
        <div>
          <label className="text-md" htmlFor="password">
            Password
          </label>
          <Input
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
        </div>

        <Button>
          Sign In
        </Button>
        <Messages />
      </form>
    </div>
  )
}
