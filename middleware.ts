import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { AuthApiError } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next()

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Refresh session if expired - required for Server Components
    await supabase.auth.getSession()
  } catch (error) {
    if ((error as AuthApiError).name === 'AuthApiError' && (error as AuthApiError).status === 400) {
      console.error("Invalid Refresh Token:", (error as AuthApiError).message)
      
      // Log user out if refresh token invalid
      res = NextResponse.redirect('/login')

    } else {
      // Handle other errors or re-throw them
      console.error("Unhandled error in middleware:", error)
    }
  }

  return res
}
