import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

const innerBase =
  "relative z-[1] flex w-full min-h-11 items-center justify-center gap-2 text-base font-semibold leading-none text-white transition-[transform,opacity] md:text-sm [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"

export interface NeonLinkProps extends React.ComponentProps<typeof Link> {
  variant?: "primary" | "secondary"
  fullWidth?: boolean
  /** `xl` matches mockup CTAs; `pill` matches legacy NeonButton. */
  shape?: "pill" | "xl"
  size?: "default" | "sm" | "lg"
}

export function NeonLink({
  className,
  variant = "primary",
  fullWidth,
  shape = "xl",
  size = "default",
  children,
  ...props
}: NeonLinkProps) {
  const round = shape === "xl" ? "rounded-xl" : "rounded-full"
  const pad =
    size === "sm" ? "px-5 py-2.5 text-sm" : size === "lg" ? "px-10 py-4 text-base" : "px-8 py-3.5 md:px-7 md:py-3"

  if (variant === "primary") {
    return (
      <Link
        className={cn(
          "group relative inline-flex p-[2px] shadow-[var(--vibe-neon-glow)] transition-[transform,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--neon-bg0)] active:scale-[0.99]",
          round,
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)]",
            round,
          )}
          aria-hidden
        />
        <span className={cn(innerBase, round, pad)}>{children}</span>
      </Link>
    )
  }

  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)] px-8 py-3.5 text-[color:var(--neon-text0)] backdrop-blur-md shadow-[var(--vibe-neon-glow-subtle)] transition-[transform,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--neon-bg0)] active:scale-[0.99] md:px-7 md:py-3",
        round,
        fullWidth && "w-full",
        size === "sm" && "min-h-9 px-5 py-2.5 text-sm",
        size === "lg" && "min-h-12 px-10 py-4 text-base",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
