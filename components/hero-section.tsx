import { OceanDivider } from "@/components/ui/ocean-divider"
import { NeonLink } from "@/components/ui/neon-link"
import { ThreeBackgroundWrapper } from "./three-background-wrapper"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20">
      {/* Three.js Background */}
      <ThreeBackgroundWrapper />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-[color:var(--neon-bg0)]/60" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[1200px] px-4 py-10 sm:px-8 sm:py-12 lg:py-14">
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

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
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
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 z-[2] h-16 bg-gradient-to-t from-[color:var(--neon-bg0)] to-transparent" />

      <OceanDivider variant="hero" density="normal" withLine className="relative z-[3]" />
    </section>
  )
}
