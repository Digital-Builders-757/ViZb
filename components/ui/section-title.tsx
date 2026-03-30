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
        <p
          className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] md:text-xs"
          style={{ color: "var(--vibe-text-muted)" }}
        >
          {kicker}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl",
          gradient && "neon-gradient-text !text-transparent",
        )}
      >
        {title}
      </h2>
    </div>
  )
}
