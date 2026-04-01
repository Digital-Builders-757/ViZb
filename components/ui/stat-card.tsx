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
    <GlassCard
      className={cn(
        "relative overflow-hidden p-4 md:p-6",
        // subtle top-edge energy so stats feel less like flat SaaS admin
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[color:var(--neon-a)]/50 before:to-transparent",
        className,
      )}
      emphasis
      {...props}
    >
      <div className="mb-3 flex items-center gap-3 md:mb-4">
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/40 backdrop-blur-md",
            "shadow-[0_0_0_1px_color-mix(in_srgb,var(--neon-a)_14%,transparent),0_0_18px_rgb(0_209_255/0.12)]",
          )}
          aria-hidden
        >
          <Icon className={cn("h-5 w-5 md:h-5 md:w-5", accentMap[accent])} />
        </span>

        <div className="min-w-0">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)] md:text-xs">
            {label}
          </span>
          {hint ? (
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--neon-text1)] md:text-sm">{hint}</p>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "font-mono text-3xl font-bold tabular-nums md:text-4xl",
          accentMap[accent],
        )}
      >
        {value}
      </div>
    </GlassCard>
  )
}
