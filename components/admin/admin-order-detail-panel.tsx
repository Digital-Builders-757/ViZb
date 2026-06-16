import Link from "next/link"
import type { ReactNode } from "react"

import { AdminPayoutOrderActions } from "@/components/admin/admin-payout-order-actions"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { formatUsdFromCents } from "@/lib/money/usd"
import type { AdminOrderDetail } from "@/lib/admin/load-admin-payments"

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  )
}

function MonoValue({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return (
    <span className="break-all font-mono text-xs" title={value}>
      {value}
    </span>
  )
}

export function AdminOrderDetailPanel({ order }: { order: AdminOrderDetail }) {
  const payout = order.payout

  return (
    <div className="space-y-6">
      <GlassCard className="p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Buyer" value={order.buyerLabel} />
          <Field
            label="Event"
            value={
              order.eventSlug ? (
                <Link href={`/events/${order.eventSlug}`} className="underline-offset-4 hover:underline">
                  {order.eventTitle}
                </Link>
              ) : (
                order.eventTitle
              )
            }
          />
          <Field label="Organizer" value={order.organizerLabel} />
          <Field label="Tier" value={order.tierName} />
          <Field label="Order status" value={order.orderStatus.replace(/_/g, " ")} />
          <Field label="Created" value={new Date(order.createdAt).toLocaleString()} />
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-neon-a">Payment math</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Ticket subtotal" value={formatUsdFromCents(order.ticketSubtotalCents)} />
          <Field label="ViZb service fee" value={formatUsdFromCents(order.vizbServiceFeeCents)} />
          <Field label="Processing fee" value={formatUsdFromCents(order.processingFeeCents)} />
          <Field label="Buyer total" value={formatUsdFromCents(order.buyerTotalCents)} />
          <Field label="Organizer payout" value={formatUsdFromCents(order.organizerPayoutCents)} />
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-neon-b">Lifecycle</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Payment status" value={order.paymentStatus} />
          <Field label="Refund status" value={order.refundStatus} />
          <Field label="Dispute status" value={order.disputeStatus} />
          <Field label="Payout status" value={order.payoutStatus} />
          <Field
            label="Payout hold"
            value={
              order.payoutBlocked
                ? `Yes (${order.payoutBlockedReason ?? "unknown"})`
                : "No"
            }
          />
          <Field
            label="Payout released at"
            value={order.payoutReleasedAt ? new Date(order.payoutReleasedAt).toLocaleString() : "—"}
          />
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Stripe references</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Field label="Checkout session" value={<MonoValue value={order.stripeCheckoutSessionId} />} />
          <Field label="Payment intent" value={<MonoValue value={order.stripePaymentIntentId} />} />
          <Field label="Charge" value={<MonoValue value={order.stripeChargeId} />} />
        </div>
      </GlassCard>

      {payout ? (
        <GlassCard className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-neon-c">Organizer payout record</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Status <span className="font-mono text-foreground">{payout.status}</span>
                {payout.blockedReason ? (
                  <>
                    {" "}
                    · blocked: <span className="font-mono text-amber-200">{payout.blockedReason}</span>
                  </>
                ) : null}
                {payout.failureReason ? (
                  <>
                    {" "}
                    · failed: <span className="font-mono text-red-200">{payout.failureReason}</span>
                  </>
                ) : null}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Available on {new Date(payout.availableOn).toLocaleString()}
              </p>
              {payout.stripeTransferId ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Transfer <span className="font-mono text-foreground">{payout.stripeTransferId}</span>
                </p>
              ) : null}
            </div>
            <NeonLink href="/admin/payments/payouts" variant="secondary" size="sm">
              All payouts
            </NeonLink>
          </div>

          <div className="mt-4">
            <AdminPayoutOrderActions
              orderId={order.id}
              payoutId={payout.id}
              payoutBlocked={order.payoutBlocked}
              payoutBlockedReason={order.payoutBlockedReason}
              payoutReleasedAt={order.payoutReleasedAt}
              releaseEligible={payout.releaseEligible}
              releaseBlockReason={payout.releaseBlockReason}
              payoutStatus={order.payoutStatus}
            />
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">No organizer payout record exists for this order yet.</p>
        </GlassCard>
      )}
    </div>
  )
}
