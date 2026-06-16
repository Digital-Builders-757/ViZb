import Link from "next/link"

import { updatePost } from "@/app/actions/posts-admin"
import { requireAdmin } from "@/lib/auth-helpers"
import {
  isPostNotFoundError,
  looksLikePostsSchemaDrift,
} from "@/lib/posts/admin-post-errors"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"

import { AdminPostErrorBanner } from "@/components/admin/posts/admin-post-error-banner"
import { AdminPostForm } from "@/components/admin/posts/admin-post-form"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"

type PostStatus = "draft" | "published" | "archived"

function normalizePostStatus(value: string | undefined, fallback: PostStatus): PostStatus {
  if (value === "draft" || value === "published" || value === "archived") return value
  return fallback
}

export default async function AdminEditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    saved?: string
    created?: string
    published?: string
    status?: string
    error?: string
    message?: string
  }>
}) {
  await requireAdmin()
  const { id } = await params
  const { saved, created, published, status: statusParam, error, message } = await searchParams

  if (!isServerSupabaseConfigured()) {
    return (
      <GlassCard className="p-6">
        <p className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          Supabase server env isn’t configured. Connect Supabase to edit posts.
        </p>
      </GlassCard>
    )
  }

  const supabase = await createClient()
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id,title,slug,excerpt,content_md,cover_image_url,video_url,content_image_urls,status,published_at,updated_at")
    .eq("id", id)
    .single()

  if (postError || !post) {
    const loadMessage = postError?.message?.trim() || "Post not found or you do not have access."
    const schemaDrift = looksLikePostsSchemaDrift(loadMessage)
    const notFound = isPostNotFoundError(loadMessage) || (!post && !postError)

    return (
      <div className="space-y-6">
        <header>
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Admin</span>
          <h1 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)]">Edit Post</h1>
        </header>

        <GlassCard className="p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">Could not load post</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">{loadMessage}</p>
          {schemaDrift ? (
            <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
              The database may be missing posts migrations. Run{" "}
              <span className="font-mono text-[color:var(--neon-text0)]">supabase db push</span> on the project linked to{" "}
              <span className="font-mono text-[color:var(--neon-text0)]">NEXT_PUBLIC_SUPABASE_URL</span>, including{" "}
              <span className="font-mono text-[color:var(--neon-text0)]">20260607193500_posts_mvp_base.sql</span> and{" "}
              <span className="font-mono text-[color:var(--neon-text0)]">20260420231755_posts_content_image_urls.sql</span>.
              See <span className="font-mono text-[color:var(--neon-text0)]">docs/plans/POSTS_MVP.md</span>.
            </p>
          ) : notFound ? (
            <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
              This post may have been deleted, or the link uses an invalid ID. Check the posts list for the row you
              expected.
            </p>
          ) : (
            <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
              Confirm your account has <span className="font-mono text-[color:var(--neon-text0)]">staff_admin</span>{" "}
              access and that Supabase RLS policies are applied.
            </p>
          )}
          <NeonLink href="/admin/posts" variant="secondary" shape="xl" className="mt-4 inline-flex">
            Back to posts
          </NeonLink>
        </GlassCard>
      </div>
    )
  }

  const boundUpdatePost = updatePost.bind(null, id)
  const displayStatus = normalizePostStatus(statusParam, post.status as PostStatus)
  const showSaved = saved === "1"
  const showCreated = created === "1"
  const justPublished = published === "1" || displayStatus === "published"
  const isLive = post.status === "published"
  const isArchived = post.status === "archived"

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Admin</span>
          <h1 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)]">Edit Post</h1>
          <p className="mt-1 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            Draft, publish, or archive a post that appears on the public feed.
          </p>
          <p className="mt-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${
                isLive
                  ? "border-emerald-500/45 bg-emerald-500/12 text-emerald-100"
                  : isArchived
                    ? "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 text-[color:var(--neon-text2)]"
                    : "border-amber-500/45 bg-amber-500/12 text-amber-100"
              }`}
            >
              {isLive ? "Live on /p" : isArchived ? "Archived, not public" : "Draft, not public yet"}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <NeonLink href="/admin/posts" variant="secondary" shape="xl" className="sm:w-auto">
            Back to posts
          </NeonLink>
          {displayStatus === "published" ? (
            <Link
              href={`/p/${post.slug}`}
              target="_blank"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-6 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur hover:shadow-[var(--vibe-neon-glow-subtle)]"
            >
              View public
            </Link>
          ) : null}
        </div>
      </header>

      <AdminPostErrorBanner error={error} dbMessage={message} />

      {showCreated ? (
        <GlassCard className="p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">Post created</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            Your draft is saved. Continue editing, then publish when you are ready.
          </p>
        </GlassCard>
      ) : null}

      {showSaved ? (
        <GlassCard className="p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">
            {justPublished && showSaved ? "Published" : "Saved"}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            {justPublished && showSaved
              ? "Your post is live on /p and the homepage feed. Use View public to preview."
              : displayStatus === "published"
                ? "Changes saved. This post remains live on /p."
                : displayStatus === "archived"
                  ? "Changes saved. This post stays archived and hidden from the public feed."
                  : "Changes saved as a draft. Publish when you’re ready for readers to see it."}
          </p>
        </GlassCard>
      ) : null}

      <AdminPostForm
        postId={post.id}
        action={boundUpdatePost}
        initial={{
          title: post.title,
          excerpt: post.excerpt ?? "",
          cover_image_url: post.cover_image_url ?? "",
          video_url: post.video_url ?? "",
          content_md: post.content_md,
          content_image_urls: Array.isArray(post.content_image_urls) ? post.content_image_urls : [],
          status: post.status,
          existing_slug: post.slug,
          existing_published_at: post.published_at ?? "",
        }}
      />

      <GlassCard className="p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            Updated {new Date(post.updated_at).toLocaleString()}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            {post.published_at ? `Published ${new Date(post.published_at).toLocaleString()}` : "Not published yet"}
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
