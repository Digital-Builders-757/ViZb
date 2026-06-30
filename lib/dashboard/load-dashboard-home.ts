import type { SupabaseClient } from "@supabase/supabase-js"
import { loadMemberHomeRsvpSummary, type MemberHomeTicketPreview } from "@/lib/dashboard/member-home-data"
import type {
  DashboardHomeBundle,
  DashboardNextMove,
  DashboardHomeStats,
  LocalPulseDigestLine,
} from "@/lib/dashboard/dashboard-home-types"
import type { DashboardEventPreview } from "@/lib/events/upcoming-preview"
import { fetchForYouRecommendations, fetchFollowedOrganizerEvents } from "@/lib/events/for-you-queries"
import { fetchMyVibesEventsInWindow, type MyVibesEventRow } from "@/lib/events/my-vibes-queries"
import { fetchPostEventRecapPrompts } from "@/lib/events/post-event-recap-prompts"
import { getDashboardUpcomingEventPreviews } from "@/lib/events/upcoming-preview"
import { fetchMemberPreferences } from "@/lib/member/load-preferences"
import {
  needsMemberPreferenceOnboarding,
  type MemberPreferencesSnapshot,
} from "@/lib/member/preferences"
import { MEMBER_HOME_CITY_OPTIONS } from "@/lib/member/home-cities"
import { calculateProfileCompletion } from "@/lib/profile/profile-completion"
import { getPublicSiteOrigin } from "@/lib/public-site-url"

function buildInviteMailto(plan: MemberHomeTicketPreview): string {
  const eventUrl = `${getPublicSiteOrigin()}/events/${plan.slug}`
  const subject = encodeURIComponent(`Pull up to ${plan.title}`)
  const body = encodeURIComponent(`I'm locked in for this — join me?\n\n${eventUrl}`)
  return `mailto:?subject=${subject}&body=${body}`
}

function resolveNextMove(
  displayName: string | null | undefined,
  needsPrefs: boolean,
  upcomingPlans: MemberHomeTicketPreview[],
  savedNotDecided: Pick<MyVibesEventRow, "title" | "slug">[],
): DashboardNextMove {
  if (!displayName?.trim()) {
    return {
      title: "Complete your profile",
      subtitle: "Add your name so ViBE feels personal from the jump.",
      href: "/profile",
      ctaLabel: "Complete profile",
    }
  }
  if (needsPrefs) {
    return {
      title: "Tune your vibe",
      subtitle: "Pick your cities and categories so we know what moves you.",
      href: "/profile#culture-preferences",
      ctaLabel: "Tune your vibe",
    }
  }
  const nextPlan = upcomingPlans[0]
  if (nextPlan) {
    return {
      title: nextPlan.title,
      subtitle: `${nextPlan.venueName} · ${nextPlan.city} — your next locked-in move.`,
      href: `/tickets/${nextPlan.ticketId}`,
      ctaLabel: "View ticket",
      secondaryHref: buildInviteMailto(nextPlan),
      secondaryCtaLabel: "Invite a friend",
    }
  }
  const nextSaved = savedNotDecided[0]
  if (nextSaved) {
    return {
      title: nextSaved.title,
      subtitle: "You saved this one. Lock it in before it fills up.",
      href: `/events/${nextSaved.slug}`,
      ctaLabel: "Lock it in",
    }
  }
  return {
    title: "Find your next move",
    subtitle: "Browse what's happening across Virginia this week.",
    href: "/events",
    ctaLabel: "Browse events",
  }
}

function isThisWeekend(iso: string): boolean {
  const date = new Date(iso)
  const day = date.getDay()
  return day === 5 || day === 6 || day === 0
}

function countByCategory(trending: DashboardEventPreview[], category: string): number {
  return trending.filter((e) => e.categories.includes(category)).length
}

export function computePulseDigest(
  trending: DashboardEventPreview[],
  region: string,
): LocalPulseDigestLine[] {
  const lines: LocalPulseDigestLine[] = []

  if (trending.length > 0) {
    lines.push({
      label: region !== "Virginia" ? `Trending in ${region}` : "Trending in Hampton Roads",
      detail: `${trending.length} upcoming event${trending.length === 1 ? "" : "s"} picking up momentum`,
    })
  }

  const weekendCount = trending.filter((e) => isThisWeekend(e.starts_at)).length
  if (weekendCount > 0) {
    lines.push({
      label: "Popular this weekend",
      detail: `${weekendCount} event${weekendCount === 1 ? "" : "s"} on the calendar`,
    })
  }

  const workshopCount = countByCategory(trending, "workshop")
  if (workshopCount > 0) {
    lines.push({
      label: "New workshops added",
      detail: `${workshopCount} workshop${workshopCount === 1 ? "" : "s"} coming up`,
    })
  }

  const partyCount = countByCategory(trending, "party")
  if (partyCount > 0 && lines.length < 3) {
    lines.push({
      label: "Creative events picking up momentum",
      detail: `${partyCount} nightlife & culture event${partyCount === 1 ? "" : "s"} on deck`,
    })
  }

  return lines.slice(0, 3)
}

export async function loadDashboardHome(
  supabase: SupabaseClient,
  userId: string,
  profile: { display_name?: string | null; avatar_url?: string | null },
): Promise<DashboardHomeBundle> {
  const memberPreferences = await fetchMemberPreferences(supabase, userId)
  const needsPrefs = needsMemberPreferenceOnboarding(memberPreferences)
  const region = formatDashboardRegion(memberPreferences)

  const [rsvp, savedUpcoming, forYou, followedOrgEvents, recapPrompts, trending] = await Promise.all([
    loadMemberHomeRsvpSummary(supabase, userId),
    fetchMyVibesEventsInWindow(supabase, userId, 30),
    fetchForYouRecommendations(supabase, userId, memberPreferences, 6),
    fetchFollowedOrganizerEvents(supabase, userId, 3),
    fetchPostEventRecapPrompts(supabase, userId, 3),
    getDashboardUpcomingEventPreviews(4),
  ])

  const ticketEventIds = new Set(rsvp.upcomingEventIds)
  const savedNotDecided = savedUpcoming.filter((e) => !ticketEventIds.has(e.id))

  const profileCompletion = calculateProfileCompletion(
    { display_name: profile.display_name, avatar_url: profile.avatar_url },
    memberPreferences,
  )
  const stats: DashboardHomeStats = {
    upcomingPlans: rsvp.upcomingCount,
    savedEvents: savedUpcoming.length,
    ticketsPasses: rsvp.upcomingCount,
    profileCompletionPct: profileCompletion.pct,
    profileCompletionLabel: profileCompletion.label,
    profileCompletionMissingFields: profileCompletion.missingFields,
  }

  const nextMove = resolveNextMove(
    profile.display_name,
    needsPrefs,
    rsvp.upcomingAll,
    savedNotDecided,
  )

  const pulseDigest = computePulseDigest(trending, region)
  const ticketSecret = process.env.TICKET_QR_SIGNING_SECRET

  return {
    rsvp,
    upcomingPlans: rsvp.upcomingAll,
    savedUpcoming,
    savedNotDecided,
    savedCount: savedUpcoming.length,
    stats,
    nextMove,
    forYou,
    followedOrgEvents,
    trending,
    pulseDigest,
    recapPrompts,
    memberPreferences,
    ticketSigningConfigured: Boolean(ticketSecret),
  }
}

export function formatDashboardRegion(prefs: MemberPreferencesSnapshot): string {
  const first = prefs.homeCities[0]
  if (!first) return "Virginia"
  const match = MEMBER_HOME_CITY_OPTIONS.find((o) => o.value === first)
  return match?.label ?? "Virginia"
}
