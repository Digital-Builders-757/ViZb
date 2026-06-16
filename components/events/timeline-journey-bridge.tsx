type TimelineJourneyBridgeProps = {
  showStaffPicksFeatured: boolean
  upcomingCount: number
}

export function TimelineJourneyBridge({
  showStaffPicksFeatured,
  upcomingCount,
}: TimelineJourneyBridgeProps) {
  if (!showStaffPicksFeatured && upcomingCount === 0) return null

  return (
    <div className="relative mx-auto max-w-[1200px] px-4 sm:px-8">
      <div className="events-timeline-journey-bridge events-card-surface relative overflow-hidden rounded-2xl border border-[color:var(--neon-hairline)]/50 px-5 py-4 md:px-8 md:py-5">
        <div className="events-journey-bridge-glow pointer-events-none absolute inset-0 opacity-80" aria-hidden />
        <div className="relative z-[1] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--neon-a)]">
              {showStaffPicksFeatured ? "Now loading the city" : "Event radar"}
            </p>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-[color:var(--neon-text1)]">
              {showStaffPicksFeatured
                ? "You’ve seen what we’re hyped on. Drop into the full pulse below, every date is a chapter."
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
