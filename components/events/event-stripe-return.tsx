"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

/**
 * Clears Stripe return query params and nudges a refresh so the wallet updates after webhook fulfillment.
 */
export function EventStripeReturn({ eventPath }: { eventPath: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    const sessionId = searchParams.get("session_id")
    const checkout = searchParams.get("checkout")

    if (sessionId) {
      handled.current = true
      toast.success(
        "Payment received. Your ticket should appear in My Tickets shortly—refresh the page if it is not there yet.",
      )
      router.replace(eventPath)
      router.refresh()
      return
    }

    if (checkout === "cancelled") {
      handled.current = true
      toast.message("Checkout cancelled.")
      router.replace(eventPath)
    }
  }, [searchParams, router, eventPath])

  return null
}
