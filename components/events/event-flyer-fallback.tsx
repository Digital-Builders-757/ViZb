import { cn } from "@/lib/utils"

export interface EventFlyerFallbackProps {
  dayNumber: string
  monthShort: string
  /** `timeline` = full card column; `thumb` = compact rail; `banner` = hero rail */
  variant?: "timeline" | "thumb" | "banner"
  className?: string
}

/**
 * Branded placeholder when an event has no flyer image.
 */
export function EventFlyerFallback({
  dayNumber,
  monthShort,
  variant = "timeline",
  className,
}: EventFlyerFallbackProps) {
  const isThumb = variant === "thumb"
  const isBanner = variant === "banner"

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-[color:var(--neon-surface)]/40",
        className,
      )}
      aria-hidden
    >
      <div className="events-flyer-fallback-glow pointer-events-none absolute inset-0 opacity-80" aria-hidden />
      <div className="relative text-center">
        <span
          className={cn(
            "font-mono font-bold text-[color:var(--neon-a)]/35",
            isThumb ? "text-lg" : isBanner ? "text-4xl" : "text-6xl md:text-8xl",
          )}
        >
          {dayNumber}
        </span>
        {!isThumb ? (
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
            {monthShort}
          </p>
        ) : null}
      </div>
    </div>
  )
}
