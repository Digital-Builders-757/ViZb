"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { TicketAddedSuccessDialog } from "@/components/events/ticket-added-success-dialog"

/**
 * Clears Stripe return query params and nudges a refresh so the wallet updates after webhook fulfillment.
 */
export function EventStripeReturn({
  eventPath,
  eventTitle,
  startsAt,
  venueName,
  city,
  eventPublicUrl,
}: {
  eventPath: string
  eventTitle: string
  startsAt: string
  venueName: string
  city: string
  eventPublicUrl: string
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const handled = useRef(false)
  const [stripeReturnParams] = useState(() => ({
    session: searchParams.get("session_id"),
    checkout: searchParams.get("checkout"),
  }))
  const [dialogDismissed, setDialogDismissed] = useState(false)
  const paidSuccessOpen = Boolean(stripeReturnParams.session) && !dialogDismissed

  useEffect(() => {
    if (handled.current) return
    const sessionId = stripeReturnParams.session
    const checkout = stripeReturnParams.checkout

    if (sessionId) {
      handled.current = true
      router.replace(eventPath)
      router.refresh()
      return
    }

    if (checkout === "cancelled") {
      handled.current = true
      toast.message("Checkout cancelled.")
      router.replace(eventPath)
    }
  }, [eventPath, router, stripeReturnParams.session, stripeReturnParams.checkout])

  return (
    <TicketAddedSuccessDialog
      open={paidSuccessOpen}
      onOpenChange={(next) => {
        if (!next) setDialogDismissed(true)
      }}
      ticketId={null}
      eventTitle={eventTitle}
      startsAt={startsAt}
      venueName={venueName}
      city={city}
      eventUrl={eventPublicUrl}
      variant="paid"
    />
  )
}
