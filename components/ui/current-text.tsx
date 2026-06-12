import { cn } from "@/lib/utils"

export type CurrentTextVariant = "kicker" | "primary" | "accent"

const VARIANT_CLASS: Record<CurrentTextVariant, string> = {
  kicker: "water-current-kicker",
  primary: "water-current-primary",
  accent: "water-current-text",
}

export interface CurrentTextProps extends React.ComponentProps<"span"> {
  variant: CurrentTextVariant
}

/**
 * Water-current typography for hero headlines. Relies on `.water-current-*` in globals.css.
 */
export function CurrentText({ variant, className, children, ...props }: CurrentTextProps) {
  return (
    <span className={cn(VARIANT_CLASS[variant], className)} {...props}>
      {children}
    </span>
  )
}
