"use client"

import * as React from "react"
import Link from "next/link"
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react"

import type { AuthErrorAction, MappedAuthError } from "@/lib/auth/auth-error-map"
import { cn } from "@/lib/utils"
import { NeonLink } from "@/components/ui/neon-link"
import { NeonButton } from "@/components/ui/neon-button"

const variantStyles = {
  error: {
    wrap: "border-2 border-[color:var(--neon-b)]/45 bg-[color:var(--neon-b)]/10 shadow-[0_0_28px_rgba(157,77,255,0.14),inset_0_1px_0_rgb(255_255_255/0.05)]",
    title: "text-[color:var(--neon-text0)]",
    message: "text-[color:var(--neon-text1)]",
    hint: "text-[color:var(--neon-text2)]",
    icon: "text-[color:var(--neon-b)]",
    role: "alert" as const,
  },
  warning: {
    wrap: "border-2 border-amber-400/45 bg-amber-500/12 shadow-[0_0_24px_rgba(251,191,36,0.12),inset_0_1px_0_rgb(255_255_255/0.05)]",
    title: "text-[color:var(--neon-text0)]",
    message: "text-[color:var(--neon-text1)]",
    hint: "text-[color:var(--neon-text2)]",
    icon: "text-amber-200",
    role: "alert" as const,
  },
  success: {
    wrap: "border-2 border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/10 shadow-[0_0_28px_rgba(0,209,255,0.14),inset_0_1px_0_rgb(255_255_255/0.05)]",
    title: "text-[color:var(--neon-text0)]",
    message: "text-[color:var(--neon-text1)]",
    hint: "text-[color:var(--neon-text2)]",
    icon: "text-[color:var(--neon-a)]",
    role: "status" as const,
  },
  info: {
    wrap: "border-2 border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/28 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]",
    title: "text-[color:var(--neon-text0)]",
    message: "text-[color:var(--neon-text1)]",
    hint: "text-[color:var(--neon-text2)]",
    icon: "text-[color:var(--neon-a)]",
    role: "status" as const,
  },
}

function DefaultIcon({ variant }: { variant: keyof typeof variantStyles }) {
  switch (variant) {
    case "error":
      return <AlertCircle className="size-5 shrink-0" aria-hidden />
    case "warning":
      return <AlertTriangle className="size-5 shrink-0" aria-hidden />
    case "success":
      return <CheckCircle2 className="size-5 shrink-0" aria-hidden />
    default:
      return <Info className="size-5 shrink-0" aria-hidden />
  }
}

function ActionControl({
  action,
  prefer,
}: {
  action: AuthErrorAction
  prefer: "primary" | "secondary"
}) {
  const isPrimary = prefer === "primary"
  if (action.href) {
    if (isPrimary) {
      return (
        <NeonLink href={action.href} variant="primary" shape="xl" size="sm" className="w-full sm:w-auto min-w-[8rem] justify-center text-center">
          {action.label}
        </NeonLink>
      )
    }
    return (
      <Link
        href={action.href}
        className={cn(
          "vibe-focus-ring motion-safe:transition-colors motion-reduce:transition-none inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/22 px-5 text-center text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur-sm hover:border-[color:var(--neon-a)]/35",
          "w-full sm:w-auto",
        )}
      >
        {action.label}
      </Link>
    )
  }
  if (action.onClick) {
    return (
      <NeonButton
        type="button"
        variant={isPrimary ? "primary" : "secondary"}
        shape="xl"
        size="sm"
        className="w-full sm:w-auto min-w-[8rem]"
        onClick={action.onClick}
      >
        {action.label}
      </NeonButton>
    )
  }
  return null
}

export interface AuthAlertProps {
  variant: keyof typeof variantStyles
  title?: string
  message: string
  hint?: string
  icon?: React.ReactNode
  /** Built-in row layouts merge actions from a mapped error */
  mapped?: Pick<MappedAuthError, "primaryAction" | "secondaryAction">
  className?: string
  /** Reserve vertical space to reduce layout shift when alerts toggle. */
  reserveMinHeight?: boolean
}

export function AuthAlert({
  variant,
  title,
  message,
  hint,
  icon,
  mapped,
  className,
  reserveMinHeight = false,
}: AuthAlertProps) {
  const styles = variantStyles[variant]
  const Icon = icon ?? <DefaultIcon variant={variant} />

  return (
    <div
      data-testid="auth-alert"
      data-auth-alert-variant={variant}
      role={styles.role}
      aria-live={variant === "error" || variant === "warning" ? "assertive" : "polite"}
      className={cn(
        "motion-safe:transition-[box-shadow,opacity] motion-reduce:transition-none rounded-xl border px-4 py-3.5 sm:px-5 sm:py-4",
        reserveMinHeight && "min-h-[5.5rem]",
        styles.wrap,
        className,
      )}
    >
      <div className="flex gap-3 sm:gap-4">
        <span className={cn("mt-0.5 shrink-0", styles.icon)}>{Icon}</span>
        <div className="min-w-0 flex-1 space-y-2">
          {title ? (
            <p className={cn("text-sm font-semibold leading-snug sm:text-base", styles.title)}>{title}</p>
          ) : null}
          <p className={cn("text-sm leading-relaxed", styles.message)}>{message}</p>
          {hint ? (
            <p className={cn("text-xs leading-relaxed sm:text-[13px]", styles.hint)}>{hint}</p>
          ) : null}
          {(mapped?.primaryAction || mapped?.secondaryAction) && (
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
              {mapped.primaryAction ? (
                <ActionControl action={mapped.primaryAction} prefer="primary" />
              ) : null}
              {mapped.secondaryAction ? (
                <ActionControl action={mapped.secondaryAction} prefer="secondary" />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
