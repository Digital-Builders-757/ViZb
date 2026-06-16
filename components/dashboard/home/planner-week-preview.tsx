import type { MyVibesEventRow } from "@/lib/events/my-vibes-queries"
import type { MemberHomeTicketPreview } from "@/lib/dashboard/member-home-data"
import { groupMyVibesByEasternDay } from "@/lib/events/my-vibes-queries"
import { formatEasternCivilDayHeading } from "@/lib/events/eastern-civil-date-label"

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

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2">
        {dayKeys.map((dateKey) => {
          const count = grouped[dateKey].length
          const label = formatEasternCivilDayHeading(dateKey)
          return (
            <div
              key={dateKey}
              className="min-w-[7.5rem] rounded-none border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-3 py-3 backdrop-blur"
            >
              <p className="font-mono text-[9px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                {label.split("·")[0]?.trim() ?? label}
              </p>
              <p className="mt-1 font-serif text-sm font-bold text-[color:var(--neon-text0)]">
                {count} {count === 1 ? "move" : "moves"}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
