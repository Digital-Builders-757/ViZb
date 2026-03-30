import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseProjectAnonKey, getSupabaseProjectUrl, isProjectSupabaseConfigured } from "./project-env"

export { isProjectSupabaseConfigured as isServerSupabaseConfigured }

export async function createClient() {
  const cookieStore = await cookies()

  const url = getSupabaseProjectUrl()
  const anonKey = getSupabaseProjectAnonKey()
  if (!url || !anonKey) {
    throw new Error(
      "Supabase URL and anon key are missing on the server. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to `.env.local`, or set SUPABASE_URL and SUPABASE_ANON_KEY (see `.env.example`). Restart `npm run dev` after editing env."
    )
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have proxy refreshing user sessions.
        }
      },
    },
  })
}
