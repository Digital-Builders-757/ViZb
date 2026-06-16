"use client"

import { useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Copy, Loader2 } from "lucide-react"

import {
  duplicateOrganizerEventDraft,
  type OrganizerDuplicateScheduleShift,
} from "@/app/actions/event"

const SHIFT_OPTIONS: { value: OrganizerDuplicateScheduleShift; label: string }[] = [
  { value: "none", label: "Same dates (edit after)" },
  { value: "one_week", label: "+1 week" },
  { value: "two_weeks", label: "+2 weeks" },
  { value: "one_month", label: "+1 month" },
]

export function OrganizerDuplicateEventDraft({
  sourceEventId,
  orgSlug,
  disabled,
}: {
  sourceEventId: string
  orgSlug: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const selectRef = useRef<HTMLSelectElement>(null)

  function run() {
    const sel = selectRef.current
    const shift = (sel?.value ?? "one_week") as OrganizerDuplicateScheduleShift
    startTransition(async () => {
      const result = await duplicateOrganizerEventDraft({
        sourceEventId,
        orgSlug,
        scheduleShift: shift,
      })
      if ("error" in result && result.error) {
        toast.error(result.error)
        return
      }
      if ("success" in result && result.success && result.slug) {
        toast.success("Draft created, upload a flyer (official) before review.")
        router.push(`/organizer/${orgSlug}/events/${result.slug}`)
        router.refresh()
      }
    })
  }

  const busy = disabled || isPending

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Reuse & repeats</p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Copy details and ticket tiers into a new draft. Dates can shift by a week or month for recurring shows. Flyer is
        not copied.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <select
          ref={selectRef}
          disabled={busy}
          defaultValue="one_week"
          className="min-h-11 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
          aria-label="Schedule offset for duplicated draft"
        >
          {SHIFT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-neon-a/35 bg-neon-a/10 px-4 font-mono text-[10px] uppercase tracking-widest text-neon-a transition-colors hover:bg-neon-a/15 disabled:opacity-60"
          onClick={() => run()}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          Duplicate draft
        </button>
      </div>
    </div>
  )
}
