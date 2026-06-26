import { Navbar } from "@/components/navbar"
import { HomeRedesignHero } from "@/components/home/home-redesign-hero"
import { HomeEventsGrid } from "@/components/home/home-events-grid"
import { HomeExperienceFlow } from "@/components/home/home-experience-flow"
import { Footer } from "@/components/footer"
import { AppPreview } from "@/components/app-preview"
import { AppShell } from "@/components/ui/app-shell"
import { OceanDivider } from "@/components/ui/ocean-divider"
import { WaitlistSection } from "@/components/waitlist-section"
import { getHomepageEventsPreview } from "@/lib/events/homepage-events"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const homepageEventsPreview = await getHomepageEventsPreview()

  return (
    <AppShell
      withNeonBackdrop={false}
      causticVariant="hero"
      className="bg-[color:var(--neon-bg0)] text-[15px] leading-relaxed text-[color:var(--neon-text1)]"
    >
      <main className="min-h-screen">
        <Navbar />
        <HomeRedesignHero />
        <OceanDivider variant="hero" density="sparse" withLine={false} />
        <HomeEventsGrid data={homepageEventsPreview} />
        <HomeExperienceFlow />
        <AppPreview />
        <WaitlistSection />
        <Footer />
      </main>
    </AppShell>
  )
}
