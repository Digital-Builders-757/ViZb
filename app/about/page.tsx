import type { Metadata } from "next"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MarqueeSection } from "@/components/marquee-section"
import { EditorialGrid } from "@/components/editorial-grid"
import { AppPreview } from "@/components/app-preview"
import { WaitlistSection } from "@/components/waitlist-section"
import { HeroPhotoGrid } from "@/components/hero-photo-grid"
import { AppShell } from "@/components/ui/app-shell"
import { OceanDivider } from "@/components/ui/ocean-divider"

export const metadata: Metadata = {
  title: "About | VIZB",
  description:
    "Who we are. VIZB is Virginia's timeline for events, community, and culture across Hampton Roads, the DMV, and beyond.",
  openGraph: {
    title: "About | VIZB",
    description:
      "Who we are. VIZB is Virginia's timeline for events, community, and culture across Hampton Roads, the DMV, and beyond.",
  },
}

export default function AboutPage() {
  return (
    <AppShell
      withNeonBackdrop
      className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]"
    >
      <main className="min-h-screen">
        <Navbar />

        <section className="px-4 pb-8 pt-24 sm:px-8 md:pt-28">
          <div className="mx-auto max-w-[1200px]">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--neon-a)]" />
                  Who we are
                </span>
                <h1 className="mt-6 text-balance font-serif text-3xl font-bold text-[color:var(--neon-text0)] sm:text-4xl md:text-5xl">
                  Virginia isn&apos;t boring. We prove it every weekend.
                </h1>
                <p className="mt-6 max-w-prose text-base leading-relaxed text-[color:var(--neon-text1)] sm:text-lg">
                  VIZB is a timeline for real events and real people across the 757, Hampton Roads, the
                  DMV, and beyond.
                </p>
                <p className="mt-4 max-w-prose text-sm leading-relaxed text-[color:var(--neon-text2)] sm:text-base">
                  Less scrolling. More showing up. That&apos;s the whole point.
                </p>
              </div>
              <HeroPhotoGrid />
            </div>
          </div>
        </section>

        <OceanDivider variant="soft" density="sparse" withLine={false} />

        <MarqueeSection />
        <EditorialGrid />
        <AppPreview />
        <WaitlistSection />
        <Footer />
      </main>
    </AppShell>
  )
}
