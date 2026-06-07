import Link from "next/link"
import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/auth-helpers"
import { logError } from "@/lib/log"
import { isTrustedBodyImageUrl, parseContentImageUrlsJson } from "@/lib/posts/body-image-upload-constraints"
import { deriveExcerptFromMarkdown } from "@/lib/posts/utils"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"

import { AdminPostForm } from "@/components/admin/posts/admin-post-form"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"

const POST_SAVE_ERRORS: Record<string, { title: string; body: string }> = {
  missing_fields: {
    title: "Missing required fields",
    body: "Title and post content are required before saving.",
  },
  invalid_images: {
    title: "Images could not be saved",
    body: "Use only images added via “Images in post”, or ensure the image list is valid JSON of Supabase Storage URLs.",
  },
  save_failed: {
    title: "Save failed",
    body: "The database rejected this save. Try again in a moment. If it keeps failing, check Supabase logs or the troubleshooting doc.",
  },
}

export default async function AdminEditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string; error?: string; published?: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const { saved, error: saveError, published: justPublished } = await searchParams

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
    .select("id,title,slug,excerpt,content_md,cover_image_url,video_url,content_image_urls,status,published_at,updated_at")
    .eq("id", id)
    .single()

  if (!post) {
    redirect("/admin/posts")
  }

  const existingPublishedAt = post.published_at
  const existingSlug = post.slug

  async function updatePost(formData: FormData) {
    "use server"

    if (!isServerSupabaseConfigured()) return

    const title = String(formData.get("title") ?? "").trim()
    const excerptRaw = String(formData.get("excerpt") ?? "").trim()
    const cover_image_url = String(formData.get("cover_image_url") ?? "").trim()
    const video_url = String(formData.get("video_url") ?? "").trim()
    const content_md = String(formData.get("content_md") ?? "").trim()
    const content_image_urls_raw = String(formData.get("content_image_urls") ?? "")
    const intent = String(formData.get("intent") ?? "save")
    let status = String(formData.get("status") ?? "draft") as "draft" | "published" | "archived"

    if (intent === "publish") status = "published"
    if (intent === "draft") status = "draft"

    if (!title || !existingSlug || !content_md) {
      logError("admin.posts.save", "missing_fields", { postId: id })
      return redirect(`/admin/posts/${id}?error=missing_fields`)
    }

    const content_image_urls_parsed = parseContentImageUrlsJson(content_image_urls_raw)
    if (content_image_urls_parsed === null) {
      logError("admin.posts.save", "invalid_images_json", { postId: id })
      return redirect(`/admin/posts/${id}?error=invalid_images`)
    }
    if (!content_image_urls_parsed.every(isTrustedBodyImageUrl)) {
      logError("admin.posts.save", "untrusted_image_urls", { postId: id })
      return redirect(`/admin/posts/${id}?error=invalid_images`)
    }

    const supabase = await createClient()
    const shouldSetPublishedAt = status === "published" && !existingPublishedAt
    const excerpt = excerptRaw || deriveExcerptFromMarkdown(content_md)

    const { error } = await supabase
      .from("posts")
      .update({
        title,
        slug: existingSlug,
        excerpt: excerpt ? excerpt : null,
        cover_image_url: cover_image_url || null,
        video_url: video_url || null,
        content_md,
        content_image_urls: content_image_urls_parsed,
        status,
        published_at: shouldSetPublishedAt ? new Date().toISOString() : existingPublishedAt,
      })
      .eq("id", id)

    if (error) {
      logError("admin.posts.save", error, { postId: id })
      return redirect(`/admin/posts/${id}?error=save_failed`)
    }

    if (intent === "publish" || status === "published") {
      return redirect(`/admin/posts/${id}?saved=1&published=1`)
    }
    return redirect(`/admin/posts/${id}?saved=1`)
  }

  const errorBanner = saveError ? POST_SAVE_ERRORS[saveError] : null
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
              {isLive ? "Live on /p" : isArchived ? "Archived — not public" : "Draft — not public yet"}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <NeonLink href="/admin/posts" variant="secondary" shape="xl" className="sm:w-auto">
            Back to posts
          </NeonLink>
          {isLive ? (
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

      {errorBanner ? (
        <GlassCard className="border border-amber-500/35 p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-amber-200">{errorBanner.title}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">{errorBanner.body}</p>
        </GlassCard>
      ) : null}

      {saved ? (
        <GlassCard className="p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">
            {justPublished ? "Published" : "Saved"}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            {justPublished
              ? "Your post is live on /p and the homepage feed. Use View public to preview."
              : isLive
                ? "Changes saved. This post remains live on /p."
                : isArchived
                  ? "Changes saved. This post stays archived and hidden from the public feed."
                  : "Changes saved as a draft. Publish when you’re ready for readers to see it."}
          </p>
        </GlassCard>
      ) : null}

      <AdminPostForm
        postId={post.id}
        action={updatePost}
        initial={{
          title: post.title,
          excerpt: post.excerpt ?? "",
          cover_image_url: post.cover_image_url ?? "",
          video_url: post.video_url ?? "",
          content_md: post.content_md,
          content_image_urls: Array.isArray(post.content_image_urls) ? post.content_image_urls : [],
          status: post.status,
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
