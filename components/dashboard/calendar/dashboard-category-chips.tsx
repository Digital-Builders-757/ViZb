"use client"

import {
  formatCategoryLabel,
  sliceCategoriesForDisplay,
} from "@/lib/events/event-display-format"

/** Agenda / day-panel rows: max 2 chips + optional +N more; omits row when no categories. */
export function DashboardCategoryChips({
  eventId,
  categories,
}: {
  eventId: string
  categories: string[] | null | undefined
}) {
  const { visible, extraCount } = sliceCategoriesForDisplay(categories, 2)
  if (visible.length === 0) return null

  return (
    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
      {visible.map((c, i) => (
        <span
          key={`${eventId}-${c}-${i}`}
          className="inline-flex rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-2.5 py-0.5 font-mono text-[10px] font-medium text-[color:var(--neon-text1)] shadow-[0_0_12px_rgba(0,209,255,0.06)]"
        >
          {formatCategoryLabel(c)}
        </span>
      ))}
      {extraCount > 0 ? (
        <span
          className="font-mono text-[10px] text-[color:var(--neon-text2)]"
          aria-label={`${extraCount} more categories`}
        >
          +{extraCount} more
        </span>
      ) : null}
    </div>
  )
}
