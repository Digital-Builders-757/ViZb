import Image from "next/image"

import { EventFlyerFallback } from "@/components/events/event-flyer-fallback"
import { WaterFrame } from "@/components/ui/water-frame"
import { cn } from "@/lib/utils"

export type EventPremiumFlyerVariant = "timeline" | "detail" | "rail"

const VARIANT_SIZES: Record<EventPremiumFlyerVariant, string> = {
  timeline: "(max-width: 768px) 100vw, 50vw",
  detail: "(max-width: 1024px) 100vw, 50vw",
  rail: "280px",
}

const VARIANT_FRAME: Record<EventPremiumFlyerVariant, string> = {
  timeline: "relative aspect-[4/5] overflow-hidden rounded-xl",
  detail: "relative aspect-[4/5] overflow-hidden rounded-xl",
  rail: "relative aspect-[4/5] overflow-hidden rounded-lg",
}

export function EventPremiumFlyer({
  title,
  flyerUrl,
  startsAt,
  variant = "detail",
  priority = false,
  className,
}: {
  title: string
  flyerUrl: string | null
  startsAt: string
  variant?: EventPremiumFlyerVariant
  priority?: boolean
  className?: string
}) {
  const start = new Date(startsAt)
  const dayNumber = Number.isNaN(start.getTime()) ? "?" : String(start.getDate())
  const monthShort = Number.isNaN(start.getTime())
    ? "---"
    : start.toLocaleDateString("en-US", { month: "short" })

  return (
    <WaterFrame className={cn(VARIANT_FRAME[variant], "event-premium-flyer", className)}>
      {flyerUrl ? (
        <>
          <Image
            src={flyerUrl}
            alt={`Flyer for ${title}`}
            fill
            sizes={VARIANT_SIZES[variant]}
            className="object-cover"
            priority={priority}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg0)]/55 via-transparent to-[color:var(--neon-a)]/10"
            aria-hidden
          />
        </>
      ) : (
        <EventFlyerFallback
          dayNumber={dayNumber}
          monthShort={monthShort}
          variant={variant === "rail" ? "thumb" : variant === "detail" ? "timeline" : "timeline"}
        />
      )}
    </WaterFrame>
  )
}
