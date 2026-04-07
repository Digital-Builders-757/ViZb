import Image from "next/image"
import Link from "next/link"
import { OceanDivider } from "@/components/ui/ocean-divider"

import { WaterFrame } from "@/components/ui/water-frame"
import { NeonLink } from "@/components/ui/neon-link"
import { ThreeBackgroundWrapper } from "./three-background-wrapper"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { normalizeCategories } from "@/lib/events/categories"

type HeroEvent = {
  title: string
  slug: string
  starts_at: string
  city: string
  categories: string[]
  flyer_url: string | null
}

function heroEventBadge(categories: string[]) {
  const list = normalizeCategories(categories)
  return list[0] ?? "Event"
}

function heroEventWhen(startsAt: string) {
  const d = new Date(startsAt)
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d)
}

export async function HeroSection() {
  let trending: HeroEvent[] = []

  if (isServerSupabaseConfigured()) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("events")
      .select("title, slug, starts_at, city, categories, flyer_url")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(2)

    trending = (data as HeroEvent[] | null) ?? []
  } else if (process.env.NODE_ENV === "production") {
    await createClient()
  }

  return (
    <section className="relative min-h-screen overflow-hidden pt-20">
      {/* Three.js Background */}
      <ThreeBackgroundWrapper />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-[color:var(--neon-bg0)]/60" />

      {/* Content */}
      <div className="relative z-10 max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-16 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh]">
          {/* Text content */}
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--neon-a)] shadow-[0_0_12px_rgba(0,209,255,0.45)]" />
              The Movement
            </span>

            {/* Main headline with neon gradient */}
            <h1 className="mt-6">
              <span className="headline-xl block uppercase text-[color:var(--neon-text0)]">Virginia</span>
              <span className="headline-xl neon-gradient-text block uppercase">Isn&apos;t</span>
              <span className="headline-xl block uppercase text-[color:var(--neon-text0)]">Boring.</span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-relaxed text-[color:var(--neon-text1)] sm:text-lg">
              Discover what&apos;s happening across Virginia — parties, pop-ups, mixers, and culture.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[color:var(--neon-text2)] sm:text-base">
              VIZB curates the timeline so you don&apos;t have to guess. Tap into the city. Pull up with your people.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] backdrop-blur">
                Timeline-first
              </span>
              <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] backdrop-blur">
                RSVP + tickets
              </span>
              <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] backdrop-blur">
                757 & beyond
              </span>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <NeonLink href="/events" variant="primary" size="default" shape="pill">
                Explore events
              </NeonLink>
              <NeonLink href="/signup" variant="secondary" size="default" shape="pill">
                Join the community
              </NeonLink>
              <NeonLink href="/host/apply" variant="ghost" size="default" shape="pill">
                Host with VIZB
              </NeonLink>
            </div>

            {trending.length > 0 ? (
              <div className="mt-10 max-w-xl">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                    Trending this weekend
                  </p>
                  <Link
                    href="/events"
                    className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] hover:brightness-110"
                  >
                    View all →
                  </Link>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {trending.map((e) => (
                    <Link
                      key={e.slug}
                      href={`/events/${e.slug}`}
                      className="group relative overflow-hidden rounded-2xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 p-3 backdrop-blur transition hover:border-[color:var(--neon-a)]/35 hover:shadow-[0_0_24px_rgba(0,209,255,0.10)]"
                    >
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        style={{
                          background:
                            "radial-gradient(900px circle at 20% 10%, rgba(0,209,255,0.12), transparent 55%)",
                        }}
                        aria-hidden
                      />

                      <div className="relative z-[1] flex items-center gap-3">
                        <WaterFrame className="relative h-14 w-14 shrink-0 rounded-xl bg-black/30">
                          <div className="relative h-full w-full overflow-hidden rounded-[inherit]">
                            {e.flyer_url ? (
                              <Image
                                src={e.flyer_url}
                                alt={e.title}
                                fill
                                sizes="56px"
                                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                              />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                          </div>
                        </WaterFrame>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[color:var(--neon-text0)]">
                            {e.title}
                          </p>
                          <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                            {heroEventWhen(e.starts_at)} · {e.city}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-[color:var(--neon-hairline)] bg-black/25 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
                          {heroEventBadge(e.categories)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <WaterFrame className="group relative aspect-[3/4] overflow-hidden rounded-2xl">
                  <Image
                    src="/vibe-event-dj.jpg"
                    alt="DJ performing at VIZB event"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    priority
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0D40FF]/40 via-[#0C74E8]/30 to-transparent mix-blend-multiply" />
                </WaterFrame>
                <div className="group relative overflow-hidden rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/28 p-4 backdrop-blur-sm transition hover:border-[color:var(--neon-a)]/35">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-70 transition-opacity group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(120deg, rgba(0,209,255,0.12), rgba(157,77,255,0.10))",
                    }}
                    aria-hidden
                  />
                  <p className="relative font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text0)]">
                    Hampton Roads
                  </p>
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="group relative overflow-hidden rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/28 p-4 backdrop-blur-sm transition hover:border-[color:var(--neon-b)]/35">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-70 transition-opacity group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(120deg, rgba(157,77,255,0.14), rgba(0,209,255,0.08))",
                    }}
                    aria-hidden
                  />
                  <p className="relative font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text0)]">DMV</p>
                </div>
                <WaterFrame className="group relative aspect-[3/4] overflow-hidden rounded-2xl">
                  <Image
                    src="/vibe-event-party.jpg"
                    alt="VIZB community members at party"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tl from-[#00BDFF]/40 via-[#0C74E8]/30 to-transparent mix-blend-multiply" />
                </WaterFrame>
              </div>
            </div>

            {/* Floating neon accent */}
            <div className="absolute -right-8 -top-8 h-32 w-32 animate-pulse rounded-full bg-[color:var(--neon-b)]/20 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-24 w-24 animate-pulse rounded-full bg-[color:var(--neon-a)]/20 blur-3xl delay-1000" />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 z-[2] h-32 bg-gradient-to-t from-[color:var(--neon-bg0)] to-transparent" />

      <OceanDivider variant="hero" density="normal" withLine className="relative z-[3]" />
    </section>
  )
}
