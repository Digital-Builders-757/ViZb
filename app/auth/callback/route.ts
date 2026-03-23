import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSafeRedirectPath } from "@/lib/utils"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const redirect = getSafeRedirectPath(searchParams.get("redirect"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`)
    }
  }

  // If no code or error, redirect to auth error page
  return NextResponse.redirect(`${origin}/auth/error`)
}
