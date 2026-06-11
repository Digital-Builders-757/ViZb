import { DepthLayer } from "@/components/ui/depth-layer"
import { OceanDivider } from "@/components/ui/ocean-divider"
import { NeonLink } from "@/components/ui/neon-link"
import { ThreeBackgroundWrapper } from "./three-background-wrapper"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 sm:pt-28">
      <DepthLayer level="far" className="absolute inset-0 -z-[1]" />
      {/* Three.js Background */}
      <ThreeBackgroundWrapper />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-[color:var(--neon-bg0)]/70" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[1200px] px-4 py-12 sm:px-8 sm:py-14 lg:py-16">
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[color:var(--neon-a)] sm:text-xs sm:tracking-widest">
          757 &amp; DMV
        </span>

        {/* Main headline with neon gradient */}
        <h1 className="mt-5 sm:mt-6">
          <span className="headline-xl mt-0 block uppercase text-[color:var(--neon-text0)]">Virginia</span>
          <span className="headline-xl mt-1 block uppercase neon-gradient-text sm:mt-2">Isn&apos;t</span>
          <span className="headline-xl mt-1 block uppercase text-[color:var(--neon-text0)] sm:mt-2">Boring.</span>
        </h1>

        <p className="mt-6 max-w-md text-base leading-relaxed text-[color:var(--neon-text1)] sm:mt-8 sm:text-lg">
          Parties, pop-ups, workshops, and nights out across the Commonwealth.
        </p>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:var(--neon-text2)] sm:text-base">
          See what&apos;s on. Pull up with your people.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
