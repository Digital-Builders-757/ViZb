import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getLatestPublishedPosts } from "@/lib/posts/posts"
import { PostCard } from "@/components/posts/post-card"

export default async function PostsIndexPage() {
  const posts = await getLatestPublishedPosts(24)

  return (
    <main className="min-h-screen bg-[color:var(--neon-bg0)]">
      <Navbar />

      <section className="pt-24 sm:pt-28 pb-16 px-4 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          <header className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
              Updates
            </span>
            <h1 className="mt-2 font-serif text-3xl font-bold text-[color:var(--neon-text0)] sm:text-4xl">
              From ViZb
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
              Culture drops, recaps, and what’s next.
            </p>
          </header>

          {posts.length === 0 ? (
            <p className="mt-10 text-[15px] text-[color:var(--neon-text1)]">
              No posts published yet.
            </p>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
