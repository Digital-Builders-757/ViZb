import type { ReactNode } from "react"
import { CurrentText } from "@/components/ui/current-text"
import { DepthLayer } from "@/components/ui/depth-layer"

export interface EventsDiscoveryHeroProps {
  upcomingCount: number
  children?: ReactNode
}

export function EventsDiscoveryHero({ upcomingCount, children }: EventsDiscoveryHeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-24 sm:px-8 sm:pb-12 md:pb-14 md:pt-28">
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
        <CurrentText
          variant="kicker"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--neon-a)]"
        >
          <span className="h-2 w-2 motion-safe:animate-pulse rounded-full bg-[color:var(--neon-a)]" aria-hidden />
          Ride the current
        </CurrentText>

        <div className="water-current-frame relative z-[1] mt-5 inline-block max-w-full md:mt-6">
          <h1 className="relative z-[1]">
            <CurrentText variant="primary" className="headline-xl block uppercase">
              Dive into
            </CurrentText>
            <CurrentText variant="accent" className="headline-xl mt-1 block uppercase sm:mt-2">
              What&apos;s on
            </CurrentText>
          </h1>
        </div>

        <p className="mt-6 max-w-prose text-base leading-relaxed text-[color:var(--neon-text1)] sm:text-lg">
          Underground parties, creative workshops, and nights worth pulling up to. Use quick filters below or open
          Filters for city, category, and vibe.
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-[color:var(--neon-text2)]">
          {upcomingCount > 0 ? `${upcomingCount} upcoming events` : "Timeline loading"} · Eastern time
        </p>

        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  )
}
