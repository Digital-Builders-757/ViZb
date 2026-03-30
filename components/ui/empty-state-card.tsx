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
    <GlassCard className={cn("p-6 md:p-8", className)} {...props}>
      {kicker ? (
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">{kicker}</span>
      ) : null}
      <h3 className="mt-2 text-left text-lg font-bold uppercase tracking-wide text-[color:var(--neon-text0)]">
        {title}
      </h3>
      <p className="mt-2 max-w-prose text-left text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
        {description}
      </p>
      {children ? <div className="mt-6 flex justify-start">{children}</div> : null}
    </GlassCard>
  )
}
