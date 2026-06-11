import { cn } from "@/lib/utils"

export type CausticVariant = "subtle" | "hero" | "control-room" | "editorial"

const VARIANT_CLASS: Record<CausticVariant, string> = {
  subtle: "vizb-caustic-subtle",
  hero: "vizb-caustic-hero",
  "control-room": "vizb-caustic-control-room",
  editorial: "vizb-caustic-editorial",
}

/** Fixed CSS caustic atmosphere — no WebGL. */
export function CausticBackdrop({
  variant = "subtle",
  className,
  fixed = true,
}: {
  variant?: CausticVariant
  className?: string
  /** When false, fills relative parent instead of viewport. */
  fixed?: boolean
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "vizb-caustic-backdrop pointer-events-none",
        fixed ? "fixed inset-0 z-0" : "absolute inset-0",
        VARIANT_CLASS[variant],
        className,
      )}
    />
  )
}
