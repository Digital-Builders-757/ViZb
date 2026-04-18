"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Loader2, RotateCcw } from "lucide-react"
import { undoCheckInRegistration } from "@/app/actions/undo-checkin"

export function UndoCheckInButton({
  eventId,
  userId,
  disabled,
}: {
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
          const result = await undoCheckInRegistration({ eventId, userId })
          if (result?.error) {
            toast.error(result.error)
            return
          }
          toast.success("Check-in undone.")
        })
      }}
      className="inline-flex items-center gap-2 border border-border text-muted-foreground px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest hover:text-neon-a hover:border-neon-a/30 hover:bg-neon-a/5 transition-all disabled:opacity-50"
      title="Undo check-in"
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
      Undo
    </button>
  )
}
