"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Calendar, MapPin, Tag, ArrowRight, AlertTriangle } from "lucide-react"
import { EVENT_STATUS_CONFIG } from "@/lib/constants"
import { formatCategoryLabel } from "@/lib/events/event-display-format"

interface EventItem {
  id: string
  title: string
  slug: string
  status: string
  starts_at: string | null
  ends_at: string | null
  venue_name: string | null
  city: string | null
  categories: string[]
  review_notes: string | null
  created_at: string
}

interface EventCardListProps {
  events: EventItem[]
  orgSlug: string
}

const STATUS_ACCENT = {
  draft: "border-l-[#555555]",
  pending_review: "border-l-brand-cyan",
  published: "border-l-brand-blue",
  rejected: "border-l-amber-500",
  archived: "border-l-muted-foreground",
  cancelled: "border-l-destructive",
} as Record<string, string>

const STATUS_GLOW = {
  draft: "",
  pending_review: "hover:shadow-[0_0_20px_rgba(0,189,255,0.12)]",
  published: "hover:shadow-[0_0_20px_rgba(13,64,255,0.12)]",
  rejected: "hover:shadow-[0_0_20px_rgba(245,158,11,0.12)]",
  archived: "",
  cancelled: "",
} as Record<string, string>

const FILTER_TABS = [
  { key: "draft", label: "Draft" },
  { key: "pending_review", label: "Pending review" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Rejected" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All" },
] as const

function primaryCta(status: string): string {
  switch (status) {
    case "draft":
      return "Continue editing"
    case "pending_review":
      return "View submission"
    case "published":
      return "Manage event"
    case "rejected":
      return "Fix & resubmit"
    case "archived":
      return "View details"
    default:
      return "Open event"
  }
}

export function EventCardList({ events, orgSlug }: EventCardListProps) {
  const [activeTab, setActiveTab] = useState<string>("all")

  const counts = useMemo(() => {
    return {
      all: events.length,
      draft: events.filter((e) => e.status === "draft").length,
      pending_review: events.filter((e) => e.status === "pending_review").length,
      published: events.filter((e) => e.status === "published").length,
      rejected: events.filter((e) => e.status === "rejected").length,
      archived: events.filter((e) => e.status === "archived").length,
    } as Record<string, number>
  }, [events])

  const filtered =
    activeTab === "all" ? events : events.filter((e) => e.status === activeTab)

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const count = counts[tab.key] ?? 0
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 border px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                isActive
                  ? "border-brand-cyan bg-brand-cyan/5 text-brand-cyan"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
              }`}
            >
              {tab.label}{" "}
              <span className="tabular-nums opacity-80">({count})</span>
            </button>
          )
        })}
      </div>

      <div className="mt-5 flex min-w-0 flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="border border-dashed border-border p-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              {activeTab === "all"
                ? "No events yet"
                : `No ${FILTER_TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} events`}
            </p>
          </div>
        ) : (
          filtered.map((event) => (
            <EventCard key={event.id} event={event} orgSlug={orgSlug} />
          ))
        )}
      </div>
    </div>
  )
}

function EventCard({ event, orgSlug }: { event: EventItem; orgSlug: string }) {
  const config = EVENT_STATUS_CONFIG[event.status] ?? EVENT_STATUS_CONFIG.draft
  const StatusIcon = config.icon
  const accent = STATUS_ACCENT[event.status] ?? STATUS_ACCENT.draft
  const glow = STATUS_GLOW[event.status] ?? ""

  const startsAt = event.starts_at ? new Date(event.starts_at) : null
  const dateStr = startsAt
    ? startsAt.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null
  const timeStr = startsAt
    ? startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null

  const href = `/organizer/${orgSlug}/events/${event.slug}`
  const needsAction = event.status === "rejected" || event.status === "pending_review"
  const rejectedFlag = event.status === "rejected"

  return (
    <div
      className={`group min-w-0 overflow-hidden border border-[#222222] bg-[#111111] border-l-[3px] ${accent} ${glow} transition-all hover:border-[#333333] hover:bg-[#141414]`}
    >
      {rejectedFlag ? (
        <div className="flex items-center gap-2 border-b border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-amber-500">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Needs action — update and resubmit for review
        </div>
      ) : null}

      {!rejectedFlag && event.status === "pending_review" ? (
        <div className="flex items-center gap-2 border-b border-brand-cyan/20 bg-brand-cyan/5 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-brand-cyan">
          Awaiting staff review
        </div>
      ) : null}

      <Link href={href} className="block min-w-0 p-4 md:p-5">
        {event.status === "rejected" && event.review_notes ? (
          <div className="mb-3 border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-400">
            <span className="font-mono text-[10px] uppercase tracking-widest text-amber-500">Admin feedback</span>
            <p className="mt-1 break-words">{event.review_notes}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-sm font-bold text-foreground transition-colors group-hover:text-brand-cyan md:text-base [text-wrap:pretty]">
              {event.title}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {dateStr ? (
                <span className="flex min-w-0 items-center gap-1.5">
                  <Calendar className="h-3 w-3 shrink-0 text-brand-blue-mid" />
                  <span>{dateStr}</span>
                  {timeStr ? <span className="text-muted-foreground/60">at {timeStr}</span> : null}
                </span>
              ) : null}
              {event.venue_name ? (
                <span className="flex min-w-0 max-w-full items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0 text-brand-blue-mid" />
                  <span className="break-words">{event.venue_name}</span>
                  {event.city ? (
                    <span className="text-muted-foreground/60 break-words">{event.city}</span>
                  ) : null}
                </span>
              ) : null}
              {event.categories.length > 0 ? (
                <span className="flex min-w-0 items-center gap-1.5">
                  <Tag className="h-3 w-3 shrink-0 text-brand-blue-mid" />
                  <span className="break-words capitalize">
                    {event.categories.map((c) => formatCategoryLabel(c)).join(" · ")}
                  </span>
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 self-stretch sm:self-center">
            <span
              className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest ${config.color}`}
            >
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-brand-cyan"
              aria-hidden
            />
          </div>
        </div>
      </Link>

      <div
        className={
          needsAction
            ? "border-t border-border bg-black/25 px-4 py-3 md:px-5"
            : "border-t border-border px-4 py-3 md:px-5"
        }
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {rejectedFlag ? (
            <p className="text-xs text-amber-500/90 sm:max-w-[55%]">
              Address the feedback above, then resubmit from the event page.
            </p>
          ) : event.status === "pending_review" ? (
            <p className="text-xs text-muted-foreground sm:max-w-[55%]">
              You&apos;ll get an email when the team approves or sends feedback.
            </p>
          ) : (
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {event.status === "published" ? "Live on VIZB" : null}
              {event.status === "draft" ? "Finish details and submit when ready" : null}
              {event.status === "archived" ? "Archived — read-only" : null}
            </span>
          )}
          <Link
            href={href}
            className={
              rejectedFlag
                ? "inline-flex min-h-10 w-full items-center justify-center border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-[10px] font-mono uppercase tracking-widest text-amber-500 transition-colors hover:bg-amber-500/20 sm:w-auto"
                : "inline-flex min-h-10 w-full items-center justify-center border border-brand-cyan/30 px-4 py-2 text-center text-[10px] font-mono uppercase tracking-widest text-brand-cyan transition-colors hover:bg-brand-cyan/5 sm:w-auto"
            }
          >
            {primaryCta(event.status)}
          </Link>
        </div>
      </div>
    </div>
  )
}
