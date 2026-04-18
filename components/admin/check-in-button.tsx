"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { checkInRegistration } from "@/app/actions/checkin"

export function CheckInButton({
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
          const result = await checkInRegistration({ eventId, userId })
          if (result?.error) {
            toast.error(result.error)
            return
          }
          toast.success("Checked in.")
        })
      }}
      className="inline-flex items-center gap-2 border border-neon-a/30 text-neon-a px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest hover:bg-neon-a/5 hover:shadow-[0_0_15px_rgba(0,189,255,0.15)] transition-all disabled:opacity-50"
      title="Mark attendee as checked in"
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
      Check in
    </button>
  )
}
