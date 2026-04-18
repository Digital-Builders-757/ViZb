import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { OceanDivider } from "@/components/ui/ocean-divider"
import { WaterFrame } from "@/components/ui/water-frame"
import { ThreeBackgroundWrapper } from "@/components/three-background-wrapper"
import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { Calendar, Clock, MapPin, ArrowLeft, Mic2 } from "lucide-react"
import { normalizeCategories } from "@/lib/events/categories"
import { formatCategoryLabel } from "@/lib/events/event-display-format"
import {
  formatLineupStatusLabel,
  PUBLIC_LINEUP_STATUSES,
} from "@/lib/lineup/lineup-entry-status"

/** Fresh enough for live tweaks without requiring realtime. */
export const revalidate = 30

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventSlug: string }>
}): Promise<Metadata> {
  const { eventSlug } = await params
  if (!isServerSupabaseConfigured()) {
    return { title: "Lineup | VIZB" }
  }
  const supabase = await createClient()
  const { data: event } = await supabase
    .from("events")
    .select("title, venue_name, city")
    .eq("slug", eventSlug)
    .eq("status", "published")
    .contains("categories", ["open_mic"])
    .maybeSingle()

  if (!event) return { title: "Lineup | VIZB" }
  return {
    title: `Lineup — ${event.title} | VIZB`,
    description: `Open mic order for ${event.title} at ${event.venue_name}, ${event.city}.`,
  }
}

export default async function PublicLineupPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>
}) {
  const { eventSlug } = await params

  if (!isServerSupabaseConfigured()) {
    notFound()
  }

  const supabase = await createClient()

  const { data: rawEvent } = await supabase
    .from("events")
    .select(
      "id, title, slug, starts_at, ends_at, venue_name, address, city, categories, organizations!inner ( name, slug )",
    )
    .eq("slug", eventSlug)
    .eq("status", "published")
    .contains("categories", ["open_mic"])
    .maybeSingle()

  if (!rawEvent) {
    notFound()
  }

  const categories = normalizeCategories(
    (rawEvent as { categories?: unknown }).categories,
  )
  if (!categories.some((c) => c.toLowerCase() === "open_mic")) {
    notFound()
  }

  const org = rawEvent.organizations as unknown as { name: string; slug: string }

  // Explicit filters: logged-in organizers still use the same client; RLS would allow
  // broader reads for org members, so we must never omit these predicates on this route.
  const { data: rawEntries } = await supabase
    .from("event_lineup_entries")
    .select("id, performer_name, stage_name, slot_order, status")
    .eq("event_id", rawEvent.id)
    .eq("is_public", true)
    .in("status", [...PUBLIC_LINEUP_STATUSES])
    .order("slot_order", { ascending: true })
    .order("id", { ascending: true })

  const entries = rawEntries ?? []

  const startsAt = new Date(rawEvent.starts_at)
  const endsAt = rawEvent.ends_at ? new Date(rawEvent.ends_at) : null

  const dateStr = startsAt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const timeStr = startsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  const endTimeStr = endsAt
    ? endsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null

  const eventDetailHref = `/events/${rawEvent.slug}`

  const rowPanelClass =
    "flex flex-col gap-3 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-4 py-4 backdrop-blur-sm transition-all sm:flex-row sm:items-center sm:gap-4 " +
    "hover:border-[color:var(--neon-a)]/40 hover:shadow-[0_0_18px_rgba(0,209,255,0.10)]"

  return (
    <main className="relative min-h-screen bg-[color:var(--neon-bg0)] overflow-hidden">
      <div className="fixed inset-0 z-0">
        <ThreeBackgroundWrapper />
      </div>

      <div className="fixed inset-0 bg-[color:var(--neon-bg0)]/55 z-[1]" aria-hidden />

      <div
        className="fixed top-20 right-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl animate-pulse z-[1]"
        aria-hidden
      />
      <div
        className="fixed bottom-32 left-10 w-32 h-32 bg-[#00BDFF]/15 rounded-full blur-3xl animate-pulse z-[1]"
        style={{ animationDelay: "1s" }}
        aria-hidden
      />
      <div
        className="fixed top-1/2 right-1/4 w-24 h-24 bg-[#0C74E8]/10 rounded-full blur-3xl animate-pulse z-[1]"
        style={{ animationDelay: "2s" }}
        aria-hidden
      />

      <div className="relative z-10 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
        <Navbar />

        <section className="pt-24 sm:pt-28 md:pt-32 pb-10 md:pb-12 px-4 sm:px-8">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <Link
                href={eventDetailHref}
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-a)] transition-colors vibe-focus-ring rounded-sm"
              >
                <ArrowLeft className="w-3 h-3 shrink-0" />
                Event details
              </Link>
              <NeonLink href={eventDetailHref} variant="primary" size="sm" shape="pill" className="w-full sm:w-auto">
                <Mic2 className="size-4" aria-hidden />
                Full event page
              </NeonLink>
            </div>

            <span className="mt-8 text-xs uppercase tracking-widest text-[color:var(--neon-a)] font-mono inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-[color:var(--neon-a)] rounded-full animate-pulse shadow-[0_0_12px_rgba(0,209,255,0.45)]" />
              Open mic · Live lineup
            </span>

            <h1 className="mt-4 md:mt-6">
              <span className="block headline-xl text-[color:var(--neon-text0)] uppercase">Live</span>
              <span className="block headline-xl uppercase neon-gradient-text">Lineup</span>
            </h1>

            <p className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[color:var(--neon-text0)] mt-4 text-balance leading-tight">
              {rawEvent.title}
            </p>

            <p className="text-base sm:text-lg text-[color:var(--neon-text1)] mt-4 max-w-2xl leading-relaxed">
              The shareable running order for this show — tap through for RSVP, venue, and full details.
            </p>

            <Link
              href={`/events?org=${org.slug}`}
              className="mt-3 inline-block text-xs font-mono uppercase tracking-widest text-[color:var(--neon-a)] hover:underline vibe-focus-ring rounded-sm"
            >
              {org.name}
            </Link>
          </div>
        </section>

        <OceanDivider variant="soft" density="sparse" />

        <section className="px-4 sm:px-8 py-10 md:py-12">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
              <GlassCard emphasis className="flex items-start gap-3 p-4 sm:p-5">
                <Calendar className="w-5 h-5 text-[color:var(--neon-a)] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">When</p>
                  <p className="mt-1 text-base text-[color:var(--neon-text0)]">{dateStr}</p>
                  <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
                    {timeStr}
                    {endTimeStr ? ` – ${endTimeStr}` : ""}
                  </p>
                </div>
              </GlassCard>
              <GlassCard emphasis className="flex items-start gap-3 p-4 sm:p-5">
                <MapPin className="w-5 h-5 text-[color:var(--neon-a)] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">Where</p>
                  <p className="mt-1 text-base text-[color:var(--neon-text0)]">{rawEvent.venue_name}</p>
                  <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
                    {(rawEvent as { address?: string | null }).address
                      ? `${(rawEvent as { address: string }).address}, `
                      : ""}
                    {rawEvent.city}
                  </p>
                </div>
              </GlassCard>
            </div>

            {categories.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur"
                  >
                    {formatCategoryLabel(c)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <OceanDivider variant="default" density="sparse" />

        <section className="px-4 sm:px-8 pb-16 md:pb-24">
          <div className="max-w-[1200px] mx-auto">
            <WaterFrame className="rounded-xl">
              <div className="rounded-[inherit] bg-[color:var(--neon-surface)]/25 p-5 sm:p-6 md:p-8 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                  <div className="rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/50 p-2">
                    <Clock className="w-5 h-5 text-[color:var(--neon-a)]" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-sm font-mono uppercase tracking-widest text-[color:var(--neon-text0)]">
                      Performer order
                    </h2>
                    <p className="text-xs text-[color:var(--neon-text2)] mt-1 font-mono uppercase tracking-wider">
                      Confirmed slots · public list
                    </p>
                  </div>
                </div>

                {entries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/20 px-5 py-8 text-center">
                    <p className="text-sm text-[color:var(--neon-text1)] leading-relaxed max-w-md mx-auto">
                      The public lineup isn&apos;t available yet. Check back after the host publishes confirmed
                      performers, or open the full event page for details.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <NeonLink href={eventDetailHref} variant="secondary" size="sm" shape="pill">
                        View event
                      </NeonLink>
                    </div>
                  </div>
                ) : (
                  <ol className="space-y-3 list-none p-0 m-0">
                    {entries.map((row, i) => (
                      <li key={row.id} className={rowPanelClass}>
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--neon-a)]/35 bg-[color:var(--neon-a)]/10 font-mono text-sm font-semibold text-[color:var(--neon-a)] tabular-nums"
                          aria-hidden
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-medium text-[color:var(--neon-text0)]">{row.performer_name}</p>
                          {row.stage_name ? (
                            <p className="text-sm text-[color:var(--neon-text1)] mt-0.5">{row.stage_name}</p>
                          ) : null}
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)] shrink-0 sm:text-right sm:min-w-[5.5rem]">
                          {formatLineupStatusLabel(row.status)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </WaterFrame>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  )
}
