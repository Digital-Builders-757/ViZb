"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { removeEventFromMyVibes, saveEventToMyVibes } from "@/app/actions/vibes"

type MyVibesButtonVariant = "timeline" | "detail" | "dashboard"

export function MyVibesButton({
  eventId,
  eventSlug,
  isSignedIn,
  initialSaved,
  authHref,
  variant = "detail",
}: {
  eventId: string
  eventSlug: string
  isSignedIn: boolean
  initialSaved: boolean
  authHref: string
  variant?: MyVibesButtonVariant
}) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(initialSaved)

  if (!isSignedIn) {
    return (
      <Link
        href={authHref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border font-mono text-[10px] uppercase tracking-widest transition-colors",
          variant === "timeline" &&
            "min-h-[40px] border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-2 text-[color:var(--neon-text1)] backdrop-blur hover:border-[color:var(--neon-a)]/45 hover:text-[color:var(--neon-text0)]",
          variant === "detail" &&
            "min-h-[44px] w-full border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-4 py-2 text-[color:var(--neon-text1)] hover:border-[color:var(--neon-a)]/45 sm:w-auto",
          variant === "dashboard" &&
            "h-10 w-full border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30 px-3 text-[color:var(--neon-text0)] hover:border-[color:color-mix(in_srgb,var(--neon-a)_45%,var(--neon-hairline))]",
        )}
      >
        <Heart className="h-4 w-4 shrink-0 text-[color:var(--neon-a)]" aria-hidden />
        Sign in to save
      </Link>
    )
  }

  return (
    <button
      type="button"
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from My Vibes" : "Save to My Vibes"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border font-mono text-[10px] uppercase tracking-widest transition-colors disabled:opacity-60",
        saved
          ? "border-[color:color-mix(in_srgb,var(--neon-a)_50%,var(--neon-hairline))] bg-[color:var(--neon-a)]/18 text-[color:var(--neon-text0)] shadow-[0_0_14px_rgba(0,209,255,0.12)]"
          : "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 text-[color:var(--neon-text1)] hover:border-[color:var(--neon-a)]/45 hover:text-[color:var(--neon-text0)]",
        variant === "timeline" && "min-h-[40px] px-3 py-2 backdrop-blur",
        variant === "detail" && "min-h-[44px] w-full px-4 py-2 sm:w-auto",
        variant === "dashboard" && "h-10 w-full px-3",
      )}
      onClick={() => {
        startTransition(async () => {
          if (saved) {
            const res = await removeEventFromMyVibes(eventId, eventSlug)
            if ("error" in res && res.error) {
              toast.error(res.error)
              return
            }
            setSaved(false)
            toast.success("Removed from My Vibes.")
            return
          }

          const res = await saveEventToMyVibes(eventId, eventSlug)
          if ("error" in res && res.error) {
            toast.error(res.error)
            return
          }
          setSaved(true)
          toast.success("Saved to My Vibes.")
        })
      }}
    >
      <Heart
        className={cn("h-4 w-4 shrink-0", saved ? "fill-[color:var(--neon-a)] text-[color:var(--neon-a)]" : "text-[color:var(--neon-a)]")}
        aria-hidden
      />
      {saved ? "Saved — My Vibes" : "My Vibes"}
    </button>
  )
}
