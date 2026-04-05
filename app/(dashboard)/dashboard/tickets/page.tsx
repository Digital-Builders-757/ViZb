import Link from "next/link"
import { headers } from "next/headers"
import { requireAuth } from "@/lib/auth-helpers"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { NeonLink } from "@/components/ui/neon-link"
import { GlassCard } from "@/components/ui/glass-card"
import { TicketWalletCard } from "@/components/dashboard/tickets/ticket-wallet-card"

type WalletEvent = {
  title: string
  slug: string
  starts_at: string
  city: string
  venue_name: string
  flyer_url: string | null
}

type RegistrationRow = {
  status: string
  created_at: string
  checked_in_at: string | null
  event: WalletEvent[] | WalletEvent | null
}

async function siteOrigin(): Promise<string> {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (envBase) return envBase

  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  if (!host) return ""
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

function firstEvent(raw: RegistrationRow["event"]): WalletEvent | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  if (typeof raw === "object" && "slug" in raw) return raw as WalletEvent
  return null
}

function partitionByStart(rows: RegistrationRow[], nowMs: number) {
  const upcoming: RegistrationRow[] = []
  const past: RegistrationRow[] = []
  const undated: RegistrationRow[] = []

  for (const r of rows) {
    const e = firstEvent(r.event)
    if (!e) continue
    const t = new Date(e.starts_at).getTime()
    if (Number.isNaN(t)) {
      undated.push(r)
      continue
    }
    if (t >= nowMs) upcoming.push(r)
    else past.push(r)
  }

  return { upcoming, past, undated }
}

function TicketSection({
  title,
  subtitle,
  rows,
  origin,
}: {
  title: string
  subtitle?: string
  rows: RegistrationRow[]
  origin: string
}) {
  if (rows.length === 0) return null

  return (
    <section className="min-w-0 space-y-3">
      <div>
        <h2 className="font-serif text-lg font-bold text-[color:var(--neon-text0)] md:text-xl">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-[color:var(--neon-text2)]">{subtitle}</p>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {rows.map((r) => {
          const e = firstEvent(r.event)
          if (!e) return null
          const base = origin || ""
          const eventAbsoluteUrl = base ? `${base}/events/${e.slug}` : `/events/${e.slug}`

          return (
            <TicketWalletCard
              key={`${e.slug}-${r.created_at}`}
              status={r.status}
              createdAt={r.created_at}
              checkedInAt={r.checked_in_at}
              event={e}
              eventAbsoluteUrl={eventAbsoluteUrl}
            />
          )
        })}
      </div>
    </section>
  )
}

export default async function TicketsPage() {
  const { user, supabase } = await requireAuth()
  const origin = await siteOrigin()

  let rows: RegistrationRow[] | null = null
  let loadError: string | null = null

  try {
    const { data, error } = await supabase
      .from("event_registrations")
      .select(
        "status, created_at, checked_in_at, event:events ( title, slug, starts_at, city, venue_name, flyer_url )",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) loadError = error.message
    rows = (data as RegistrationRow[]) ?? null
  } catch {
    loadError = "Ticketing is not fully configured on this environment yet."
    rows = null
  }

  const list = rows ?? []
  const active = list.filter((r) => {
    if (r.status === "cancelled") return false
    return firstEvent(r.event) != null
  })

  const nowMs = Date.now()
  const { upcoming, past, undated } = partitionByStart(active, nowMs)

  return (
    <div className="min-w-0 space-y-8 md:space-y-10">
      <header className="min-w-0">
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
          Wallet
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)] md:text-3xl">
          My tickets
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          Your RSVPs and check-ins in one place. Add events to your calendar so you don&apos;t miss a show.
        </p>
      </header>

      {loadError ? (
        <GlassCard className="p-4">
          <p className="text-sm text-amber-200/90">{loadError}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Apply <span className="font-mono">scripts/025_create_event_registrations.sql</span> to enable RSVP.
          </p>
        </GlassCard>
      ) : null}

      {active.length === 0 && !loadError ? (
        <EmptyStateCard
          kicker="No tickets yet"
          title="Nothing in your wallet"
          description="RSVP to a published event and it will show up here with date, venue, and calendar actions."
        >
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <NeonLink href="/events" fullWidth className="sm:w-auto" shape="xl">
              Browse events
            </NeonLink>
            <Link
              href="/events"
              className="text-center text-sm text-[color:var(--neon-text2)] underline-offset-4 hover:text-[color:var(--neon-a)] hover:underline sm:text-left"
            >
              Go to /events
            </Link>
          </div>
        </EmptyStateCard>
      ) : null}

      {active.length > 0 ? (
        <div className="min-w-0 space-y-10">
          <TicketSection
            title="Upcoming"
            subtitle="Events on your calendar from today forward."
            rows={[...upcoming, ...undated]}
            origin={origin}
          />

          <TicketSection
            title="Past"
            subtitle="Earlier RSVPs for your records."
            rows={past}
            origin={origin}
          />
        </div>
      ) : null}
    </div>
  )
}
