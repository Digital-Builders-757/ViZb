import Image from "next/image"
import Link from "next/link"
import { ThreeBackgroundWrapper } from "./three-background-wrapper"

export function HeroSection() {
  return (
    <section className="relative min-h-screen pt-20 overflow-hidden">
      {/* Three.js Background */}
      <ThreeBackgroundWrapper />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-background/60 z-[1]" />

      {/* Content */}
      <div className="relative z-10 max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-16 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh]">
          {/* Text content */}
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-mono inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              The Movement
            </span>

            {/* Main headline with neon gradient */}
            <h1 className="mt-6">
              <span className="block headline-xl text-foreground uppercase">Virginia</span>
              <span className="block headline-xl uppercase neon-gradient-text">Isn't</span>
              <span className="block headline-xl text-foreground uppercase">Boring.</span>
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
              <Link
                href="/events"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[color:var(--neon-a)] px-7 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-bg0)] shadow-[0_0_28px_rgba(0,209,255,0.25)] transition hover:brightness-110"
              >
                Explore events
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/20 px-7 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur transition hover:border-[color:var(--neon-a)]/40 hover:text-[color:var(--neon-a)]"
              >
                Join the community
              </Link>
              <Link
                href="/host/apply"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[color:var(--neon-hairline)] px-7 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)] transition hover:border-[color:var(--neon-a)]/35 hover:text-[color:var(--neon-text0)]"
              >
                Host with VIZB
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative aspect-[3/4] overflow-hidden group">
                  <Image
                    src="/vibe-event-dj.jpg"
                    alt="DJ performing at VIZB event"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    priority
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Blue brand overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0D40FF]/40 via-[#0C74E8]/30 to-transparent mix-blend-multiply" />
                  {/* Neon border glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border-2 border-primary shadow-[inset_0_0_20px_rgba(13,64,255,0.3)]" />
                </div>
                <div className="bg-primary p-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0D40FF] to-[#00BDFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="relative text-xs uppercase tracking-widest text-background font-mono">Hampton Roads</p>
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="bg-secondary p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary to-muted opacity-50" />
                  <p className="relative text-xs uppercase tracking-widest text-foreground font-mono">DMV</p>
                </div>
                <div className="relative aspect-[3/4] overflow-hidden group">
                  <Image
                    src="/vibe-event-party.jpg"
                    alt="VIZB community members at party"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Blue brand overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tl from-[#00BDFF]/40 via-[#0C74E8]/30 to-transparent mix-blend-multiply" />
                  {/* Neon border glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border-2 border-[#00BDFF] shadow-[inset_0_0_20px_rgba(0,189,255,0.3)]" />
                </div>
              </div>
            </div>

            {/* Floating neon accent */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#00BDFF]/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[2]" />
    </section>
  )
}
