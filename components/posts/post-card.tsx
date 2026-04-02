import Image from "next/image"
import Link from "next/link"

import type { PostRow } from "@/lib/posts/posts"
import { GlassCard } from "@/components/ui/glass-card"

export function PostCard({ post }: { post: Pick<PostRow, "slug" | "title" | "excerpt" | "cover_image_url" | "video_url"> }) {
  const href = `/p/${post.slug}`

  return (
    <Link href={href} className="group block active:scale-[0.99] transition-transform">
      <GlassCard className="overflow-hidden p-0 transition-[box-shadow] group-hover:shadow-[var(--vibe-neon-glow-subtle)]" emphasis>
        <div className="relative aspect-[16/9] w-full bg-[color:var(--neon-bg1)]">
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-[color:var(--neon-a)]/25 via-[color:var(--neon-b)]/15 to-[color:var(--neon-c)]/10"
              aria-hidden
            />
          )}

          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[color:var(--neon-bg0)]/92 via-[color:var(--neon-bg0)]/30 to-transparent"
            aria-hidden
          />

          {post.video_url ? (
            <span className="absolute top-4 right-4 rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur">
              Video
            </span>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="text-balance text-base font-bold tracking-tight text-[color:var(--neon-text0)] md:text-lg">
              {post.title}
            </h3>
            {post.excerpt ? (
              <p className="mt-1 line-clamp-2 text-[13px] leading-[1.6] text-[color:var(--neon-text1)] sm:text-sm">
                {post.excerpt}
              </p>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}
