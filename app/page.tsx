import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { HomepageEventsPreview } from "@/components/homepage-events-preview"
import { HomeTimelineSection } from "@/components/home-timeline-section"
import { Footer } from "@/components/footer"
import { AppShell } from "@/components/ui/app-shell"
import { getHomepageEventsPreview } from "@/lib/events/homepage-events"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const homepageEventsPreview = await getHomepageEventsPreview()

  return (
    <AppShell
      withNeonBackdrop
      causticVariant="hero"
      className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]"
    >
      <main className="min-h-screen">
        <Navbar />
        <HeroSection />
        <HomepageEventsPreview data={homepageEventsPreview} />
        <HomeTimelineSection />
        <Footer />
      </main>
    </AppShell>
  )
}
