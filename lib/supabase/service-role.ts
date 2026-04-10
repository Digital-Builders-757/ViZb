import { createClient } from "@supabase/supabase-js"

import { getSupabaseProjectUrl, getSupabaseServiceRoleKey } from "./project-env"

/**
 * Supabase client with the service role key. Server-only — bypasses RLS; use only in trusted server code.
 */
export function createServiceRoleClient() {
  const url = getSupabaseProjectUrl()
  const serviceRoleKey = getSupabaseServiceRoleKey()
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY and Supabase URL are required for this operation. Add them to the server environment.",
    )
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
