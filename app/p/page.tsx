import type { Metadata } from "next"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AppShell } from "@/components/ui/app-shell"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { OceanDivider } from "@/components/ui/ocean-divider"
import { SectionTitle } from "@/components/ui/section-title"
import { getLatestPublishedPosts, getRecapPostIdSet } from "@/lib/posts/posts"
import { PostCard } from "@/components/posts/post-card"

export const metadata: Metadata = {
  title: "Posts | VIZB",
  description: "Culture drops, recaps, and what’s next from VIZB.",
}

export default async function PostsIndexPage() {
  const posts = await getLatestPublishedPosts(24)
  const recapIds = await getRecapPostIdSet(posts.map((p) => p.id))

  return (
    <AppShell
      withNeonBackdrop
      className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]"
    >
      <main className="min-h-screen">
        <Navbar />

        <section className="px-4 pb-16 pt-24 sm:px-8 sm:pt-28">
          <div className="mx-auto max-w-[1200px]">
            <header className="max-w-2xl">
              <SectionTitle kicker="Updates" title="From VIZB" gradient />
              <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
                Culture drops, recaps, and what&apos;s next from the team.
              </p>
            </header>

            {posts.length === 0 ? (
              <EmptyStateCard
                className="mt-10"
                kicker="Fresh ink incoming"
                title="No posts yet"
                description="Check back soon for recaps, scene notes, and what's next across Virginia."
              />
            ) : (
              <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} isRecap={recapIds.has(p.id)} />
                ))}
              </div>
            )}
          </div>
        </section>

        <OceanDivider variant="soft" density="normal" withLine={false} />

        <Footer />
      </main>
    </AppShell>
  )
}
