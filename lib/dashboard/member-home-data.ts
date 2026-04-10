import type { SupabaseClient } from "@supabase/supabase-js"
import {
  coalesceRelation,
  firstWalletEvent,
  type WalletEvent,
} from "@/lib/dashboard/ticket-wallet-shared"

function isUpcomingOrOngoing(startsAt: string, endsAt: string | null, now: Date): boolean {
  if (endsAt) return new Date(endsAt).getTime() >= now.getTime()
  return new Date(startsAt).getTime() >= now.getTime()
}

export interface MemberHomeTicketPreview {
  ticketId: string
  registrationKey: string
  status: string
  title: string
  slug: string
  startsAt: string
  city: string
  venueName: string
  flyerUrl: string | null
}

export interface MemberHomeRsvpSummary {
  loadError: string | null
  upcomingPreviews: MemberHomeTicketPreview[]
  upcomingCount: number
  attendedCount: number
}

const emptySummary = (): MemberHomeRsvpSummary => ({
  loadError: null,
  upcomingPreviews: [],
  upcomingCount: 0,
  attendedCount: 0,
})

/**
 * Ticket rollup for member home: rows from `tickets` + registration status; mirrors `/dashboard/tickets` + `ends_at`.
 */
export async function loadMemberHomeRsvpSummary(
  supabase: SupabaseClient,
  userId: string,
): Promise<MemberHomeRsvpSummary> {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select(
        "id, created_at, event_registrations!inner ( status, created_at, event:events ( title, slug, starts_at, ends_at, city, venue_name, flyer_url ) )",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      return { ...emptySummary(), loadError: error.message }
    }

    const now = new Date()
    const rows = data ?? []

    type RegRow = {
      status: string
      created_at: string
      event: WalletEvent | WalletEvent[] | null
    }

    type RawRow = {
      id: string
      created_at: string
      event_registrations: RegRow | RegRow[]
    }

    const normalized = (rows as RawRow[])
      .map((r) => {
        const er = coalesceRelation(r.event_registrations)
        return er ? { id: r.id, created_at: r.created_at, event_registrations: er } : null
      })
      .filter((r): r is { id: string; created_at: string; event_registrations: RegRow } => r != null)

    const active = normalized.filter((r) => {
      if (r.event_registrations.status === "cancelled") return false
      return firstWalletEvent(coalesceRelation(r.event_registrations.event)) != null
    })

    const attendedCount = active.filter((r) => r.event_registrations.status === "checked_in").length

    const upcomingRows = active.filter((r) => {
      const e = firstWalletEvent(coalesceRelation(r.event_registrations.event))
      if (!e) return false
      return isUpcomingOrOngoing(e.starts_at, e.ends_at ?? null, now)
    })

    upcomingRows.sort((a, b) => {
      const ae = firstWalletEvent(coalesceRelation(a.event_registrations.event))!
      const be = firstWalletEvent(coalesceRelation(b.event_registrations.event))!
      return new Date(ae.starts_at).getTime() - new Date(be.starts_at).getTime()
    })

    const upcomingPreviews: MemberHomeTicketPreview[] = upcomingRows.slice(0, 3).map((r) => {
      const e = firstWalletEvent(coalesceRelation(r.event_registrations.event))!
      return {
        ticketId: r.id,
        registrationKey: r.id,
        status: r.event_registrations.status,
        title: e.title,
        slug: e.slug,
        startsAt: e.starts_at,
        city: e.city,
        venueName: e.venue_name,
        flyerUrl: e.flyer_url,
      }
    })

    return {
      loadError: null,
      upcomingPreviews,
      upcomingCount: upcomingRows.length,
      attendedCount,
    }
  } catch {
    return {
      ...emptySummary(),
      loadError: "Ticketing is not fully configured on this environment yet.",
    }
  }
}
