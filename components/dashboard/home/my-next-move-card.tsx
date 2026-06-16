import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { DashboardNextMove } from "@/lib/dashboard/dashboard-home-types"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"

export function MyNextMoveCard({ nextMove }: { nextMove: DashboardNextMove }) {
  const isExternalAction = nextMove.href.startsWith("mailto:")

  return (
    <GlassCard
      className="rounded-none border-l-4 border-l-[color:var(--neon-a)] border-[color:var(--neon-a)]/35 bg-[color:color-mix(in_srgb,var(--neon-surface)_28%,transparent)] p-5 transition-[box-shadow] hover:shadow-[0_0_32px_rgb(0_209_255/0.12)] md:p-6"
      emphasis
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--neon-a)]">
        My next move
      </p>
      <h2 className="mt-2 font-serif text-2xl font-bold leading-tight text-[color:var(--neon-text0)] md:text-3xl">
        {nextMove.title}
      </h2>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
        {nextMove.subtitle}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {isExternalAction ? (
          <a
            href={nextMove.href}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-none border border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/12 px-6 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] transition-[box-shadow,transform] hover:bg-[color:var(--neon-a)]/22 hover:shadow-[var(--vibe-neon-glow-subtle)] active:scale-[0.99] sm:w-auto"
          >
            {nextMove.ctaLabel}
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </a>
        ) : (
          <NeonLink href={nextMove.href} shape="xl" className="w-full sm:w-auto">
            {nextMove.ctaLabel}
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </NeonLink>
        )}
        {nextMove.secondaryHref && nextMove.secondaryCtaLabel ? (
          nextMove.secondaryHref.startsWith("mailto:") ? (
            <a
              href={nextMove.secondaryHref}
              className="text-center font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] underline-offset-4 hover:text-[color:var(--neon-a)] hover:underline sm:text-left"
            >
              {nextMove.secondaryCtaLabel}
            </a>
          ) : (
            <Link
              href={nextMove.secondaryHref}
              className="text-center font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] underline-offset-4 hover:text-[color:var(--neon-a)] hover:underline sm:text-left"
            >
              {nextMove.secondaryCtaLabel}
            </Link>
          )
        ) : (
          <Link
            href="/events"
            className="text-center font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] underline-offset-4 hover:text-[color:var(--neon-a)] hover:underline sm:text-left"
          >
            Explore all events
          </Link>
        )}
      </div>
    </GlassCard>
  )
}
