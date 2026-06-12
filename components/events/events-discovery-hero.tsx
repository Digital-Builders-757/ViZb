import { DepthLayer } from "@/components/ui/depth-layer"
import { NeonLink } from "@/components/ui/neon-link"
import Link from "next/link"

export interface EventsDiscoveryHeroProps {
  upcomingCount: number
  tonightHref: string
  weekendHref: string
  vibesHref: string
  featuredHref: string
}

export function EventsDiscoveryHero({
  upcomingCount,
  tonightHref,
  weekendHref,
  vibesHref,
  featuredHref,
}: EventsDiscoveryHeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-24 sm:px-8 sm:pb-16 md:pb-20 md:pt-32">
      <DepthLayer level="far" className="pointer-events-none absolute inset-0 -z-[1] opacity-80" />
      <div
        className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-[color:var(--neon-a)]/10 blur-3xl motion-safe:animate-pulse"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-8 h-48 w-48 rounded-full bg-[color:var(--neon-b)]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1200px]">
        <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--neon-a)]">
          <span className="h-2 w-2 motion-safe:animate-pulse rounded-full bg-[color:var(--neon-a)]" />
          Ride the current
        </span>

        <h1 className="mt-5 md:mt-6">
          <span className="headline-xl block uppercase text-[color:var(--neon-text0)]">Dive into</span>
          <span className="headline-xl neon-gradient-text mt-1 block uppercase sm:mt-2">What&apos;s on</span>
        </h1>

        <p className="mt-6 max-w-prose text-base leading-relaxed text-[color:var(--neon-text1)] sm:text-lg">
          Underground parties, creative workshops, and nights worth pulling up to — filtered by tide, city, and vibe.
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-[color:var(--neon-text2)]">
          {upcomingCount > 0 ? `${upcomingCount} upcoming events` : "Timeline loading"} · Eastern time
        </p>

        <nav
          aria-label="Quick discovery"
          className="mt-8 flex flex-wrap gap-2 sm:mt-10 sm:gap-3"
        >
          <Link
            href={tonightHref}
            className="vibe-focus-ring inline-flex min-h-11 items-center rounded-full border border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/12 px-5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] transition-[box-shadow,background-color] hover:bg-[color:var(--neon-a)]/22 hover:shadow-[0_0_24px_rgba(0,209,255,0.18)] sm:text-xs"
          >
            Tonight
          </Link>
          <Link
            href={weekendHref}
            className="vibe-focus-ring inline-flex min-h-11 items-center rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text1)] backdrop-blur transition-colors hover:border-[color:var(--neon-a)]/40 hover:text-[color:var(--neon-text0)] sm:text-xs"
          >
            This weekend
          </Link>
          <Link
            href={vibesHref}
            className="vibe-focus-ring inline-flex min-h-11 items-center rounded-full border border-[color:var(--neon-b)]/40 bg-[color:var(--neon-b)]/10 px-5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] transition-colors hover:border-[color:var(--neon-b)]/55 sm:text-xs"
          >
            My Vibes
          </Link>
          <Link
            href={featuredHref}
            className="vibe-focus-ring inline-flex min-h-11 items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-5 font-mono text-[10px] uppercase tracking-widest text-amber-100 transition-colors hover:border-amber-400/55 sm:text-xs"
          >
            Featured
          </Link>
        </nav>

        <div className="mt-8">
          <NeonLink href="#timeline" variant="primary" size="default" shape="pill">
            Explore the timeline
          </NeonLink>
        </div>
      </div>
    </section>
  )
}
