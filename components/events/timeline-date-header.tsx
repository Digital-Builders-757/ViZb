interface TimelineDateHeaderProps {
  date: Date
  isFirst?: boolean
  chapterLabel?: string | null
}

export function TimelineDateHeader({ date, isFirst = false, chapterLabel = null }: TimelineDateHeaderProps) {
  // All display in America/New_York for Virginia audience
  const tz = "America/New_York"
  const dayOfWeek = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(date)
  const month = new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "long" }).format(date)
  const day = new Intl.DateTimeFormat("en-US", { timeZone: tz, day: "numeric" }).format(date)
  const year = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric" }).format(date)

  // Check if it's today or tomorrow (in ET)
  const now = new Date()
  const todayET = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now)
  const eventET = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date)

  const todayDate = new Date(todayET + "T12:00:00")
  const eventDate = new Date(eventET + "T12:00:00")
  const diffDays = Math.round((eventDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))

  let relativeLabel: string | null = null
  if (diffDays === 0) relativeLabel = "Today"
  else if (diffDays === 1) relativeLabel = "Tomorrow"
  else if (diffDays < 7 && diffDays > 0) relativeLabel = "This week"

  const signalLabel = chapterLabel ?? (isFirst ? "Next up" : null)

  return (
    <div
      className={`events-timeline-date-header sticky top-[4.75rem] z-20 -mx-1 rounded-2xl border border-transparent bg-[color:var(--neon-bg0)]/72 px-1 py-3 backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none ${
        isFirst ? "" : "mt-16 md:mt-24"
      }`}
    >
      <div className="relative flex items-center gap-4 md:gap-6">
        {/* Timeline node — desktop rail */}
        <div className="hidden md:flex flex-col items-center self-stretch">
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span
              className="events-timeline-pulse-ring absolute inset-0 rounded-full bg-[color:var(--neon-a)]/25"
              aria-hidden
            />
            <div className="relative h-3 w-3 rounded-full bg-[color:var(--neon-a)] shadow-[0_0_14px_rgb(0_209_255/0.45)]" />
          </div>
          {!isFirst ? (
            <div
              className="events-timeline-node-line mt-2 w-px flex-1 min-h-[3rem] bg-gradient-to-b from-[color:var(--neon-a)]/35 to-transparent"
              aria-hidden
            />
          ) : null}
        </div>

        {/* Mobile pulse marker */}
        <div className="flex md:hidden flex-col items-center">
          <div className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span
              className="events-timeline-pulse-ring absolute inset-0 rounded-full bg-[color:var(--neon-a)]/25"
              aria-hidden
            />
            <div className="relative h-2.5 w-2.5 rounded-full bg-[color:var(--neon-a)]" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {signalLabel ? (
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--neon-a)]">
              {signalLabel}
            </p>
          ) : null}
          <div className="flex items-baseline gap-3 md:gap-4 flex-wrap">
            <span className="text-4xl sm:text-5xl md:text-7xl font-bold text-[color:var(--neon-text0)] font-mono leading-none">
              {day}
            </span>
            <div>
              <p className="text-sm md:text-base font-serif text-[color:var(--neon-text0)]">
                {month} {year}
              </p>
              <p className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
                {dayOfWeek}
              </p>
            </div>
            {relativeLabel ? (
              <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-a)] backdrop-blur">
                {relativeLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="events-timeline-chapter-rule mt-4 h-px w-full bg-gradient-to-r from-[color:var(--neon-a)]/45 via-[color:var(--neon-hairline)]/70 to-transparent md:ml-10"
        aria-hidden
      />
    </div>
  )
}
