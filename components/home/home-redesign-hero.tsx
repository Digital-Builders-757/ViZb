import Link from "next/link"
import { ArrowDown, ArrowRight } from "lucide-react"

export function HomeRedesignHero() {
  return (
    <section
      id="hero"
      className="relative flex w-full flex-col items-center overflow-hidden px-6 pb-12 pt-28 text-center lg:pb-16 lg:pt-36"
    >
      <div className="home-redesign-grid absolute inset-0 z-0" aria-hidden />

      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="home-redesign-glow-blob -right-[100px] -top-[200px] h-[600px] w-[600px] bg-[#9d00ff]/20" />
        <div className="home-redesign-glow-blob -left-[200px] top-[40%] h-[500px] w-[500px] bg-[#00e5ff]/15" />
        <div className="home-redesign-glow-blob -bottom-[300px] right-[10%] h-[700px] w-[700px] bg-[#ff007f]/10" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
        <div className="home-redesign-glass mb-8 inline-flex items-center gap-2 rounded-full border-[color:rgb(0_229_255_/_0.3)] px-4 py-2 text-sm font-medium text-[color:var(--neon-a)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--neon-a)]" />
          The heartbeat of Virginia
        </div>

        <h1 className="mb-8 text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl lg:text-[7rem]">
          Virginia <br className="hidden md:block" />
          <span className="home-redesign-text-gradient">Isn&apos;t Boring</span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg font-light text-[color:var(--neon-text1)] md:text-2xl">
          Discover curated events, underground parties, and local culture across the 757, RVA, DMV
          and beyond.
        </p>

        <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
          <Link
            href="#events"
            className="home-redesign-btn-primary group flex w-full items-center justify-center gap-2 rounded-full px-10 py-4 text-lg font-bold text-white sm:w-auto"
          >
            Explore Events
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/signup"
            className="home-redesign-glass w-full rounded-full border border-[color:rgb(0_229_255_/_0.5)] px-8 py-4 text-lg font-bold text-white shadow-[0_0_15px_rgb(0_229_255_/_0.1)] transition-colors hover:bg-[color:rgb(0_229_255_/_0.1)] sm:w-auto"
          >
            Join Community
          </Link>
          <Link
            href="/host/apply"
            className="home-redesign-glass w-full rounded-full border border-[color:rgb(157_0_255_/_0.5)] px-8 py-4 text-lg font-bold text-white shadow-[0_0_15px_rgb(157_0_255_/_0.1)] transition-colors hover:bg-[color:rgb(157_0_255_/_0.1)] sm:w-auto"
          >
            Create Event
          </Link>
        </div>
      </div>

      <a
        href="#events"
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 animate-bounce flex-col items-center gap-2 text-[color:var(--neon-text2)] md:flex"
        aria-label="Scroll to events"
      >
        <span className="text-xs font-bold uppercase tracking-widest">Scroll</span>
        <ArrowDown className="h-5 w-5" />
      </a>
    </section>
  )
}
