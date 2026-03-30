import * as React from "react"

import { NeonDashboardBackdrop } from "@/components/ui/neon-dashboard-backdrop"
import { cn } from "@/lib/utils"

export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When true, adds aurora + noise on top of the global starfield. */
  withNeonBackdrop?: boolean
}

/**
 * Dashboard / mobile-first shell: optional neon backdrop + relative content stack.
 */
export function AppShell({ className, withNeonBackdrop, children, ...props }: AppShellProps) {
  return (
    <div className={cn("relative min-h-[100dvh] overflow-x-hidden", className)} {...props}>
      {withNeonBackdrop ? <NeonDashboardBackdrop /> : null}
      <div className="relative z-[2]">{children}</div>
    </div>
  )
}
