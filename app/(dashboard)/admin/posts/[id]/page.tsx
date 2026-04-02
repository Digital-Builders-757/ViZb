import Link from "next/link"
import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/auth-helpers"
import { slugify, deriveExcerptFromMarkdown } from "@/lib/posts/utils"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"

import { AdminPostForm } from "@/components/admin/posts/admin-post-form"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"

export default async function AdminEditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string; error?: string; slug?: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const { saved, error, slug: slugParam } = await searchParams

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
  const { data: post } = await supabase
    .from("posts")
    .select("id,title,slug,excerpt,content_md,cover_image_url,video_url,status,published_at,updated_at")
    .eq("id", id)
    .single()

  if (!post) {
    redirect("/admin/posts")
  }

  // Primitives for the server action closure — TS does not narrow `post` inside nested async functions.
  const existingPublishedAt = post.published_at

  async function updatePost(formData: FormData) {
    "use server"

    if (!isServerSupabaseConfigured()) return

    const title = String(formData.get("title") ?? "").trim()
    const slugRaw = String(formData.get("slug") ?? "").trim()
    const resolvedSlug = slugRaw || slugify(title)

    const excerptRaw = String(formData.get("excerpt") ?? "").trim()
    const cover_image_url = String(formData.get("cover_image_url") ?? "").trim()
    const video_url = String(formData.get("video_url") ?? "").trim()
    const content_md = String(formData.get("content_md") ?? "").trim()
    const status = String(formData.get("status") ?? "draft")

    if (!title || !resolvedSlug || !content_md) return

    const supabase = await createClient()

    // Preserve published_at once set. If transitioning to published with no published_at, set now.
    const shouldSetPublishedAt = status === "published" && !existingPublishedAt

    const excerpt = excerptRaw || deriveExcerptFromMarkdown(content_md)

    const { error } = await supabase
      .from("posts")
      .update({
        title,
        slug: resolvedSlug,
        excerpt: excerpt ? excerpt : null,
        cover_image_url: cover_image_url || null,
        video_url: video_url || null,
        content_md,
        status,
        published_at: shouldSetPublishedAt ? new Date().toISOString() : existingPublishedAt,
      })
      .eq("id", id)

    if (error) {
      if ((error as any).code === "23505") {
        return redirect(`/admin/posts/${id}?error=slug_taken&slug=${encodeURIComponent(resolvedSlug)}`)
      }
      return
    }

    return redirect(`/admin/posts/${id}?saved=1`)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Admin</span>
          <h1 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)]">Edit Post</h1>
          <p className="mt-1 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            Draft, publish, or archive a post that appears on the public feed.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <NeonLink href="/admin/posts" variant="secondary" shape="xl" className="sm:w-auto">
            Back to posts
          </NeonLink>
          {post.status === "published" ? (
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

      {saved ? (
        <GlassCard className="p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">Saved</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            Changes saved. {post.status === "published" ? "This post is live." : "This post is not published yet."}
          </p>
        </GlassCard>
      ) : null}

      {error === "slug_taken" ? (
        <GlassCard className="p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">Slug already exists</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            The slug <span className="font-mono text-[color:var(--neon-text0)]">{slugParam}</span> is already in use. Change the slug and try again.
          </p>
        </GlassCard>
      ) : null}

      <AdminPostForm
        submitLabel="Save changes"
        action={updatePost}
        initial={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          cover_image_url: post.cover_image_url ?? "",
          video_url: post.video_url ?? "",
          content_md: post.content_md,
          status: post.status,
        }}
      />

      <GlassCard className="p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            Updated {new Date(post.updated_at).toLocaleString()}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            {post.published_at ? `Published ${new Date(post.published_at).toLocaleString()}` : "Not published"}
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
