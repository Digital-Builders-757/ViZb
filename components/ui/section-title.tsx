import * as React from "react"

import { cn } from "@/lib/utils"

export interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  kicker?: string
  title: string
  /** Use gradient display treatment for the main title (brand moments) */
  gradient?: boolean
}

export function SectionTitle({
  kicker,
  title,
  gradient = false,
  className,
  ...props
}: SectionTitleProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {kicker ? (
        <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--neon-text2)] md:text-xs">
          {kicker}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-balance font-serif text-2xl font-semibold leading-tight tracking-tight text-[color:var(--neon-text0)] md:text-3xl",
          gradient && "neon-gradient-text !text-transparent",
        )}
      >
        {title}
      </h2>
    </div>
  )
}
