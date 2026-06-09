"use client"

import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createEvent, uploadEventFlyer } from "@/app/actions/event"
import { ArrowLeft, CalendarIcon, MapPin, FileText, Clock, Sparkles, X, ImageIcon, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { EventCategoryPicker } from "@/components/events/event-category-picker"
import {
  EVENT_FLYER_ACCEPT_ATTR,
  validateEventFlyerFile,
} from "@/lib/events/flyer-upload-constraints"
import { GlassCard } from "@/components/ui/glass-card"
import { EventTicketingCreateFields } from "@/components/admin/event-ticketing-section"

const FLYER_UPLOAD_REASON_MAX_LEN = 240

function buildFlyerUploadFailureUrl(eventId: string, reason: string) {
  const params = new URLSearchParams({ flyer_upload: "failed" })
  const trimmed = reason.trim().slice(0, FLYER_UPLOAD_REASON_MAX_LEN)
  if (trimmed) params.set("reason", trimmed)
  return `/admin/events/${eventId}?${params.toString()}`
}

interface CreateEventFormProps {
  orgId: string
  orgSlug: string
  orgName: string
  /** Staff admin: back/cancel go to `/admin`, success to `/admin/events/[id]`. Default: organizer URLs. */
  flow?: "organizer" | "admin"
  /**
   * `community` — local/third-party listings (platform org only, staff-enforced server-side).
   * Omits ViZb RSVP cap UI; RSVP link optional at draft creation.
   */
  variant?: "official" | "community"
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

export function CreateEventForm({
  orgId,
  orgSlug,
  orgName,
  flow = "organizer",
  variant = "official",
}: CreateEventFormProps) {
  const router = useRouter()
  const flyerInputRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)
  const showCommunityFlyerPicker = flow === "admin" && variant === "community"
  const showAdminTicketing = flow === "admin" && variant === "official"
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploadingFlyer, setUploadingFlyer] = useState(false)
  const [flyerFile, setFlyerFile] = useState<File | null>(null)
  const [flyerPreviewUrl, setFlyerPreviewUrl] = useState<string | null>(null)
  const [flyerError, setFlyerError] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [startTime, setStartTime] = useState("19:00")
  const [endTime, setEndTime] = useState("23:00")
  const [startOpen, setStartOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [rsvpMode, setRsvpMode] = useState<"unlimited" | "capped">("unlimited")
  const [rsvpCapInput, setRsvpCapInput] = useState("")

  useEffect(() => {
    return () => {
      if (flyerPreviewUrl) URL.revokeObjectURL(flyerPreviewUrl)
    }
  }, [flyerPreviewUrl])

  function clearFlyerSelection() {
    if (flyerPreviewUrl) URL.revokeObjectURL(flyerPreviewUrl)
    setFlyerFile(null)
    setFlyerPreviewUrl(null)
    setFlyerError("")
    if (flyerInputRef.current) flyerInputRef.current.value = ""
  }

  function handleFlyerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateEventFlyerFile(file)
    if (!validation.ok) {
      setFlyerError(validation.error)
      setFlyerFile(null)
      if (flyerPreviewUrl) URL.revokeObjectURL(flyerPreviewUrl)
      setFlyerPreviewUrl(null)
      if (flyerInputRef.current) flyerInputRef.current.value = ""
      return
    }

    setFlyerError("")
    if (flyerPreviewUrl) URL.revokeObjectURL(flyerPreviewUrl)
    setFlyerFile(file)
    setFlyerPreviewUrl(URL.createObjectURL(file))
  }

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
    if (submittingRef.current) return

    submittingRef.current = true
    setError("")
    setLoading(true)

    let leavingPage = false

    try {
      if (!startDate) {
        setError("Please select a start date.")
        return
      }

      if (selectedCategories.size === 0) {
        setError("Select at least one category.")
        return
      }

      if (showCommunityFlyerPicker && flyerFile) {
        const validation = validateEventFlyerFile(flyerFile)
        if (!validation.ok) {
          setFlyerError(validation.error)
          return
        }
      }

      const form = e.currentTarget
      const formData = new FormData(form)
      formData.set("org_id", orgId)
      if (variant === "community") {
        formData.set("event_kind", "community")
      }
      for (const c of selectedCategories) {
        formData.append("categories", c)
      }

      if (variant !== "community") {
        if (rsvpMode === "unlimited") {
          formData.set("rsvp_capacity", "")
        } else {
          const capRaw = rsvpCapInput.trim()
          if (!capRaw) {
            setError("Enter a maximum number of free RSVPs, or choose Unlimited RSVPs.")
            return
          }
          formData.set("rsvp_capacity", capRaw)
        }
      }

      const startDateTime = `${format(startDate, "yyyy-MM-dd")}T${startTime}`
      formData.set("starts_at", startDateTime)

      if (endDate) {
        const endDateTime = `${format(endDate, "yyyy-MM-dd")}T${endTime}`
        formData.set("ends_at", endDateTime)
      }

      const ticketMode = String(formData.get("ticket_mode") ?? "free_rsvp")
      if (ticketMode === "paid") {
        if (!formData.get("is_active")) {
          formData.set("is_active", "false")
        }
        const priceRaw = String(formData.get("price_usd") ?? "").trim()
        if (!priceRaw) {
          setError("Enter a price for the paid ticket tier.")
          return
        }
      }

      const result = await createEvent(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      if (!result.success || !result.event) {
        setError("Event was created but the response was incomplete. Refresh and check Admin before trying again.")
        return
      }

      const eventId = result.event.id

      if (showCommunityFlyerPicker && flyerFile) {
        setUploadingFlyer(true)
        try {
          const uploadFormData = new FormData()
          uploadFormData.set("event_id", eventId)
          uploadFormData.set("flyer", flyerFile)

          const uploadResult = await uploadEventFlyer(uploadFormData)

          if (uploadResult.error) {
            leavingPage = true
            router.push(buildFlyerUploadFailureUrl(eventId, uploadResult.error))
            router.refresh()
            return
          }
        } catch {
          leavingPage = true
          router.push(buildFlyerUploadFailureUrl(eventId, "An unexpected error occurred during upload."))
          router.refresh()
          return
        } finally {
          setUploadingFlyer(false)
        }
      }

      leavingPage = true
      if (flow === "admin") {
        router.push(`/admin/events/${eventId}`)
      } else {
        router.push(`/organizer/${orgSlug}/events/${result.event.slug}`)
      }
      router.refresh()
    } finally {
      if (!leavingPage) {
        submittingRef.current = false
        setLoading(false)
        setUploadingFlyer(false)
      }
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
          <span className="font-mono text-xs uppercase tracking-widest text-neon-a">
            {variant === "community" ? "New community listing" : "New Event"}
          </span>
        </div>
        <h1 className="text-balance font-serif text-2xl font-bold text-[color:var(--neon-text0)] md:text-3xl">
          {variant === "community" ? "Create local / community event" : "Create Event"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--neon-text1)]">
          {variant === "community" ? (
            <>
              Add a third-party listing for <span className="text-neon-a/90">{orgName}</span>. Choose categories so the
              event appears under the right filters on <span className="font-mono text-[color:var(--neon-text0)]">/events</span>.
              You can attach an optional flyer now or later — it improves feed visibility. Set an RSVP link before submitting
              for review (here or on the detail page).
            </>
          ) : (
            <>
              Fill in the details below to create a new event draft for <span className="text-neon-a/90">{orgName}</span>.
              After the draft is created, you’ll land on the event detail screen where you can upload the flyer before
              submitting it for review.
            </>
          )}
        </p>
        <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-[color:var(--neon-text2)]">
          <span className="font-mono text-[10px] uppercase tracking-widest text-neon-a">Speed tip</span>
          <span className="text-[color:var(--neon-text1)]"> · </span>
          Reuse a past event: open it in Organizer (or Admin), then use{" "}
          <span className="text-[color:var(--neon-text0)]">Duplicate draft</span> — optional +1 week / +1 month shifts,
          ticket tiers copy over; official events still need a new flyer before review.
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

                <EventCategoryPicker
                  selected={selectedCategories}
                  onToggle={toggleCategory}
                  required
                  legendClassName={`${labelClass} mb-1`}
                  helpTextClassName={`${helpTextClass} -mt-1`}
                  chipOnClassName={chipOnClass}
                  chipOffClassName={chipOffClass}
                  helpText={
                    variant === "community"
                      ? "Pick all that apply — drives category chips on the public events page (avoid Other unless nothing else fits)."
                      : "Pick all that apply, it helps people discover your event faster."
                  }
                />

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

                {variant === "community" ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="external_rsvp_url" className={labelClass}>
                      RSVP link (optional now)
                    </label>
                    <input
                      id="external_rsvp_url"
                      name="external_rsvp_url"
                      type="url"
                      inputMode="url"
                      placeholder="https://…"
                      className={inputClass}
                    />
                    <p className={helpTextClass}>
                      Add a valid https link before submitting for review. You can also paste it on the event page after
                      creating the draft.
                    </p>
                  </div>
                ) : null}

                {showCommunityFlyerPicker ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <span className={labelClass}>Flyer (optional)</span>
                      <p className={`${helpTextClass} mt-1 max-w-xl`}>
                        Optional for submission, but strongly recommended for feed visibility and click-through. JPEG, PNG,
                        WebP, or GIF — max 5MB.
                      </p>
                    </div>

                    {flyerError ? (
                      <p className="text-sm text-destructive">{flyerError}</p>
                    ) : null}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="relative aspect-[4/5] w-full max-w-[160px] shrink-0 overflow-hidden border border-[color:var(--neon-hairline)] bg-white/[0.02]">
                        {flyerPreviewUrl ? (
                          <Image
                            src={flyerPreviewUrl}
                            alt="Flyer preview"
                            fill
                            sizes="160px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <ImageIcon className="h-8 w-8 text-[color:var(--neon-text2)]/70" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                              No flyer
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          className={`inline-flex cursor-pointer items-center gap-2 border border-neon-a/30 px-4 py-2.5 text-xs font-mono uppercase tracking-widest text-neon-a transition-colors hover:bg-neon-a/10 ${
                            loading ? "pointer-events-none opacity-50" : ""
                          }`}
                        >
                          <Upload className="h-4 w-4" />
                          {flyerFile ? "Replace flyer" : "Select flyer"}
                          <input
                            ref={flyerInputRef}
                            type="file"
                            accept={EVENT_FLYER_ACCEPT_ATTR}
                            onChange={handleFlyerSelect}
                            disabled={loading}
                            className="sr-only"
                          />
                        </label>
                        {flyerFile ? (
                          <button
                            type="button"
                            onClick={clearFlyerSelection}
                            disabled={loading}
                            className="border border-[color:var(--neon-hairline)] px-4 py-2.5 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text1)] transition-colors hover:border-destructive/30 hover:text-destructive disabled:opacity-50"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {variant !== "community" ? (
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
                ) : null}
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

            {showAdminTicketing ? (
              <>
                <div className="section-divider my-8" />
                <EventTicketingCreateFields />
              </>
            ) : null}
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
                  {loading
                    ? uploadingFlyer
                      ? "Uploading flyer..."
                      : "Creating..."
                    : "Create Draft"}
                </button>
                <Link
                  href={flow === "admin" ? "/admin" : `/organizer/${orgSlug}`}
                  className="border border-[color:var(--neon-hairline)] bg-white/[0.02] px-6 py-3 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text1)] transition-all hover:border-neon-a/30 hover:text-[color:var(--neon-text0)]"
                >
                  Cancel
                </Link>
              </div>
              <p className="hidden font-mono text-[11px] text-[color:var(--neon-text2)] sm:block">
                {variant === "community"
                  ? "Optional flyer improves discovery — RSVP link required before review."
                  : "Create the draft first, then upload the flyer on the event page."}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
