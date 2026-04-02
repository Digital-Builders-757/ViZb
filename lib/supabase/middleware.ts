import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseProjectAnonKey, getSupabaseProjectUrl } from "./project-env"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = getSupabaseProjectUrl()
  const supabaseAnonKey = getSupabaseProjectAnonKey()

  // Local preview without Supabase: skip session refresh so marketing routes still render.
  // Protected routes will not enforce auth until env is configured.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production") {
      return supabaseResponse
    }
    throw new Error(
      "Your project's URL and Key are required to create a Supabase client!\n\n" +
        "Check your Supabase project's API settings to find these values\n\n" +
        "https://supabase.com/dashboard/project/_/settings/api"
    )
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: DO NOT remove this line
  // Refreshing the auth token is critical for server-side auth to work
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected route checks -- session presence only
  // Deep role checks happen in server layouts, RLS is the ultimate authority
  const pathname = request.nextUrl.pathname

  // /events is public (marketing timeline); dashboard/organizer/tickets/profile/admin stay gated.
  const protectedPrefixes = ["/dashboard", "/organizer", "/admin", "/tickets", "/profile"]
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    const returnTo = `${pathname}${request.nextUrl.search}`
    url.searchParams.set("redirect", returnTo)
    return NextResponse.redirect(url)
  }

  // If logged-in user visits login/signup, redirect to dashboard
  const authPages = ["/login", "/signup"]
  if (user && authPages.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
