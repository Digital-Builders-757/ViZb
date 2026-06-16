import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export type StaffAdminApiAuthResult =
  | { ok: true; userId: string; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; response: NextResponse }

/**
 * Session + staff_admin check for admin API routes (JSON errors, no redirects).
 */
export async function requireStaffAdminApi(): Promise<StaffAdminApiAuthResult> {
  if (!isServerSupabaseConfigured()) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }),
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError || profile?.platform_role !== "staff_admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { ok: true, userId: user.id, supabase }
}
