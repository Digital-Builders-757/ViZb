import type { SupabaseClient } from "@supabase/supabase-js"

export type CheckInScanGate =
  | { ok: true }
  | { ok: false; reason: "event_not_found" | "not_authorized" }

/**
 * Staff admins or org owners/admins for the event's organization may perform check-in scans.
 * Matches RLS on `event_registrations` updates and organizer server actions.
 */
export async function assertCheckInScanAllowed(
  supabase: SupabaseClient,
  userId: string,
  platformRole: string | null | undefined,
  eventId: string,
): Promise<CheckInScanGate> {
  const { data: event, error } = await supabase
    .from("events")
    .select("id, org_id")
    .eq("id", eventId)
    .maybeSingle()

  if (error || !event) return { ok: false, reason: "event_not_found" }

  if (platformRole === "staff_admin") return { ok: true }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", event.org_id)
    .eq("user_id", userId)
    .maybeSingle()

  if (membership && ["owner", "admin"].includes(membership.role)) return { ok: true }

  return { ok: false, reason: "not_authorized" }
}
