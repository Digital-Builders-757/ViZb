import type { SupabaseClient } from "@supabase/supabase-js"
import {
  coalesceRelation,
  firstWalletEvent,
  type WalletEvent,
} from "@/lib/dashboard/ticket-wallet-shared"
import { getEventEffectiveEndMs, isEventUpcomingOrOngoing } from "@/lib/events/event-schedule"

export interface MemberHomeTicketPreview {
  ticketId: string
  eventId: string
  registrationKey: string
  status: string
  title: string
  slug: string
  startsAt: string
  endsAt: string | null
  city: string
  venueName: string
  flyerUrl: string | null
}

export interface MemberHomeRsvpSummary {
  loadError: string | null
  upcomingPreviews: MemberHomeTicketPreview[]
  upcomingAll: MemberHomeTicketPreview[]
  upcomingEventIds: string[]
  upcomingCount: number
  pastCount: number
  attendedCount: number
}

const emptySummary = (): MemberHomeRsvpSummary => ({
  loadError: null,
  upcomingPreviews: [],
  upcomingAll: [],
  upcomingEventIds: [],
  upcomingCount: 0,
  pastCount: 0,
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
        "id, created_at, event_id, event_registrations!inner ( status, created_at, event:events ( id, title, slug, starts_at, ends_at, city, venue_name, flyer_url ) )",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      return { ...emptySummary(), loadError: error.message }
    }

    const now = new Date()
    const nowMs = now.getTime()
    const rows = data ?? []

    type RegRow = {
      status: string
      created_at: string
      event: (WalletEvent & { id?: string }) | (WalletEvent & { id?: string })[] | null
    }

    type RawRow = {
      id: string
      created_at: string
      event_id: string
      event_registrations: RegRow | RegRow[]
    }

    const normalized = (rows as RawRow[])
      .map((r) => {
        const er = coalesceRelation(r.event_registrations)
        return er ? { id: r.id, created_at: r.created_at, event_id: r.event_id, event_registrations: er } : null
      })
      .filter((r): r is { id: string; created_at: string; event_id: string; event_registrations: RegRow } => r != null)

    function toPreview(r: { id: string; event_id: string; event_registrations: RegRow }): MemberHomeTicketPreview | null {
      const e = firstWalletEvent(coalesceRelation(r.event_registrations.event))
      if (!e) return null
      const eventId = (e as WalletEvent & { id?: string }).id ?? r.event_id
      return {
        ticketId: r.id,
        eventId,
        registrationKey: r.id,
        status: r.event_registrations.status,
        title: e.title,
        slug: e.slug,
        startsAt: e.starts_at,
        endsAt: e.ends_at ?? null,
        city: e.city,
        venueName: e.venue_name,
        flyerUrl: e.flyer_url,
      }
    }

    const active = normalized.filter((r) => {
      if (r.event_registrations.status === "cancelled") return false
      return firstWalletEvent(coalesceRelation(r.event_registrations.event)) != null
    })

    const attendedCount = active.filter((r) => r.event_registrations.status === "checked_in").length

    const upcomingRows = active.filter((r) => {
      const e = firstWalletEvent(coalesceRelation(r.event_registrations.event))
      if (!e) return false
      return isEventUpcomingOrOngoing(e.starts_at, e.ends_at ?? null, nowMs)
    })

    const pastRows = active.filter((r) => {
      const e = firstWalletEvent(coalesceRelation(r.event_registrations.event))
      if (!e) return false
      const effectiveEndMs = getEventEffectiveEndMs(e.starts_at, e.ends_at ?? null)
      if (Number.isNaN(effectiveEndMs)) return false
      return effectiveEndMs <= nowMs
    })

    upcomingRows.sort((a, b) => {
      const ae = firstWalletEvent(coalesceRelation(a.event_registrations.event))!
      const be = firstWalletEvent(coalesceRelation(b.event_registrations.event))!
      return new Date(ae.starts_at).getTime() - new Date(be.starts_at).getTime()
    })

    const upcomingPreviewsAll: MemberHomeTicketPreview[] = upcomingRows
      .map(toPreview)
      .filter((r): r is MemberHomeTicketPreview => r != null)

    const upcomingPreviews = upcomingPreviewsAll.slice(0, 3)
    const upcomingEventIds = upcomingPreviewsAll.map((r) => r.eventId)

    return {
      loadError: null,
      upcomingPreviews,
      upcomingAll: upcomingPreviewsAll,
      upcomingEventIds,
      upcomingCount: upcomingRows.length,
      pastCount: pastRows.length,
      attendedCount,
    }
  } catch {
    return {
      ...emptySummary(),
      loadError: "Ticketing is not fully configured on this environment yet.",
    }
  }
}
