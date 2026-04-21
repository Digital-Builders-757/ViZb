"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Copy, Search } from "lucide-react"

import { CheckInButton } from "@/components/admin/check-in-button"
import { UndoCheckInButton } from "@/components/admin/undo-check-in-button"

type Row = {
  user_id: string
  status: "confirmed" | "cancelled" | "checked_in" | string
  created_at: string
  checked_in_at?: string | null
}

export function AdminEventRegistrationsTable({
  eventId,
  rows,
  profileById,
}: {
  eventId: string
  rows: Row[]
  profileById: Record<string, { display_name: string | null }>
}) {
  const [q, setQ] = useState("")
  const [tab, setTab] = useState<"all" | "confirmed" | "checked_in" | "cancelled">("all")

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false
      if (!needle) return true

      const name = (profileById[r.user_id]?.display_name ?? "").toLowerCase()
      return name.includes(needle) || r.user_id.toLowerCase().includes(needle)
    })
  }, [rows, q, tab, profileById])

  const checkedInNames = useMemo(() => {
    const names = rows
      .filter((r) => r.status === "checked_in")
      .map((r) => profileById[r.user_id]?.display_name || r.user_id)
    return names.join("\n")
  }, [rows, profileById])

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: "all", label: "All" },
              { key: "confirmed", label: "Confirmed" },
              { key: "checked_in", label: "Checked in" },
              { key: "cancelled", label: "Cancelled" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border transition-colors " +
                (tab === t.key
                  ? "border-neon-a text-neon-a bg-neon-a/5"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50 bg-transparent")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or UUID"
              className="w-full sm:w-[280px] bg-input border border-border pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-a/50 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(checkedInNames || "")
                toast.success("Copied checked-in list.")
              } catch {
                toast.error("Failed to copy.")
              }
            }}
            className="inline-flex items-center justify-center gap-2 border border-border text-muted-foreground px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest hover:text-neon-a hover:border-neon-a/30 hover:bg-neon-a/5 transition-all"
            title="Copy checked-in list"
          >
            <Copy className="w-4 h-4" />
            Copy checked-in
          </button>
        </div>
      </div>

      <div className="mt-4 border border-border bg-black/20">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
          <div className="col-span-5">User</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Times</div>
          <div className="col-span-2">Action</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">No matching RSVPs.</p>
          </div>
        ) : (
          filtered.slice(0, 200).map((r) => {
            const display = profileById[r.user_id]?.display_name || "(no display name)"
            return (
              <div
                key={`${r.user_id}-${r.created_at}`}
                className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-muted-foreground border-b border-border/60 last:border-b-0"
              >
                <div className="col-span-5 min-w-0">
                  <div className="truncate text-foreground/90">{display}</div>
                  <div className="mt-0.5 font-mono truncate text-[11px] text-muted-foreground">{r.user_id}</div>
                </div>
                <div className="col-span-2 font-mono uppercase tracking-widest text-[10px] text-foreground/80">
                  {r.status}
                </div>
                <div className="col-span-3 font-mono text-[10px] text-muted-foreground">
                  <div>RSVP {new Date(r.created_at).toLocaleString()}</div>
                  {r.checked_in_at ? <div>IN {new Date(r.checked_in_at).toLocaleString()}</div> : null}
                </div>
                <div className="col-span-2">
                  {r.status === "confirmed" ? (
                    <CheckInButton eventId={eventId} userId={r.user_id} />
                  ) : r.status === "checked_in" ? (
                    <UndoCheckInButton eventId={eventId} userId={r.user_id} />
                  ) : (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {filtered.length > 200 ? (
        <p className="mt-2 text-[11px] text-muted-foreground">Showing first 200 results.</p>
      ) : null}
    </div>
  )
}
