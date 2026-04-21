"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import {
  createEventTicketType,
  deleteEventTicketType,
  updateEventTicketType,
} from "@/app/actions/ticket-types"
import { GlassCard } from "@/components/ui/glass-card"

export type OrganizerTicketTypeRow = {
  id: string
  name: string
  price_cents: number
  sort_order: number
  is_default_rsvp: boolean
  capacity: number | null
  sales_starts_at: string | null
  sales_ends_at: string | null
}

function toLocalInput(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

const fieldClass =
  "w-full vibe-input-glass vibe-focus-ring px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground rounded-md"
const labelClass = "text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
/** Secondary actions — per-tier only; primary “Save event details” lives above in EventDetailsEditForm. */
const tierActionButtonClass =
  "rounded-lg border border-border bg-input/90 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground disabled:opacity-50"

export function EventTicketTypesPanel({
  orgSlug,
  eventId,
  eventSlug,
  types,
}: {
  orgSlug: string
  eventId: string
  eventSlug: string
  types: OrganizerTicketTypeRow[]
}) {
  const [pending, startTransition] = useTransition()

  return (
    <GlassCard emphasis className="card-accent-cyan mt-6 p-6 md:p-8">
      <h2 className="text-xs font-mono uppercase tracking-widest text-neon-a mb-1">RSVP and ticket tiers</h2>
      <p className="text-sm text-muted-foreground mb-3 max-w-2xl">
        Each row is its own form: use <span className="text-foreground/90 font-medium">Save tier</span> for that tier
        only. This does <span className="text-foreground/90 font-medium">not</span> save title, schedule, venue,
        categories, or the whole-event RSVP cap — those use <span className="text-foreground/90 font-medium">Save event details</span>{" "}
        above.
      </p>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl pb-6 border-b border-border/50">
        Free tiers power RSVP ($0). Set a price in USD to sell a tier via Stripe Checkout (requires{" "}
        <span className="font-mono text-xs">STRIPE_SECRET_KEY</span> and{" "}
        <span className="font-mono text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</span> on the server). The default
        RSVP tier must stay free.
      </p>

      <div className="space-y-8">
        {types.map((t) => (
          <div
            key={t.id}
            className="border border-border/60 rounded-lg p-4 space-y-3 bg-muted/25"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">{t.name}</span>
              {t.is_default_rsvp ? (
                <span className="text-[10px] font-mono uppercase tracking-widest text-neon-a border border-neon-a/40 px-2 py-0.5 rounded">
                  Default RSVP
                </span>
              ) : t.price_cents > 0 ? (
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-200/90">Paid</span>
              ) : (
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Free tier
                </span>
              )}
            </div>

            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                startTransition(async () => {
                  const res = await updateEventTicketType(fd)
                  if (res.error) toast.error(res.error)
                  else toast.success("Tier updated.")
                })
              }}
            >
              <input type="hidden" name="org_slug" value={orgSlug} />
              <input type="hidden" name="event_id" value={eventId} />
              <input type="hidden" name="event_slug" value={eventSlug} />
              <input type="hidden" name="ticket_type_id" value={t.id} />

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className={labelClass}>Display name</label>
                <input name="name" required defaultValue={t.name} className={fieldClass} />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Sort order</label>
                <input
                  name="sort_order"
                  type="number"
                  step={1}
                  defaultValue={t.sort_order}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>
                  Price (USD){t.is_default_rsvp ? " — default tier stays free" : ""}
                </label>
                <input
                  name="price_usd"
                  type="text"
                  inputMode="decimal"
                  disabled={t.is_default_rsvp}
                  placeholder="0"
                  defaultValue={t.is_default_rsvp ? "0" : (t.price_cents / 100).toFixed(2)}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Tier capacity (optional)</label>
                <input
                  name="capacity"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Unlimited"
                  defaultValue={t.capacity ?? ""}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Sales start (local)</label>
                <input
                  name="sales_starts_at"
                  type="datetime-local"
                  defaultValue={toLocalInput(t.sales_starts_at)}
                  className={fieldClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Sales end (local)</label>
                <input
                  name="sales_ends_at"
                  type="datetime-local"
                  defaultValue={toLocalInput(t.sales_ends_at)}
                  className={fieldClass}
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-2 pt-1">
                <button type="submit" disabled={pending} className={tierActionButtonClass}>
                  Save tier
                </button>
              </div>
            </form>

            {!t.is_default_rsvp && t.price_cents === 0 ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!confirm("Delete this tier? It must have zero issued tickets.")) return
                  const fd = new FormData()
                  fd.set("org_slug", orgSlug)
                  fd.set("event_id", eventId)
                  fd.set("event_slug", eventSlug)
                  fd.set("ticket_type_id", t.id)
                  startTransition(async () => {
                    const res = await deleteEventTicketType(fd)
                    if (res.error) toast.error(res.error)
                    else toast.success("Tier removed.")
                  })
                }}
              >
                <button
                  type="submit"
                  disabled={pending}
                  className="text-xs font-mono uppercase tracking-widest text-red-400/90 hover:underline disabled:opacity-50"
                >
                  Delete tier
                </button>
              </form>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 section-divider">
        <h3 className={`${labelClass} text-neon-a mb-3`}>Add tier</h3>
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              const res = await createEventTicketType(fd)
              if (res.error) toast.error(res.error)
              else {
                toast.success("Tier added.")
                e.currentTarget.reset()
              }
            })
          }}
        >
          <input type="hidden" name="org_slug" value={orgSlug} />
          <input type="hidden" name="event_id" value={eventId} />
          <input type="hidden" name="event_slug" value={eventSlug} />

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className={labelClass}>Name</label>
            <input name="name" required placeholder="Guest list" className={fieldClass} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Price USD (0 = free)</label>
            <input
              name="price_usd"
              type="text"
              inputMode="decimal"
              placeholder="0"
              defaultValue="0"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Capacity (optional)</label>
            <input name="capacity" type="number" min={1} step={1} placeholder="Unlimited" className={fieldClass} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Sales start (optional)</label>
            <input name="sales_starts_at" type="datetime-local" className={fieldClass} />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className={labelClass}>Sales end (optional)</label>
            <input name="sales_ends_at" type="datetime-local" className={fieldClass} />
          </div>

          <div className="md:col-span-2">
            <button type="submit" disabled={pending} className={tierActionButtonClass}>
              Add tier
            </button>
          </div>
        </form>
      </div>
    </GlassCard>
  )
}
