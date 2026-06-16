import type { MemberHomeRsvpSummary, MemberHomeTicketPreview } from "@/lib/dashboard/member-home-data"
import type { DashboardEventPreview } from "@/lib/events/upcoming-preview"
import type { ForYouFeed } from "@/lib/events/for-you-queries"
import type { MyVibesEventRow } from "@/lib/events/my-vibes-queries"
import type { ScoredRecommendation } from "@/lib/events/member-recommendations"
import type { PostEventRecapPrompt } from "@/lib/events/post-event-recap-prompts"
import type { MemberPreferencesSnapshot } from "@/lib/member/preferences"

export type DashboardNextMove = {
  title: string
  subtitle: string
  href: string
  ctaLabel: string
  secondaryHref?: string
  secondaryCtaLabel?: string
}

export type LocalPulseDigestLine = {
  label: string
  detail: string
}

export type DashboardHomeStats = {
  upcomingPlans: number
  savedEvents: number
  ticketsPasses: number
  profileCompletionPct: number
  profileCompletionLabel: string
}

export type DashboardHomeBundle = {
  rsvp: MemberHomeRsvpSummary
  upcomingPlans: MemberHomeTicketPreview[]
  savedUpcoming: MyVibesEventRow[]
  savedNotDecided: MyVibesEventRow[]
  savedCount: number
  stats: DashboardHomeStats
  nextMove: DashboardNextMove
  forYou: ForYouFeed
  followedOrgEvents: ScoredRecommendation[]
  trending: DashboardEventPreview[]
  pulseDigest: LocalPulseDigestLine[]
  recapPrompts: PostEventRecapPrompt[]
  memberPreferences: MemberPreferencesSnapshot
  ticketSigningConfigured: boolean
}
