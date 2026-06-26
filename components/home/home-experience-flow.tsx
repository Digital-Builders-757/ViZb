import Link from "next/link"
import { ArrowRight, CalendarDays, Handshake, Newspaper, Sparkles, TicketCheck, Users } from "lucide-react"

import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { SectionTitle } from "@/components/ui/section-title"

const proofPoints = [
  { value: "127+", label: "members" },
  { value: "757", label: "home base" },
  { value: "DMV", label: "in range" },
  { value: "VA", label: "on the map" },
]

const pathways = [
  {
    title: "Find the night",
    description: "Scan parties, music, workshops, pop-ups, and community moments worth pulling up to.",
    href: "/events",
    label: "Open events",
    icon: CalendarDays,
  },
  {
    title: "Save your vibe",
    description: "Keep the maybes, tickets, reminders, and must-go nights close in My Vibes.",
    href: "/signup",
    label: "Join VIZB",
    icon: TicketCheck,
  },
  {
    title: "Host the room",
    description: "Give your flyer a sharp page with RSVPs, tickets, and tools that keep the door organized.",
    href: "/host/apply",
    label: "Host with VIZB",
    icon: Users,
  },
  {
    title: "Move the culture",
    description: "Put your campaign near people already choosing where to go next.",
    href: "/advertise",
    label: "Partner with us",
    icon: Handshake,
  },
]

export function HomeExperienceFlow() {
  return (
    <section className="home-flow-section relative overflow-hidden px-5 py-14 sm:px-8 md:py-24">
      <div className="relative z-10 mx-auto max-w-[1200px]">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <SectionTitle kicker="Why it works" title="From first look to pull-up." gradient />
            <p className="mt-5 max-w-prose text-pretty text-base leading-relaxed text-[color:var(--neon-text1)] sm:text-lg">
              The vibe moves fast. VIZB keeps the signal clean, what is happening, where it is,
              who is hosting, and how to get in.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {proofPoints.map((point) => (
              <GlassCard key={point.label} className="home-proof-tile p-4">
                <p className="font-mono text-2xl font-black text-[color:var(--neon-a)] sm:text-3xl">
                  {point.value}
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text2)]">
                  {point.label}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pathways.map((path) => {
            const Icon = path.icon

            return (
              <Link key={path.href} href={path.href} className="group block h-full">
                <GlassCard className="home-path-card flex h-full flex-col p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 text-[color:var(--neon-a)]">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <ArrowRight className="h-4 w-4 text-[color:var(--neon-text2)] transition-transform group-hover:translate-x-1 group-hover:text-[color:var(--neon-a)]" />
                  </div>
                  <h3 className="mt-5 text-balance font-serif text-xl font-bold text-[color:var(--neon-text0)]">
                    {path.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[color:var(--neon-text1)]">
                    {path.description}
                  </p>
                  <p className="mt-5 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-a)]">
                    {path.label}
                  </p>
                </GlassCard>
              </Link>
            )
          })}
        </div>

        <GlassCard className="home-editorial-bridge mt-10 overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
            <div className="p-6 sm:p-8 md:p-10">
              <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-a)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Virginia after dark
              </p>
              <h2 className="mt-4 max-w-2xl text-balance font-serif text-2xl font-bold leading-tight text-[color:var(--neon-text0)] sm:text-3xl md:text-4xl">
                City light moves through tidewater. VIZB keeps you in the current.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[color:var(--neon-text1)] sm:text-base">
                Real flyers stay up front. Decisions stay quick. Your dashboard keeps tickets,
                saves, and recommendations within reach.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <NeonLink href="/events" shape="pill" className="sm:w-auto">
                  Explore the timeline
                </NeonLink>
                <NeonLink href="/p" variant="secondary" shape="pill" className="sm:w-auto">
                  <Newspaper className="h-4 w-4" aria-hidden />
                  Read the feed
                </NeonLink>
              </div>
            </div>

            <div className="home-editorial-bridge__panel min-h-[260px] p-6 sm:p-8">
              <div className="grid h-full gap-3">
                {[
                  ["Discover", "Find the right night by city, category, and vibe."],
                  ["Commit", "RSVP, buy, save, or share while the energy is fresh."],
                  ["Return", "Come back to your tickets, saves, and next best recommendations."],
                ].map(([title, copy]) => (
                  <div
                    key={title}
                    className="rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)]/35 p-4"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-a)]">
                      {title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[color:var(--neon-text1)]">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  )
}
