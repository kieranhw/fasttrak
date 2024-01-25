import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
    const { supabase } = createClient(request);

    try {
        // Attempt to retrieve the current user's session
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (!user) {
            // No user session found, redirect to the login page
            // Make sure to exclude the login and public routes to avoid infinite redirects
            if (!request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/public')) {
                return NextResponse.redirect(new URL('/login', request.url));
            }
        }

        // User is authenticated, or the request is for a public route, so proceed with the request
        return NextResponse.next();
    } catch (error) {
        console.error('Error checking user authentication:', error);
        return NextResponse.redirect(new URL('/error', request.url));
    }
}

export const config = {
  matcher: [
    // Apply middleware only to paths starting with "/dashboard/"
    '/dashboard/:path*',
  ],
};

