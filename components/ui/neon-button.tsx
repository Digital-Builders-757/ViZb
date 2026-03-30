import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const neonButtonInner = cva(
  "relative z-[1] flex w-full min-h-11 items-center justify-center gap-2 rounded-full text-base font-semibold leading-none text-white transition-[transform,opacity] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 md:text-sm [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      size: {
        default: "px-8 py-3.5 md:px-7 md:py-3",
        sm: "px-5 py-2.5 text-sm",
        lg: "px-10 py-4 text-base",
      },
    },
    defaultVariants: { size: "default" },
  },
)

const neonButtonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-base font-semibold leading-none transition-[box-shadow,transform,opacity] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 md:text-sm [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "",
        secondary:
          "min-h-11 border border-[color:var(--vibe-glass-border)] bg-[color:var(--vibe-glass-bg)] px-8 py-3.5 text-foreground backdrop-blur-md shadow-[var(--vibe-neon-glow-subtle)] focus-visible:ring-2 focus-visible:ring-[color:var(--vibe-neon-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] active:scale-[0.99] md:px-7 md:py-3",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      fullWidth: false,
    },
  },
)

export interface NeonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neonButtonVariants>,
    VariantProps<typeof neonButtonInner> {}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = "primary", fullWidth, size = "default", children, type = "button", ...props }, ref) => {
    if (variant === "primary") {
      return (
        <button
          ref={ref}
          type={type}
          className={cn(
            "group relative rounded-full p-[2px] shadow-[var(--vibe-neon-glow)] focus-visible:shadow-[var(--vibe-neon-glow),0_0_0_3px_var(--vibe-neon-cyan)] active:scale-[0.99]",
            fullWidth && "flex w-full",
            className,
          )}
          {...props}
        >
          <span
            className="absolute inset-0 rounded-full bg-gradient-to-r from-[color:var(--vibe-neon-cyan)] to-[color:var(--vibe-neon-purple)]"
            aria-hidden
          />
          <span className={cn(neonButtonInner({ size }))}>{children}</span>
        </button>
      )
    }

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          neonButtonVariants({ variant, fullWidth }),
          size === "sm" && "min-h-9 px-5 py-2.5 text-sm",
          size === "lg" && "min-h-12 px-10 py-4 text-base",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
NeonButton.displayName = "NeonButton"

export { NeonButton, neonButtonVariants }
