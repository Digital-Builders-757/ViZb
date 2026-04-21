"use client"

import { useState, useRef } from "react"
import { reviewEvent } from "@/app/actions/event"
import { Clock, CheckCircle2, XCircle, Calendar, MapPin, ImageIcon, Eye, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { normalizeCategories } from "@/lib/events/categories"
import { formatCategoryLabel } from "@/lib/events/event-display-format"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

type ReviewEvent = {
  id: string
  title: string
  slug: string
  description: string | null
  status: string
  starts_at: string
  ends_at: string | null
  venue_name: string
  city: string
  categories: string[]
  flyer_url: string | null
  created_at: string
  reviewed_at: string | null
  review_notes: string | null
  organizations: { name: string; slug: string } | null
}

const CATEGORY_COLORS: Record<string, string> = {
  party: "text-neon-a border-neon-a/30 bg-neon-a/5",
  concert: "text-neon-b border-neon-b/30 bg-neon-b/5",
  networking: "text-neon-b border-neon-b/30 bg-neon-b/5",
  workshop: "text-neon-c border-neon-c/30 bg-neon-c/5",
  social: "text-neon-a border-neon-a/30 bg-neon-a/5",
  other: "text-muted-foreground border-border bg-muted/5",
}

const TABS = [
  { key: "pending_review", label: "In Review" },
  { key: "published", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const

export function EventReviewQueue({ events }: { events: ReviewEvent[] }) {
  const [activeTab, setActiveTab] = useState<string>("pending_review")
  const [results, setResults] = useState<
    Record<string, { success?: boolean; error?: string; action?: string; event?: { title: string; slug: string } }>
  >({})
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const rejectNotesRef = useRef<HTMLTextAreaElement>(null)

  const counts = {
    pending_review: events.filter((e) => e.status === "pending_review").length,
    published: events.filter((e) => e.status === "published").length,
    rejected: events.filter((e) => e.status === "rejected").length,
  } as Record<string, number>

  const filtered = events.filter((e) => e.status === activeTab)

  async function handleReview(eventId: string, action: "approve" | "reject", notes?: string) {
    setPendingIds((prev) => new Set(prev).add(eventId))
    const formData = new FormData()
    formData.set("eventId", eventId)
    formData.set("action", action)
    if (notes) formData.set("review_notes", notes)
    const res = await reviewEvent(formData)
    setResults((prev) => ({ ...prev, [eventId]: res as (typeof results)[string] }))
    setPendingIds((prev) => {
      const next = new Set(prev)
      next.delete(eventId)
      return next
    })
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
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
                  isActive ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Event cards */}
      <div className="mt-5 flex flex-col gap-4">
        {filtered.length === 0 ? (
          <div className="border border-dashed p-12 flex flex-col items-center text-center gradient-border">
            <div className="w-12 h-12 rounded-full bg-neon-a/10 flex items-center justify-center mb-4">
              {activeTab === "pending_review" && <CheckCircle2 className="w-6 h-6 text-neon-a" />}
              {activeTab === "published" && <CheckCircle2 className="w-6 h-6 text-neon-b" />}
              {activeTab === "rejected" && <XCircle className="w-6 h-6 text-amber-500" />}
            </div>
            <span className="text-xs uppercase tracking-widest text-neon-a font-mono">
              {activeTab === "pending_review" ? "All Clear" : "None Yet"}
            </span>
            <h3 className="text-lg font-bold text-foreground uppercase mt-2">
              {activeTab === "pending_review" && "No Events Pending Review"}
              {activeTab === "published" && "No Approved Events"}
              {activeTab === "rejected" && "No Rejected Events"}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              {activeTab === "pending_review" && "Events submitted for review by organizers will appear here."}
              {activeTab === "published" && "Events you approve will appear here for reference."}
              {activeTab === "rejected" && "Events you reject with feedback will appear here."}
            </p>
          </div>
        ) : (
          filtered.map((evt, index) => {
            const result = results[evt.id]
            const isPending = pendingIds.has(evt.id)
            const isHandled = result?.success
            const isApproved = result?.action === "approved"
            const isRejected = result?.action === "rejected"
            const isExpanded = expandedIds.has(evt.id)
            const isPendingReview = evt.status === "pending_review"

            const accentColors = [
              "border-l-neon-a",
              "border-l-neon-b",
              "border-l-neon-b",
              "border-l-neon-c",
            ]
            const accent = isPendingReview
              ? accentColors[index % accentColors.length]
              : evt.status === "published"
                ? "border-l-neon-b"
                : "border-l-amber-500"
            const cats = normalizeCategories(evt.categories)

            const startDate = new Date(evt.starts_at)
            const formattedDate = startDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            const formattedTime = startDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })

            return (
              <div
                key={evt.id}
                className={`border-l-2 border border-border bg-card transition-all ${
                  isApproved ? "border-l-neon-a bg-neon-a/5 border-neon-a/20" : ""
                } ${isRejected ? "border-l-amber-500 opacity-60" : ""} ${
                  !isHandled ? `${accent} hover:bg-muted/45` : ""
                }`}
              >
                {/* Card header */}
                <div className="p-5 pb-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-neon-b/20 to-neon-a/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {evt.flyer_url ? (
                          <Image
                            src={evt.flyer_url || "/placeholder.svg"}
                            alt={`${evt.title} flyer`}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">{evt.title}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {cats.map((c) => (
                            <span
                              key={c}
                              className={`inline-flex items-center text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border ${
                                CATEGORY_COLORS[c] ?? CATEGORY_COLORS.other
                              }`}
                            >
                              {formatCategoryLabel(c)}
                            </span>
                          ))}
                          {evt.organizations && (
                            <span className="text-[10px] font-mono text-muted-foreground truncate">
                              by {evt.organizations.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <Clock className="w-3 h-3" />
                      <span className="font-mono">
                        {evt.status === "pending_review"
                          ? `Submitted ${new Date(evt.created_at).toLocaleDateString()}`
                          : evt.reviewed_at
                            ? `Reviewed ${new Date(evt.reviewed_at).toLocaleDateString()}`
                            : `Created ${new Date(evt.created_at).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-5 py-4">
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3 h-3" />
                      {formattedDate} at {formattedTime}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <MapPin className="w-3 h-3" />
                      {evt.venue_name}, {evt.city}
                    </span>
                  </div>

                  {evt.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-3 line-clamp-2">
                      {evt.description}
                    </p>
                  )}

                  {/* Rejection notes (shown on rejected tab) */}
                  {evt.status === "rejected" && evt.review_notes && (
                    <div className="mt-3 border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400 leading-relaxed">
                      <span className="font-mono uppercase tracking-widest text-amber-500 text-[10px]">
                        Rejection Notes:
                      </span>
                      <p className="mt-1">{evt.review_notes}</p>
                    </div>
                  )}

                  {/* Expandable flyer preview */}
                  {evt.flyer_url && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleExpanded(evt.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-neon-a font-mono hover:underline transition-colors bg-transparent border-0 p-0 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        {isExpanded ? "Hide Flyer" : "Preview Flyer"}
                      </button>
                      {isExpanded && (
                        <div className="mt-3 border border-border p-2 bg-black/20 max-w-sm">
                          <Image
                            src={evt.flyer_url || "/placeholder.svg"}
                            alt={`${evt.title} flyer preview`}
                            width={400}
                            height={500}
                            className="w-full h-auto object-contain"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions -- only for pending_review events that haven't been handled yet */}
                {isPendingReview && !isHandled && (
                  <div className="px-5 pb-5">
                    <div className="section-divider pt-4 flex flex-col sm:flex-row gap-3">
                      {/* Approve with confirmation */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            disabled={isPending}
                            className="bg-gradient-to-r from-neon-b to-neon-a text-white px-5 py-2.5 text-xs font-mono uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,189,255,0.3)] transition-all disabled:opacity-50"
                          >
                            {isPending ? "Processing..." : "Approve + Publish"}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <div className="flex items-center gap-3 mb-1">
                              <div className="w-9 h-9 bg-neon-a/10 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-neon-a" />
                              </div>
                              <AlertDialogTitle className="font-serif text-foreground">Approve Event</AlertDialogTitle>
                            </div>
                            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
                              This will publish{" "}
                              <span className="font-semibold text-foreground">{evt.title}</span> by{" "}
                              <span className="font-semibold text-foreground">{evt.organizations?.name}</span> to the
                              public events page. It will be immediately visible to all visitors.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="border border-border bg-black/20 p-3 flex flex-wrap gap-3 text-xs text-muted-foreground font-mono">
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              {formattedDate}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-3 h-3" />
                              {evt.venue_name}, {evt.city}
                            </span>
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border text-muted-foreground font-mono text-xs uppercase tracking-widest bg-transparent hover:bg-muted/10">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleReview(evt.id, "approve")}
                              className="bg-gradient-to-r from-neon-b to-neon-a text-white font-mono text-xs uppercase tracking-widest border-0 hover:shadow-[0_0_20px_rgba(0,189,255,0.3)]"
                            >
                              Confirm Approval
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      {/* Reject with confirmation + notes */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            disabled={isPending}
                            className="border border-border px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:border-amber-500 hover:text-amber-500 transition-colors disabled:opacity-50 bg-transparent"
                          >
                            Reject
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <div className="flex items-center gap-3 mb-1">
                              <div className="w-9 h-9 bg-amber-500/10 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                              </div>
                              <AlertDialogTitle className="font-serif text-foreground">Reject Event</AlertDialogTitle>
                            </div>
                            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
                              This will reject{" "}
                              <span className="font-semibold text-foreground">{evt.title}</span>. The organizer will see
                              the rejection and any feedback you provide below.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div>
                            <label
                              htmlFor={`reject-notes-${evt.id}`}
                              className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2"
                            >
                              Feedback for Organizer (optional)
                            </label>
                            <textarea
                              ref={rejectNotesRef}
                              id={`reject-notes-${evt.id}`}
                              rows={3}
                              placeholder="Explain why this event was rejected and what the organizer should fix..."
                              className="w-full bg-black/30 border border-border text-foreground text-sm p-3 placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500/50 resize-none"
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border text-muted-foreground font-mono text-xs uppercase tracking-widest bg-transparent hover:bg-muted/10">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                const notes = rejectNotesRef.current?.value?.trim() || ""
                                handleReview(evt.id, "reject", notes)
                              }}
                              className="bg-amber-500 text-black font-mono text-xs uppercase tracking-widest border-0 hover:bg-amber-400"
                            >
                              Confirm Rejection
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}

                {/* Result states */}
                {result?.error && (
                  <div className="mx-5 mb-5 border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{result.error}</p>
                  </div>
                )}

                {isApproved && (
                  <div className="mx-5 mb-5 border border-neon-a/30 bg-neon-a/5 p-3 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-neon-a shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-mono uppercase tracking-widest text-neon-a">
                        Approved -- Now Published
                      </p>
                      {result.event && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.event.title} is now live on the events page.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {isRejected && (
                  <div className="mx-5 mb-5 border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-mono uppercase tracking-widest text-amber-500">
                        Event Rejected
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
