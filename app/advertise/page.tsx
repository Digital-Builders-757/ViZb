import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AdvertiseContactForm } from "@/components/advertise/advertise-contact-form"
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
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 sm:pt-28 pb-20 px-4 sm:px-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">Partnerships</p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-bold text-foreground text-balance">
            Advertise with VIZB
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Reach people who show up for culture in Virginia and the DMV — events, creative communities, and
            local brands. Tell us what you have in mind; we route inquiries straight to{" "}
            <a href={`mailto:${inbox}`} className="text-primary hover:underline font-mono text-sm">
              {inbox}
            </a>
            .
          </p>

          <div className="mt-12 border border-border bg-card/30 p-6 sm:p-8 relative">
            <AdvertiseContactForm emailConfigured={emailConfigured} />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
