"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { NeonButton } from "@/components/ui/neon-button"
import type { AdminPaymentsFilterOptions } from "@/lib/admin/load-admin-payments"

type FilterValues = {
  event?: string
  organizer?: string
  payoutStatus?: string
  paymentStatus?: string
  disputeStatus?: string
}

export function AdminPaymentsFilters({
  basePath,
  options,
  values,
  showPayoutStatus = true,
  showPaymentStatus = true,
  showDisputeStatus = true,
}: {
  basePath: string
  options: AdminPaymentsFilterOptions
  values: FilterValues
  showPayoutStatus?: boolean
  showPaymentStatus?: boolean
  showDisputeStatus?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function apply(formData: FormData) {
    const params = new URLSearchParams()
    const keys = ["event", "organizer", "payoutStatus", "paymentStatus", "disputeStatus"] as const
    for (const key of keys) {
      const value = String(formData.get(key) ?? "").trim()
      if (value) params.set(key, value)
    }
    const qs = params.toString()
    router.push(qs ? `${basePath}?${qs}` : basePath)
  }

  function clearFilters() {
    router.push(basePath)
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        apply(new FormData(event.currentTarget))
      }}
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"
    >
      <label className="space-y-1 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Event</span>
        <select
          name="event"
          defaultValue={values.event ?? ""}
          className="w-full rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-3 py-2 text-sm"
        >
          <option value="">All events</option>
          {options.events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Organizer</span>
        <select
          name="organizer"
          defaultValue={values.organizer ?? ""}
          className="w-full rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-3 py-2 text-sm"
        >
          <option value="">All organizers</option>
          {options.organizers.map((organizer) => (
            <option key={organizer.id} value={organizer.id}>
              {organizer.label}
            </option>
          ))}
        </select>
      </label>

      {showPayoutStatus ? (
        <label className="space-y-1 text-sm">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Payout status</span>
          <select
            name="payoutStatus"
            defaultValue={values.payoutStatus ?? searchParams.get("payoutStatus") ?? ""}
            className="w-full rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-3 py-2 text-sm"
          >
            <option value="">All payout statuses</option>
            <option value="pending">Pending</option>
            <option value="blocked">Blocked</option>
            <option value="released">Released</option>
            <option value="failed">Failed</option>
            <option value="not_required">Not required</option>
          </select>
        </label>
      ) : null}

      {showPaymentStatus ? (
        <label className="space-y-1 text-sm">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Payment status</span>
          <select
            name="paymentStatus"
            defaultValue={values.paymentStatus ?? ""}
            className="w-full rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-3 py-2 text-sm"
          >
            <option value="">All payment statuses</option>
            <option value="created">Created</option>
            <option value="checkout_started">Checkout started</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
          </select>
        </label>
      ) : null}

      {showDisputeStatus ? (
        <label className="space-y-1 text-sm">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Dispute status</span>
          <select
            name="disputeStatus"
            defaultValue={values.disputeStatus ?? ""}
            className="w-full rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-3 py-2 text-sm"
          >
            <option value="">All dispute statuses</option>
            <option value="none">None</option>
            <option value="disputed">Disputed</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="warning_closed">Warning closed</option>
          </select>
        </label>
      ) : null}

      <div className="flex items-end gap-2 xl:col-span-2">
        <NeonButton type="submit" size="sm">
          Apply filters
        </NeonButton>
        <NeonButton type="button" variant="secondary" size="sm" onClick={clearFilters}>
          Clear
        </NeonButton>
      </div>
    </form>
  )
}
