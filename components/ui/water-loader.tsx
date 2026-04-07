import { cn } from "@/lib/utils"

const sizeClass: Record<"sm" | "lg", string> = {
  sm: "h-1 w-16",
  lg: "h-2.5 w-40 sm:w-52 md:w-64",
}

export interface WaterLoaderProps extends React.ComponentProps<"div"> {
  size?: "sm" | "lg"
}

/**
 * CSS-only liquid-neon loading bar (no spinner). Pair with `.water-loader` / `.water-shimmer` in globals.css.
 * Prefer `size="lg"` for global first paint; `size="sm"` for optional tiny inline use.
 */
export function WaterLoader({ className, size = "lg", ...props }: WaterLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={cn(
        "water-loader relative isolate overflow-hidden rounded-full",
        "bg-[color:color-mix(in_srgb,var(--neon-surface)_65%,transparent)]",
        "shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]",
        sizeClass[size],
        className
      )}
      {...props}
    >
      {/* Base flow */}
      <div
        className="water-loader-fill pointer-events-none absolute inset-0 rounded-[inherit]"
        aria-hidden
      />
      {/* Caustic / shimmer sheet */}
      <div
        className="water-shimmer pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-screen opacity-90"
        aria-hidden
      />
      {/* Secondary refracted sweep */}
      <div
        className="water-loader-sheen pointer-events-none absolute inset-0 rounded-[inherit] opacity-50"
        aria-hidden
      />
    </div>
  )
}
