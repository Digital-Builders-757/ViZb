import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { MarqueeSection } from "@/components/marquee-section"
import { EditorialGrid } from "@/components/editorial-grid"
import { EventsSection } from "@/components/events-section"
import { AppPreview } from "@/components/app-preview"
import { WaitlistSection } from "@/components/waitlist-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <MarqueeSection />
      <EditorialGrid />
      <EventsSection />
      <AppPreview />
      <WaitlistSection />
      <Footer />
    </main>
  )
}
