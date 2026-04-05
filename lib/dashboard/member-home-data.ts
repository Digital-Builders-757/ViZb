import type { SupabaseClient } from "@supabase/supabase-js"

function isUpcomingOrOngoing(startsAt: string, endsAt: string | null, now: Date): boolean {
  if (endsAt) return new Date(endsAt).getTime() >= now.getTime()
  return new Date(startsAt).getTime() >= now.getTime()
}

export interface MemberHomeTicketPreview {
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
 * RSVP rollup for member home: explicit select; mirrors `/dashboard/tickets` shape + `ends_at` for ongoing events.
 */
export async function loadMemberHomeRsvpSummary(
  supabase: SupabaseClient,
  userId: string,
): Promise<MemberHomeRsvpSummary> {
  try {
    const { data, error } = await supabase
      .from("event_registrations")
      .select(
        "status, created_at, event:events ( title, slug, starts_at, ends_at, city, venue_name, flyer_url )",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      return { ...emptySummary(), loadError: error.message }
    }

    const now = new Date()
    const rows = data ?? []

    type Row = (typeof rows)[number]

    const active = rows.filter(
      (r: Row) =>
        r.status !== "cancelled" &&
        r.event &&
        Array.isArray(r.event) &&
        r.event.length > 0,
    )

    const attendedCount = active.filter((r: Row) => r.status === "checked_in").length

    const upcomingRows = active.filter((r: Row) => {
      const e = r.event![0]
      return isUpcomingOrOngoing(e.starts_at, e.ends_at ?? null, now)
    })

    upcomingRows.sort(
      (a: Row, b: Row) =>
        new Date(a.event![0].starts_at).getTime() - new Date(b.event![0].starts_at).getTime(),
    )

    const upcomingPreviews: MemberHomeTicketPreview[] = upcomingRows.slice(0, 3).map((r: Row) => {
      const e = r.event![0]
      return {
        registrationKey: `${e.slug}-${r.created_at}`,
        status: r.status,
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
