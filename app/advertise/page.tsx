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
    <main className="min-h-screen bg-[color:var(--neon-bg0)] relative overflow-hidden">
      {/* Ocean gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--neon-a)]/5 via-transparent to-[color:var(--neon-b)]/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(0,209,255,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(157,77,255,0.06),transparent)]" />
      </div>

      {/* Animated wave at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none -z-5">
        <svg className="absolute bottom-0 w-full h-24 opacity-20" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M0,60 C150,90 350,30 500,60 C650,90 850,30 1000,60 C1150,90 1200,60 1200,60 L1200,120 L0,120 Z"
            fill="url(#advertiseWaveGradient)"
            style={{ animation: "wave 8s ease-in-out infinite" }}
          />
          <defs>
            <linearGradient id="advertiseWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--neon-a)" />
              <stop offset="50%" stopColor="var(--neon-b)" />
              <stop offset="100%" stopColor="var(--neon-a)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <Navbar />

      <section className="pt-24 sm:pt-28 pb-20 px-4 sm:px-8 relative">
        {/* Decorative elements */}
        <div className="absolute top-32 left-10 w-32 h-32 bg-[color:var(--neon-a)]/10 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute top-64 right-10 w-40 h-40 bg-[color:var(--neon-b)]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="max-w-2xl mx-auto relative">
          {/* Header with neon styling */}
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-10 bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)] shadow-[0_0_10px_rgba(0,209,255,0.5)]" />
            <p className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-a)]">Partnerships</p>
          </div>
          
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[color:var(--neon-text0)] text-balance">
            Advertise with{" "}
            <span className="neon-gradient-text">VIZB</span>
          </h1>
          
          <p className="mt-6 text-[color:var(--neon-text1)] leading-relaxed text-lg">
            Reach people who show up for culture in Virginia and the DMV — events, creative communities, and
            local brands. Tell us what you have in mind; we route inquiries straight to{" "}
            <a href={`mailto:${inbox}`} className="text-[color:var(--neon-a)] hover:text-[color:var(--neon-b)] transition-colors font-mono text-sm">
              {inbox}
            </a>
            .
          </p>

          {/* Features list */}
          <div className="mt-8 flex flex-wrap gap-4">
            {["Event Sponsorships", "Newsletter Features", "Brand Collaborations"].map((feature, i) => (
              <div 
                key={i}
                className="group flex items-center gap-2 px-4 py-2 rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)] hover:border-[color:var(--neon-a)]/40 transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)]" />
                <span className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)]">{feature}</span>
              </div>
            ))}
          </div>

          {/* Form card with glass effect */}
          <div className="mt-12 rounded-2xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)] backdrop-blur-sm p-6 sm:p-8 relative overflow-hidden">
            {/* Subtle glow at top of card */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[color:var(--neon-a)]/50 to-transparent" />
            <div className="absolute top-0 left-1/4 right-1/4 h-20 bg-gradient-to-b from-[color:var(--neon-a)]/10 to-transparent blur-xl" />
            
            <AdvertiseContactForm emailConfigured={emailConfigured} />
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        @keyframes wave {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-25px);
          }
        }
      `}</style>
    </main>
  )
}
