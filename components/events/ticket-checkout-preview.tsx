import { formatUsdFromCents } from "@/lib/money/usd"
import type { TicketCheckoutAmounts } from "@/lib/payments/ticket-fees"

export function TicketCheckoutPreview({ amounts }: { amounts: TicketCheckoutAmounts }) {
  return (
    <div
      className="mb-3 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-4 py-3"
      aria-label="Checkout preview"
    >
      <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
        Checkout preview
      </p>
      <dl className="space-y-1.5 text-xs text-[color:var(--neon-text2)]">
        <div className="flex items-center justify-between gap-4">
          <dt>Ticket subtotal</dt>
          <dd className="font-mono text-[color:var(--neon-text1)]">
            {formatUsdFromCents(amounts.subtotalCents)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>ViZB service fee</dt>
          <dd className="font-mono text-[color:var(--neon-text1)]">
            {formatUsdFromCents(amounts.platformFeeCents)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>Payment processing fee</dt>
          <dd className="font-mono text-[color:var(--neon-text1)]">
            {formatUsdFromCents(amounts.processingFeeCents)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-[color:var(--neon-hairline)] pt-2">
          <dt className="text-[color:var(--neon-text0)]">Total due today</dt>
          <dd className="font-mono text-sm text-[color:var(--neon-text0)]">
            {formatUsdFromCents(amounts.totalCents)}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[10px] leading-relaxed text-[color:var(--neon-text2)]">
        Stripe Checkout shows the same three line items and total before you pay.
      </p>
    </div>
  )
}
