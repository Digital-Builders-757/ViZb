type TimelineSectionIntroProps = {
  activeDiscoveryLabel: string | null
  searchQ: string
  sortMode: "soonest" | "city"
  showFilters: boolean
}

export function TimelineSectionIntro({
  activeDiscoveryLabel,
  searchQ,
  sortMode,
  showFilters,
}: TimelineSectionIntroProps) {
  if (!showFilters) return null

  return (
    <header className="events-timeline-intro mb-10 md:mb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--neon-a)]">
            <span className="events-timeline-pulse-dot h-2 w-2 rounded-full bg-[color:var(--neon-a)]" aria-hidden />
            Full timeline
          </p>
          <h2 className="mt-3 font-serif text-2xl font-bold leading-tight text-[color:var(--neon-text0)] md:text-3xl">
            The living map of everything happening around you
          </h2>
          {activeDiscoveryLabel || searchQ.trim() ? (
            <p className="mt-3 text-sm text-[color:var(--neon-text1)]">
              {activeDiscoveryLabel ? <>Vibe: {activeDiscoveryLabel}</> : null}
              {activeDiscoveryLabel && searchQ.trim() ? <> · </> : null}
              {searchQ.trim() ? <>Search: “{searchQ.trim()}”</> : null}
            </p>
          ) : (
            <p className="mt-3 text-sm text-[color:var(--neon-text1)]">
              Sorted {sortMode === "city" ? "by city, then time" : "by start time"} · EST · scroll date chapters
              below
            </p>
          )}
        </div>
      </div>
    </header>
  )
}
