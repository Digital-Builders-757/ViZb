"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { NeonButton } from "@/components/ui/neon-button"
import { cancelRsvp, rsvpToEvent } from "@/app/actions/registrations"

export function EventRsvpCta({
  eventId,
  isSignedIn,
  initialStatus,
  authHref,
  rsvpCapacity = null,
  rsvpOccupied = 0,
}: {
  eventId: string
  isSignedIn: boolean
  initialStatus: "confirmed" | "cancelled" | "checked_in" | null
  authHref: string
  /** Max RSVPs (confirmed + checked in). Null = no limit. */
  rsvpCapacity?: number | null
  /** Current count from server (published events only). */
  rsvpOccupied?: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(initialStatus)
  const [occupied, setOccupied] = useState(rsvpOccupied)

  const isConfirmed = status === "confirmed" || status === "checked_in"
  const isFull =
    rsvpCapacity != null && rsvpCapacity > 0 && occupied >= rsvpCapacity && !isConfirmed
  const capLabel =
    rsvpCapacity != null && rsvpCapacity > 0
      ? `${Math.min(occupied, rsvpCapacity)} / ${rsvpCapacity} RSVPs`
      : occupied > 0
        ? `${occupied} RSVP${occupied === 1 ? "" : "s"}`
        : null

  return (
    <div className="mt-4">
      {capLabel ? (
        <p className="mb-2 text-xs font-mono uppercase tracking-wider text-[color:var(--neon-text2)]">{capLabel}</p>
      ) : null}
      {!isSignedIn ? (
        <p className="mb-2 text-xs text-[color:var(--neon-text2)]">
          You’ll need an account to RSVP.
        </p>
      ) : null}
      {isFull ? (
        <p className="mb-3 text-sm text-[color:var(--neon-text1)]">This event is at capacity for RSVPs.</p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <NeonButton fullWidth shape="xl" disabled>
        Get Tickets
      </NeonButton>

      <NeonButton
        fullWidth
        variant={isConfirmed ? "primary" : "secondary"}
        shape="xl"
        disabled={isPending || isFull}
        onClick={() => {
          if (!isSignedIn) {
            window.location.href = authHref
            return
          }

          startTransition(async () => {
            if (isConfirmed) {
              const result = await cancelRsvp(eventId)
              if (result?.error) {
                toast.error(result.error)
                return
              }
              toast.success("RSVP cancelled.")
              setStatus("cancelled")
              setOccupied((n) => Math.max(0, n - 1))
              router.refresh()
              return
            }

            const result = await rsvpToEvent(eventId)
            if (result?.error) {
              toast.error(result.error)
              return
            }

            toast.success("You're on the list.")
            setStatus("confirmed")
            setOccupied((n) => n + 1)
            router.refresh()
          })
        }}
      >
        {!isSignedIn ? "Sign in to RSVP" : isFull ? "RSVP full" : isConfirmed ? "Cancel RSVP" : "RSVP"}
      </NeonButton>
      </div>
    </div>
  )
}
