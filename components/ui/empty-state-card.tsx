import * as React from "react"

import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"

export interface EmptyStateCardProps extends React.HTMLAttributes<HTMLDivElement> {
  kicker?: string
  title: string
  description: string
  children?: React.ReactNode
}

export function EmptyStateCard({
  className,
  kicker,
  title,
  description,
  children,
  ...props
}: EmptyStateCardProps) {
  return (
    <GlassCard
      className={cn(
        "relative overflow-hidden p-6 md:p-8",
        // gradient edge + soft glow (mockup feel) without making the whole card loud
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:ring-1 before:ring-[color:var(--neon-hairline)]",
        "after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-0.5 after:bg-gradient-to-r after:from-[color:var(--neon-a)]/55 after:via-[color:var(--neon-b)]/45 after:to-[color:var(--neon-c)]/35",
        "shadow-[0_0_0_1px_color-mix(in_srgb,var(--neon-a)_12%,transparent),0_0_28px_rgb(0_209_255/0.12)]",
        className,
      )}
      {...props}
    >
      {kicker ? (
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]/95">
          {kicker}
        </span>
      ) : null}

      <h3 className="mt-2 text-left font-serif text-xl font-bold text-[color:var(--neon-text0)] md:text-2xl">
        {title}
      </h3>
      <p className="mt-2 max-w-prose text-left text-[15px] leading-relaxed text-[color:var(--neon-text1)] md:text-base">
        {description}
      </p>
      {children ? <div className="mt-6 flex w-full justify-start">{children}</div> : null}
    </GlassCard>
  )
}
