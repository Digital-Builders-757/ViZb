import { getLatestPublishedPosts } from "@/lib/posts/posts"
import { PostCard } from "@/components/posts/post-card"

export async function LatestPostsSection() {
  const posts = await getLatestPublishedPosts(3)

  if (posts.length === 0) return null

  return (
    <section aria-labelledby="latest-posts">
      <div className="mb-4">
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
          Latest
        </span>
        <h2 id="latest-posts" className="mt-2 font-serif text-xl font-bold text-[color:var(--neon-text0)] md:text-2xl">
          From ViZb
        </h2>
        <p className="mt-1 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          Updates, recaps, culture drops, and what’s next.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </section>
  )
}
