"use client"

import { useCallback, useId, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"

function maskBackupCode(token: string): string {
  const t = token.trim()
  if (t.length <= 14) return "••••••••"
  return `${t.slice(0, 6)}…${t.slice(-4)}`
}

export function TicketQrReveal({
  token,
  label,
  defaultOpen = false,
  showFullBackupCode = false,
  size = 200,
}: {
  token: string
  label: string
  /** Detail pages can show the door QR immediately. */
  defaultOpen?: boolean
  /** When true, display the full backup token (detail page); list view keeps a masked preview. */
  showFullBackupCode?: boolean
  /** QR pixel size — detail pages use a larger code for door scanning. */
  size?: number
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)
  const panelId = useId()

  const toggle = useCallback(() => {
    setOpen((o) => !o)
  }, [])

  const copyBackup = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(token.trim())
      setCopied(true)
      toast.success("Backup code copied")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy, select the code and copy manually.")
    }
  }, [token])

  return (
    <div className="border-t border-[color:var(--neon-hairline)]/50 bg-[color:var(--neon-surface)]/20 px-4 py-4 sm:px-5 sm:py-5">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="block font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
            Door check-in
          </span>
          <span className="mt-0.5 block text-sm font-semibold text-[color:var(--neon-text0)]">
            {open ? "Hide QR code" : "Show QR at the door"}
          </span>
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 font-mono text-lg text-[color:var(--neon-text0)]">
          {open ? "−" : "+"}
        </span>
      </button>

      {open ? (
        <div id={panelId} className="mt-5 flex flex-col items-center gap-4">
          <p className="sr-only">{label}</p>
          <div className="rounded-xl border-2 border-[color:var(--neon-a)]/30 bg-white p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <QRCodeSVG value={token} size={size} level="M" includeMargin={false} />
          </div>
          <p className="max-w-xs text-center text-[10px] font-mono leading-relaxed text-[color:var(--neon-text2)]">
            Staff can scan this QR, or you can read your <span className="text-[color:var(--neon-text1)]">backup code</span>{" "}
            aloud. Don&apos;t post screenshots publicly.
          </p>

          <div className="w-full max-w-sm space-y-2">
            <p className="text-center font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
              Backup code (manual entry)
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
              <code className="block min-h-[44px] flex-1 select-all rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)]/40 px-3 py-2.5 text-center font-mono text-[11px] text-[color:var(--neon-text0)] sm:text-left">
                {showFullBackupCode ? token.trim() : maskBackupCode(token)}
              </code>
              <button
                type="button"
                onClick={copyBackup}
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-4 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] transition-colors hover:border-[color:var(--neon-a)]/45"
              >
                {copied ? "Copied" : "Copy code"}
              </button>
            </div>
            <p className="text-center text-[10px] text-[color:var(--neon-text2)]">
              Paste this in the organizer door scanner if the camera can&apos;t read the QR.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
