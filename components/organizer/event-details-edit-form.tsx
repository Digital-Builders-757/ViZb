"use client"

import { useState, useTransition } from "react"
import { Save, X } from "lucide-react"
import { updateEventDetails } from "@/app/actions/event"

const CATEGORIES = [
  { value: "party", label: "Party" },
  { value: "concert", label: "Concert" },
  { value: "workshop", label: "Workshop" },
  { value: "networking", label: "Networking" },
  { value: "social", label: "Social" },
  { value: "other", label: "Other" },
]

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
  }
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<Set<string>>(
    new Set(Array.isArray(event.categories) ? event.categories : []),
  )

  function toggleCategory(value: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)

        const fd = new FormData(e.currentTarget)
        fd.set("event_id", event.id)
        fd.set("org_id", event.org_id)
        // categories (multi)
        for (const c of selected) fd.append("categories", c)

        startTransition(async () => {
          const res = await updateEventDetails(fd)
          if (res?.error) setError(res.error)
        })
      }}
      className="mt-6 space-y-4"
    >
      {event.status === "archived" ? (
        <p className="text-sm text-muted-foreground">This event is archived and can’t be edited.</p>
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
            className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">City</label>
          <input
            name="city"
            defaultValue={event.city}
            required
            className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Description</label>
        <textarea
          name="description"
          defaultValue={event.description ?? ""}
          rows={4}
          className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors resize-none"
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
            className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Ends at (optional)</label>
          <input
            name="ends_at"
            type="datetime-local"
            defaultValue={event.ends_at ? event.ends_at.slice(0, 16) : ""}
            className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Venue name</label>
          <input
            name="venue_name"
            defaultValue={event.venue_name}
            required
            className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Address (optional)</label>
          <input
            name="address"
            defaultValue={event.address ?? ""}
            className="w-full bg-[#0a0a0a] border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors"
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Categories</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const on = selected.has(cat.value)
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCategory(cat.value)}
                className={`border px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
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

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending || event.status === "archived"}
          className="inline-flex items-center gap-2 border border-border bg-[#111111] px-4 py-2.5 text-xs font-mono uppercase tracking-widest text-foreground hover:border-brand-cyan/40 hover:text-brand-cyan transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isPending ? "Saving..." : "Save details"}
        </button>
        {event.status === "published" ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Published event: edits will update the public page immediately (flyer changes are still locked).
          </p>
        ) : null}
      </div>
    </form>
  )
}
