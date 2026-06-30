import type { DashboardHomeStats, DashboardNextMove } from "@/lib/dashboard/dashboard-home-types"
import { DashboardStats } from "@/components/dashboard/home/dashboard-stats"
import { MyNextMoveCard } from "@/components/dashboard/home/my-next-move-card"

export interface DashboardCommandCenterProps {
  displayName: string
  region: string
  isFirstRun: boolean
  firstRunHint: string | null
  firstRunCtaHref?: string | null
  firstRunCtaLabel?: string | null
  stats: DashboardHomeStats
  nextMove: DashboardNextMove
}

export function DashboardCommandCenter({
  displayName,
  region,
  isFirstRun,
  firstRunHint,
  firstRunCtaHref,
  firstRunCtaLabel,
  stats,
  nextMove,
}: DashboardCommandCenterProps) {
  const subtext = firstRunHint
    ? firstRunHint
    : region !== "Virginia"
      ? `Here's what's on your radar this week in ${region}.`
      : "Here's what's on your radar this week."

  return (
    <section aria-labelledby="command-center-heading" className="space-y-6">
      <header className="vizb-control-room-header planner-tide-panel rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/22 px-4 pb-5 pt-4 backdrop-blur md:px-6 md:pb-6 md:pt-5 vizb-motion-enter">
        <span className="font-mono text-sm uppercase tracking-normal text-[color:var(--neon-text2)]">
          Command center - {region}
        </span>
        <h1
          id="command-center-heading"
          className="neon-gradient-text mt-2 max-w-full break-words font-serif text-2xl font-bold leading-tight sm:text-3xl md:text-4xl"
        >
          {isFirstRun ? "Welcome to VIZB" : "What's the move?"}
        </h1>
        {!isFirstRun && displayName !== "there" ? (
          <p className="mt-2 font-mono text-xs uppercase tracking-normal text-[color:var(--neon-a)]">
            {displayName}
          </p>
        ) : null}
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[color:var(--neon-text1)]">
          {subtext}
        </p>
        {firstRunHint && firstRunCtaHref && firstRunCtaLabel ? (
          <a
            href={firstRunCtaHref}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)] px-5 font-mono text-[10px] font-bold uppercase tracking-normal text-[color:var(--neon-bg0)] shadow-[var(--vibe-neon-glow-subtle)] transition-[transform,box-shadow] hover:shadow-[var(--vibe-neon-glow)] active:scale-[0.99]"
          >
            {firstRunCtaLabel}
          </a>
        ) : null}
      </header>

      <MyNextMoveCard nextMove={nextMove} />

      <DashboardStats stats={stats} />
    </section>
  )
}
