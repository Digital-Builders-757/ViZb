import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AdvertiseContactForm } from "@/components/advertise/advertise-contact-form"
import { AppShell } from "@/components/ui/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { WaterFrame } from "@/components/ui/water-frame"
import { getAdminInboxEmail, isAdvertiseEmailConfigured } from "@/lib/email/project-env"

export const metadata: Metadata = {
  title: "Advertise with VIZB",
  description:
    "Partner with VIZB to reach Virginia and DMV audiences. Sponsorships, placements, and brand collaborations.",
}

export default function AdvertisePage() {
  const emailConfigured = isAdvertiseEmailConfigured()
  const inbox = getAdminInboxEmail()

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
              </div>
            </WaterFrame>

            <GlassCard emphasis className="mt-10 p-6 sm:p-8">
              <AdvertiseContactForm emailConfigured={emailConfigured} />
            </GlassCard>
          </div>
        </section>
      </main>

      <Footer />
    </AppShell>
  )
}
