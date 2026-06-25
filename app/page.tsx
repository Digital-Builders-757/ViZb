import { Navbar } from "@/components/navbar"
import { HomeRedesignHero } from "@/components/home/home-redesign-hero"
import { HomeEventsGrid } from "@/components/home/home-events-grid"
import { Footer } from "@/components/footer"
import { AppShell } from "@/components/ui/app-shell"
import { getHomepageEventsPreview } from "@/lib/events/homepage-events"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const homepageEventsPreview = await getHomepageEventsPreview()

  return (
    <AppShell
      withNeonBackdrop={false}
      className="bg-[#060609] text-[15px] leading-relaxed text-[color:var(--neon-text1)]"
    >
      <main className="min-h-screen">
        <Navbar />
        <HomeRedesignHero />
        <HomeEventsGrid data={homepageEventsPreview} />
        <Footer />
      </main>
    </AppShell>
  )
}
