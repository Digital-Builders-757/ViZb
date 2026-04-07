import { cn } from "@/lib/utils"

export interface WaterFrameProps extends React.ComponentProps<"div"> {
  children: React.ReactNode
}

/**
 * Liquid neon edge for image cards. Relies on `.water-frame` in globals.css (pseudo-elements, overflow contained).
 */
export function WaterFrame({ className, children, ...props }: WaterFrameProps) {
  return (
    <div className={cn("water-frame water-border", className)} {...props}>
      {children}
    </div>
  )
}
