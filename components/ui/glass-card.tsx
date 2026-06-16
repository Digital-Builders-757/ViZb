import * as React from "react"

import { cn } from "@/lib/utils"
import { GlassCardInteractive } from "@/components/ui/glass-card-interactive"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slightly stronger border + shadow for hero cards */
  emphasis?: boolean
  /** Tilt + specular highlight on pointer hover; keyboard gets focus-within glow. Respects reduced motion. */
  interactive?: boolean
}

export function GlassCard({ className, emphasis, interactive, ...props }: GlassCardProps) {
  if (interactive) {
    return (
      <GlassCardInteractive className={className} emphasis={emphasis} {...props} />
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)] text-[color:var(--neon-text0)] backdrop-blur-md shadow-[inset_0_1px_0_0_var(--glass-inset-highlight)]",
        emphasis &&
          "shadow-[var(--vibe-neon-glow-subtle),0_0_0_1px_var(--glass-emphasis-ring)]",
        className,
      )}
      {...props}
    />
  )
}
