import { requireOrgMember } from "@/lib/auth-helpers"
import { EVENT_STATUS_CONFIG } from "@/lib/constants"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import Image from "next/image"
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  ImageIcon,
} from "lucide-react"
import { FlyerUploadForm } from "@/components/organizer/flyer-upload-form"
import { SubmitReviewButton } from "@/components/organizer/submit-review-button"
import { EventDetailsEditForm } from "@/components/organizer/event-details-edit-form"
import { normalizeCategories } from "@/lib/events/categories"
import { formatCategoryLabel } from "@/lib/events/event-display-format"
import { EventAttendeesPanel } from "@/components/organizer/event-attendees-panel"

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string; eventSlug: string }>
}) {
  const { slug, eventSlug } = await params
  const { org } = await requireOrgMember(slug)
  const supabase = await createClient()

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("org_id", org.id)
    .eq("slug", eventSlug)
    .single()

  if (!event) {
    notFound()
  }

  const categories = normalizeCategories(
    (event as { categories?: unknown }).categories,
  )

  const config = EVENT_STATUS_CONFIG[event.status] ?? EVENT_STATUS_CONFIG.draft
  const StatusIcon = config.icon

  // RSVP rollup (requires scripts/025_create_event_registrations.sql)
  let rsvpRows: { user_id: string; status: string; created_at: string }[] = []
  try {
    const { data } = await supabase
      .from("event_registrations")
      .select("user_id, status, created_at")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false })

    rsvpRows = (data as typeof rsvpRows) ?? []
  } catch {
    rsvpRows = []
  }

  const confirmed = rsvpRows.filter((r) => r.status === "confirmed").length
  const checkedIn = rsvpRows.filter((r) => r.status === "checked_in").length
  const cancelled = rsvpRows.filter((r) => r.status === "cancelled").length
  const total = rsvpRows.length

  // Parse starts_at / ends_at timestamps
  const startsAt = event.starts_at ? new Date(event.starts_at) : null
  const endsAt = event.ends_at ? new Date(event.ends_at) : null

  const startDateStr = startsAt
    ? startsAt.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null

  const startTimeStr = startsAt
    ? startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null

  const endDateStr = endsAt
    ? endsAt.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null

  const endTimeStr = endsAt
    ? endsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/organizer/${slug}`}
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-brand-cyan transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to {org.name}
      </Link>

      {/* Header */}
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-serif text-xl md:text-3xl font-bold text-foreground text-balance">
              {event.title}
            </h1>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-1 border ${config.color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          {categories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c}
                  className="inline-block border border-border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground"
                >
                  {formatCategoryLabel(c)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full md:w-auto">
          {event.status === "draft" && (
            <SubmitReviewButton eventId={event.id} />
          )}
          {event.status === "rejected" && (
            <SubmitReviewButton eventId={event.id} variant="resubmit" />
          )}
        </div>
      </div>

      {/* Archived banner */}
      {event.status === "archived" ? (
        <div className="mt-4 border border-border bg-muted/5 p-4 md:p-5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Archived</span>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            This event has been archived. It’s hidden from public discovery and can’t be edited.
          </p>
        </div>
      ) : null}

      {/* Rejection feedback banner */}
      {event.status === "rejected" && event.review_notes && (
        <div className="mt-4 border border-amber-500/30 bg-amber-500/5 p-4 md:p-5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500">Admin Feedback</span>
          <p className="mt-2 text-sm text-amber-400 leading-relaxed">{event.review_notes}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Please address the feedback above, then click <span className="font-semibold text-amber-500">Revise & Resubmit</span> to send it back for review.
          </p>
        </div>
      )}

      {/* Flyer Section */}
      <div className="mt-8 form-card p-6 md:p-8">
        <h2 className="text-xs font-mono uppercase tracking-widest text-brand-cyan mb-6 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Event Flyer
        </h2>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Current flyer preview */}
          <div className="relative w-full md:w-64 aspect-[4/5] overflow-hidden border border-border bg-secondary shrink-0">
            {event.flyer_url ? (
              <Image
                src={event.flyer_url}
                alt={`Flyer for ${event.title}`}
                fill
                sizes="(max-width: 768px) 100vw, 256px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground mt-2 font-mono uppercase tracking-widest">
                  No Flyer
                </p>
              </div>
            )}
          </div>

          {/* Upload form (for drafts / pending_review / rejected) */}
          <div className="flex-1">
            {["draft", "pending_review", "rejected"].includes(event.status) ? (
              <FlyerUploadForm
                eventId={event.id}
                currentFlyerUrl={event.flyer_url}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {event.flyer_url
                  ? "Flyer is set. Published events cannot have their flyer changed."
                  : "No flyer uploaded."}
              </p>
            )}
            {!event.flyer_url && ["draft", "rejected"].includes(event.status) && (
              <p className="mt-3 text-xs text-amber-500 font-mono">
                A flyer is required before submitting for review.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Attendees */}
      <EventAttendeesPanel
        total={total}
        confirmed={confirmed}
        checkedIn={checkedIn}
        cancelled={cancelled}
        rows={rsvpRows}
        orgSlug={slug}
        eventSlug={eventSlug}
        eventId={event.id}
      />

      {/* Event details card */}
      <div className="mt-6 form-card p-6 md:p-8">
        <h2 className="text-xs font-mono uppercase tracking-widest text-brand-cyan mb-2">
          Event Details
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Edit your event details here. Published event edits update the public page immediately.
        </p>

        <EventDetailsEditForm event={event} />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date & Time */}
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Starts
              </span>
              {startDateStr && (
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-brand-cyan" />
                  <span className="text-sm text-foreground">{startDateStr}</span>
                </div>
              )}
              {startTimeStr && (
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-brand-blue-mid" />
                  <span className="text-sm text-foreground">{startTimeStr}</span>
                </div>
              )}
              {!startDateStr && (
                <p className="text-sm text-muted-foreground mt-1">Not set</p>
              )}
            </div>

            {(endDateStr || endTimeStr) && (
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Ends
                </span>
                {endDateStr && (
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-brand-cyan" />
                    <span className="text-sm text-foreground">{endDateStr}</span>
                  </div>
                )}
                {endTimeStr && (
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-brand-blue-mid" />
                    <span className="text-sm text-foreground">{endTimeStr}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Venue
              </span>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 text-brand-cyan-bright" />
                <span className="text-sm text-foreground">
                  {event.venue_name || "Not set"}
                </span>
              </div>
              {event.address && (
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  {event.address}
                </p>
              )}
            </div>

            {event.city && (
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  City
                </span>
                <p className="text-sm text-foreground mt-1">{event.city}</p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="mt-8 pt-6 section-divider">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Description
            </span>
            <p className="text-sm text-foreground/80 mt-2 leading-relaxed whitespace-pre-wrap max-w-2xl">
              {event.description}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-8 pt-6 section-divider">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Info
          </span>
          <div className="flex items-center gap-6 mt-2 text-xs text-muted-foreground">
            <span>
              Created{" "}
              {new Date(event.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="font-mono">/{event.slug}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
