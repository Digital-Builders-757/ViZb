import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSafeRedirectPath } from "@/lib/utils"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const redirect = getSafeRedirectPath(searchParams.get("redirect"))
  const type = searchParams.get("type")

  console.log("🔧 [CALLBACK] Params:", { code: code?.substring(0, 10), type, redirect })

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If this is a password reset, redirect to reset password page
      if (type === "recovery") {
        console.log("✅ [CALLBACK] Recovery type detected, redirecting to reset-password")
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }
      console.log("🔧 [CALLBACK] Regular auth, redirecting to:", redirect)
      return NextResponse.redirect(`${origin}${redirect}`)
    }
    console.error("❌ [CALLBACK] Exchange error:", error)
  }

  // If no code or error, redirect to auth error page
  console.log("❌ [CALLBACK] No code or error occurred")
  return NextResponse.redirect(`${origin}/auth/error`)
}
