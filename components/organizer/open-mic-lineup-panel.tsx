"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import {
  addLineupEntry,
  cancelLineupEntry,
  moveLineupEntry,
  setLineupEntryPublic,
  setLineupEntryStatus,
  updateLineupEntry,
} from "@/app/actions/lineup"
import {
  formatLineupStatusLabel,
  getLineupEntryPublicVisibilityPresentation,
  isLineupEntryOnPublicPage,
  type LineupPublicVisibilityTone,
} from "@/lib/lineup/lineup-entry-status"
import {
  getPublicLineupAbsoluteUrl,
  getPublicLineupShareTarget,
} from "@/lib/public-site-url"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { ChevronDown, ChevronUp, ExternalLink, Link2, Mic2 } from "lucide-react"

export type OpenMicLineupEntryRow = {
  id: string
  performer_name: string
  stage_name: string | null
  notes: string | null
  slot_order: number
  status: string
  is_public: boolean
}

const fieldClass =
  "vibe-input-glass vibe-focus-ring !min-h-0 px-3 py-2 text-sm placeholder:text-[color:var(--neon-text2)]"
const labelClass = "text-[10px] font-mono uppercase tracking-widest text-muted-foreground"

function visibilityToneClass(tone: LineupPublicVisibilityTone) {
  switch (tone) {
    case "on_public":
      return "border-emerald-500/50 text-emerald-400"
    case "caution":
      return "border-amber-500/50 text-amber-400"
    default:
      return "border-border text-muted-foreground"
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "confirmed":
      return "border-emerald-500/50 text-emerald-400"
    case "performed":
      return "border-neon-a/50 text-neon-a"
    case "no_show":
      return "border-amber-500/50 text-amber-400"
    case "cancelled":
      return "border-border text-muted-foreground line-through"
    default:
      return "border-border text-muted-foreground"
  }
}

export function OpenMicLineupPanel({
  eventId,
  eventSlug,
  orgSlug,
  entries,
  isArchived,
  eventIsPublished,
}: {
  eventId: string
  eventSlug: string
  orgSlug: string | null
  entries: OpenMicLineupEntryRow[]
  isArchived: boolean
  eventIsPublished: boolean
}) {
  const [pending, startTransition] = useTransition()

  const publicLineupAbsolute = getPublicLineupAbsoluteUrl(eventSlug)
  const publicLineupShareTarget = getPublicLineupShareTarget(eventSlug)
  const eligiblePublicCount = entries.filter(isLineupEntryOnPublicPage).length

  const copyPublicLink = () => {
    const text = publicLineupShareTarget
    void navigator.clipboard.writeText(text).then(
      () => toast.success("Public lineup link copied."),
      () => toast.error("Could not copy link."),
    )
  }

  const orgSlugValue = orgSlug ?? ""

  return (
    <GlassCard className="mt-6 p-6 md:p-8" emphasis>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-neon-a mb-1 flex items-center gap-2">
            <Mic2 className="w-4 h-4" />
            Open mic lineup
          </h2>
          <div className="text-sm text-muted-foreground max-w-2xl space-y-2">
            <p>
              Running order for performers. The public lineup page lists only rows with{" "}
              <span className="text-foreground/90">Public on</span> and status{" "}
              <span className="text-foreground/90">Confirmed</span> or <span className="text-foreground/90">Performed</span>.
            </p>
            <p>
              Pending, hidden, no-show, and cancelled slots stay in your dashboard but do not appear publicly. Host
              notes are never shown on the public page.
            </p>
          </div>
        </div>
      </div>

      {!eventIsPublished ? (
        <p className="mb-4 text-sm text-muted-foreground border border-amber-500/30 bg-amber-500/5 px-3 py-2 rounded-md">
          This event is not <span className="text-foreground/90">published</span> yet — the shareable{" "}
          <span className="font-mono text-xs">/lineup/…</span> page is only available after you publish the event.
        </p>
      ) : null}

      {entries.length > 0 && eligiblePublicCount === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground border border-border/60 bg-muted/5 px-3 py-2 rounded-md">
          No performers are currently eligible for public display. Turn <span className="text-foreground/90">Public</span>{" "}
          on and set status to <span className="text-foreground/90">Confirmed</span> or{" "}
          <span className="text-foreground/90">Performed</span> for anyone who should appear on the public lineup.
        </p>
      ) : null}

      <div className="mb-6 rounded-md border border-border/60 bg-muted/5 px-3 py-3 space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Public lineup URL
        </p>
        <p className="text-xs font-mono text-foreground/90 break-all">{publicLineupShareTarget}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border font-mono text-[10px] uppercase tracking-widest"
            asChild
          >
            <a href={publicLineupShareTarget} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 mr-2" />
              Open public page
            </a>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border font-mono text-[10px] uppercase tracking-widest"
            onClick={copyPublicLink}
          >
            <Link2 className="w-3 h-3 mr-2" />
            Copy link
          </Button>
        </div>
        {!publicLineupAbsolute ? (
          <p className="text-[11px] text-muted-foreground leading-snug">
            Set <span className="text-foreground/80">NEXT_PUBLIC_SITE_URL</span> so copy/open use a full https URL for
            sharing (see <span className="text-foreground/80">.env.example</span>).
          </p>
        ) : null}
      </div>

      {isArchived ? (
        <p className="text-sm text-muted-foreground border border-border/60 p-4 bg-muted/5">
          This event is archived — lineup can’t be edited.
        </p>
      ) : (
        <>
          <form
            className="mb-8 border border-border/60 rounded-lg p-4 space-y-3 bg-muted/25"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              fd.set("event_id", eventId)
              fd.set("org_slug", orgSlugValue)
              startTransition(async () => {
                const res = await addLineupEntry(fd)
                if ("error" in res && res.error) toast.error(res.error)
                else {
                  toast.success("Performer added.")
                  ;(e.target as HTMLFormElement).reset()
                }
              })
            }}
          >
            <span className={labelClass}>Quick add</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={labelClass + " block mb-1"}>Performer</label>
                <input name="performer_name" required className={fieldClass} placeholder="Name" />
              </div>
              <div>
                <label className={labelClass + " block mb-1"}>Stage / mic</label>
                <input name="stage_name" className={fieldClass} placeholder="Optional" />
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <label className={labelClass + " block mb-1"}>Notes</label>
                <input name="notes" className={fieldClass} placeholder="Host notes (not on public page)" />
              </div>
            </div>
            <Button type="submit" disabled={pending} size="sm" className="font-mono text-[10px] uppercase tracking-widest">
              Add to lineup
            </Button>
          </form>

          <div className="space-y-4">
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border/60">
                No performers yet — add the first slot above.
              </p>
            ) : (
              entries.map((row, index) => {
                const visibility = getLineupEntryPublicVisibilityPresentation(row)
                return (
                <div
                  key={row.id}
                  className={`border border-border/60 rounded-lg p-4 space-y-3 bg-muted/25 ${
                    row.status === "cancelled" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border ${statusBadgeClass(row.status)}`}
                    >
                      {formatLineupStatusLabel(row.status)}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border max-w-full ${visibilityToneClass(visibility.tone)}`}
                      title="Public lineup page visibility"
                    >
                      {visibility.label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground ml-auto md:ml-0">
                      #{index + 1}
                    </span>
                  </div>

                  <form
                    className="grid grid-cols-1 md:grid-cols-12 gap-3"
                    onSubmit={(e) => {
                      e.preventDefault()
                      const fd = new FormData(e.currentTarget)
                      fd.set("entry_id", row.id)
                      fd.set("org_slug", orgSlugValue)
                      startTransition(async () => {
                        const res = await updateLineupEntry(fd)
                        if ("error" in res && res.error) toast.error(res.error)
                        else toast.success("Saved.")
                      })
                    }}
                  >
                    <div className="md:col-span-1">
                      <label className={labelClass + " block mb-1"}>Order</label>
                      <input
                        name="slot_order"
                        type="number"
                        min={0}
                        defaultValue={row.slot_order}
                        className={fieldClass}
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className={labelClass + " block mb-1"}>Performer</label>
                      <input
                        name="performer_name"
                        required
                        defaultValue={row.performer_name}
                        className={fieldClass}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className={labelClass + " block mb-1"}>Stage</label>
                      <input
                        name="stage_name"
                        defaultValue={row.stage_name ?? ""}
                        className={fieldClass}
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className={labelClass + " block mb-1"}>Notes</label>
                      <input name="notes" defaultValue={row.notes ?? ""} className={fieldClass} />
                    </div>
                    <div className="md:col-span-12 flex flex-wrap gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={pending}
                        variant="secondary"
                        className="font-mono text-[10px] uppercase tracking-widest"
                      >
                        Save row
                      </Button>
                    </div>
                  </form>

                  <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending || row.status === "cancelled"}
                      className="h-8 px-2"
                      onClick={() => {
                        const fd = new FormData()
                        fd.set("entry_id", row.id)
                        fd.set("org_slug", orgSlugValue)
                        fd.set("direction", "up")
                        startTransition(async () => {
                          const res = await moveLineupEntry(fd)
                          if ("error" in res && res.error) toast.error(res.error)
                        })
                      }}
                      aria-label="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending || row.status === "cancelled"}
                      className="h-8 px-2"
                      onClick={() => {
                        const fd = new FormData()
                        fd.set("entry_id", row.id)
                        fd.set("org_slug", orgSlugValue)
                        fd.set("direction", "down")
                        startTransition(async () => {
                          const res = await moveLineupEntry(fd)
                          if ("error" in res && res.error) toast.error(res.error)
                        })
                      }}
                      aria-label="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>

                    {(["pending", "confirmed", "performed", "no_show"] as const).map((st) => (
                      <Button
                        key={st}
                        type="button"
                        size="sm"
                        variant={row.status === st ? "default" : "outline"}
                        disabled={pending || row.status === "cancelled"}
                        className="font-mono text-[10px] uppercase tracking-widest h-8"
                        onClick={() => {
                          const fd = new FormData()
                          fd.set("entry_id", row.id)
                          fd.set("org_slug", orgSlugValue)
                          fd.set("status", st)
                          startTransition(async () => {
                            const res = await setLineupEntryStatus(fd)
                            if ("error" in res && res.error) toast.error(res.error)
                            else toast.success("Status updated.")
                          })
                        }}
                      >
                        {formatLineupStatusLabel(st)}
                      </Button>
                    ))}

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending || row.status === "cancelled"}
                      className="font-mono text-[10px] uppercase tracking-widest h-8"
                      onClick={() => {
                        const fd = new FormData()
                        fd.set("entry_id", row.id)
                        fd.set("org_slug", orgSlugValue)
                        fd.set("is_public", row.is_public ? "false" : "true")
                        startTransition(async () => {
                          const res = await setLineupEntryPublic(fd)
                          if ("error" in res && res.error) toast.error(res.error)
                          else toast.success(row.is_public ? "Hidden from public page." : "Visible on public page.")
                        })
                      }}
                    >
                      {row.is_public ? "Hide from public" : "Show on public"}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={pending || row.status === "cancelled"}
                      className="font-mono text-[10px] uppercase tracking-widest h-8 ml-auto"
                      onClick={() => {
                        if (!confirm("Cancel this slot? It will drop off the public page.")) return
                        const fd = new FormData()
                        fd.set("entry_id", row.id)
                        fd.set("org_slug", orgSlugValue)
                        startTransition(async () => {
                          const res = await cancelLineupEntry(fd)
                          if ("error" in res && res.error) toast.error(res.error)
                          else toast.success("Slot cancelled.")
                        })
                      }}
                    >
                      Cancel slot
                    </Button>
                  </div>
                </div>
                )
              })
            )}
          </div>
        </>
      )}
    </GlassCard>
  )
}
