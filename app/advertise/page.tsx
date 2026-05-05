import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AdvertiseContactForm } from "@/components/advertise/advertise-contact-form"
import { AppShell } from "@/components/ui/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { WaterFrame } from "@/components/ui/water-frame"
import { getAdminInboxEmail, isAdvertiseEmailConfigured } from "@/lib/email/project-env"
import { buildAdvertiseSubmissionContext } from "@/lib/partnerships/advertise-context"
import { INTEREST_OPTIONS } from "@/lib/advertise-contact-schema"

export const metadata: Metadata = {
  title: "Advertise with VIZB",
  description:
    "Partner with VIZB to reach Virginia and DMV audiences. Sponsorships, placements, and brand collaborations.",
}

export default async function AdvertisePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; org?: string; event?: string }>
}) {
  const sp = await searchParams
  const emailConfigured = isAdvertiseEmailConfigured()
  const inbox = getAdminInboxEmail()
  const fromOrganizer = sp.from === "organizer"
  const submissionContextLine = buildAdvertiseSubmissionContext({
    from: sp.from,
    orgSlug: sp.org,
    eventSlug: sp.event,
  })
  const defaultInterest: (typeof INTEREST_OPTIONS)[number] | undefined = fromOrganizer
    ? "organizer_promotion"
    : undefined
  const formInstanceKey = [sp.from ?? "", submissionContextLine ?? "", defaultInterest ?? ""].join("|")

  return (
    <AppShell
      withNeonBackdrop
      className="min-h-[100dvh] overflow-x-hidden text-[15px] leading-relaxed text-[color:var(--neon-text1)]"
    >
      <Navbar />

      <main>
        <section className="px-4 pb-20 pt-24 sm:px-8 sm:pt-28">
          <div className="mx-auto max-w-2xl">
            <WaterFrame className="rounded-xl">
              <div className="px-5 py-8 sm:px-8 sm:py-10">
                <p className="text-xs font-mono uppercase tracking-[0.35em] text-[color:var(--neon-a)]">
                  Partnerships
                </p>
                <h1 className="mt-3 text-balance font-serif text-3xl font-bold sm:text-4xl">
                  <span className="neon-gradient-text">Advertise with VIZB</span>
                </h1>
                <p className="mt-4 leading-relaxed text-[color:var(--neon-text2)]">
                  Reach people who show up for culture in Virginia and the DMV — events, creative communities, and
                  local brands. Tell us what you have in mind; we route inquiries straight to{" "}
                  <a
                    href={`mailto:${inbox}`}
                    className="font-mono text-sm text-[color:var(--neon-a)] underline decoration-[color:var(--neon-hairline)] underline-offset-4 transition hover:decoration-[color:var(--neon-a)]"
                  >
                    {inbox}
                  </a>
                  .
                </p>

                <ul className="mt-6 space-y-2 text-xs leading-relaxed text-[color:var(--neon-text2)]">
                  <li>
                    <span className="font-mono uppercase tracking-widest text-[color:var(--neon-text0)]/90">
                      Paid &amp; sponsored
                    </span>{" "}
                    — Any partnership inventory we run together is{" "}
                    <span className="text-[color:var(--neon-text0)]">labeled on-site</span> so it never passes for
                    organic discovery.
                  </li>
                  <li>
                    <span className="font-mono uppercase tracking-widest text-[color:var(--neon-text0)]/90">
                      Editorial
                    </span>{" "}
                    —{" "}
                    <strong className="font-semibold text-[color:var(--neon-text0)]">
                      Staff pick highlights are staff-curated only
                    </strong>
                    {" "}
                    (not for sale) and stay visually distinct from paid placement.
                  </li>
                  <li>Inquiry-only today — reply with timelines, packages, and pricing after we scope fit.</li>
                </ul>

                {fromOrganizer ? (
                  <p className="mt-5 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 text-xs leading-relaxed text-[color:var(--neon-text1)]">
                    <span className="font-mono uppercase tracking-widest text-amber-200/95">Organizer pathway</span>{" "}
                    — Tell us what you’re promoting next; we routed you here from the organizer tools so replies can tie
                    back to your org or event slug when relevant.
                  </p>
                ) : null}
              </div>
            </WaterFrame>

            <GlassCard emphasis className="mt-10 p-6 sm:p-8">
              <AdvertiseContactForm
                key={formInstanceKey}
                emailConfigured={emailConfigured}
                submissionContextLine={submissionContextLine}
                defaultInterestType={defaultInterest}
              />
            </GlassCard>
          </div>
        </section>
      </main>

      <Footer />
    </AppShell>
  )
}
