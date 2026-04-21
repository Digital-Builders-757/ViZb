import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AppShell } from "@/components/ui/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { OceanDivider } from "@/components/ui/ocean-divider"
import { getPublishedPostBySlug } from "@/lib/posts/posts"
import { MarkdownContent } from "@/components/posts/markdown"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)

  if (!post) {
    return { title: "Post Not Found | VIZB" }
  }

  return {
    title: `${post.title} | VIZB`,
    description: post.excerpt ?? undefined,
    openGraph: post.cover_image_url
      ? { images: [{ url: post.cover_image_url, width: 1200, height: 630 }] }
      : undefined,
  }
}

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)

  if (!post) notFound()

  return (
    <AppShell
      withNeonBackdrop
      className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]"
    >
      <main className="min-h-screen">
        <Navbar />

        <section className="px-4 pb-16 pt-24 sm:px-8 sm:pt-28">
        <div className="mx-auto max-w-[900px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
                <Link href="/" className="hover:text-[color:var(--neon-text0)]">Home</Link>
                <span className="mx-2 text-[color:var(--neon-text2)]">/</span>
                <Link href="/p" className="hover:text-[color:var(--neon-text0)]">Posts</Link>
              </p>
              <h1 className="mt-3 text-balance font-serif text-3xl font-bold text-[color:var(--neon-text0)] sm:text-4xl">
                {post.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {post.video_url ? (
                <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur">
                  Video
                </span>
              ) : null}
              <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] backdrop-blur">
                {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
              </span>
            </div>
          </div>
          {post.excerpt ? (
            <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
              {post.excerpt}
            </p>
          ) : null}

          {post.cover_image_url ? (
            <GlassCard className="mt-8 overflow-hidden p-0" emphasis>
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
              <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Video link</p>
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

          <GlassCard className="mt-8 p-4 md:p-6">
            <MarkdownContent md={post.content_md} />
          </GlassCard>

          {post.content_image_urls && post.content_image_urls.length > 0 ? (
            <GlassCard className="mt-6 p-4 md:p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Photos</p>
              <ul className="mt-4 grid list-none gap-4 p-0 sm:grid-cols-2" aria-label="Images in this post">
                {post.content_image_urls.map((url, i) => (
                  <li
                    key={`${url}-${i}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30"
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 432px"
                      unoptimized
                    />
                  </li>
                ))}
              </ul>
            </GlassCard>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
              Published {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
            </p>
            <Link
              href="/p"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-6 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur hover:shadow-[var(--vibe-neon-glow-subtle)]"
            >
              Back to posts
            </Link>
          </div>
        </div>
        </section>

        <OceanDivider variant="soft" density="sparse" withLine={false} />

        <Footer />
      </main>
    </AppShell>
  )
}
