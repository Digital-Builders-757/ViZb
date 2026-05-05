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
  compact = false,
  onSavedChange,
}: {
  eventId: string
  eventSlug: string
  isSignedIn: boolean
  initialSaved: boolean
  authHref: string
  variant?: MyVibesButtonVariant
  /** Smaller footprint on timeline flyer (secondary to artwork). */
  compact?: boolean
  /** When parent tracks optimistic overrides (e.g. dashboard calendar shell). */
  onSavedChange?: (nextSaved: boolean) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(initialSaved)

  if (!isSignedIn) {
    return (
      <Link
        href={authHref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border font-mono uppercase tracking-widest transition-colors",
          variant === "timeline" &&
            cn(
              "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 text-[color:var(--neon-text1)] backdrop-blur hover:border-[color:var(--neon-a)]/45 hover:text-[color:var(--neon-text0)]",
              compact
                ? "min-h-[34px] gap-1.5 px-2.5 py-1 text-[9px] sm:text-[10px]"
                : "min-h-[40px] gap-2 px-3 py-2 text-[10px]",
            ),
          variant === "detail" &&
            "min-h-[44px] w-full border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-4 py-2 text-[color:var(--neon-text1)] hover:border-[color:var(--neon-a)]/45 sm:w-auto",
          variant === "dashboard" &&
            "h-10 w-full border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30 px-3 text-[color:var(--neon-text0)] hover:border-[color:color-mix(in_srgb,var(--neon-a)_45%,var(--neon-hairline))]",
        )}
      >
        <Heart className={cn("shrink-0 text-[color:var(--neon-a)]", compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
        Sign in to save to My Vibes
      </Link>
    )
  }

  return (
    <button
      type="button"
      disabled={isPending}
      aria-pressed={saved}
      aria-busy={isPending}
      aria-label={saved ? "Remove from My Vibes" : "Save to My Vibes"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border font-mono text-[10px] uppercase tracking-widest transition-colors disabled:opacity-60",
        saved
          ? "border-[color:color-mix(in_srgb,var(--neon-a)_50%,var(--neon-hairline))] bg-[color:var(--neon-a)]/18 text-[color:var(--neon-text0)] shadow-[0_0_14px_rgba(0,209,255,0.12)]"
          : "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 text-[color:var(--neon-text1)] hover:border-[color:var(--neon-a)]/45 hover:text-[color:var(--neon-text0)]",
        variant === "timeline" &&
          cn(
            "backdrop-blur",
            compact
              ? "min-h-[34px] gap-1.5 px-2.5 py-1 text-[9px] sm:text-[10px]"
              : "min-h-[40px] gap-2 px-3 py-2 text-[10px]",
          ),
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
            onSavedChange?.(false)
            toast.success("Removed from My Vibes.")
            return
          }

          const res = await saveEventToMyVibes(eventId, eventSlug)
          if ("error" in res && res.error) {
            toast.error(res.error)
            return
          }
          setSaved(true)
          onSavedChange?.(true)
          toast.success("Saved to My Vibes.")
        })
      }}
    >
      <Heart
        className={cn(
          "shrink-0",
          compact ? "h-3.5 w-3.5" : "h-4 w-4",
          saved ? "fill-[color:var(--neon-a)] text-[color:var(--neon-a)]" : "text-[color:var(--neon-a)]",
        )}
        aria-hidden
      />
      {isPending ? (saved ? "Removing…" : "Saving…") : saved ? "Saved — My Vibes" : "My Vibes"}
    </button>
  )
}
