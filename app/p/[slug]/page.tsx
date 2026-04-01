import { notFound } from "next/navigation"
import Image from "next/image"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { GlassCard } from "@/components/ui/glass-card"
import { getPublishedPostBySlug } from "@/lib/posts/posts"
import { MarkdownContent } from "@/components/posts/markdown"

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)

  if (!post) notFound()

  return (
    <main className="min-h-screen bg-[color:var(--neon-bg0)]">
      <Navbar />

      <section className="pt-24 sm:pt-28 pb-16 px-4 sm:px-8">
        <div className="mx-auto max-w-[900px]">
          <h1 className="text-balance font-serif text-3xl font-bold text-[color:var(--neon-text0)] sm:text-4xl">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
              {post.excerpt}
            </p>
          ) : null}

          {post.cover_image_url ? (
            <GlassCard className="mt-6 overflow-hidden p-0" emphasis>
              <div className="relative aspect-[16/9] w-full bg-[color:var(--neon-bg1)]">
                <Image
                  src={post.cover_image_url}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 900px"
                  priority
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[color:var(--neon-bg0)]/85 via-[color:var(--neon-bg0)]/20 to-transparent"
                  aria-hidden
                />
              </div>
            </GlassCard>
          ) : null}

          {post.video_url ? (
            <GlassCard className="mt-6 p-4 md:p-5" emphasis>
              <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Video</p>
              <a
                href={post.video_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all text-[15px] text-[color:var(--neon-a)] underline-offset-4 hover:underline"
              >
                {post.video_url}
              </a>
            </GlassCard>
          ) : null}

          <GlassCard className="mt-6 p-4 md:p-6">
            <MarkdownContent md={post.content_md} />
          </GlassCard>

          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
            Published {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
