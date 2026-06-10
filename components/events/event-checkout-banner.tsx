"use client"

import Link from "next/link"
import { X } from "lucide-react"

export function EventCheckoutBanner({
  variant,
  onDismiss,
}: {
  variant: "cancelled" | "pending" | "error"
  onDismiss?: () => void
}) {
  const styles =
    variant === "cancelled"
      ? "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35"
      : variant === "pending"
        ? "border-amber-400/40 bg-amber-400/10"
        : "border-red-400/35 bg-red-400/10"

  const title =
    variant === "cancelled"
      ? "Checkout cancelled"
      : variant === "pending"
        ? "Confirming your ticket"
        : "Checkout issue"

  const body =
    variant === "cancelled"
      ? "No payment was taken. You can try again when you're ready."
      : variant === "pending"
        ? "Payment received. We're confirming your ticket now — check My Tickets in a moment or refresh that page."
        : "We couldn't confirm your purchase yet. Open My Tickets to check status, or contact support if payment was taken."

  return (
    <div className={`mt-4 rounded-xl border px-4 py-3 ${styles}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-[color:var(--neon-text1)]">{body}</p>
          {variant !== "cancelled" ? (
            <p className="mt-2 text-[11px] text-[color:var(--neon-text2)]">
              <Link href="/tickets" className="text-[color:var(--neon-a)] underline-offset-4 hover:underline">
                Open My Tickets
              </Link>
            </p>
          ) : null}
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-full p-1 text-[color:var(--neon-text2)] transition-colors hover:text-[color:var(--neon-text0)]"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  )
}
