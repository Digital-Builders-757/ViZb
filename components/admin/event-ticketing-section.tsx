"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Ticket } from "lucide-react"
import { upsertEventPaidTicketTier } from "@/app/actions/ticket-types"
import { DEFAULT_PAID_TIER_NAME } from "@/lib/tickets/paid-tier-validation"
import { GlassCard } from "@/components/ui/glass-card"

export type AdminPaidTierRow = {
  id: string
  name: string
  price_cents: number
  capacity: number | null
  is_active: boolean
  sales_starts_at: string | null
  sales_ends_at: string | null
}

const fieldClass =
  "w-full vibe-input-glass vibe-focus-ring px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground rounded-md"
const labelClass = "text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
const actionButtonClass =
  "rounded-lg border border-border bg-input/90 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground disabled:opacity-50"

function toLocalInput(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

type TicketMode = "free_rsvp" | "paid"

function TicketingFields({
  ticketMode,
  onTicketModeChange,
  paidTier,
  idPrefix = "",
}: {
  ticketMode: TicketMode
  onTicketModeChange: (mode: TicketMode) => void
  paidTier: AdminPaidTierRow | null
  idPrefix?: string
}) {
  const showPaid = ticketMode === "paid"

  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className={labelClass}>Ticket mode</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="radio"
              name="ticket_mode"
              value="free_rsvp"
              checked={ticketMode === "free_rsvp"}
              onChange={() => onTicketModeChange("free_rsvp")}
              className="accent-[color:var(--neon-a)]"
            />
            Free RSVP only
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="radio"
              name="ticket_mode"
              value="paid"
              checked={ticketMode === "paid"}
              onChange={() => onTicketModeChange("paid")}
              className="accent-[color:var(--neon-a)]"
            />
            Paid ticket
          </label>
        </div>
      </fieldset>

      {showPaid ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-border/60 rounded-lg p-4 bg-muted/25">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label htmlFor={`${idPrefix}paid_tier_name`} className={labelClass}>
              Tier name
            </label>
            <input
              id={`${idPrefix}paid_tier_name`}
              name="paid_tier_name"
              required={showPaid}
              defaultValue={paidTier?.name ?? DEFAULT_PAID_TIER_NAME}
              placeholder={DEFAULT_PAID_TIER_NAME}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`${idPrefix}price_usd`} className={labelClass}>
              Price (USD)
            </label>
            <input
              id={`${idPrefix}price_usd`}
              name="price_usd"
              type="text"
              inputMode="decimal"
              required={showPaid}
              placeholder="5.00"
              defaultValue={
                paidTier && paidTier.price_cents > 0
                  ? (paidTier.price_cents / 100).toFixed(2)
                  : ""
              }
              className={fieldClass}
            />
            <p className="text-xs text-muted-foreground">Minimum $0.50 for paid tiers.</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`${idPrefix}capacity`} className={labelClass}>
              Quantity / capacity
            </label>
            <input
              id={`${idPrefix}capacity`}
              name="capacity"
              type="number"
              min={1}
              step={1}
              placeholder="Unlimited"
              defaultValue={paidTier?.capacity ?? ""}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`${idPrefix}sales_starts_at`} className={labelClass}>
              Sales start (optional)
            </label>
            <input
              id={`${idPrefix}sales_starts_at`}
              name="sales_starts_at"
              type="datetime-local"
              defaultValue={toLocalInput(paidTier?.sales_starts_at ?? null)}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`${idPrefix}sales_ends_at`} className={labelClass}>
              Sales end (optional)
            </label>
            <input
              id={`${idPrefix}sales_ends_at`}
              name="sales_ends_at"
              type="datetime-local"
              defaultValue={toLocalInput(paidTier?.sales_ends_at ?? null)}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className={labelClass}>Currency</span>
            <p className="text-sm text-foreground py-2">USD</p>
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <input
              id={`${idPrefix}is_active`}
              name="is_active"
              type="checkbox"
              value="true"
              defaultChecked={paidTier?.is_active !== false}
              className="accent-[color:var(--neon-a)]"
            />
            <label htmlFor={`${idPrefix}is_active`} className="text-sm text-foreground">
              Active — tier is available for purchase
            </label>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** Standalone edit section for admin event detail page. */
export function EventTicketingSection({
  orgSlug,
  eventId,
  eventSlug,
  paidTier,
}: {
  orgSlug: string
  eventId: string
  eventSlug: string
  paidTier: AdminPaidTierRow | null
}) {
  const [pending, startTransition] = useTransition()
  const [ticketMode, setTicketMode] = useState<TicketMode>(
    paidTier && paidTier.price_cents > 0 ? "paid" : "free_rsvp",
  )

  return (
    <GlassCard emphasis className="card-accent-cyan mt-8 p-6 md:p-8">
      <h2 className="text-xs font-mono uppercase tracking-widest text-neon-a mb-2 flex items-center gap-2">
        <Ticket className="w-4 h-4" />
        Ticketing
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Configure free RSVP or a paid ticket tier for Stripe Checkout. Paid tiers require{" "}
        <span className="font-mono text-xs">STRIPE_SECRET_KEY</span> and{" "}
        <span className="font-mono text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</span> on the server.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          fd.set("org_slug", orgSlug)
          fd.set("event_id", eventId)
          fd.set("event_slug", eventSlug)
          fd.set("ticket_mode", ticketMode)
          if (ticketMode === "paid" && !fd.get("is_active")) {
            fd.set("is_active", "false")
          }
          startTransition(async () => {
            const res = await upsertEventPaidTicketTier(fd)
            if ("error" in res && res.error) toast.error(res.error)
            else toast.success("Ticketing saved.")
          })
        }}
      >
        <TicketingFields
          ticketMode={ticketMode}
          onTicketModeChange={setTicketMode}
          paidTier={paidTier}
        />

        <div className="mt-6">
          <button type="submit" disabled={pending} className={actionButtonClass}>
            {pending ? "Saving…" : "Save ticketing"}
          </button>
        </div>
      </form>
    </GlassCard>
  )
}

/** Embedded fields for admin event create form (no submit — parent form handles create). */
export function EventTicketingCreateFields({
  paidTier = null,
}: {
  paidTier?: AdminPaidTierRow | null
}) {
  const [ticketMode, setTicketMode] = useState<TicketMode>("free_rsvp")

  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-neon-a/25 bg-gradient-to-br from-neon-a/18 via-neon-b/14 to-neon-c/12 shadow-[0_0_28px_rgba(0,209,255,0.12)]">
          <Ticket className="h-4 w-4 text-neon-a" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[color:var(--neon-text2)]">04</span>
          <span className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)]">
            Ticketing
          </span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-neon-a/40 via-neon-b/15 to-transparent" />
      </div>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Choose free RSVP only or add a paid ticket tier. You can change this after creation on the event
        detail page.
      </p>
      <TicketingFields
        ticketMode={ticketMode}
        onTicketModeChange={setTicketMode}
        paidTier={paidTier}
        idPrefix="create-"
      />
    </section>
  )
}
