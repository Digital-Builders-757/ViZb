import type { SupabaseClient } from "@supabase/supabase-js"

export type RegistrationEvent = {
  title: string
  slug: string
  starts_at: string
  city: string
  venue_name: string
}

export type PassRegistrationRow = {
  id: string
  event_id: string
  status: string
  event: RegistrationEvent[] | RegistrationEvent | null
}

function firstEvent(raw: PassRegistrationRow["event"]): RegistrationEvent | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  if (typeof raw === "object" && "slug" in raw) return raw as RegistrationEvent
  return null
}

/**
 * Loads a registration for pass issuance; caller must use an authenticated Supabase client
 * so RLS restricts to the signed-in user.
 */
export async function fetchRegistrationForWalletPass(
  supabase: SupabaseClient,
  registrationId: string,
): Promise<{ id: string; event_id: string; status: string; event: RegistrationEvent } | null> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("id, event_id, status, event:events ( title, slug, starts_at, city, venue_name )")
    .eq("id", registrationId)
    .maybeSingle()

  if (error || !data) return null

  const row = data as PassRegistrationRow
  const ev = firstEvent(row.event)
  if (!ev) return null

  return {
    id: row.id,
    event_id: row.event_id,
    status: row.status,
    event: ev,
  }
}
