import Image from "next/image"
import Link from "next/link"

import type { PostRow } from "@/lib/posts/posts"
import { formatPostPublishedDate, getPostCardKicker, postCardKickerLabel } from "@/lib/posts/display"
import { GlassCard } from "@/components/ui/glass-card"

export function PostCard({
  post,
  isRecap = false,
}: {
  post: Pick<PostRow, "slug" | "title" | "excerpt" | "cover_image_url" | "video_url" | "published_at">
  isRecap?: boolean
}) {
  const href = `/p/${post.slug}`
  const publishedLabel = formatPostPublishedDate(post.published_at)
  const kicker = postCardKickerLabel(getPostCardKicker(isRecap))

  return (
    <Link
      href={href}
      className="events-neon-card events-neon-card-hover group flex h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--neon-bg0)]"
    >
      <GlassCard
        className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-[color:var(--neon-surface)]/20 p-0"
        emphasis
        interactive
      >
        <div className="relative aspect-[16/9] w-full shrink-0 bg-[color:var(--neon-bg1)]">
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-reduce:transition-none group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-[color:var(--neon-a)]/25 via-[color:var(--neon-b)]/15 to-[color:var(--neon-c)]/10"
              aria-hidden
            />
          )}

          <div className="absolute inset-x-0 top-0 flex flex-wrap gap-2 p-4">
            <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] backdrop-blur">
              {kicker}
            </span>
            {post.video_url ? (
              <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur">
                Video
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col border-t border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/85 p-4 backdrop-blur-sm">
          {publishedLabel ? (
            <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
              {publishedLabel}
            </p>
          ) : null}
          <h3 className="mt-1 line-clamp-2 min-h-[2.75rem] text-balance text-base font-bold tracking-tight text-[color:var(--neon-text0)] md:text-lg">
            {post.title}
          </h3>
          <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-[13px] leading-[1.6] text-[color:var(--neon-text1)] sm:text-sm">
            {post.excerpt ?? "\u00A0"}
          </p>
        </div>
      </GlassCard>
    </Link>
  )
}
