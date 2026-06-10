"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { syncPaidTicketCheckoutSession } from "@/app/actions/ticket-checkout"
import { EventCheckoutBanner } from "@/components/events/event-checkout-banner"
import { TicketAddedSuccessDialog } from "@/components/events/ticket-added-success-dialog"

type PaidFulfillmentState = "syncing" | "confirmed" | "pending" | "error"

/**
 * Clears Stripe return query params, syncs fulfillment when webhooks are delayed/missing, then refreshes.
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
  const [cancelBannerDismissed, setCancelBannerDismissed] = useState(false)
  const [fulfilledTicketId, setFulfilledTicketId] = useState<string | null>(null)
  const [paidState, setPaidState] = useState<PaidFulfillmentState | null>(
    stripeReturnParams.session ? "syncing" : null,
  )
  const [syncError, setSyncError] = useState<string | null>(null)

  const paidSuccessOpen = Boolean(stripeReturnParams.session) && !dialogDismissed && paidState !== null
  const showCancelledBanner =
    stripeReturnParams.checkout === "cancelled" && !cancelBannerDismissed && !stripeReturnParams.session

  useEffect(() => {
    if (handled.current) return
    const sessionId = stripeReturnParams.session
    const checkout = stripeReturnParams.checkout

    if (sessionId) {
      handled.current = true
      void (async () => {
        const result = await syncPaidTicketCheckoutSession(sessionId)
        if ("error" in result && result.error) {
          setSyncError(result.error)
          setPaidState("error")
          toast.error(result.error)
        } else if (result.ticketId) {
          setFulfilledTicketId(result.ticketId)
          setPaidState("confirmed")
        } else {
          setPaidState("pending")
        }
        router.replace(eventPath)
        router.refresh()
      })()
      return
    }

    if (checkout === "cancelled") {
      handled.current = true
      router.replace(eventPath)
    }
  }, [eventPath, router, stripeReturnParams.session, stripeReturnParams.checkout])

  return (
    <>
      {showCancelledBanner ? (
        <EventCheckoutBanner variant="cancelled" onDismiss={() => setCancelBannerDismissed(true)} />
      ) : null}

      {paidState === "pending" && !dialogDismissed ? (
        <EventCheckoutBanner variant="pending" onDismiss={() => setDialogDismissed(true)} />
      ) : null}

      {paidState === "error" && syncError && !dialogDismissed ? (
        <EventCheckoutBanner variant="error" onDismiss={() => setDialogDismissed(true)} />
      ) : null}

      <TicketAddedSuccessDialog
        open={paidSuccessOpen}
        onOpenChange={(next) => {
          if (!next) setDialogDismissed(true)
        }}
        ticketId={fulfilledTicketId}
        eventTitle={eventTitle}
        startsAt={startsAt}
        venueName={venueName}
        city={city}
        eventUrl={eventPublicUrl}
        variant="paid"
        paidFulfillmentState={paidState}
      />
    </>
  )
}
