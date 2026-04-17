"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Save, X } from "lucide-react"
import { toast } from "sonner"
import { updateEventDetails } from "@/app/actions/event"
import { EVENT_CATEGORY_OPTIONS } from "@/lib/events/categories"

export function EventDetailsEditForm({
  event,
}: {
  event: {
    id: string
    org_id: string
    title: string
    description: string | null
    starts_at: string
    ends_at: string | null
    venue_name: string
    address: string | null
    city: string
    categories: string[]
    status: string
    rsvp_capacity?: number | null
    updated_at?: string
  }
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const initialCap =
    event.rsvp_capacity != null && event.rsvp_capacity > 0 ? String(event.rsvp_capacity) : ""
  const [rsvpMode, setRsvpMode] = useState<"unlimited" | "capped">(
    initialCap ? "capped" : "unlimited",
  )
  const [rsvpCapInput, setRsvpCapInput] = useState(initialCap)

  const [selected, setSelected] = useState<Set<string>>(
    new Set(Array.isArray(event.categories) ? event.categories : []),
  )

  const archived = event.status === "archived"

  function toggleCategory(value: string) {
    setIsDirty(true)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  return (
    <form
      onInput={() => setIsDirty(true)}
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)

        const fd = new FormData(e.currentTarget)
        fd.set("event_id", event.id)
        fd.set("org_id", event.org_id)
        for (const c of selected) fd.append("categories", c)

        if (rsvpMode === "unlimited") {
          fd.set("rsvp_capacity", "")
        } else {
          const capRaw = rsvpCapInput.trim()
          if (!capRaw) {
            setError("Enter a maximum number of free RSVPs, or choose Unlimited RSVPs.")
            return
          }
          fd.set("rsvp_capacity", capRaw)
        }

        startTransition(async () => {
          const res = await updateEventDetails(fd)
          if (res?.error) {
            setError(res.error)
            return
          }
          toast.success("Event details saved.")
          setIsDirty(false)
          router.refresh()
        })
      }}
      className="mt-6 space-y-4"
    >
      {archived ? (
        <p className="text-sm text-muted-foreground">This event is archived and can’t be edited.</p>
      ) : null}

      {!archived ? (
        <p className="text-[11px] text-muted-foreground leading-relaxed max-w-2xl border border-border/50 bg-muted/5 px-3 py-2.5 rounded-sm">
          <span className="font-mono uppercase tracking-wider text-muted-foreground/90">This section</span> — title,
          schedule, venue, description, categories, and whole-event RSVP cap — saves with{" "}
          <span className="text-foreground/90">Save event details</span> below. Ticket tier names, prices, and per-tier
          capacity are separate: use <span className="text-foreground/90">Save tier</span> in RSVP and ticket tiers.
        </p>
      ) : null}

      {error ? (
        <div className="border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
          <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Title</label>
          <input
            name="title"
            defaultValue={event.title}
            required
            disabled={archived}
            className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">City</label>
          <input
            name="city"
            defaultValue={event.city}
            required
            disabled={archived}
            className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Description</label>
        <textarea
          name="description"
          defaultValue={event.description ?? ""}
          rows={4}
          disabled={archived}
          className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors resize-none disabled:opacity-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Starts at</label>
          <input
            name="starts_at"
            type="datetime-local"
            defaultValue={event.starts_at?.slice(0, 16)}
            required
            disabled={archived}
            className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Ends at (optional)</label>
          <input
            name="ends_at"
            type="datetime-local"
            defaultValue={event.ends_at ? event.ends_at.slice(0, 16) : ""}
            disabled={archived}
            className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      <div className="pt-6 mt-2 section-divider flex flex-col gap-3">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Whole-event RSVP cap
          </span>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed max-w-xl">
            Saved with <span className="text-foreground/85">Save event details</span> — not with Save tier. This is the
            event-wide limit on active free RSVPs (confirmed or checked in). Use Unlimited unless you need a hard cap.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setIsDirty(true)
              setRsvpMode("unlimited")
              setRsvpCapInput("")
            }}
            disabled={archived}
            className={`border px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50 ${
              rsvpMode === "unlimited"
                ? "border-brand-cyan bg-brand-cyan/10 text-foreground"
                : "border-border text-muted-foreground hover:border-muted-foreground/50"
            }`}
          >
            Unlimited RSVPs
          </button>
          <button
            type="button"
            onClick={() => {
              setIsDirty(true)
              setRsvpMode("capped")
            }}
            disabled={archived}
            className={`border px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50 ${
              rsvpMode === "capped"
                ? "border-brand-cyan bg-brand-cyan/10 text-foreground"
                : "border-border text-muted-foreground hover:border-muted-foreground/50"
            }`}
          >
            Set RSVP cap
          </button>
        </div>
        {rsvpMode === "capped" ? (
          <div className="flex flex-col gap-2">
            <label
              htmlFor="rsvp_capacity_edit"
              className="text-xs font-mono uppercase tracking-widest text-muted-foreground"
            >
              Maximum free RSVPs
            </label>
            <input
              id="rsvp_capacity_edit"
              type="number"
              min={1}
              step={1}
              value={rsvpCapInput}
              onChange={(e) => {
                setIsDirty(true)
                setRsvpCapInput(e.target.value)
              }}
              placeholder="e.g. 150"
              disabled={archived}
              className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors disabled:opacity-50"
            />
            <p className="text-[11px] text-muted-foreground">
              Cannot be set below current confirmed + checked-in count (server enforced).
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">No whole-event RSVP cap.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Venue name</label>
          <input
            name="venue_name"
            defaultValue={event.venue_name}
            required
            disabled={archived}
            className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Address (optional)</label>
          <input
            name="address"
            defaultValue={event.address ?? ""}
            disabled={archived}
            className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Categories</legend>
        <div className="flex flex-wrap gap-2">
          {EVENT_CATEGORY_OPTIONS.map((cat) => {
            const on = selected.has(cat.value)
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCategory(cat.value)}
                disabled={archived}
                className={`border px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50 ${
                  on
                    ? "border-brand-cyan bg-brand-cyan/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-muted-foreground/50"
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div
        className={`sticky bottom-0 z-10 mt-6 -mx-1 px-1 pt-4 pb-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-border/70 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/98 to-[#0c0c0c]/85 backdrop-blur-md`}
      >
        <button
          type="submit"
          disabled={archived || isPending || !isDirty}
          className="inline-flex items-center gap-2 border border-border bg-[#111111] px-4 py-2.5 text-xs font-mono uppercase tracking-widest text-foreground hover:border-brand-cyan/40 hover:text-brand-cyan transition-colors disabled:opacity-50 disabled:hover:border-border disabled:hover:text-foreground"
        >
          <Save className="w-4 h-4" />
          {isPending ? "Saving…" : "Save event details"}
        </button>
        {!archived && !isDirty ? (
          <p className="mt-2 text-[11px] text-muted-foreground">Change a field above to enable saving.</p>
        ) : null}
        {event.status === "published" ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Published event: edits update the public page immediately (flyer changes stay locked).
          </p>
        ) : null}
      </div>
    </form>
  )
}
