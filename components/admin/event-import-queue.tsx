"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  bulkReviewImportedEvents,
  reviewImportedEvent,
  type ImportedEventQueueRow,
} from "@/app/actions/event-import"
import { Calendar, Clock, ExternalLink, ImageIcon, MapPin, RefreshCw } from "lucide-react"
import { formatCategoryLabel } from "@/lib/events/event-display-format"
import { normalizeCategories } from "@/lib/events/categories"
import { NeonLink } from "@/components/ui/neon-link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function EventImportQueue({ events }: { events: ImportedEventQueueRow[] }) {
  const [rows, setRows] = useState(events)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [importPending, setImportPending] = useState(false)
  const [importSummary, setImportSummary] = useState<string | null>(null)
  const rejectNotesRef = useRef<HTMLTextAreaElement>(null)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)

  async function handleRunImport() {
    setImportPending(true)
    setImportSummary(null)
    try {
      const res = await fetch("/api/admin/imports/eventbrite/run", { method: "POST" })
      const data = (await res.json()) as {
        ok?: boolean
        skipped?: boolean
        found?: number
        created?: number
        updated?: number
        skippedEvents?: number
        errors?: string[]
        error?: string
      }
      if (!res.ok || data.error) {
        setImportSummary(data.error ?? "Import failed.")
      } else if (data.skipped) {
        setImportSummary("Import skipped (disabled or not configured).")
      } else {
        setImportSummary(
          `Found ${data.found ?? 0} · created ${data.created ?? 0} · updated ${data.updated ?? 0} · skipped ${data.skippedEvents ?? 0}`,
        )
      }
      window.location.reload()
    } catch {
      setImportSummary("Import request failed.")
    } finally {
      setImportPending(false)
    }
  }

  async function handleReview(eventId: string, action: "approve" | "reject", notes?: string) {
    setPendingIds((prev) => new Set(prev).add(eventId))
    const formData = new FormData()
    formData.set("eventId", eventId)
    formData.set("action", action)
    if (notes) formData.set("review_notes", notes)
    const res = await reviewImportedEvent(formData)
    setPendingIds((prev) => {
      const next = new Set(prev)
      next.delete(eventId)
      return next
    })
    if ("success" in res && res.success) {
      setRows((prev) => prev.filter((e) => e.id !== eventId))
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    }
  }

  async function handleBulkApprove() {
    const ids = [...selected]
    if (ids.length === 0) return
    setPendingIds(new Set(ids))
    setImportSummary(null)

    const res = await bulkReviewImportedEvents(ids, "approve")
    setPendingIds(new Set())

    const succeededIds =
      "succeededIds" in res && Array.isArray(res.succeededIds) ? new Set(res.succeededIds) : new Set<string>()

    if (succeededIds.size === 0) {
      setImportSummary("error" in res && res.error ? res.error : "Bulk approve failed.")
      return
    }

    setRows((prev) => prev.filter((e) => !succeededIds.has(e.id)))
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of succeededIds) next.delete(id)
      return next
    })

    if ("success" in res && res.success) {
      setImportSummary(`Approved ${succeededIds.size} event(s).`)
    } else if ("error" in res && res.error) {
      setImportSummary(res.error)
    }
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} Eventbrite event{rows.length === 1 ? "" : "s"} awaiting approval.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRunImport}
            disabled={importPending}
            className="inline-flex min-h-10 items-center gap-2 border border-border px-4 font-mono text-[10px] uppercase tracking-widest hover:border-neon-a/45 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${importPending ? "animate-spin" : ""}`} aria-hidden />
            Run import now
          </button>
          {selected.size > 0 ? (
            <button
              type="button"
              onClick={handleBulkApprove}
              className="inline-flex min-h-10 items-center border border-neon-a/45 bg-neon-a/10 px-4 font-mono text-[10px] uppercase tracking-widest text-foreground"
            >
              Approve selected ({selected.size})
            </button>
          ) : null}
        </div>
      </div>

      {importSummary ? (
        <p className="font-mono text-xs text-muted-foreground">{importSummary}</p>
      ) : null}

      {rows.length === 0 ? (
        <div className="border border-dashed p-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neon-a">Queue empty</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Run an import to pull Eventbrite events into pending review.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((evt) => {
            const isPending = pendingIds.has(evt.id)
            const startDate = new Date(evt.starts_at)
            const cats = normalizeCategories(evt.categories)

            return (
              <li
                key={evt.id}
                className="border border-border border-l-2 border-l-neon-b bg-card p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <label className="flex items-start gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={selected.has(evt.id)}
                      onChange={() => toggleSelected(evt.id)}
                      className="mt-1"
                      aria-label={`Select ${evt.title}`}
                    />
                    <div className="flex gap-3 min-w-0">
                      <div className="h-12 w-12 shrink-0 overflow-hidden bg-muted">
                        {evt.flyer_url ? (
                          <Image
                            src={evt.flyer_url}
                            alt=""
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{evt.title}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-neon-b">
                          Eventbrite import
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {cats.map((c) => (
                            <span
                              key={c}
                              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                            >
                              {formatCategoryLabel(c)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </label>

                  <div className="flex flex-wrap gap-2 sm:shrink-0">
                    <NeonLink href={`/admin/events/${evt.id}`} variant="secondary" size="sm">
                      Edit
                    </NeonLink>
                    {evt.source_url ? (
                      <a
                        href={evt.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-9 items-center gap-1 px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-neon-a"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        Source
                      </a>
                    ) : null}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleReview(evt.id, "approve")}
                      className="min-h-9 border border-neon-a/45 bg-neon-a/10 px-4 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <AlertDialog
                      open={rejectTargetId === evt.id}
                      onOpenChange={(open) => setRejectTargetId(open ? evt.id : null)}
                    >
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          disabled={isPending}
                          className="min-h-9 border border-border px-4 font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject imported event?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Optional reason helps if the listing is re-imported after changes on Eventbrite.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <textarea
                          ref={rejectNotesRef}
                          rows={3}
                          className="w-full border border-border bg-background p-2 text-sm"
                          placeholder="Rejection reason (optional)"
                        />
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              const notes = rejectNotesRef.current?.value?.trim()
                              handleReview(evt.id, "reject", notes || undefined)
                              setRejectTargetId(null)
                            }}
                          >
                            Reject
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    <Calendar className="h-3 w-3" />
                    {startDate.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    <MapPin className="h-3 w-3" />
                    {evt.venue_name}, {evt.city}
                  </span>
                  {evt.last_imported_at ? (
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <Clock className="h-3 w-3" />
                      Imported {new Date(evt.last_imported_at).toLocaleString()}
                    </span>
                  ) : null}
                </div>

                {evt.description ? (
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{evt.description}</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
