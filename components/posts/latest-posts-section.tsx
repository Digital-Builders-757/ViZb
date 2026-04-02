import Link from "next/link"

import { getLatestPublishedPosts } from "@/lib/posts/posts"
import { PostCard } from "@/components/posts/post-card"

export async function LatestPostsSection() {
  const posts = await getLatestPublishedPosts(3)

  if (posts.length === 0) return null

  return (
    <section aria-labelledby="latest-posts">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
            Latest
          </span>
          <h2 id="latest-posts" className="mt-2 font-serif text-xl font-bold text-[color:var(--neon-text0)] md:text-2xl">
            From VIZB
          </h2>
          <p className="mt-1 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            Updates, recaps, culture drops, and what’s next.
          </p>
        </div>

        <Link
          href="/p"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-6 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur hover:shadow-[var(--vibe-neon-glow-subtle)]"
        >
          View all posts
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  )
}
