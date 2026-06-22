import Link from "next/link"
import { Building2, Shield } from "lucide-react"
import { getUserOrganizations } from "@/lib/auth-helpers"
import { loadDashboardHome, formatDashboardRegion } from "@/lib/dashboard/load-dashboard-home"
import { needsMemberPreferenceOnboarding } from "@/lib/member/preferences"
import { getPublicSiteOrigin } from "@/lib/public-site-url"
import { parseDashboardCalendarMonth } from "@/lib/events/dashboard-calendar"
import { getPublishedEventsForDashboardMonth } from "@/lib/events/dashboard-calendar-queries"
import { fetchMySavedEventIds } from "@/lib/events/my-vibes-queries"
import { DashboardCommandCenter } from "@/components/dashboard/home/dashboard-command-center"
import { TicketPassesSection } from "@/components/dashboard/home/ticket-passes-section"
import { SavedNotDecidedSection } from "@/components/dashboard/home/saved-not-decided-section"
import { VibeProfileSection } from "@/components/dashboard/home/vibe-profile-section"
import { LocalPulseSection } from "@/components/dashboard/home/local-pulse-section"
import { RecommendedEventsSection } from "@/components/dashboard/home/recommended-events-section"
import { PostEventRecapPromptsSection } from "@/components/dashboard/post-event-recap-prompts"
import { MemberPreferencesForm } from "@/components/dashboard/member-preferences-form"
import { GlassCard } from "@/components/ui/glass-card"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ cal?: string }>
}) {
  const { cal } = await searchParams
  const { year, monthIndex, calKey } = parseDashboardCalendarMonth(cal)

  const { profile, user, supabase, memberships } = await getUserOrganizations()
  const [home, myVibesSavedIds, calendarEvents] = await Promise.all([
    loadDashboardHome(supabase, user.id, profile ?? {}),
    fetchMySavedEventIds(supabase, user.id),
    getPublishedEventsForDashboardMonth(year, monthIndex),
  ])
  const siteOrigin = getPublicSiteOrigin()

  const displayName = profile?.display_name || "there"
  const needsPreferenceOnboarding = needsMemberPreferenceOnboarding(home.memberPreferences)
  const isFirstRun = !profile?.display_name || needsPreferenceOnboarding
  const region = formatDashboardRegion(home.memberPreferences)

  const firstRunHint = !profile?.display_name
    ? "You're in. Set up your profile to get the most out of ViBE."
    : needsPreferenceOnboarding
      ? "Almost there — tell us your cities and categories so we can personalize your command center."
      : null

  return (
    <div className="max-w-full space-y-10 overflow-x-hidden md:space-y-12">
      <DashboardCommandCenter
        displayName={displayName}
        region={region}
        isFirstRun={isFirstRun}
        firstRunHint={firstRunHint}
        stats={home.stats}
        nextMove={home.nextMove}
        upcomingPlans={home.upcomingPlans}
        savedUpcoming={home.savedUpcoming}
        ticketEventIds={home.rsvp.upcomingEventIds}
        siteOrigin={siteOrigin}
        calendarYear={year}
        calendarMonthIndex={monthIndex}
        calendarKey={calKey}
        calendarEvents={calendarEvents}
        savedEventIds={myVibesSavedIds}
      />

      {isFirstRun && !profile?.display_name ? (
        <Link href="/profile" className="group block">
          <GlassCard className="flex w-full items-center gap-4 rounded-none p-4 transition-[box-shadow,transform] hover:shadow-[var(--vibe-neon-glow-subtle)] active:scale-[0.99] sm:w-auto sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-gradient-to-br from-[color:var(--neon-a)] to-[color:var(--neon-b)] font-bold text-[color:var(--neon-text0)]">
              1
            </div>
            <div className="min-w-0 text-left">
              <p className="font-semibold text-[color:var(--neon-text0)]">Complete your profile</p>
              <p className="text-sm text-[color:var(--neon-text2)]">Add your name to get started</p>
            </div>
            <span className="ml-auto text-[color:var(--neon-a)] transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </GlassCard>
        </Link>
      ) : null}

      {needsPreferenceOnboarding ? (
        <section aria-labelledby="first-run-preferences" className="max-w-2xl">
          <h2 id="first-run-preferences" className="sr-only">
            Set your culture preferences
          </h2>
          <MemberPreferencesForm initial={home.memberPreferences} variant="first-run" />
        </section>
      ) : null}

      <TicketPassesSection
        loadError={home.rsvp.loadError}
        upcomingPreviews={home.rsvp.upcomingPreviews}
        upcomingCount={home.rsvp.upcomingCount}
        pastCount={home.rsvp.pastCount}
        ticketSigningConfigured={home.ticketSigningConfigured}
      />

      <SavedNotDecidedSection events={home.savedNotDecided} siteOrigin={siteOrigin} />

      <VibeProfileSection
        preferences={home.memberPreferences}
        profileCompletionPct={home.stats.profileCompletionPct}
        profileCompletionLabel={home.stats.profileCompletionLabel}
      />

      <PostEventRecapPromptsSection prompts={home.recapPrompts} />

      <LocalPulseSection
        trending={home.trending}
        followedOrgEvents={home.followedOrgEvents}
        pulseDigest={home.pulseDigest}
        region={region}
      />

      <RecommendedEventsSection forYou={home.forYou} />

      {memberships.length === 0 && profile?.platform_role !== "staff_admin" ? (
        <section>
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
            Organize
          </span>
          <h2 className="mt-2 font-serif text-xl font-bold text-[color:var(--neon-text0)]">
            Want to Host Events?
          </h2>
          <Link href="/host/apply" className="mt-4 block">
            <GlassCard className="flex items-center gap-4 rounded-none p-4 transition-[box-shadow] hover:shadow-[var(--vibe-neon-glow-subtle)] md:p-5">
              <Building2 className="h-5 w-5 shrink-0 text-[color:var(--neon-a)]" />
              <div className="min-w-0 text-left">
                <p className="font-semibold text-[color:var(--neon-text0)]">Request to Host</p>
                <p className="text-sm text-[color:var(--neon-text2)]">
                  Apply to become an event organizer on ViBE
                </p>
              </div>
              <span className="ml-auto text-[color:var(--neon-a)]">→</span>
            </GlassCard>
          </Link>
        </section>
      ) : null}

      {memberships.length === 0 && profile?.platform_role === "staff_admin" ? (
        <section>
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
            Organize
          </span>
          <h2 className="mt-2 font-serif text-xl font-bold text-[color:var(--neon-text0)]">
            Create an Organization
          </h2>
          <Link href="/admin" className="mt-4 block">
            <GlassCard className="flex items-center gap-4 rounded-none p-4 transition-[box-shadow] hover:shadow-[var(--vibe-neon-glow-subtle)] md:p-5">
              <Shield className="h-5 w-5 shrink-0 text-[color:var(--neon-b)]" />
              <div className="min-w-0 text-left">
                <p className="font-semibold text-[color:var(--neon-text0)]">Go to Admin Panel</p>
                <p className="text-sm text-[color:var(--neon-text2)]">
                  Create organizations directly from the admin dashboard
                </p>
              </div>
              <span className="ml-auto text-[color:var(--neon-b)]">→</span>
            </GlassCard>
          </Link>
        </section>
      ) : null}
    </div>
  )
}
