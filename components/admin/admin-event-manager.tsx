"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { archiveEvent } from "@/app/actions/event"
import { EVENT_STATUS_CONFIG } from "@/lib/constants"
import {
  Search,
  Calendar,
  MapPin,
  Loader2,
  ExternalLink,
  Archive,
  Pencil,
} from "lucide-react"
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
import { toast } from "sonner"
import { formatCategoryLabel } from "@/lib/events/event-display-format"

interface AdminEvent {
  id: string
  title: string
  slug: string
  status: string
  starts_at: string | null
  venue_name: string | null
  city: string | null
  categories: string[]
  created_at: string
  organizations: { name: string; slug: string } | null
}

interface AdminEventManagerProps {
  events: AdminEvent[]
}

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "pending_review", label: "In Review" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Rejected" },
  { key: "archived", label: "Archived" },
] as const

export function AdminEventManager({ events }: AdminEventManagerProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (activeTab !== "all" && e.status !== activeTab) return false
      if (search) {
        const q = search.toLowerCase()
        const matchesTitle = e.title.toLowerCase().includes(q)
        const matchesOrg = e.organizations?.name.toLowerCase().includes(q)
        const matchesCity = e.city?.toLowerCase().includes(q)
        const matchesCat = e.categories.some((c) => c.toLowerCase().includes(q))
        if (!matchesTitle && !matchesOrg && !matchesCity && !matchesCat) return false
      }
      return true
    })
  }, [events, activeTab, search])

  const counts = useMemo(() => {
    const visible = events
    return {
      all: visible.length,
      draft: visible.filter((e) => e.status === "draft").length,
      pending_review: visible.filter((e) => e.status === "pending_review").length,
      published: visible.filter((e) => e.status === "published").length,
      rejected: visible.filter((e) => e.status === "rejected").length,
      archived: visible.filter((e) => e.status === "archived").length,
    } as Record<string, number>
  }, [events])

  async function handleArchive(eventId: string, eventTitle: string) {
    setDeletingId(eventId)
    try {
      const result = await archiveEvent(eventId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`"${eventTitle}" was archived.`)
        setActiveTab("archived")
        router.refresh()
      }
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setDeletingId(null)
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return null
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateStr))
  }

  return (
    <div>
      {/* Search + filter tabs */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by title, organization, or city..."
            className="w-full bg-[#0a0a0a] border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border transition-colors ${
                activeTab === tab.key
                  ? "border-brand-cyan text-brand-cyan bg-brand-cyan/5"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50 bg-transparent"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 opacity-60">{counts[tab.key] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Event list */}
      <div className="mt-5 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? "No events match your search." : "No events in this category."}
            </p>
          </div>
        ) : (
          filtered.map((event) => {
            const config = EVENT_STATUS_CONFIG[event.status] ?? EVENT_STATUS_CONFIG.draft
            const StatusIcon = config.icon
            const isDeleting = deletingId === event.id
            const dateStr = formatDate(event.starts_at)

            return (
              <div
                key={event.id}
                className={`group border border-border bg-[#111111] p-4 transition-colors hover:border-border/80 ${
                  isDeleting ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Event info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-foreground truncate">
                        {event.title}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border ${config.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                      {event.organizations && (
                        <span className="font-medium text-foreground/70">
                          {event.organizations.name}
                        </span>
                      )}
                      {dateStr && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </span>
                      )}
                      {event.venue_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.venue_name}
                          {event.city ? `, ${event.city}` : ""}
                        </span>
                      )}
                      {event.categories.length > 0 && (
                        <span className="capitalize text-muted-foreground">
                          {event.categories.map((c) => formatCategoryLabel(c)).join(" · ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {event.organizations?.slug ? (
                      <a
                        href={`/organizer/${event.organizations.slug}/events/${event.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-border text-muted-foreground hover:text-brand-cyan hover:border-brand-cyan/30 transition-colors bg-transparent"
                        title="Open organizer editor"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </a>
                    ) : null}

                    {event.status === "published" && (
                      <a
                        href={`/events/${event.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-border text-muted-foreground hover:text-brand-cyan hover:border-brand-cyan/30 transition-colors bg-transparent"
                        title="View public page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          disabled={isDeleting}
                          className="p-2 border border-border text-muted-foreground hover:text-amber-400 hover:border-amber-400/40 transition-colors disabled:opacity-50 bg-transparent"
                          title="Archive event"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Archive className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#111111] border-border">
                        <AlertDialogHeader>
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 bg-amber-500/10 flex items-center justify-center shrink-0">
                              <Archive className="w-5 h-5 text-amber-400" />
                            </div>
                            <AlertDialogTitle className="font-serif text-foreground">
                              Archive Event
                            </AlertDialogTitle>
                          </div>
                          <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
                            Archiving removes this event from public discovery and organizer surfaces, but keeps it for audit.
                            <span className="block mt-2 font-semibold text-foreground">
                              {event.title}
                            </span>
                            {event.organizations && (
                              <>
                                {" "}by{" "}
                                <span className="font-semibold text-foreground">
                                  {event.organizations.name}
                                </span>
                              </>
                            )}
                            ?
                            <span className="block mt-2">
                              You can unarchive later (staff-only) if needed.
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        {/* Event summary */}
                        <div className="border border-border bg-black/20 p-3 flex flex-wrap gap-3 text-xs text-muted-foreground font-mono">
                          <span className={`inline-flex items-center gap-1 ${config.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                          {dateStr && (
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              {dateStr}
                            </span>
                          )}
                          {event.venue_name && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-3 h-3" />
                              {event.venue_name}
                            </span>
                          )}
                        </div>

                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border text-muted-foreground font-mono text-xs uppercase tracking-widest bg-transparent hover:bg-muted/10">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleArchive(event.id, event.title)}
                            className="bg-amber-500 text-black font-mono text-xs uppercase tracking-widest border-0 hover:bg-amber-400"
                          >
                            Archive event
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Summary footer */}
      {filtered.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground font-mono text-right">
          Showing {filtered.length} of {counts.all} event{counts.all !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}
