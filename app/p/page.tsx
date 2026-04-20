import type { Metadata } from "next"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AppShell } from "@/components/ui/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { OceanDivider } from "@/components/ui/ocean-divider"
import { getLatestPublishedPosts } from "@/lib/posts/posts"
import { PostCard } from "@/components/posts/post-card"

export const metadata: Metadata = {
  title: "Posts | VIZB",
  description: "Culture drops, recaps, and what’s next from VIZB.",
}

export default async function PostsIndexPage() {
  const posts = await getLatestPublishedPosts(24)

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
              <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
                Updates
              </span>
              <h1 className="mt-2 font-serif text-3xl font-bold text-[color:var(--neon-text0)] sm:text-4xl">
                From VIZB
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
                Culture drops, recaps, and what’s next — editorial drops from the team.
              </p>
            </header>

            {posts.length === 0 ? (
              <GlassCard className="mt-10 p-8 md:p-10" emphasis>
                <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">
                  Fresh ink incoming
                </p>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
                  No published posts yet. Check back soon for recaps, scene notes, and what&apos;s next across Virginia.
                </p>
              </GlassCard>
            ) : (
              <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} />
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
