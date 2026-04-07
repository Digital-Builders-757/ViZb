"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type AttendeeInfo = {
  registrationId: string
  userId: string
  displayName: string | null
}

type ScanResult =
  | { kind: "success"; title: string; message: string; attendee?: AttendeeInfo | null }
  | { kind: "error"; title: string; message: string; attendee?: AttendeeInfo | null }
  | { kind: "info"; title: string; message: string; attendee?: AttendeeInfo | null }

type RecentScan = {
  id: string
  at: number
  kind: ScanResult["kind"]
  title: string
  message: string
  name?: string | null
}

type ScanApiJson = {
  ok?: boolean
  status?: string
  error?: string
  code?: string
  attendee?: AttendeeInfo
  checkedInAt?: string | null
}

function pushRecent(prev: RecentScan[], entry: Omit<RecentScan, "id">): RecentScan[] {
  const row: RecentScan = { ...entry, id: `${entry.at}-${Math.random().toString(36).slice(2, 9)}` }
  return [row, ...prev].slice(0, 5)
}

export function EventCheckInScanner({
  eventId,
}: {
  eventId: string
}) {
  const [cameraOn, setCameraOn] = useState(false)
  const [manualToken, setManualToken] = useState("")
  const [isPending, startTransition] = useTransition()
  const [last, setLast] = useState<ScanResult | null>(null)
  const [recent, setRecent] = useState<RecentScan[]>([])
  const dedupeRef = useRef<{ token: string; at: number } | null>(null)

  const regionId = useMemo(() => `qr-reader-${eventId}`, [eventId])
  const qrcodeRef = useRef<Html5Qrcode | null>(null)

  function submitToken(rawToken: string) {
    const trimmed = rawToken.trim()
    if (!trimmed) return

    const now = Date.now()
    const prev = dedupeRef.current
    if (prev && prev.token === trimmed && now - prev.at < 2800) return
    dedupeRef.current = { token: trimmed, at: now }

    startTransition(async () => {
      try {
        const res = await fetch("/api/checkin/scan", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: trimmed, eventId }),
        })

        let json: ScanApiJson
        try {
          json = (await res.json()) as ScanApiJson
        } catch {
          const title = "Scan failed"
          const message = "The server returned an unreadable response."
          setLast({ kind: "error", title, message })
          setRecent((r) => pushRecent(r, { at: Date.now(), kind: "error", title, message }))
          toast.error(message)
          return
        }

        const attendee = json.attendee
        const name = attendee?.displayName?.trim() || null

        if (json.ok === true && json.status === "checked_in") {
          const title = "Checked in"
          const message = "Guest admitted."
          setLast({ kind: "success", title, message, attendee: attendee ?? null })
          setRecent((r) => pushRecent(r, { at: Date.now(), kind: "success", title, message, name }))
          toast.success(name ? `${message} ${name}` : message)
          return
        }

        if (json.ok === true && json.status === "already_checked_in") {
          const title = "Already checked in"
          const message = "This ticket was already scanned."
          setLast({ kind: "info", title, message, attendee: attendee ?? null })
          setRecent((r) => pushRecent(r, { at: Date.now(), kind: "info", title, message, name }))
          toast(name ? `${message} ${name}` : message)
          return
        }

        const errText = typeof json.error === "string" && json.error.length > 0 ? json.error : "Scan failed."
        const code = json.code ?? "unknown"

        const titled = (t: string, m: string, kind: ScanResult["kind"] = "error") => {
          setLast({ kind, title: t, message: m, attendee: attendee ?? null })
          setRecent((r) => pushRecent(r, { at: Date.now(), kind, title: t, message: m, name }))
        }

        switch (code) {
          case "scanner_not_configured":
          case "service_unavailable": {
            const title = "Scanner not ready"
            titled(title, errText)
            toast.error(errText)
            return
          }
          case "unauthorized": {
            const title = "Not signed in"
            titled(title, errText)
            toast.error(errText)
            return
          }
          case "not_authorized": {
            const title = "Not authorized"
            titled(title, errText)
            toast.error(errText)
            return
          }
          case "event_not_found": {
            const title = "Event not found"
            titled(title, errText)
            toast.error(errText)
            return
          }
          case "wrong_event": {
            const title = "Wrong event"
            titled(title, errText)
            toast.error(errText)
            return
          }
          case "token_expired": {
            const title = "Expired ticket code"
            titled(title, errText)
            toast.error(errText)
            return
          }
          case "token_expiry_invalid":
          case "invalid_token": {
            const title = "Invalid ticket code"
            titled(title, errText)
            toast.error(errText)
            return
          }
          case "registration_not_found": {
            const title = "Registration not found"
            titled(title, errText)
            toast.error(errText)
            return
          }
          case "registration_cancelled": {
            const title = "Cancelled RSVP"
            const message = name ? `${errText} — ${name}` : errText
            titled(title, message)
            toast.error(message)
            return
          }
          case "registration_invalid_status": {
            const title = "Not confirmed"
            const message = name ? `${errText} — ${name}` : errText
            titled(title, message)
            toast.error(message)
            return
          }
          case "invalid_body": {
            const title = "Invalid request"
            titled(title, errText)
            toast.error(errText)
            return
          }
          case "check_in_failed":
          case "server_error":
          default: {
            const title = "Could not check in"
            titled(title, errText)
            toast.error(errText)
            return
          }
        }
      } catch {
        const title = "Network error"
        const message = "Scanner request failed. Check your connection and try again."
        setLast({ kind: "error", title, message })
        setRecent((r) => pushRecent(r, { at: Date.now(), kind: "error", title, message }))
        toast.error(message)
      }
    })
  }

  useEffect(() => {
    return () => {
      const inst = qrcodeRef.current
      qrcodeRef.current = null
      if (!inst) return
      Promise.resolve(inst.stop() as unknown as Promise<void>)
        .catch(() => {})
        .finally(() => {
          Promise.resolve(inst.clear() as unknown as Promise<void>).catch(() => {})
        })
    }
  }, [])

  useEffect(() => {
    if (!cameraOn) return

    const inst = new Html5Qrcode(regionId)
    qrcodeRef.current = inst

    inst
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          submitToken(decodedText)
        },
        () => {},
      )
      .catch((err: unknown) => {
        setCameraOn(false)
        const msg = typeof err === "string" ? err : "Could not start camera"
        setLast({ kind: "error", title: "Camera", message: msg })
      })

    return () => {
      Promise.resolve(inst.stop() as unknown as Promise<void>)
        .catch(() => {})
        .finally(() => {
          Promise.resolve(inst.clear() as unknown as Promise<void>).catch(() => {})
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn, regionId])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 p-4 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">Scanner</p>
            <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
              Scan ticket QR codes or paste a backup code.
            </p>
          </div>
          <button
            type="button"
            className={cn(
              "inline-flex min-h-[44px] items-center justify-center rounded-full border px-5 font-mono text-[10px] uppercase tracking-widest transition-colors",
              cameraOn
                ? "border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/12 text-[color:var(--neon-text0)]"
                : "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 text-[color:var(--neon-text1)] hover:border-[color:var(--neon-a)]/45 hover:text-[color:var(--neon-text0)]",
            )}
            onClick={() => setCameraOn((v) => !v)}
          >
            {cameraOn ? "Stop camera" : "Start camera"}
          </button>
        </div>

        {cameraOn ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)]/25 p-3">
            <div id={regionId} />
          </div>
        ) : null}

        <div className="mt-4">
          <label className="block text-xs text-[color:var(--neon-text2)]">Manual code</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Paste ticket code"
              className="min-h-[44px] w-full rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 px-3 font-mono text-xs text-[color:var(--neon-text0)] placeholder:text-[color:var(--neon-text2)] focus:outline-none focus:ring-2 focus:ring-[color:var(--neon-a)]/35"
            />
            <button
              type="button"
              disabled={isPending}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] transition-colors hover:border-[color:var(--neon-a)]/45 disabled:opacity-60"
              onClick={() => submitToken(manualToken)}
            >
              Check in
            </button>
          </div>
        </div>

        {last ? (
          <div
            className={cn(
              "mt-4 rounded-xl border px-4 py-3",
              last.kind === "success" &&
                "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
              last.kind === "error" && "border-red-400/30 bg-red-400/10 text-red-100",
              last.kind === "info" &&
                "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 text-[color:var(--neon-text1)]",
            )}
          >
            <p className="text-xs font-mono uppercase tracking-widest opacity-90">{last.title}</p>
            <p className="mt-1 text-sm leading-snug">{last.message}</p>
            {last.attendee?.displayName ? (
              <p className="mt-2 text-xs opacity-90">Attendee: {last.attendee.displayName}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {recent.length > 0 ? (
        <div className="rounded-2xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/12 p-4 backdrop-blur">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            Recent scans
          </p>
          <p className="mt-1 text-xs text-[color:var(--neon-text2)]">Last five swipes — confirm without re-scanning.</p>
          <ul className="mt-3 space-y-2">
            {recent.map((row) => (
              <li
                key={row.id}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm",
                  row.kind === "success" && "border-emerald-400/20 bg-emerald-400/5 text-emerald-50/95",
                  row.kind === "error" && "border-red-400/20 bg-red-400/5 text-red-50/95",
                  row.kind === "info" && "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/15 text-[color:var(--neon-text1)]",
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-80">{row.title}</span>
                  <span className="font-mono text-[10px] text-[color:var(--neon-text2)]">
                    {new Date(row.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] leading-snug">{row.message}</p>
                {row.name ? <p className="mt-1 text-xs opacity-90">{row.name}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
