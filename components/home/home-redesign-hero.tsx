import Link from "next/link"
import { ArrowDown, ArrowRight } from "lucide-react"

import { WaterHeadline } from "@/components/home/water-headline"

export function HomeRedesignHero() {
  return (
    <section
      id="hero"
      className="home-midnight-hero relative flex w-full flex-col items-center overflow-hidden px-6 pb-16 pt-28 text-center lg:pb-20 lg:pt-36"
    >
      <div className="home-redesign-grid absolute inset-0 z-0" aria-hidden />
      <div className="home-midnight-caustics absolute inset-0 z-0" aria-hidden />
      <div className="home-midnight-horizon absolute inset-x-0 bottom-0 z-0 h-48" aria-hidden />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
        <div className="home-redesign-glass mb-8 inline-flex items-center gap-2 rounded-full border-[color:rgb(0_229_255_/_0.3)] px-4 py-2 text-sm font-medium text-[color:var(--neon-a)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--neon-a)]" />
          The heartbeat of Virginia
        </div>

        <WaterHeadline eyebrow="Virginia" accent="Isn't Boring" />

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
