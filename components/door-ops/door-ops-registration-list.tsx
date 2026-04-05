"use client"

import { useMemo, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Copy, Download, Search } from "lucide-react"

export type DoorOpsRow = {
  user_id: string
  status: string
  created_at: string
  checked_in_at?: string | null
}

const DISPLAY_LIMIT = 200

function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatDoorTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function DoorOpsRegistrationList({
  rows,
  profileById,
  renderRowAction,
}: {
  rows: DoorOpsRow[]
  profileById: Record<string, { display_name: string | null }>
  renderRowAction: (row: DoorOpsRow) => ReactNode
}) {
  const [q, setQ] = useState("")
  const [tab, setTab] = useState<"all" | "confirmed" | "checked_in" | "cancelled">("all")

  const counts = useMemo(() => {
    return {
      all: rows.length,
      confirmed: rows.filter((r) => r.status === "confirmed").length,
      checked_in: rows.filter((r) => r.status === "checked_in").length,
      cancelled: rows.filter((r) => r.status === "cancelled").length,
    }
  }, [rows])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false
      if (!needle) return true

      const name = (profileById[r.user_id]?.display_name ?? "").toLowerCase()
      return name.includes(needle) || r.user_id.toLowerCase().includes(needle)
    })
  }, [rows, q, tab, profileById])

  const visible = useMemo(() => filtered.slice(0, DISPLAY_LIMIT), [filtered])

  const checkedInNames = useMemo(() => {
    return rows
      .filter((r) => r.status === "checked_in")
      .map((r) => profileById[r.user_id]?.display_name?.trim() || r.user_id)
      .join("\n")
  }, [rows, profileById])

  const checkedInUuids = useMemo(() => {
    return rows.filter((r) => r.status === "checked_in").map((r) => r.user_id).join("\n")
  }, [rows])

  const exportCsv = () => {
    const header = ["display_name", "user_id", "status", "rsvp_at", "checked_in_at"]
    const lines = visible.map((r) => {
      const name = profileById[r.user_id]?.display_name ?? ""
      return [
        escapeCsvCell(name),
        escapeCsvCell(r.user_id),
        escapeCsvCell(r.status),
        escapeCsvCell(r.created_at),
        escapeCsvCell(r.checked_in_at ?? ""),
      ].join(",")
    })
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rsvp-export-${tab}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV downloaded.")
  }

  const copyText = async (text: string, success: string) => {
    try {
      await navigator.clipboard.writeText(text || "")
      toast.success(success)
    } catch {
      toast.error("Failed to copy.")
    }
  }

  const tabs = [
    { key: "all" as const, label: "All" },
    { key: "confirmed" as const, label: "Confirmed" },
    { key: "checked_in" as const, label: "Checked in" },
    { key: "cancelled" as const, label: "Cancelled" },
  ]

  return (
    <div className="mt-5 min-w-0">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap gap-1.5 min-w-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border transition-colors shrink-0 " +
                (tab === t.key
                  ? "border-brand-cyan text-brand-cyan bg-brand-cyan/5"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50 bg-transparent")
              }
            >
              {t.label}{" "}
              <span className="tabular-nums opacity-80">({counts[t.key]})</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center min-w-0">
          <div className="relative min-w-0 flex-1 sm:flex-initial sm:min-w-[200px] sm:max-w-[min(100%,320px)]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or UUID"
              className="w-full min-w-0 bg-[#0a0a0a] border border-border pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copyText(checkedInNames, "Copied checked-in names.")}
              className="inline-flex flex-1 min-w-[8rem] items-center justify-center gap-2 border border-border text-muted-foreground px-3 py-2.5 text-[10px] font-mono uppercase tracking-widest hover:text-brand-cyan hover:border-brand-cyan/30 hover:bg-brand-cyan/5 transition-all sm:flex-initial"
              title="One name per line"
            >
              <Copy className="h-4 w-4 shrink-0" />
              Names
            </button>
            <button
              type="button"
              onClick={() => copyText(checkedInUuids, "Copied checked-in UUIDs.")}
              className="inline-flex flex-1 min-w-[8rem] items-center justify-center gap-2 border border-border text-muted-foreground px-3 py-2.5 text-[10px] font-mono uppercase tracking-widest hover:text-brand-cyan hover:border-brand-cyan/30 hover:bg-brand-cyan/5 transition-all sm:flex-initial"
              title="User IDs for audit"
            >
              <Copy className="h-4 w-4 shrink-0" />
              UUIDs
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={visible.length === 0}
              className="inline-flex flex-1 min-w-[8rem] items-center justify-center gap-2 border border-border text-muted-foreground px-3 py-2.5 text-[10px] font-mono uppercase tracking-widest hover:text-brand-cyan hover:border-brand-cyan/30 hover:bg-brand-cyan/5 transition-all disabled:opacity-40 sm:flex-initial"
              title="Current filter (up to 200 rows)"
            >
              <Download className="h-4 w-4 shrink-0" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: stacked cards — no horizontal table scroll */}
      <div className="mt-4 space-y-2 md:hidden">
        {visible.length === 0 ? (
          <div className="border border-border px-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">No matching RSVPs.</p>
          </div>
        ) : (
          visible.map((r) => {
            const display = profileById[r.user_id]?.display_name || "(no display name)"
            return (
              <div
                key={`${r.user_id}-${r.created_at}`}
                className="border border-border bg-black/20 p-3 min-w-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm text-foreground/90">{display}</div>
                  <div className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{r.user_id}</div>
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-foreground/80">
                  {r.status.replace(/_/g, " ")}
                </div>
                <div className="mt-2 space-y-1 font-mono text-[10px] text-muted-foreground">
                  <div>
                    <span className="text-muted-foreground/70">RSVP </span>
                    {formatDoorTime(r.created_at)}
                  </div>
                  {r.checked_in_at ? (
                    <div>
                      <span className="text-muted-foreground/70">Check-in </span>
                      {formatDoorTime(r.checked_in_at)}
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-col gap-2 [&_button]:w-full">{renderRowAction(r)}</div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop: grid table */}
      <div className="mt-4 hidden md:block border border-border bg-black/20 min-w-0 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
          <div className="col-span-4 min-w-0">User</div>
          <div className="col-span-2 min-w-0">Status</div>
          <div className="col-span-4 min-w-0">RSVP / Check-in</div>
          <div className="col-span-2 min-w-0 text-right">Action</div>
        </div>

        {visible.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">No matching RSVPs.</p>
          </div>
        ) : (
          visible.map((r) => {
            const display = profileById[r.user_id]?.display_name || "(no display name)"
            return (
              <div
                key={`${r.user_id}-${r.created_at}`}
                className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-muted-foreground border-b border-border/60 last:border-b-0 items-start"
              >
                <div className="col-span-4 min-w-0">
                  <div className="truncate text-foreground/90">{display}</div>
                  <div className="mt-0.5 font-mono truncate text-[11px] text-muted-foreground">{r.user_id}</div>
                </div>
                <div className="col-span-2 min-w-0 font-mono uppercase tracking-widest text-[10px] text-foreground/80">
                  {r.status.replace(/_/g, " ")}
                </div>
                <div className="col-span-4 min-w-0 font-mono text-[10px] text-muted-foreground space-y-0.5">
                  <div title={new Date(r.created_at).toLocaleString()}>
                    RSVP {formatDoorTime(r.created_at)}
                  </div>
                  {r.checked_in_at ? (
                    <div className="text-brand-cyan/90" title={new Date(r.checked_in_at).toLocaleString()}>
                      In {formatDoorTime(r.checked_in_at)}
                    </div>
                  ) : (
                    <div className="text-muted-foreground/50">—</div>
                  )}
                </div>
                <div className="col-span-2 min-w-0 flex justify-end">{renderRowAction(r)}</div>
              </div>
            )
          })
        )}
      </div>

      {filtered.length > DISPLAY_LIMIT ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Showing first {DISPLAY_LIMIT} of {filtered.length} in this filter. Refine search or export CSV for the
          visible slice.
        </p>
      ) : null}
    </div>
  )
}
