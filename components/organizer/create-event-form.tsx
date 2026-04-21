"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createEvent } from "@/app/actions/event"
import { ArrowLeft, CalendarIcon, MapPin, FileText, Clock, Sparkles, X } from "lucide-react"
import Link from "next/link"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { EVENT_CATEGORY_OPTIONS } from "@/lib/events/categories"
import { GlassCard } from "@/components/ui/glass-card"

interface CreateEventFormProps {
  orgId: string
  orgSlug: string
  orgName: string
  /** Staff admin: back/cancel go to `/admin`, success to `/admin/events/[id]`. Default: organizer URLs. */
  flow?: "organizer" | "admin"
}

function SectionHeader({ icon: Icon, label, number }: { icon: React.ElementType; label: string; number: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-neon-a/25 bg-gradient-to-br from-neon-a/18 via-neon-b/14 to-neon-c/12 shadow-[0_0_28px_rgba(0,209,255,0.12)]">
        <Icon className="h-4 w-4 text-neon-a" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-[color:var(--neon-text2)]">{number}</span>
        <span className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)]">{label}</span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-neon-a/40 via-neon-b/15 to-transparent" />
    </div>
  )
}

export function CreateEventForm({ orgId, orgSlug, orgName, flow = "organizer" }: CreateEventFormProps) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [startTime, setStartTime] = useState("19:00")
  const [endTime, setEndTime] = useState("23:00")
  const [startOpen, setStartOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [rsvpMode, setRsvpMode] = useState<"unlimited" | "capped">("unlimited")
  const [rsvpCapInput, setRsvpCapInput] = useState("")

  function toggleCategory(value: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!startDate) {
      setError("Please select a start date.")
      setLoading(false)
      return
    }

    if (selectedCategories.size === 0) {
      setError("Select at least one category.")
      setLoading(false)
      return
    }

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set("org_id", orgId)
    for (const c of selectedCategories) {
      formData.append("categories", c)
    }

    if (rsvpMode === "unlimited") {
      formData.set("rsvp_capacity", "")
    } else {
      const capRaw = rsvpCapInput.trim()
      if (!capRaw) {
        setError("Enter a maximum number of free RSVPs, or choose Unlimited RSVPs.")
        setLoading(false)
        return
      }
      formData.set("rsvp_capacity", capRaw)
    }

    const startDateTime = `${format(startDate, "yyyy-MM-dd")}T${startTime}`
    formData.set("starts_at", startDateTime)

    if (endDate) {
      const endDateTime = `${format(endDate, "yyyy-MM-dd")}T${endTime}`
      formData.set("ends_at", endDateTime)
    }

    const result = await createEvent(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.success && result.event) {
      if (flow === "admin") {
        router.push(`/admin/events/${result.event.id}`)
      } else {
        router.push(`/organizer/${orgSlug}/events/${result.event.slug}`)
      }
      router.refresh()
    }
  }

  const inputClass =
    "vibe-input-glass vibe-focus-ring w-full rounded-lg px-4 py-3 font-sans text-sm text-[color:var(--neon-text0)] placeholder:text-[color:var(--neon-text2)]"
  const labelClass = "text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text1)]"
  const helpTextClass = "text-[11px] leading-relaxed text-[color:var(--neon-text2)]"
  const quietTextClass = "text-[color:var(--neon-text2)]"
  const chipOffClass = "border-[color:var(--neon-hairline)] bg-white/[0.02] text-[color:var(--neon-text1)] hover:border-neon-a/35 hover:bg-neon-a/[0.07] hover:text-[color:var(--neon-text0)]"
  const chipOnClass = "border-neon-a bg-neon-a/12 text-[color:var(--neon-text0)] shadow-[0_0_18px_rgba(0,209,255,0.12)]"

  return (
    <div className="form-glow-bg min-h-full pb-28">
      {/* Back link */}
      <Link
        href={flow === "admin" ? "/admin" : `/organizer/${orgSlug}`}
        className="mb-8 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] transition-colors hover:text-neon-a"
      >
        <ArrowLeft className="h-3 w-3" />
        {flow === "admin" ? "Back to Admin" : `Back to ${orgName}`}
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-neon-a" />
          <span className="font-mono text-xs uppercase tracking-widest text-neon-a">New Event</span>
        </div>
        <h1 className="text-balance font-serif text-2xl font-bold text-[color:var(--neon-text0)] md:text-3xl">
          Create Event
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--neon-text1)]">
          Fill in the details below to create a new event draft for <span className="text-neon-a/90">{orgName}</span>.
          After the draft is created, you’ll land on the event detail screen where you can upload the flyer before
          submitting it for review.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 flex items-start gap-3 border border-destructive/30 bg-destructive/5 px-4 py-3">
          <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Form card */}
      <form onSubmit={handleSubmit}>
        <GlassCard emphasis className="card-accent-cyan relative overflow-hidden p-6 md:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,209,255,0.16),rgba(157,77,255,0.08)_45%,transparent_72%)] blur-3xl"
          />

          <div className="relative flex flex-col gap-0">
            {/* ---- Section 1: Basics ---- */}
            <section>
              <SectionHeader icon={FileText} label="Basics" number="01" />
              <div className="flex flex-col gap-6">
                {/* Title */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="title" className={labelClass}>
                    Event Title <span className="text-neon-a">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    placeholder="e.g. Summer Block Party"
                    className={inputClass}
                  />
                  <p className={helpTextClass}>Keep it short and catchy, this is what people see first.</p>
                </div>

                {/* Categories (multi-select) */}
                <fieldset className="flex min-w-0 flex-col gap-3">
                  <legend className={`${labelClass} mb-1`}>
                    Categories <span className="text-neon-a">*</span>
                  </legend>
                  <p className={`${helpTextClass} -mt-1`}>
                    Pick all that apply, it helps people discover your event faster.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_CATEGORY_OPTIONS.map((cat) => {
                      const on = selectedCategories.has(cat.value)
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => toggleCategory(cat.value)}
                          className={`border px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                            on ? chipOnClass : chipOffClass
                          }`}
                        >
                          {cat.label}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="description" className={labelClass}>
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="Tell people what this event is about..."
                    className={`${inputClass} resize-none`}
                  />
                  <p className={helpTextClass}>Markdown is not supported yet. Keep it plain text for now.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <span className={labelClass}>RSVP capacity</span>
                    <p className={`${helpTextClass} mt-1 max-w-xl`}>
                      Limits how many people can hold an active free RSVP for this event once it is published. Choose
                      deliberately, you can still change it later from the event page.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRsvpMode("unlimited")
                        setRsvpCapInput("")
                      }}
                      className={`border px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                        rsvpMode === "unlimited" ? chipOnClass : chipOffClass
                      }`}
                    >
                      Unlimited RSVPs
                    </button>
                    <button
                      type="button"
                      onClick={() => setRsvpMode("capped")}
                      className={`border px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                        rsvpMode === "capped" ? chipOnClass : chipOffClass
                      }`}
                    >
                      Set RSVP cap
                    </button>
                  </div>
                  {rsvpMode === "capped" ? (
                    <div className="flex flex-col gap-2">
                      <label htmlFor="rsvp_capacity" className={labelClass}>
                        Maximum free RSVPs
                      </label>
                      <input
                        id="rsvp_capacity"
                        type="number"
                        min={1}
                        step={1}
                        value={rsvpCapInput}
                        onChange={(e) => setRsvpCapInput(e.target.value)}
                        placeholder="e.g. 150"
                        className={inputClass}
                      />
                      <p className={helpTextClass}>
                        Whole-event cap. New RSVPs are blocked once confirmed and checked-in guests reach this number.
                      </p>
                    </div>
                  ) : (
                    <p className={helpTextClass}>No limit, as many free RSVPs as you need.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Divider */}
            <div className="section-divider my-8" />

            {/* ---- Section 2: Date & Time ---- */}
            <section>
              <SectionHeader icon={Clock} label="Date & Time" number="02" />
              <div className="flex flex-col gap-6">
                {/* Start Date + Time */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <span className={labelClass}>
                      Start Date <span className="text-neon-a">*</span>
                    </span>
                    <Popover open={startOpen} onOpenChange={setStartOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className={`${inputClass} flex items-center gap-3 text-left`}>
                          <CalendarIcon className={`h-4 w-4 shrink-0 ${quietTextClass}`} />
                          {startDate ? (
                            <span className="truncate text-[color:var(--neon-text0)]">{format(startDate, "MMM d, yyyy")}</span>
                          ) : (
                            <span className={quietTextClass}>Pick a date</span>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            setStartDate(date)
                            setStartOpen(false)
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="start_time" className={labelClass}>
                      Start Time <span className="text-neon-a">*</span>
                    </label>
                    <input
                      id="start_time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* End Date + Time */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <span className={labelClass}>End Date</span>
                    <Popover open={endOpen} onOpenChange={setEndOpen}>
                      <PopoverTrigger asChild>
                        <button type="button" className={`${inputClass} flex items-center gap-3 text-left`}>
                          <CalendarIcon className={`h-4 w-4 shrink-0 ${quietTextClass}`} />
                          {endDate ? (
                            <span className="truncate text-[color:var(--neon-text0)]">{format(endDate, "MMM d, yyyy")}</span>
                          ) : (
                            <span className={`${quietTextClass} truncate`}>Same as start</span>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            setEndDate(date)
                            setEndOpen(false)
                          }}
                          disabled={(date) =>
                            startDate
                              ? date < startDate
                              : date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="end_time" className={labelClass}>
                      End Time
                    </label>
                    <input
                      id="end_time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Divider */}
            <div className="section-divider my-8" />

            {/* ---- Section 3: Location ---- */}
            <section>
              <SectionHeader icon={MapPin} label="Location" number="03" />
              <div className="flex flex-col gap-6">
                {/* Venue */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="venue_name" className={labelClass}>
                    Venue Name <span className="text-neon-a">*</span>
                  </label>
                  <input
                    id="venue_name"
                    name="venue_name"
                    type="text"
                    required
                    placeholder="e.g. The Norva, Scope Arena"
                    className={inputClass}
                  />
                </div>

                {/* Address + City */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="address" className={labelClass}>
                      Address
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="317 Monticello Ave"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="city" className={labelClass}>
                      City <span className="text-neon-a">*</span>
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      placeholder="Norfolk, VA"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </GlassCard>

        {/* ---- Sticky Footer Action Bar ---- */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:left-64">
          <div className="border-t border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:justify-between md:px-8">
              <div className="flex w-full items-center gap-3 sm:w-auto">
                <button
                  type="submit"
                  disabled={loading}
                  className="vibe-cta-gradient vibe-focus-ring flex-1 px-8 py-3 text-xs font-mono font-bold uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                >
                  {loading ? "Creating..." : "Create Draft"}
                </button>
                <Link
                  href={flow === "admin" ? "/admin" : `/organizer/${orgSlug}`}
                  className="border border-[color:var(--neon-hairline)] bg-white/[0.02] px-6 py-3 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text1)] transition-all hover:border-neon-a/30 hover:text-[color:var(--neon-text0)]"
                >
                  Cancel
                </Link>
              </div>
              <p className="hidden font-mono text-[11px] text-[color:var(--neon-text2)] sm:block">
                Create the draft first, then upload the flyer on the event page.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
