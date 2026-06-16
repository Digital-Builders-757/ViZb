import type { DashboardHomeStats, DashboardNextMove } from "@/lib/dashboard/dashboard-home-types"
import { DashboardStats } from "@/components/dashboard/home/dashboard-stats"
import { MyNextMoveCard } from "@/components/dashboard/home/my-next-move-card"

export interface DashboardCommandCenterProps {
  displayName: string
  region: string
  isFirstRun: boolean
  firstRunHint: string | null
  stats: DashboardHomeStats
  nextMove: DashboardNextMove
}

export function DashboardCommandCenter({
  displayName,
  region,
  isFirstRun,
  firstRunHint,
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
      <header className="vizb-control-room-header rounded-none border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/22 px-4 py-5 backdrop-blur md:px-6 vizb-motion-enter">
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
          Command center · {region}
        </span>
        <h1
          id="command-center-heading"
          className="neon-gradient-text mt-2 text-balance font-serif text-2xl font-bold md:text-3xl"
        >
          {isFirstRun ? "Welcome to ViBE" : "What's the move?"}
        </h1>
        {!isFirstRun && displayName !== "there" ? (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--neon-a)]">
            {displayName}
          </p>
        ) : null}
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          {subtext}
        </p>
      </header>

      <MyNextMoveCard nextMove={nextMove} />

      <DashboardStats stats={stats} />
    </section>
  )
}
