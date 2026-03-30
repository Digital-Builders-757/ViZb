import { createBrowserClient } from "@supabase/ssr"

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ""
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ""
}

/** True when the browser bundle has both public Supabase vars (from `.env.local`, etc.). */
export function isBrowserSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey())
}

export function createClient() {
  const url = getSupabaseUrl()
  const anonKey = getSupabaseAnonKey()
  if (!url || !anonKey) {
    throw new Error(
      "Supabase URL and anon key are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to a file named `.env.local` in the project root (Next.js does not load `env.local`). See `.env.example`."
    )
  }
  return createBrowserClient(url, anonKey)
}
