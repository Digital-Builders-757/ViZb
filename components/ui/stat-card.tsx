import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"

const accentMap = {
  a: "text-[color:var(--neon-a)]",
  b: "text-[color:var(--neon-b)]",
  c: "text-[color:var(--neon-c)]",
} as const

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  hint?: string
  accent?: keyof typeof accentMap
}

export function StatCard({
  className,
  icon: Icon,
  label,
  value,
  hint,
  accent = "a",
  ...props
}: StatCardProps) {
  return (
    <GlassCard className={cn("p-4 md:p-6", className)} emphasis {...props}>
      <div className="mb-3 flex items-center gap-3 md:mb-4">
        <Icon className={cn("h-5 w-5 shrink-0 md:h-6 md:w-6", accentMap[accent])} />
        <span className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)] md:text-xs">
          {label}
        </span>
      </div>
      <div className={cn("font-mono text-3xl font-bold tabular-nums md:text-4xl", accentMap[accent])}>{value}</div>
      {hint ? (
        <p className="mt-1 text-xs leading-relaxed text-[color:var(--neon-text2)] md:text-sm">{hint}</p>
      ) : null}
    </GlassCard>
  )
}
