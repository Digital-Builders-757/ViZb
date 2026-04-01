interface TimelineDateHeaderProps {
  date: Date
  isFirst?: boolean
}

export function TimelineDateHeader({ date, isFirst = false }: TimelineDateHeaderProps) {
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
  else if (diffDays < 7 && diffDays > 0) relativeLabel = "This Week"

  return (
    <div className={`relative flex items-center gap-4 md:gap-6 ${isFirst ? "" : "mt-16 md:mt-24"}`}>
      {/* Timeline dot */}
      <div className="hidden md:flex flex-col items-center">
        <div className="h-3 w-3 rounded-full bg-[color:var(--neon-a)] shadow-[0_0_14px_rgb(0_209_255/0.45)]" />
      </div>

      {/* Date content */}
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
        {relativeLabel && (
          <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-a)] backdrop-blur">
            {relativeLabel}
          </span>
        )}
      </div>
    </div>
  )
}
