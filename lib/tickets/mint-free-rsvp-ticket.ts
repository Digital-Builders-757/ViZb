import type { SupabaseClient } from "@supabase/supabase-js"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function coerceUuid(data: unknown): string | null {
  if (typeof data === "string" && UUID_RE.test(data.trim())) return data.trim()
  if (data && typeof data === "object" && "id" in data) {
    const id = (data as { id: unknown }).id
    if (typeof id === "string" && UUID_RE.test(id.trim())) return id.trim()
  }
  return null
}

/**
 * Calls `mint_free_rsvp_ticket_for_registration` and resolves the new (or existing) ticket id.
 * Use from server actions and Server Components with a user-scoped Supabase client.
 */
export async function mintFreeRsvpTicketForRegistration(
  supabase: SupabaseClient,
  registrationId: string,
  ticketTypeId?: string | null,
): Promise<{ ticketId: string } | { error: string }> {
  const payload: { p_registration_id: string; p_ticket_type_id?: string } = {
    p_registration_id: registrationId,
  }
  if (ticketTypeId) payload.p_ticket_type_id = ticketTypeId

  const { data, error } = await supabase.rpc("mint_free_rsvp_ticket_for_registration", payload)
  if (error) return { error: `Could not issue ticket: ${error.message}` }

  let ticketId = coerceUuid(data)
  if (!ticketId) {
    const { data: row } = await supabase
      .from("tickets")
      .select("id")
      .eq("event_registration_id", registrationId)
      .maybeSingle()
    ticketId = row?.id ? coerceUuid(row.id) : null
  }

  if (!ticketId) {
    return {
      error: "Could not issue ticket: no ticket was created. Try again or contact support.",
    }
  }

  return { ticketId }
}
