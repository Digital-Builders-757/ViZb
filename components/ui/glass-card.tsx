import * as React from "react"

import { cn } from "@/lib/utils"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slightly stronger border + shadow for hero cards */
  emphasis?: boolean
}

export function GlassCard({ className, emphasis, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)] text-[color:var(--neon-text0)] backdrop-blur-md",
        emphasis &&
          "shadow-[var(--vibe-neon-glow-subtle),0_0_0_1px_color-mix(in_srgb,var(--neon-a)_18%,transparent)]",
        className,
      )}
      {...props}
    />
  )
}
