"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"
import { NeonButton } from "@/components/ui/neon-button"
import { cancelRsvp, rsvpToEvent } from "@/app/actions/registrations"

export function EventRsvpCta({
  eventId,
  isSignedIn,
  initialStatus,
  authHref,
}: {
  eventId: string
  isSignedIn: boolean
  initialStatus: "confirmed" | "cancelled" | "checked_in" | null
  authHref: string
}) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(initialStatus)

  const isOnList = status === "confirmed" || status === "checked_in"
  const isCheckedIn = status === "checked_in"

  const runAuthOrRsvp = () => {
    if (!isSignedIn) {
      window.location.href = authHref
      return
    }

    startTransition(async () => {
      if (isOnList) {
        const result = await cancelRsvp(eventId)
        if (result?.error) {
          toast.error(result.error)
          return
        }
        toast.success("RSVP cancelled.")
        setStatus("cancelled")
        return
      }

      const result = await rsvpToEvent(eventId)
      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success("You're on the list.")
      setStatus("confirmed")
    })
  }

  return (
    <div className="mt-5 min-w-0 space-y-4">
      {!isSignedIn ? (
        <p className="text-sm leading-relaxed text-[color:var(--neon-text1)]">
          Sign in with your VIZB account to RSVP. It&apos;s free and takes a few seconds.
        </p>
      ) : null}

      {isSignedIn && isOnList ? (
        <div
          className="flex gap-3 rounded-xl border border-[color:var(--neon-a)]/35 bg-[color:var(--neon-surface)]/50 px-4 py-3"
          role="status"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[color:var(--neon-a)] mt-0.5" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[color:var(--neon-text0)]">You&apos;re on the list</p>
            {isCheckedIn ? (
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--neon-text2)]">
                Checked in — you&apos;re set for the door.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--neon-text2)]">
                We&apos;ll see you at the event. You can cancel below if plans change.
              </p>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {isSignedIn && isOnList ? (
          <NeonButton
            fullWidth
            variant="secondary"
            shape="xl"
            disabled={isPending}
            onClick={runAuthOrRsvp}
          >
            Cancel RSVP
          </NeonButton>
        ) : (
          <NeonButton fullWidth shape="xl" disabled={isPending} onClick={runAuthOrRsvp}>
            {!isSignedIn ? "Sign in to RSVP" : "RSVP"}
          </NeonButton>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-[color:var(--neon-text2)]">
        Ticket purchases aren&apos;t available yet — RSVP is how you save your spot for now.
      </p>
    </div>
  )
}
