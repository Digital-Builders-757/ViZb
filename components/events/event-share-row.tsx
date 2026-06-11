"use client"

import { useEffect, useState } from "react"
import { Share2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { trackProductEvent, type ProductEventContext } from "@/lib/analytics/product-events"

function absoluteShareUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  if (typeof window === "undefined") return url
  const path = url.startsWith("/") ? url : `/${url}`
  return `${window.location.origin}${path}`
}

export function EventShareRow({
  shareUrl,
  title,
  className,
  analyticsContext,
}: {
  shareUrl: string
  title: string
  className?: string
  analyticsContext?: ProductEventContext
}) {
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    void Promise.resolve().then(() => {
      setCanNativeShare(typeof navigator.share === "function")
    })
  }, [])

  const copyLink = async () => {
    trackProductEvent("event_share_clicked", {
      ...analyticsContext,
      channel: "copy",
      source: analyticsContext?.source ?? "event_detail",
    })
    const href = absoluteShareUrl(shareUrl)
    try {
      await navigator.clipboard.writeText(href)
      toast.success("Event link copied")
    } catch {
      toast.error("Could not copy link")
    }
  }

  const shareNative = async () => {
    const href = absoluteShareUrl(shareUrl)
    if (typeof navigator.share !== "function") {
      await copyLink()
      return
    }
    try {
      await navigator.share({
        title,
        text: title,
        url: href,
      })
      trackProductEvent("event_share_clicked", {
        ...analyticsContext,
        channel: "native",
        source: analyticsContext?.source ?? "event_detail",
      })
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === "AbortError") return
      await copyLink()
    }
  }

  const baseBtn =
    "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-4 py-2.5 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)] transition-colors hover:border-[color:var(--neon-a)]/40 hover:text-[color:var(--neon-a)] sm:w-auto sm:min-w-[9rem]"

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap", className)}>
      <button type="button" onClick={() => void copyLink()} className={baseBtn}>
        Copy event link
      </button>
      {canNativeShare ? (
        <button type="button" onClick={() => void shareNative()} className={baseBtn}>
          <Share2 className="h-4 w-4 shrink-0" aria-hidden />
          Share…
        </button>
      ) : null}
    </div>
  )
}
