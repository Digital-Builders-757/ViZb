import Image from "next/image"
import Link from "next/link"

import { WaterFrame } from "@/components/ui/water-frame"
import { OceanDivider } from "@/components/ui/ocean-divider"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { normalizeCategories } from "@/lib/events/categories"

type LandingEvent = {
  title: string
  slug: string
  starts_at: string
  city: string
  venue_name: string
  categories: string[]
  flyer_url: string | null
}

function formatMonthDay(startsAt: string): { month: string; day: string; dow: string } {
  const d = new Date(startsAt)
  const month = d.toLocaleString("en-US", { month: "short" })
  const day = d.toLocaleString("en-US", { day: "2-digit" })
  const dow = d.toLocaleString("en-US", { weekday: "short" })
  return { month, day, dow }
}

function topCategory(categories: string[]): string {
  const list = normalizeCategories(categories)
  return list[0] ?? "Event"
}

export async function EventsSection() {
  let events: LandingEvent[] = []

  if (isServerSupabaseConfigured()) {
    const supabase = await createClient()

    const { data } = await supabase
      .from("events")
      .select("title, slug, starts_at, city, venue_name, categories, flyer_url")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(6)

    events = (data as LandingEvent[] | null) ?? []
  } else if (process.env.NODE_ENV === "production") {
    // ensure client is created so prod config errors surface clearly
    await createClient()
  }

  // fallback (local/dev without Supabase)
  if (events.length === 0) {
    events = [
      {
        title: "The Matrix Party",
        slug: "the-matrix-party",
        starts_at: "2026-04-12T01:00:00.000Z",
        city: "Norfolk",
        venue_name: "Downtown",
        categories: ["party"],
        flyer_url: "/vibe-event-party.jpg",
      },
      {
        title: "BeatNight 757",
        slug: "beatnight-757",
        starts_at: "2026-04-14T02:00:00.000Z",
        city: "Virginia Beach",
        venue_name: "Waterside",
        categories: ["concert"],
        flyer_url: "/vibe-event-dj.jpg",
      },
      {
        title: "Creators Mixer",
        slug: "creators-mixer",
        starts_at: "2026-04-17T23:00:00.000Z",
        city: "Richmond",
        venue_name: "Arts District",
        categories: ["networking"],
        flyer_url: "/vibe-creative-workshop-real.jpg",
      },
    ]
  }

  return (
    <section id="events" className="px-4 pb-20 pt-16 sm:px-8 md:pb-28 md:pt-20">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-4 border-b border-[color:var(--neon-hairline)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">
              Trending this week
            </span>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[color:var(--neon-text0)] sm:text-4xl">
              Explore events
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--neon-text1)]">
              A curated timeline of parties, pop-ups, mixers, and culture across Virginia.
            </p>
          </div>

          <Link
            href="/events"
            className="inline-flex items-center gap-2 self-start font-mono text-[11px] uppercase tracking-widest text-[color:var(--neon-text2)] transition-colors hover:text-[color:var(--neon-text0)] sm:self-auto"
          >
            View all
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
          {events.slice(0, 3).map((e) => {
            const { month, day, dow } = formatMonthDay(e.starts_at)
            const badge = topCategory(e.categories)

            return (
              <WaterFrame key={e.slug} className="rounded-2xl">
                <Link
                  href={`/events/${e.slug}`}
                  className="group relative block overflow-hidden rounded-2xl bg-[color:var(--neon-surface)]/30 backdrop-blur"
                >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ background: "radial-gradient(1200px circle at 20% 10%, rgba(0,209,255,0.12), transparent 55%)" }} />

                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={e.flyer_url || "/placeholder.svg"}
                    alt={e.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

                  <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--neon-a)] shadow-[0_0_12px_rgba(0,209,255,0.35)]" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/85">
                      {badge}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-balance font-serif text-xl font-bold text-white drop-shadow-sm">
                      {e.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80">
                      <span className="font-mono uppercase tracking-widest">
                        {dow} · {month} {day}
                      </span>
                      <span className="text-white/60">•</span>
                      <span className="truncate">{e.city}</span>
                      {e.venue_name ? (
                        <>
                          <span className="text-white/60">•</span>
                          <span className="truncate">{e.venue_name}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 px-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[color:var(--neon-text0)]">
                      Tap for details
                    </p>
                    <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                      RSVP · calendar · share
                    </p>
                  </div>

                  <div className="shrink-0 rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)]/40 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] shadow-[0_0_22px_rgba(0,209,255,0.08)]">
                    View
                  </div>
                </div>
              </Link>
              </WaterFrame>
            )
          })}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[color:var(--neon-text2)]">
            Want your event featured? Apply to host.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/events"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[color:var(--neon-a)] px-6 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-bg0)] shadow-[0_0_28px_rgba(0,209,255,0.25)] transition hover:brightness-110"
            >
              Explore events
            </Link>
            <Link
              href="/host/apply"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-6 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur transition hover:border-[color:var(--neon-a)]/40 hover:text-[color:var(--neon-a)]"
            >
              Host with VIZB
            </Link>
          </div>
        </div>

        <OceanDivider variant="soft" density="sparse" withLine={false} className="mt-10" />
      </div>
    </section>
  )
}
