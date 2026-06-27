import { CalendarDays } from "lucide-react"
import type { MyVibesEventRow } from "@/lib/events/my-vibes-queries"
import type { MemberHomeTicketPreview } from "@/lib/dashboard/member-home-data"
import { groupMyVibesByEasternDay } from "@/lib/events/my-vibes-queries"

function todayEasternKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function dayLabel(dateKey: string): { eyebrow: string; title: string } {
  const [year, month, day] = dateKey.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  const eyebrow = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date)
  const title = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date)
  return { eyebrow, title }
}

export function PlannerWeekPreview({
  upcomingPlans,
  savedUpcoming,
}: {
  upcomingPlans: MemberHomeTicketPreview[]
  savedUpcoming: MyVibesEventRow[]
}) {
  const merged: MyVibesEventRow[] = [
    ...upcomingPlans.map((p) => ({
      id: p.eventId,
      title: p.title,
      slug: p.slug,
      description: null,
      starts_at: p.startsAt,
      ends_at: p.endsAt,
      venue_name: p.venueName,
      city: p.city,
      categories: [],
      flyer_url: p.flyerUrl,
    })),
    ...savedUpcoming,
  ]

  const uniqueById = new Map<string, MyVibesEventRow>()
  for (const e of merged) {
    if (!uniqueById.has(e.id)) uniqueById.set(e.id, e)
  }

  const grouped = groupMyVibesByEasternDay([...uniqueById.values()])
  const dayKeys = Object.keys(grouped).sort().slice(0, 7)

  if (dayKeys.length === 0) return null

  const todayKey = todayEasternKey()

  return (
    <div className="planner-scroll-rail -mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-max gap-3">
        {dayKeys.map((dateKey) => {
          const events = grouped[dateKey]
          const count = events.length
          const { eyebrow, title } = dayLabel(dateKey)
          const isToday = dateKey === todayKey
          const first = events[0]

          return (
            <div
              key={dateKey}
              className="planner-tide-row min-w-[9.5rem] overflow-hidden rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/28 px-3 py-3 backdrop-blur"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text2)]">
                    {isToday ? "Today" : eyebrow}
                  </p>
                  <p className="mt-0.5 font-serif text-base font-bold leading-tight text-[color:var(--neon-text0)]">
                    {title}
                  </p>
                </div>
                <span className="inline-flex min-h-7 min-w-7 items-center justify-center rounded-full border border-[color:var(--neon-a)]/35 bg-[color:var(--neon-a)]/12 font-mono text-xs font-bold text-[color:var(--neon-a)]">
                  {count}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-snug text-[color:var(--neon-text1)]">
                {first?.title ?? "On your radar"}
              </p>
              {count > 1 ? (
                <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-b)]">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  +{count - 1} more
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
