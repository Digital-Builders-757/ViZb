import { DepthLayer } from "@/components/ui/depth-layer"
import { NeonLink } from "@/components/ui/neon-link"

export interface EventsDiscoveryHeroProps {
  upcomingCount: number
}

export function EventsDiscoveryHero({ upcomingCount }: EventsDiscoveryHeroProps) {
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
        <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--neon-a)]">
          <span className="h-2 w-2 motion-safe:animate-pulse rounded-full bg-[color:var(--neon-a)]" />
          Ride the current
        </span>

        <h1 className="mt-5 md:mt-6">
          <span className="headline-xl block uppercase text-[color:var(--neon-text0)]">Dive into</span>
          <span className="headline-xl neon-gradient-text mt-1 block uppercase sm:mt-2">What&apos;s on</span>
        </h1>

        <p className="mt-6 max-w-prose text-base leading-relaxed text-[color:var(--neon-text1)] sm:text-lg">
          Underground parties, creative workshops, and nights worth pulling up to — use quick filters below or open
          Filters for city, category, and vibe.
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-[color:var(--neon-text2)]">
          {upcomingCount > 0 ? `${upcomingCount} upcoming events` : "Timeline loading"} · Eastern time
        </p>

        <div className="mt-8">
          <NeonLink href="#timeline" variant="primary" size="default" shape="pill">
            Jump to events
          </NeonLink>
        </div>
      </div>
    </section>
  )
}
