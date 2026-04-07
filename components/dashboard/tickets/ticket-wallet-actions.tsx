"use client"

export function TicketWalletPassActions({
  registrationId,
  appleEnabled,
  googleEnabled,
}: {
  registrationId: string
  appleEnabled: boolean
  googleEnabled: boolean
}) {
  const appleHref = `/api/tickets/pass/apple?rid=${encodeURIComponent(registrationId)}`
  const googleHref = `/api/tickets/pass/google?rid=${encodeURIComponent(registrationId)}`

  if (!appleEnabled && !googleEnabled) {
    return (
      <p className="mt-3 text-xs text-[color:var(--neon-text2)]">
        Add to Apple Wallet / Google Wallet: <span className="text-[color:var(--neon-text1)]">coming soon</span>
      </p>
    )
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {appleEnabled ? (
        <a
          href={appleHref}
          className="inline-flex items-center justify-center rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/70 px-3 py-2 text-xs font-medium text-[color:var(--neon-text0)] shadow-sm transition hover:border-[color:var(--neon-a)]/50 hover:bg-[color:var(--neon-surface)]"
        >
          Add to Apple Wallet
        </a>
      ) : null}
      {googleEnabled ? (
        <a
          href={googleHref}
          className="inline-flex items-center justify-center rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/70 px-3 py-2 text-xs font-medium text-[color:var(--neon-text0)] shadow-sm transition hover:border-[color:var(--neon-a)]/50 hover:bg-[color:var(--neon-surface)]"
        >
          Add to Google Wallet
        </a>
      ) : null}
    </div>
  )
}
