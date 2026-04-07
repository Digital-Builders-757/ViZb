"use client"

import { useCallback, useId, useState } from "react"
import { QRCodeSVG } from "qrcode.react"

export function TicketQrReveal({ token, label }: { token: string; label: string }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  const toggle = useCallback(() => {
    setOpen((o) => !o)
  }, [])

  return (
    <div className="mt-4 border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30 p-4 sm:p-5">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-[color:var(--neon-text0)]"
      >
        <span>{open ? "Hide check-in code" : "Tap to show check-in QR"}</span>
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
          {open ? "−" : "+"}
        </span>
      </button>

      {open ? (
        <div id={panelId} className="mt-4 flex flex-col items-center gap-3">
          <p className="sr-only">{label}</p>
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <QRCodeSVG value={token} size={200} level="M" includeMargin={false} />
          </div>
          <p className="text-center text-[10px] font-mono text-[color:var(--neon-text2)]">
            Show this at the door. Don&apos;t share screenshots publicly.
          </p>
        </div>
      ) : null}
    </div>
  )
}
