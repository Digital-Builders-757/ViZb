"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, MapPin, Tag, ArrowRight } from "lucide-react"
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
  cancelled: "border-l-destructive",
} as Record<string, string>

const STATUS_GLOW = {
  draft: "",
  pending_review: "hover:shadow-[0_0_20px_rgba(0,189,255,0.12)]",
  published: "hover:shadow-[0_0_20px_rgba(13,64,255,0.12)]",
  rejected: "hover:shadow-[0_0_20px_rgba(245,158,11,0.12)]",
  cancelled: "",
} as Record<string, string>

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "pending_review", label: "In Review" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Rejected" },
] as const

export function EventCardList({ events, orgSlug }: EventCardListProps) {
  const [activeTab, setActiveTab] = useState<string>("all")

  const counts = {
    all: events.length,
    draft: events.filter((e) => e.status === "draft").length,
    pending_review: events.filter((e) => e.status === "pending_review").length,
    published: events.filter((e) => e.status === "published").length,
    rejected: events.filter((e) => e.status === "rejected").length,
  } as Record<string, number>

  const filtered = activeTab === "all" ? events : events.filter((e) => e.status === activeTab)

  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const count = counts[tab.key] ?? 0
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-all shrink-0 border ${
                isActive
                  ? "border-primary text-foreground bg-primary/5 shadow-[0_0_12px_rgba(13,64,255,0.15)]"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {tab.label}
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-mono ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Event cards */}
      <div className="mt-5 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground font-mono">
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
    ? startsAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : null
  const timeStr = startsAt
    ? startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null

  return (
    <Link
      href={`/organizer/${orgSlug}/events/${event.slug}`}
      className={`group relative block border border-[#222222] bg-[#111111] border-l-[3px] ${accent} ${glow} hover:border-[#333333] hover:bg-[#141414] transition-all`}
    >
      {/* Rejection feedback banner */}
      {event.status === "rejected" && event.review_notes && (
        <div className="mx-4 mt-4 md:mx-5 md:mt-5 mb-0 border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400 leading-relaxed">
          <span className="font-mono uppercase tracking-widest text-amber-500 text-[10px]">Admin Feedback:</span>
          <p className="mt-1">{event.review_notes}</p>
        </div>
      )}

      {/* Inner content */}
      <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Left: title + metadata */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start gap-3">
            <h3 className="text-sm md:text-base font-bold text-foreground truncate group-hover:text-brand-cyan transition-colors">
              {event.title}
            </h3>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {dateStr && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 shrink-0 text-brand-blue-mid" />
                <span>{dateStr}</span>
                {timeStr && (
                  <span className="text-muted-foreground/60">at {timeStr}</span>
                )}
              </span>
            )}
            {event.venue_name && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0 text-brand-blue-mid" />
                <span className="truncate max-w-[140px]">{event.venue_name}</span>
                {event.city && (
                  <span className="hidden sm:inline text-muted-foreground/60">{event.city}</span>
                )}
              </span>
            )}
            {event.categories.length > 0 && (
              <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                <Tag className="w-3 h-3 shrink-0 text-brand-blue-mid" />
                <span className="capitalize">
                  {event.categories.map((c) => formatCategoryLabel(c)).join(" · ")}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Right: status chip + arrow */}
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 border ${config.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-brand-cyan group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  )
}
