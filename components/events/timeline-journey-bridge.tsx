type TimelineJourneyBridgeProps = {
  showDiscoveryRails: boolean
  upcomingCount: number
}

export function TimelineJourneyBridge({ showDiscoveryRails, upcomingCount }: TimelineJourneyBridgeProps) {
  if (!showDiscoveryRails && upcomingCount === 0) return null

  return (
    <div className="relative mx-auto max-w-[1200px] px-4 sm:px-8">
      <div className="events-timeline-journey-bridge relative overflow-hidden rounded-2xl border border-[color:var(--neon-hairline)]/50 bg-[color:var(--neon-surface)]/12 px-5 py-4 backdrop-blur md:px-8 md:py-5">
        <div className="events-journey-bridge-glow pointer-events-none absolute inset-0 opacity-80" aria-hidden />
        <div className="relative z-[1] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--neon-a)]">
              {showDiscoveryRails ? "Now loading the city" : "Event radar"}
            </p>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-[color:var(--neon-text1)]">
              {showDiscoveryRails
                ? "You’ve seen what’s starting soon and what we’re hyped on. Drop into the full pulse below, every date is a chapter."
                : "Scroll the living map of what’s happening across Virginia."}
            </p>
          </div>
          {upcomingCount > 0 ? (
            <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
              {upcomingCount} upcoming {upcomingCount === 1 ? "moment" : "moments"} in view
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
