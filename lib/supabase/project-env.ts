/**
 * URL + anon key for server-side Supabase (Server Components, Route Handlers, Middleware).
 * Prefer NEXT_PUBLIC_* (same values the browser needs); fall back to SUPABASE_* from .env.example.
 */
export function getSupabaseProjectUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    ""
  )
}

export function getSupabaseProjectAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    ""
  )
}

export function isProjectSupabaseConfigured(): boolean {
  return Boolean(getSupabaseProjectUrl() && getSupabaseProjectAnonKey())
}

/** Server-only. Used for Auth Admin API (e.g. staff deleting a user). Never expose to the client. */
export function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ""
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(getSupabaseProjectUrl() && getSupabaseServiceRoleKey())
}
