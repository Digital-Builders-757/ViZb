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
        "rounded-xl vibe-glass-panel text-card-foreground",
        emphasis && "shadow-[var(--vibe-neon-glow-subtle)]",
        className,
      )}
      {...props}
    />
  )
}
