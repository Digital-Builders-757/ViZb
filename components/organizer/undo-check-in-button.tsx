"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Loader2, RotateCcw } from "lucide-react"
import { organizerUndoCheckInRegistration } from "@/app/actions/organizer-undo-checkin"

export function OrganizerUndoCheckInButton({
  orgSlug,
  eventSlug,
  eventId,
  userId,
  disabled,
}: {
  orgSlug: string
  eventSlug: string
  eventId: string
  userId: string
  disabled?: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={disabled || isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await organizerUndoCheckInRegistration({
            orgSlug,
            eventSlug,
            eventId,
            userId,
          })
          if (result?.error) {
            toast.error(result.error)
            return
          }
          toast.success("Check-in undone.")
        })
      }}
      className="inline-flex items-center gap-2 border border-border text-muted-foreground px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest hover:text-brand-cyan hover:border-brand-cyan/30 hover:bg-brand-cyan/5 transition-all disabled:opacity-50"
      title="Undo check-in"
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
      Undo
    </button>
  )
}
