import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { GlassCard } from "@/components/ui/glass-card"
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

  return (
    <main className="min-h-screen bg-[color:var(--neon-bg0)]">
      <Navbar />

      <section className="pt-24 sm:pt-28 pb-16 md:pb-24 px-4 sm:px-8">
        <div className="max-w-[720px] mx-auto">
          <Link
            href={`/events/${rawEvent.slug}`}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Event details
          </Link>

          <div className="mt-6 flex items-start gap-3">
            <div className="mt-1 rounded-full border border-[color:var(--neon-hairline)] p-2 bg-[color:var(--neon-surface)]/40">
              <Mic2 className="w-5 h-5 text-[color:var(--neon-a)]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
                Open mic · Live lineup
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[color:var(--neon-text0)] mt-2 text-balance leading-tight">
                {rawEvent.title}
              </h1>
              <Link
                href={`/events?org=${org.slug}`}
                className="mt-2 inline-block text-xs font-mono uppercase tracking-widest text-[color:var(--neon-a)] hover:underline"
              >
                {org.name}
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <GlassCard className="flex items-start gap-3 p-4">
              <Calendar className="w-5 h-5 text-[color:var(--neon-a)] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">When</p>
                <p className="mt-1 text-base text-[color:var(--neon-text0)]">{dateStr}</p>
                <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
                  {timeStr}
                  {endTimeStr ? ` – ${endTimeStr}` : ""}
                </p>
              </div>
            </GlassCard>
            <GlassCard className="flex items-start gap-3 p-4">
              <MapPin className="w-5 h-5 text-[color:var(--neon-a)] shrink-0" />
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
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text0)]"
                >
                  {formatCategoryLabel(c)}
                </span>
              ))}
            </div>
          ) : null}

          <GlassCard className="mt-8 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-4 h-4 text-[color:var(--neon-a)]" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-[color:var(--neon-text0)]">
                Performer order
              </h2>
            </div>

            {entries.length === 0 ? (
              <p className="text-sm text-[color:var(--neon-text1)] leading-relaxed">
                The public lineup isn’t available yet. Check back after the host publishes confirmed performers,
                or open the full event page for details.
              </p>
            ) : (
              <ol className="space-y-0 divide-y divide-[color:var(--neon-hairline)]/60">
                {entries.map((row, i) => (
                  <li
                    key={row.id}
                    className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-4 first:pt-0"
                  >
                    <span className="font-mono text-lg text-[color:var(--neon-a)] w-8 shrink-0">{i + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-medium text-[color:var(--neon-text0)]">{row.performer_name}</p>
                      {row.stage_name ? (
                        <p className="text-sm text-[color:var(--neon-text1)] mt-0.5">{row.stage_name}</p>
                      ) : null}
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)] shrink-0 sm:text-right">
                      {formatLineupStatusLabel(row.status)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </GlassCard>
        </div>
      </section>

      <Footer />
    </main>
  )
}
