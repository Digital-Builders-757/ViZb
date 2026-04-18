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

interface CreateEventFormProps {
  orgId: string
  orgSlug: string
  orgName: string
}

function SectionHeader({ icon: Icon, label, number }: { icon: React.ElementType; label: string; number: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-7 h-7 flex items-center justify-center bg-gradient-to-br from-neon-b/20 to-neon-a/20 border border-neon-a/20">
        <Icon className="w-3.5 h-3.5 text-neon-a" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-neon-a/60">{number}</span>
        <span className="text-xs font-mono uppercase tracking-widest text-[#FAFAFA]">{label}</span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-[#222222] to-transparent" />
    </div>
  )
}

export function CreateEventForm({ orgId, orgSlug, orgName }: CreateEventFormProps) {
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
      router.push(`/organizer/${orgSlug}/events/${result.event.slug}`)
      router.refresh()
    }
  }

  const inputClass =
    "input-premium w-full px-4 py-3 text-sm text-[#FAFAFA] placeholder:text-[#555555] font-sans"

  return (
    <div className="form-glow-bg min-h-full pb-28">
      {/* Back link */}
      <Link
        href={`/organizer/${orgSlug}`}
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#555555] hover:text-neon-a transition-colors mb-8"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to {orgName}
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-neon-a" />
          <span className="text-xs uppercase tracking-widest text-neon-a font-mono">New Event</span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#FAFAFA] text-balance">
          Create Event
        </h1>
        <p className="text-sm text-[#777777] mt-2 leading-relaxed max-w-lg">
          Fill in the details below to create a new event draft for{" "}
          <span className="text-neon-a/80">{orgName}</span>. You can add a flyer and submit for review later.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
          <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Form card */}
      <form onSubmit={handleSubmit}>
        <div className="form-card p-6 md:p-8 flex flex-col gap-0">

          {/* ---- Section 1: Basics ---- */}
          <section>
            <SectionHeader icon={FileText} label="Basics" number="01" />
            <div className="flex flex-col gap-6">
              {/* Title */}
              <div className="flex flex-col gap-2">
                <label htmlFor="title" className="text-xs font-mono uppercase tracking-widest text-[#888888]">
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
                <p className="text-[11px] text-[#555555]">Keep it short and catchy -- this is what people see first.</p>
              </div>

              {/* Categories (multi-select) */}
              <fieldset className="flex flex-col gap-3 min-w-0">
                <legend className="text-xs font-mono uppercase tracking-widest text-[#888888] mb-1">
                  Categories <span className="text-neon-a">*</span>
                </legend>
                <p className="text-[11px] text-[#555555] -mt-1">
                  Pick all that apply — helps people discover your event.
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
                          on
                            ? "border-neon-a bg-neon-a/10 text-[#FAFAFA]"
                            : "border-[#333333] text-[#888888] hover:border-[#444444] hover:text-[#FAFAFA]"
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
                <label htmlFor="description" className="text-xs font-mono uppercase tracking-widest text-[#888888]">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Tell people what this event is about..."
                  className={`${inputClass} resize-none`}
                />
                <p className="text-[11px] text-[#555555]">Markdown is not supported yet. Keep it plain text for now.</p>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#888888]">
                    RSVP capacity
                  </span>
                  <p className="text-[11px] text-[#555555] mt-1 leading-relaxed max-w-xl">
                    Limits how many people can hold an active free RSVP (confirmed or checked in) for this
                    event once it is published. This is easy to get wrong — choose deliberately. You can
                    change this later from the event page.
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
                      rsvpMode === "unlimited"
                        ? "border-neon-a bg-neon-a/10 text-[#FAFAFA]"
                        : "border-[#333333] text-[#888888] hover:border-[#444444] hover:text-[#FAFAFA]"
                    }`}
                  >
                    Unlimited RSVPs
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsvpMode("capped")}
                    className={`border px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                      rsvpMode === "capped"
                        ? "border-neon-a bg-neon-a/10 text-[#FAFAFA]"
                        : "border-[#333333] text-[#888888] hover:border-[#444444] hover:text-[#FAFAFA]"
                    }`}
                  >
                    Set RSVP cap
                  </button>
                </div>
                {rsvpMode === "capped" ? (
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="rsvp_capacity"
                      className="text-xs font-mono uppercase tracking-widest text-[#888888]"
                    >
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
                    <p className="text-[11px] text-[#555555]">
                      Whole-event cap. New RSVPs are blocked when confirmed + checked-in reaches this number.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#555555]">
                    No limit — as many free RSVPs as you need, subject to other settings.
                  </p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#888888]">
                    Start Date <span className="text-neon-a">*</span>
                  </span>
                  <Popover open={startOpen} onOpenChange={setStartOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`${inputClass} text-left flex items-center gap-3`}
                      >
                        <CalendarIcon className="w-4 h-4 text-[#555555] shrink-0" />
                        {startDate ? (
                          <span className="text-[#FAFAFA] truncate">{format(startDate, "MMM d, yyyy")}</span>
                        ) : (
                          <span className="text-[#555555]">Pick a date</span>
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
                  <label htmlFor="start_time" className="text-xs font-mono uppercase tracking-widest text-[#888888]">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#888888]">
                    End Date
                  </span>
                  <Popover open={endOpen} onOpenChange={setEndOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`${inputClass} text-left flex items-center gap-3`}
                      >
                        <CalendarIcon className="w-4 h-4 text-[#555555] shrink-0" />
                        {endDate ? (
                          <span className="text-[#FAFAFA] truncate">{format(endDate, "MMM d, yyyy")}</span>
                        ) : (
                          <span className="text-[#555555] truncate">Same as start</span>
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
                  <label htmlFor="end_time" className="text-xs font-mono uppercase tracking-widest text-[#888888]">
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
                <label htmlFor="venue_name" className="text-xs font-mono uppercase tracking-widest text-[#888888]">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="address" className="text-xs font-mono uppercase tracking-widest text-[#888888]">
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
                  <label htmlFor="city" className="text-xs font-mono uppercase tracking-widest text-[#888888]">
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

        {/* ---- Sticky Footer Action Bar ---- */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:left-64">
          <div className="border-t border-[#222222] bg-[#0A0A0A]/95 backdrop-blur-md">
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-neon-b to-neon-a text-white px-8 py-3 text-xs uppercase tracking-widest font-bold hover:shadow-[0_0_30px_rgba(0,189,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Draft"}
                </button>
                <Link
                  href={`/organizer/${orgSlug}`}
                  className="px-6 py-3 text-xs font-mono uppercase tracking-widest text-[#555555] hover:text-[#FAFAFA] border border-[#222222] hover:border-[#333333] transition-all bg-transparent"
                >
                  Cancel
                </Link>
              </div>
              <p className="text-[11px] text-[#555555] font-mono hidden sm:block">
                Events start as drafts -- submit for review when ready
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
