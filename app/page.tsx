import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { HomeTimelineSection } from "@/components/home-timeline-section"
import { Footer } from "@/components/footer"
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
        <HomeTimelineSection />
        <Footer />
      </main>
    </AppShell>
  )
}
