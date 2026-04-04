"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
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

  const isConfirmed = status === "confirmed" || status === "checked_in"

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <NeonButton fullWidth shape="xl" disabled>
        Get Tickets
      </NeonButton>

      <NeonButton
        fullWidth
        variant={isConfirmed ? "primary" : "secondary"}
        shape="xl"
        disabled={isPending}
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
        }}
      >
        {isConfirmed ? "Cancel RSVP" : "RSVP"}
      </NeonButton>
    </div>
  )
}
