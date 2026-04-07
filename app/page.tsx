import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { MarqueeSection } from "@/components/marquee-section"
import { EditorialGrid } from "@/components/editorial-grid"
import { EventsSection } from "@/components/events-section"
import { AppPreview } from "@/components/app-preview"
import { WaitlistSection } from "@/components/waitlist-section"
import { Footer } from "@/components/footer"
import { LatestPostsSection } from "@/components/posts/latest-posts-section"
import { AppShell } from "@/components/ui/app-shell"

export default function HomePage() {
  return (
    <AppShell
      withNeonBackdrop
      className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]"
    >
      <main className="min-h-screen">
        <Navbar />
        <HeroSection />
        <MarqueeSection />
        <EditorialGrid />
        <EventsSection />
        <div className="px-4 sm:px-8 pb-16">
          <div className="mx-auto max-w-[1200px]">
            {/* Public feed module: admin-authored posts (published only). */}
            <LatestPostsSection />
          </div>
        </div>
        <AppPreview />
        <WaitlistSection />
        <Footer />
      </main>
    </AppShell>
  )
}
