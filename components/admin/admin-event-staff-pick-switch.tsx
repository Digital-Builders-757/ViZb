"use client"

import { useMemo, useState, useTransition } from "react"

import { setEventStaffPickFromAdmin } from "@/app/actions/event-trust"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface AdminEventStaffPickSwitchProps {
  eventId: string
  initialStaffPick: boolean
}

export function AdminEventStaffPickSwitch({
  eventId,
  initialStaffPick,
}: AdminEventStaffPickSwitchProps) {
  const [on, setOn] = useState(initialStaffPick)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const id = useMemo(() => `staff-pick-${eventId}`, [eventId])

  function apply(next: boolean) {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const r = await setEventStaffPickFromAdmin(eventId, next)
      if (r.ok) {
        setOn(next)
        setMessage(r.message ?? null)
      } else {
        setError(r.error)
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Label htmlFor={id} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Staff pick
          </Label>
          <p className="text-sm text-muted-foreground max-w-xl">
            Highlight this listing as a ViZb editorial pick — shows a calm badge and can appear in the &quot;ViZb picks&quot; rail on Discover.
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <Switch
            id={id}
            checked={on}
            disabled={pending}
            onCheckedChange={(v) => apply(v)}
            aria-describedby={`${id}-hint`}
          />
          <p id={`${id}-hint`} className="sr-only">
            Toggle whether this published listing is highlighted as Staff pick on public surfaces.
          </p>
        </div>
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
