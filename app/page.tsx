import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { MarqueeSection } from "@/components/marquee-section"
import { EditorialGrid } from "@/components/editorial-grid"
import { EventsSection } from "@/components/events-section"
import { AppPreview } from "@/components/app-preview"
import { WaitlistSection } from "@/components/waitlist-section"
import { Footer } from "@/components/footer"
import { LatestPostsSection } from "@/components/posts/latest-posts-section"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <MarqueeSection />
      <EditorialGrid />
      <EventsSection />
      <div className="px-4 sm:px-8 pb-16">
        <div className="max-w-[1200px] mx-auto">
          {/* Public feed module: admin-authored posts (published only). */}
          <LatestPostsSection />
        </div>
      </div>
      <AppPreview />
      <WaitlistSection />
      <Footer />
    </main>
  )
}
