import type { SupabaseClient } from "@supabase/supabase-js"

import { coerceUuid } from "@/lib/coerce-uuid"

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
