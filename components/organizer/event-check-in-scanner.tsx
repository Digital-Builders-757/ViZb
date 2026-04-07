"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type AttendeeInfo = {
  userId: string
  displayName: string | null
}

type ScanResult =
  | { kind: "success"; message: string; attendee?: AttendeeInfo | null }
  | { kind: "error"; message: string; attendee?: AttendeeInfo | null }
  | { kind: "info"; message: string; attendee?: AttendeeInfo | null }

export function EventCheckInScanner({
  eventId,
}: {
  eventId: string
}) {
  const [cameraOn, setCameraOn] = useState(false)
  const [manualToken, setManualToken] = useState("")
  const [isPending, startTransition] = useTransition()
  const [last, setLast] = useState<ScanResult | null>(null)

  const regionId = useMemo(() => `qr-reader-${eventId}`, [eventId])
  const qrcodeRef = useRef<Html5Qrcode | null>(null)

  function submitToken(token: string) {
    const trimmed = token.trim()
    if (!trimmed) return

    startTransition(async () => {
      try {
        const res = await fetch("/api/checkin/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: trimmed, eventId }),
        })
        const json = (await res.json()) as Record<string, unknown>
        const result = json.result as string | undefined
        const err = json.error as string | undefined
        const attendee = json.attendee as AttendeeInfo | undefined

        const nameLine = attendee?.displayName?.trim()
          ? ` — ${attendee.displayName.trim()}`
          : ""

        if (res.status === 401) {
          const msg = "Sign in again, then retry."
          setLast({ kind: "error", message: msg })
          toast.error(msg)
          return
        }

        if (res.status === 403 || result === "not_authorized") {
          const msg = "You are not allowed to check in for this event."
          setLast({ kind: "error", message: msg })
          toast.error(msg)
          return
        }

        if (res.status === 503) {
          const msg = err || "Scanner not configured (TICKET_QR_SECRET)."
          setLast({ kind: "error", message: msg })
          toast.error(msg)
          return
        }

        if (result === "wrong_event") {
          const msg = (err as string) || "This QR is for a different event."
          setLast({ kind: "error", message: msg, attendee: attendee ?? null })
          toast.error(msg)
          return
        }

        if (result === "registration_not_found" || res.status === 404) {
          const msg = "Invalid ticket or unknown registration."
          setLast({ kind: "error", message: msg })
          toast.error(msg)
          return
        }

        if (result === "cancelled") {
          const msg = `Cancelled RSVP${nameLine}.`
          setLast({ kind: "error", message: msg, attendee: attendee ?? null })
          toast.error(msg)
          return
        }

        if (result === "already_checked_in") {
          const msg = `Already checked in${nameLine}.`
          setLast({ kind: "info", message: msg, attendee: attendee ?? null })
          toast(msg)
          return
        }

        if (res.ok && result === "checked_in") {
          const msg = `Checked in${nameLine}.`
          setLast({ kind: "success", message: msg, attendee: attendee ?? null })
          toast.success(msg)
          return
        }

        const msg = (err as string) || "Scan failed"
        setLast({ kind: "error", message: msg, attendee: attendee ?? null })
        toast.error(msg)
      } catch {
        const msg = "Scanner request failed"
        setLast({ kind: "error", message: msg })
        toast.error(msg)
      }
    })
  }

  useEffect(() => {
    return () => {
      const inst = qrcodeRef.current
      qrcodeRef.current = null
      if (!inst) return
      Promise.resolve(inst.stop() as any)
        .catch(() => {})
        .finally(() => {
          Promise.resolve(inst.clear() as any).catch(() => {})
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
        (decodedText) => {
          submitToken(decodedText)
        },
        () => {},
      )
      .catch((err) => {
        setCameraOn(false)
        const msg = typeof err === "string" ? err : "Could not start camera"
        setLast({ kind: "error", message: msg })
      })

    return () => {
      Promise.resolve(inst.stop() as any)
        .catch(() => {})
        .finally(() => {
          Promise.resolve(inst.clear() as any).catch(() => {})
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
              "mt-4 rounded-xl border px-4 py-3 text-sm",
              last.kind === "success" &&
                "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
              last.kind === "error" && "border-red-400/30 bg-red-400/10 text-red-100",
              last.kind === "info" &&
                "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 text-[color:var(--neon-text1)]",
            )}
          >
            <p>{last.message}</p>
            {last.attendee?.displayName ? (
              <p className="mt-2 text-xs opacity-90">Name: {last.attendee.displayName}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
