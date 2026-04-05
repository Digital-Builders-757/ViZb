"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { archiveEvent, unarchiveEvent } from "@/app/actions/event"
import { EVENT_STATUS_CONFIG } from "@/lib/constants"
import {
  Search,
  Calendar,
  MapPin,
  Loader2,
  ExternalLink,
  Archive,
  Pencil,
  RotateCcw,
  MoreVertical,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  { key: "pending_review", label: "Pending review" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Rejected" },
  { key: "archived", label: "Archived" },
] as const

function matchesSearch(e: AdminEvent, q: string) {
  const needle = q.toLowerCase()
  if (e.title.toLowerCase().includes(needle)) return true
  if (e.organizations?.name.toLowerCase().includes(needle)) return true
  if (e.organizations?.slug?.toLowerCase().includes(needle)) return true
  if (e.city?.toLowerCase().includes(needle)) return true
  return false
}

export function AdminEventManager({ events }: AdminEventManagerProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [archiveFor, setArchiveFor] = useState<AdminEvent | null>(null)

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (activeTab !== "all" && e.status !== activeTab) return false
      if (search.trim() && !matchesSearch(e, search.trim())) return false
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
        setArchiveFor(null)
        router.refresh()
      }
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleUnarchive(eventId: string, eventTitle: string) {
    setDeletingId(eventId)
    try {
      const result = await unarchiveEvent(eventId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`"${eventTitle}" was restored to draft.`)
        setActiveTab("draft")
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

  const archiveDialogEvent = archiveFor
  const archiveConfig = archiveDialogEvent
    ? (EVENT_STATUS_CONFIG[archiveDialogEvent.status] ?? EVENT_STATUS_CONFIG.draft)
    : null
  const archiveDateStr = archiveDialogEvent ? formatDate(archiveDialogEvent.starts_at) : null
  const ArchiveStatusIcon = archiveConfig?.icon

  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-4">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, org name, org slug, or city…"
            className="w-full min-w-0 bg-[#0a0a0a] border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border transition-colors shrink-0 ${
                activeTab === tab.key
                  ? "border-brand-cyan text-brand-cyan bg-brand-cyan/5"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50 bg-transparent"
              }`}
            >
              {tab.label}{" "}
              <span className="tabular-nums opacity-80">({counts[tab.key] ?? 0})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {search.trim() ? "No events match your search." : "No events in this category."}
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
                className={`group border border-border bg-[#111111] p-4 transition-colors hover:border-border/80 min-w-0 ${
                  isDeleting ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground break-words">{event.title}</h4>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border ${config.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {event.organizations && (
                        <span className="font-medium text-foreground/70 break-words">
                          {event.organizations.name}
                        </span>
                      )}
                      {dateStr && (
                        <span className="flex min-w-0 items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {dateStr}
                        </span>
                      )}
                      {event.venue_name && (
                        <span className="flex min-w-0 items-center gap-1 break-words">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {event.venue_name}
                          {event.city ? `, ${event.city}` : ""}
                        </span>
                      )}
                      {event.categories.length > 0 && (
                        <span className="text-muted-foreground break-words">
                          {event.categories.map((c) => formatCategoryLabel(c)).join(" · ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
                    <div className="hidden items-center gap-2 md:flex">
                      <a
                        href={`/admin/events/${event.id}`}
                        className="border border-border bg-transparent p-2 text-muted-foreground transition-colors hover:border-brand-cyan/30 hover:text-brand-cyan"
                        title="Open staff event detail"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </a>

                      {event.organizations?.slug ? (
                        <a
                          href={`/organizer/${event.organizations.slug}/events/${event.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border border-border bg-transparent p-2 text-muted-foreground transition-colors hover:border-brand-cyan/30 hover:text-brand-cyan"
                          title="Open organizer editor"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}

                      {event.status === "archived" ? (
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleUnarchive(event.id, event.title)}
                          className="border border-border bg-transparent p-2 text-muted-foreground transition-colors hover:border-brand-cyan/30 hover:text-brand-cyan disabled:opacity-50"
                          title="Restore to draft"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ) : null}

                      {event.status === "published" ? (
                        <a
                          href={`/events/${event.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border border-border bg-transparent p-2 text-muted-foreground transition-colors hover:border-brand-cyan/30 hover:text-brand-cyan"
                          title="View public page"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}

                      {event.status !== "archived" ? (
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => setArchiveFor(event)}
                          className="border border-border bg-transparent p-2 text-muted-foreground transition-colors hover:border-amber-400/40 hover:text-amber-400 disabled:opacity-50"
                          title="Archive event"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>

                    <div className="md:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            disabled={isDeleting}
                            className="inline-flex h-10 min-w-10 items-center justify-center border border-border bg-transparent text-muted-foreground hover:border-brand-cyan/30 hover:text-brand-cyan disabled:opacity-50"
                            aria-label="Event actions"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[12rem]">
                          <DropdownMenuItem asChild>
                            <a href={`/admin/events/${event.id}`}>Staff event detail</a>
                          </DropdownMenuItem>
                          {event.organizations?.slug ? (
                            <DropdownMenuItem asChild>
                              <a
                                href={`/organizer/${event.organizations.slug}/events/${event.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Organizer editor
                              </a>
                            </DropdownMenuItem>
                          ) : null}
                          {event.status === "published" ? (
                            <DropdownMenuItem asChild>
                              <a href={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer">
                                Public event page
                              </a>
                            </DropdownMenuItem>
                          ) : null}
                          {event.status === "archived" ? (
                            <DropdownMenuItem
                              disabled={isDeleting}
                              onSelect={(ev) => {
                                ev.preventDefault()
                                handleUnarchive(event.id, event.title)
                              }}
                            >
                              Restore to draft
                            </DropdownMenuItem>
                          ) : null}
                          {event.status !== "archived" ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={isDeleting}
                                onSelect={(ev) => {
                                  ev.preventDefault()
                                  setArchiveFor(event)
                                }}
                              >
                                Archive event…
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <AlertDialog
        open={archiveFor !== null}
        onOpenChange={(open) => {
          if (!open) setArchiveFor(null)
        }}
      >
        <AlertDialogContent className="border-border bg-[#111111]">
          {archiveDialogEvent && archiveConfig && ArchiveStatusIcon ? (
            <>
              <AlertDialogHeader>
                <div className="mb-1 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-amber-500/10">
                    <Archive className="h-5 w-5 text-amber-400" />
                  </div>
                  <AlertDialogTitle className="font-serif text-foreground">Archive Event</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
                  Archiving removes this event from public discovery and organizer surfaces, but keeps it for audit.
                  <span className="mt-2 block font-semibold text-foreground">{archiveDialogEvent.title}</span>
                  {archiveDialogEvent.organizations ? (
                    <>
                      {" "}
                      by{" "}
                      <span className="font-semibold text-foreground">
                        {archiveDialogEvent.organizations.name}
                      </span>
                    </>
                  ) : null}
                  ?
                  <span className="mt-2 block">You can unarchive later (staff-only) if needed.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="flex flex-wrap gap-3 border border-border bg-black/20 p-3 font-mono text-xs text-muted-foreground">
                <span className={`inline-flex items-center gap-1 ${archiveConfig.color}`}>
                  <ArchiveStatusIcon className="h-3 w-3" />
                  {archiveConfig.label}
                </span>
                {archiveDateStr ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {archiveDateStr}
                  </span>
                ) : null}
                {archiveDialogEvent.venue_name ? (
                  <span className="inline-flex items-center gap-1.5 break-all">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {archiveDialogEvent.venue_name}
                  </span>
                ) : null}
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel className="border-border bg-transparent font-mono text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted/10">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleArchive(archiveDialogEvent.id, archiveDialogEvent.title)}
                  className="border-0 bg-amber-500 font-mono text-xs uppercase tracking-widest text-black hover:bg-amber-400"
                >
                  Archive event
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>

      {filtered.length > 0 ? (
        <p className="mt-4 text-right font-mono text-xs text-muted-foreground">
          Showing {filtered.length} of {counts.all} event{counts.all !== 1 ? "s" : ""}
        </p>
      ) : null}
    </div>
  )
}
