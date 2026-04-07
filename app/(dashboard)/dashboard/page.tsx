import { getUserOrganizations } from "@/lib/auth-helpers"
import { MemberHomeQuickActions } from "@/components/dashboard/member-home-quick-actions"
import { MemberHomeTicketsSection } from "@/components/dashboard/member-home-tickets-section"
import { DashboardCalendarShell } from "@/components/dashboard/calendar/dashboard-calendar-shell"
import { parseDashboardCalendarMonth } from "@/lib/events/dashboard-calendar"
import { getPublishedEventsForDashboardMonth } from "@/lib/events/dashboard-calendar-queries"
import {
  formatCategoryLabels,
  formatDashboardEventWhen,
  getDashboardUpcomingEventPreviews,
} from "@/lib/events/upcoming-preview"
import { isServerSupabaseConfigured } from "@/lib/supabase/server"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Building2, Heart, Shield, Sparkles, Ticket, Users } from "lucide-react"

import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { StatCard } from "@/components/ui/stat-card"
import { loadMemberHomeRsvpSummary } from "@/lib/dashboard/member-home-data"
import { MyVibesThisWeek } from "@/components/dashboard/my-vibes-week"
import { fetchMySavedEventIds } from "@/lib/events/my-vibes-queries"

const TRENDING_MOCK = [
  {
    title: "The Matrix Party",
    location: "Norfolk",
    dates: "Fri–Sat, Apr 26–27",
    tag: "Urban Nightlife",
  },
  {
    title: "BeatNight 757",
    location: "Norfolk",
    dates: "Sat, Apr 27",
    tag: "Hip-hop",
  },
] as const

/** Labels are editorial; `category` must match `events.categories` + `/events` filter (lowercase). */
const CULTURE_PICKS = [
  { label: "Parties & nightlife", category: "party" as const, icon: Sparkles },
  { label: "Network & connect", category: "networking" as const, icon: Users },
  { label: "Workshops & builds", category: "workshop" as const, icon: Heart },
] as const

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ cal?: string }>
}) {
  const { cal } = await searchParams
  const { year, monthIndex, calKey } = parseDashboardCalendarMonth(cal)

  const { profile, user, supabase, memberships } = await getUserOrganizations()
  const rsvp = await loadMemberHomeRsvpSummary(supabase, user.id)
  const myVibesSavedIds = await fetchMySavedEventIds(supabase, user.id)
  const trendingLive = await getDashboardUpcomingEventPreviews(3)
  const calendarEvents = await getPublishedEventsForDashboardMonth(year, monthIndex)
  const supabaseReady = isServerSupabaseConfigured()
  const showTrendingMocks = !supabaseReady

  const displayName = profile?.display_name || "there"
  const isFirstRun = !profile?.display_name

  return (
    <div className="max-w-full space-y-10 overflow-x-hidden md:space-y-12">
      <header>
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
          Overview
        </span>
        <h1 className="mt-2 text-balance font-serif text-2xl font-bold text-[color:var(--neon-text0)] md:text-3xl">
          {isFirstRun ? "Welcome to VIZB" : `Hey, ${displayName}`}
        </h1>
        {isFirstRun ? (
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            {"You're in. Set up your profile to get the most out of VIZB."}
          </p>
        ) : null}
      </header>

      <MemberHomeQuickActions />

      {isFirstRun ? (
        <Link href="/profile" className="group block">
          <GlassCard className="flex w-full items-center gap-4 p-4 transition-[box-shadow,transform] hover:shadow-[var(--vibe-neon-glow-subtle)] active:scale-[0.99] sm:w-auto sm:p-5">
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

      <section aria-labelledby="dash-stats">
        <h2 id="dash-stats" className="sr-only">
          Your stats
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard
            icon={Ticket}
            label="Tickets"
            value={rsvp.loadError ? "—" : rsvp.upcomingCount}
            hint="Upcoming RSVPs"
            accent="a"
          />
          <StatCard
            icon={Building2}
            label="Organizations"
            value={memberships.length}
            hint={
              memberships.length === 0 ? "Not part of any org yet" : "Active memberships"
            }
            accent="b"
          />
          <StatCard
            icon={Calendar}
            label="Events"
            value={rsvp.loadError ? "—" : rsvp.attendedCount}
            hint="Check-ins recorded"
            accent="c"
          />
        </div>
      </section>

      <MyVibesThisWeek supabase={supabase} userId={user.id} />

      <section aria-labelledby="dash-calendar-heading" className="scroll-mt-24">
        <h2 id="dash-calendar-heading" className="sr-only">
          Events this month
        </h2>
        <DashboardCalendarShell
          key={calKey}
          year={year}
          monthIndex={monthIndex}
          calKey={calKey}
          events={calendarEvents}
          savedEventIds={myVibesSavedIds}
        />
      </section>

      {memberships.length === 0 && profile?.platform_role !== "staff_admin" ? (
        <section>
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
            Organize
          </span>
          <h2 className="mt-2 font-serif text-xl font-bold text-[color:var(--neon-text0)]">
            Want to Host Events?
          </h2>
          <Link href="/host/apply" className="mt-4 block">
            <GlassCard className="flex items-center gap-4 p-4 transition-[box-shadow] hover:shadow-[var(--vibe-neon-glow-subtle)] md:p-5">
              <Building2 className="h-5 w-5 shrink-0 text-[color:var(--neon-a)]" />
              <div className="min-w-0 text-left">
                <p className="font-semibold text-[color:var(--neon-text0)]">Request to Host</p>
                <p className="text-sm text-[color:var(--neon-text2)]">
                  Apply to become an event organizer on VIZB
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
            <GlassCard className="flex items-center gap-4 p-4 transition-[box-shadow] hover:shadow-[var(--vibe-neon-glow-subtle)] md:p-5">
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

      <section aria-labelledby="trending-heading">
        <div className="mb-4">
          <h2
            id="trending-heading"
            className="font-serif text-xl font-bold text-[color:var(--neon-text0)] md:text-2xl"
          >
            Trending this weekend
          </h2>
          <p className="mt-1 text-[15px] leading-relaxed text-[color:var(--neon-text2)]">
            {trendingLive.length > 0
              ? "Happening soon — open a card for full details."
              : showTrendingMocks
                ? "Sample picks for layout; connect Supabase to pull live published events."
                : "No upcoming published events yet — browse the full feed for the latest."}
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {trendingLive.length > 0
            ? trendingLive.map((ev) => (
                <Link key={ev.id} href={`/events/${ev.slug}`} className="block">
                  <GlassCard className="overflow-hidden p-0 transition-[box-shadow,transform] hover:shadow-[var(--vibe-neon-glow-subtle)] active:scale-[0.99]" emphasis>
                    {ev.flyer_url ? (
                      <div className="relative aspect-[16/9] w-full bg-[color:var(--neon-bg1)]">
                        <Image
                          src={ev.flyer_url}
                          alt={`${ev.title} flyer`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 800px"
                        />
                        {/* readability overlay for text-on-image (mobile-first) */}
                        <div
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[color:var(--neon-bg0)]/95 via-[color:var(--neon-bg0)]/35 to-transparent"
                          aria-hidden
                        />
                        <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-4 md:hidden">
                          <h3 className="text-lg font-bold text-[color:var(--neon-text0)]">{ev.title}</h3>
                          <p className="text-sm text-[color:var(--neon-text1)]">
                            {ev.city} · {formatDashboardEventWhen(ev.starts_at, ev.ends_at)}
                          </p>
                          <span className="inline-flex rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-a)] backdrop-blur">
                            {formatCategoryLabels(ev.categories)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-[color:var(--neon-a)]/25 via-[color:var(--neon-b)]/15 to-[color:var(--neon-c)]/10">
                        <div
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[color:var(--neon-bg0)]/85 via-[color:var(--neon-bg0)]/30 to-transparent"
                          aria-hidden
                        />
                        <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-4 md:hidden">
                          <h3 className="text-lg font-bold text-[color:var(--neon-text0)]">{ev.title}</h3>
                          <p className="text-sm text-[color:var(--neon-text1)]">
                            {ev.city} · {formatDashboardEventWhen(ev.starts_at, ev.ends_at)}
                          </p>
                          <span className="inline-flex rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-a)] backdrop-blur">
                            {formatCategoryLabels(ev.categories)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* desktop detail stack */}
                    <div className="hidden space-y-2 p-4 md:block md:p-5">
                      <h3 className="text-lg font-bold text-[color:var(--neon-text0)]">{ev.title}</h3>
                      <p className="text-sm text-[color:var(--neon-text1)]">
                        {ev.city} · {formatDashboardEventWhen(ev.starts_at, ev.ends_at)}
                      </p>
                      <span className="inline-flex rounded-full border border-[color:var(--neon-hairline)] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-a)]">
                        {formatCategoryLabels(ev.categories)}
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              ))
            : showTrendingMocks
              ? TRENDING_MOCK.map((ev) => (
                  <GlassCard key={ev.title} className="overflow-hidden p-0" emphasis>
                    <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-[color:var(--neon-a)]/25 via-[color:var(--neon-b)]/15 to-[color:var(--neon-c)]/10">
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[color:var(--neon-bg0)]/85 via-[color:var(--neon-bg0)]/30 to-transparent"
                        aria-hidden
                      />
                      <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-4 md:hidden">
                        <h3 className="text-lg font-bold text-[color:var(--neon-text0)]">{ev.title}</h3>
                        <p className="text-sm text-[color:var(--neon-text1)]">
                          {ev.location} · {ev.dates}
                        </p>
                        <span className="inline-flex rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-a)] backdrop-blur">
                          {ev.tag}
                        </span>
                      </div>
                    </div>
                    <div className="hidden space-y-2 p-4 md:block md:p-5">
                      <h3 className="text-lg font-bold text-[color:var(--neon-text0)]">{ev.title}</h3>
                      <p className="text-sm text-[color:var(--neon-text1)]">
                        {ev.location} · {ev.dates}
                      </p>
                      <span className="inline-flex rounded-full border border-[color:var(--neon-hairline)] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-a)]">
                        {ev.tag}
                      </span>
                    </div>
                  </GlassCard>
                ))
              : (
                  <EmptyStateCard
                    kicker="Nothing scheduled"
                    title="Check the events feed"
                    description="Published events you can attend will show up here first. Explore everything on the timeline."
                  >
                    <NeonLink href="/events" fullWidth className="sm:w-auto" shape="xl">
                      Browse events
                    </NeonLink>
                  </EmptyStateCard>
                )}
        </div>
      </section>

      <section aria-labelledby="culture-heading">
        <h2
          id="culture-heading"
          className="mb-4 font-serif text-xl font-bold text-[color:var(--neon-text0)] md:text-2xl"
        >
          Culture picks
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CULTURE_PICKS.map(({ label, category, icon: Icon }) => (
            <Link
              key={label}
              href={`/events?category=${category}`}
              className="group block transition-[transform] active:scale-[0.99]"
            >
              <GlassCard
                className={
                  "relative flex h-full items-center gap-3 overflow-hidden p-4 " +
                  // subtle neon edge + depth (closer to mock pill cards)
                  "shadow-[0_0_0_1px_color-mix(in_srgb,var(--neon-a)_18%,transparent),0_0_22px_rgb(0_209_255/0.12)] " +
                  "transition-[box-shadow,transform] group-hover:shadow-[var(--vibe-neon-glow-subtle)]"
                }
              >
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/35 backdrop-blur-md"
                  aria-hidden
                >
                  <Icon className="h-5 w-5 text-[color:var(--neon-a)]" aria-hidden />
                </span>

                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-[color:var(--neon-text0)]">
                    {label}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                    Tap to browse
                  </span>
                </div>

                <span
                  className="ml-auto font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-text2)] transition-colors group-hover:text-[color:var(--neon-a)]"
                  aria-hidden
                >
                  →
                </span>

                <span
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[color:var(--neon-b)]/35 to-transparent"
                  aria-hidden
                />
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>

      <MemberHomeTicketsSection
        loadError={rsvp.loadError}
        upcomingPreviews={rsvp.upcomingPreviews}
        upcomingCount={rsvp.upcomingCount}
      />
    </div>
  )
}
