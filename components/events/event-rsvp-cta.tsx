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
  freeTicketTiers = [],
}: {
  eventId: string
  isSignedIn: boolean
  initialStatus: "confirmed" | "cancelled" | "checked_in" | null
  authHref: string
  /** Max RSVPs (confirmed + checked in). Null = no limit. */
  rsvpCapacity?: number | null
  /** Current count from server (published events only). */
  rsvpOccupied?: number
  /** Free ($0) tiers currently on sale; empty = default tier only at mint time. */
  freeTicketTiers?: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(initialStatus)
  const [occupied, setOccupied] = useState(rsvpOccupied)
  const [selectedTierId, setSelectedTierId] = useState(freeTicketTiers[0]?.id ?? "")

  const isConfirmed = status === "confirmed" || status === "checked_in"
  const isFull =
    rsvpCapacity != null && rsvpCapacity > 0 && occupied >= rsvpCapacity && !isConfirmed
  const capLabel =
    rsvpCapacity != null && rsvpCapacity > 0
      ? `${Math.min(occupied, rsvpCapacity)} / ${rsvpCapacity} RSVPs`
      : occupied > 0
        ? `${occupied} RSVP${occupied === 1 ? "" : "s"}`
        : null

  function tierArgForRsvp(): string | null {
    if (freeTicketTiers.length === 0) return null
    const pick = freeTicketTiers.find((t) => t.id === selectedTierId) ?? freeTicketTiers[0]
    return pick?.id ?? null
  }

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

      {freeTicketTiers.length > 1 && !isConfirmed ? (
        <fieldset className="mb-4 space-y-2">
          <legend className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)] mb-2">
            Choose a tier
          </legend>
          <div className="flex flex-col gap-2">
            {freeTicketTiers.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 text-sm text-[color:var(--neon-text1)]"
              >
                <input
                  type="radio"
                  name="ticket_tier"
                  value={t.id}
                  checked={selectedTierId === t.id}
                  onChange={() => setSelectedTierId(t.id)}
                  className="h-4 w-4 accent-[color:var(--neon-a)]"
                />
                <span>{t.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : freeTicketTiers.length === 1 && !isConfirmed ? (
        <p className="mb-3 text-xs text-[color:var(--neon-text2)]">
          Tier: <span className="text-[color:var(--neon-text1)]">{freeTicketTiers[0].name}</span>
        </p>
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

            const result = await rsvpToEvent(eventId, tierArgForRsvp())
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
