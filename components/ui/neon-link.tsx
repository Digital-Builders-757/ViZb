import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

const innerBase =
  "relative z-[1] flex w-full min-h-11 items-center justify-center gap-2 text-base font-semibold leading-none text-white transition-[transform,opacity,background-color] duration-300 md:text-sm [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"

export interface NeonLinkProps extends React.ComponentProps<typeof Link> {
  variant?: "primary" | "secondary" | "ghost"
  fullWidth?: boolean
  /** `xl` matches mockup CTAs; `pill` matches legacy NeonButton. */
  shape?: "pill" | "xl"
  size?: "default" | "sm" | "lg"
  neon?: boolean
}

export function NeonLink({
  className,
  variant = "primary",
  fullWidth,
  shape = "xl",
  size = "default",
  neon = true,
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
          "group relative inline-flex p-[2px] shadow-[var(--vibe-neon-glow)] hover:shadow-[0_0_32px_rgba(0,209,255,0.45),0_0_64px_rgba(157,77,255,0.3)] transition-shadow duration-300 vibe-focus-ring active:scale-[0.99]",
          round,
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {/* Animated gradient border */}
        <span
          className={cn(
            "absolute inset-0 animate-neon-border-flow bg-gradient-to-r from-[color:var(--neon-a)] via-[color:var(--neon-b)] to-[color:var(--neon-a)] bg-[length:200%_100%]",
            round,
          )}
          aria-hidden
        />
        {/* Inner content */}
        <span className={cn(innerBase, round, pad, "bg-[color:var(--neon-bg0)]/80 group-hover:bg-[color:var(--neon-bg0)]/60")}>{children}</span>
      </Link>
    )
  }

  // Secondary and ghost variants
  return (
    <Link
      className={cn(
        "group relative inline-flex min-h-11 items-center justify-center border px-8 py-3.5 text-[color:var(--neon-text0)] backdrop-blur-md transition-all duration-300 vibe-focus-ring active:scale-[0.99] md:px-7 md:py-3",
        variant === "secondary"
          ? "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)] shadow-[var(--vibe-neon-glow-subtle)] hover:border-[color:var(--neon-a)]/40 hover:bg-[color:var(--neon-surface)]/70"
          : "border-transparent bg-transparent hover:border-[color:var(--neon-hairline)] hover:bg-[color:var(--neon-surface)]/50",
        round,
        fullWidth && "w-full",
        size === "sm" && "min-h-9 px-5 py-2.5 text-sm",
        size === "lg" && "min-h-12 px-10 py-4 text-base",
        className,
      )}
      {...props}
    >
      {/* Top neon line - appears on hover */}
      {neon && (
        <span
          className="absolute h-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out inset-x-0 top-0 bg-gradient-to-r w-3/4 mx-auto from-transparent via-[color:var(--neon-a)] to-transparent"
          aria-hidden
        />
      )}
      {/* Content */}
      <span className="relative z-10">{children}</span>
      {/* Bottom neon line */}
      {neon && (
        <span
          className="absolute opacity-30 group-hover:opacity-70 transition-all duration-500 ease-in-out inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent via-[color:var(--neon-a)] to-transparent"
          aria-hidden
        />
      )}
    </Link>
  )
}
