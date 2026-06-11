"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { saveEventToMyVibes } from "@/app/actions/vibes"
import { parsePostLoginIntent } from "@/lib/auth/post-login-intent"
import { NeonButton } from "@/components/ui/neon-button"

function clearIntentFromUrl(
  eventSlug: string,
  searchParams: URLSearchParams,
  router: ReturnType<typeof useRouter>,
) {
  const next = new URLSearchParams(searchParams.toString())
  next.delete("intent")
  const qs = next.toString()
  router.replace(qs ? `/events/${eventSlug}?${qs}` : `/events/${eventSlug}`, { scroll: false })
}

export function PostLoginIntentResolver({
  eventId,
  eventSlug,
  isSignedIn,
  initialSaved,
}: {
  eventId: string
  eventSlug: string
  isSignedIn: boolean
  initialSaved: boolean
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const saveHandledRef = useRef(false)
  const scrollHandledRef = useRef(false)

  const intent = parsePostLoginIntent(searchParams)
  const showRsvpBanner = isSignedIn && intent === "rsvp_event"

  useEffect(() => {
    if (!isSignedIn || saveHandledRef.current || intent !== "save_event") return

    saveHandledRef.current = true

    if (initialSaved) {
      toast.message("Already in My Vibes.")
      clearIntentFromUrl(eventSlug, searchParams, router)
      return
    }

    void (async () => {
      const res = await saveEventToMyVibes(eventId, eventSlug)
      if ("error" in res && res.error) {
        toast.error(res.error)
      } else {
        toast.success("Saved to My Vibes.")
      }
      clearIntentFromUrl(eventSlug, searchParams, router)
    })()
  }, [eventId, eventSlug, initialSaved, intent, isSignedIn, router, searchParams])

  useEffect(() => {
    if (!showRsvpBanner || scrollHandledRef.current) return
    scrollHandledRef.current = true
    requestAnimationFrame(() => {
      document.getElementById("event-rsvp")?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }, [showRsvpBanner])

  if (!showRsvpBanner) return null

  return (
    <div
      className="mx-auto mb-4 max-w-[1200px] rounded-xl border border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/10 px-4 py-4 shadow-[0_0_20px_rgba(0,209,255,0.12)] sm:px-8"
      role="status"
    >
      <p className="text-sm font-medium text-[color:var(--neon-text0)]">You&apos;re signed in — finish your RSVP below.</p>
      <p className="mt-1 text-xs text-[color:var(--neon-text2)]">
        Pick free RSVP or buy a ticket, then confirm on this page.
      </p>
      <NeonButton
        type="button"
        size="sm"
        variant="ghost"
        shape="pill"
        className="mt-3"
        onClick={() => clearIntentFromUrl(eventSlug, searchParams, router)}
      >
        Dismiss
      </NeonButton>
    </div>
  )
}
