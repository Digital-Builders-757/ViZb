import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export interface InputRowProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
}

/**
 * Glass row shell for forms (icon + content). Matches mockup InputRow density.
 */
export function InputRow({ className, icon: Icon, children, ...props }: InputRowProps) {
  return (
    <div
      className={cn(
        "flex min-h-[2.75rem] items-center gap-3 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)] px-4 py-2 backdrop-blur-md",
        className,
      )}
      {...props}
    >
      {Icon ? <Icon className="h-5 w-5 shrink-0 text-[color:var(--neon-text2)]" aria-hidden /> : null}
      <div className="min-w-0 flex-1 text-[15px] leading-relaxed text-[color:var(--neon-text0)]">{children}</div>
    </div>
  )
}
