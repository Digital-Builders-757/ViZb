import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const neonButtonInner = cva(
  "relative z-[1] flex w-full min-h-11 items-center justify-center gap-2 text-base font-semibold leading-none text-white transition-[transform,opacity] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 md:text-sm [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      size: {
        default: "px-8 py-3.5 md:px-7 md:py-3",
        sm: "px-5 py-2.5 text-sm",
        lg: "px-10 py-4 text-base",
      },
      shape: {
        pill: "rounded-full",
        xl: "rounded-xl",
      },
    },
    defaultVariants: { size: "default", shape: "pill" },
  },
)

const neonButtonVariants = cva(
  "vibe-focus-ring inline-flex items-center justify-center text-base font-semibold leading-none transition-[box-shadow,transform,opacity] disabled:pointer-events-none disabled:opacity-50 md:text-sm [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "",
        secondary:
          "min-h-11 border border-[color:var(--vibe-glass-border)] bg-[color:var(--vibe-glass-bg)] px-8 py-3.5 text-foreground backdrop-blur-md shadow-[var(--vibe-neon-glow-subtle)] active:scale-[0.99] md:px-7 md:py-3",
        ghost:
          "min-h-11 border border-transparent bg-transparent px-8 py-3.5 text-foreground hover:border-[color:var(--vibe-glass-border)] hover:bg-[color:var(--vibe-glass-bg)]/50 active:scale-[0.99] md:px-7 md:py-3",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
      shape: {
        pill: "rounded-full",
        xl: "rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      fullWidth: false,
      shape: "pill",
    },
  },
)

export interface NeonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neonButtonVariants>,
    VariantProps<typeof neonButtonInner> {
  neon?: boolean
  asChild?: boolean
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  (
    { className, variant = "primary", fullWidth, shape = "pill", size = "default", neon = true, asChild = false, children, type = "button", ...props },
    ref,
  ) => {
    const round = shape === "xl" ? "rounded-xl" : "rounded-full"

    // For asChild, we wrap the child in a span structure that provides the neon effects
    // The Slot component will merge props onto the single child element
    if (asChild) {
      if (variant === "primary") {
        return (
          <Slot
            ref={ref}
            className={cn(
              "group relative inline-flex p-[2px] shadow-[var(--vibe-neon-glow)] vibe-focus-ring active:scale-[0.99] hover:shadow-[0_0_32px_rgba(0,209,255,0.45),0_0_64px_rgba(157,77,255,0.3)] transition-shadow duration-300",
              round,
              fullWidth && "w-full",
              className,
            )}
            {...props}
          >
            {children}
          </Slot>
        )
      }
      return (
        <Slot
          ref={ref}
          className={cn(
            "group relative",
            neonButtonVariants({ variant, fullWidth, shape }),
            size === "sm" && "min-h-9 px-5 py-2.5 text-sm",
            size === "lg" && "min-h-12 px-10 py-4 text-base",
            className,
          )}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    // Regular button rendering with full neon effects
    if (variant === "primary") {
      return (
        <button
          ref={ref}
          type={type}
          className={cn(
            "group relative p-[2px] shadow-[var(--vibe-neon-glow)] vibe-focus-ring active:scale-[0.99] hover:shadow-[0_0_32px_rgba(0,209,255,0.45),0_0_64px_rgba(157,77,255,0.3)] transition-shadow duration-300",
            round,
            fullWidth && "flex w-full",
            className,
          )}
          {...props}
        >
          {/* Animated gradient border */}
          <span
            className={cn(
              "absolute inset-0 animate-neon-border-flow bg-gradient-to-r from-[color:var(--vibe-neon-cyan)] via-[color:var(--vibe-neon-purple)] to-[color:var(--vibe-neon-cyan)] bg-[length:200%_100%]",
              round,
            )}
            aria-hidden
          />
          {/* Inner content with background */}
          <span className={cn(neonButtonInner({ size, shape }), "bg-[color:var(--neon-bg0)]/80 group-hover:bg-[color:var(--neon-bg0)]/60 transition-colors duration-300", round)}>{children}</span>
        </button>
      )
    }

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "group relative",
          neonButtonVariants({ variant, fullWidth, shape }),
          size === "sm" && "min-h-9 px-5 py-2.5 text-sm",
          size === "lg" && "min-h-12 px-10 py-4 text-base",
          className,
        )}
        {...props}
      >
        {/* Top neon line - appears on hover */}
        {neon && (
          <span
            className="absolute h-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out inset-x-0 top-0 bg-gradient-to-r w-3/4 mx-auto from-transparent via-[color:var(--vibe-neon-cyan)] to-transparent"
            aria-hidden
          />
        )}
        {/* Content */}
        <span className="relative z-10">{children}</span>
        {/* Bottom neon line - subtle always, brighter on hover */}
        {neon && (
          <span
            className="absolute opacity-30 group-hover:opacity-70 transition-all duration-500 ease-in-out inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent via-[color:var(--vibe-neon-cyan)] to-transparent"
            aria-hidden
          />
        )}
      </button>
    )
  },
)
NeonButton.displayName = "NeonButton"

export { NeonButton, neonButtonVariants }
