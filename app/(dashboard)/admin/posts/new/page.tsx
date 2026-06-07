import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/auth-helpers"
import { logError } from "@/lib/log"
import { isTrustedBodyImageUrl, parseContentImageUrlsJson } from "@/lib/posts/body-image-upload-constraints"
import { slugify, deriveExcerptFromMarkdown } from "@/lib/posts/utils"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"

import { AdminPostForm } from "@/components/admin/posts/admin-post-form"
import { GlassCard } from "@/components/ui/glass-card"

const POST_CREATE_ERRORS: Record<string, { title: string; body: string }> = {
  missing_fields: {
    title: "Missing required fields",
    body: "Title and post content are required before creating a post.",
  },
  invalid_images: {
    title: "Images could not be saved",
    body: "Use only images added via “Images in post”, or ensure URLs are from Supabase Storage.",
  },
  save_failed: {
    title: "Create failed",
    body: "The database rejected this post. Try again or check Supabase logs.",
  },
}

export default async function AdminNewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; slug?: string }>
}) {
  await requireAdmin()
  const { error, slug } = await searchParams

  async function createPost(formData: FormData) {
    "use server"

    if (!isServerSupabaseConfigured()) return

    const title = String(formData.get("title") ?? "").trim()
    const resolvedSlug = slugify(title)
    const excerptRaw = String(formData.get("excerpt") ?? "").trim()
    const cover_image_url = String(formData.get("cover_image_url") ?? "").trim()
    const video_url = String(formData.get("video_url") ?? "").trim()
    const content_md = String(formData.get("content_md") ?? "").trim()
    const content_image_urls_raw = String(formData.get("content_image_urls") ?? "")
    const intent = String(formData.get("intent") ?? "draft")
    const status = intent === "publish" ? "published" : "draft"

    if (!title || !resolvedSlug || !content_md) {
      logError("admin.posts.create", "missing_fields")
      return redirect("/admin/posts/new?error=missing_fields")
    }

    const content_image_urls_parsed = parseContentImageUrlsJson(content_image_urls_raw)
    if (content_image_urls_parsed === null) {
      logError("admin.posts.create", "invalid_images_json")
      return redirect("/admin/posts/new?error=invalid_images")
    }
    if (!content_image_urls_parsed.every(isTrustedBodyImageUrl)) {
      logError("admin.posts.create", "untrusted_image_urls")
      return redirect("/admin/posts/new?error=invalid_images")
    }

    const supabase = await createClient()
    const excerpt = excerptRaw || deriveExcerptFromMarkdown(content_md)

    const { data, error } = await supabase
      .from("posts")
      .insert({
        title,
        slug: resolvedSlug,
        excerpt: excerpt ? excerpt : null,
        content_md,
        cover_image_url: cover_image_url || null,
        video_url: video_url || null,
        content_image_urls: content_image_urls_parsed,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select("id")
      .single()

    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return redirect(`/admin/posts/new?error=slug_taken&slug=${encodeURIComponent(resolvedSlug)}`)
      }
      logError("admin.posts.create", error)
      return redirect("/admin/posts/new?error=save_failed")
    }

    if (!data?.id) {
      logError("admin.posts.create", "no_id_returned")
      return redirect("/admin/posts/new?error=save_failed")
    }

    const qs = status === "published" ? "?saved=1&published=1" : ""
    redirect(`/admin/posts/${data.id}${qs}`)
  }

  const errorBanner =
    error === "slug_taken"
      ? {
          title: "Link already in use",
          body: (
            <>
              Another post already uses a URL like{" "}
              <span className="font-mono text-[color:var(--neon-text0)]">/p/{slug}</span>. Try a more specific title
              (or add a few words) so the link is unique, then save again.
            </>
          ),
        }
      : error
        ? POST_CREATE_ERRORS[error]
        : null

  return (
    <div className="space-y-6">
      <header>
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Admin</span>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)]">New Post</h1>
        <p className="mt-1 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          Create a post for the public feed. Save as draft or publish when ready.
        </p>
        <p className="mt-3">
          <span className="inline-flex rounded-full border border-amber-500/45 bg-amber-500/12 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-100">
            New — not public until published
          </span>
        </p>
      </header>

      {errorBanner ? (
        <GlassCard className="border border-amber-500/35 p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-amber-200">{errorBanner.title}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">{errorBanner.body}</p>
        </GlassCard>
      ) : null}

      {!isServerSupabaseConfigured() ? (
        <GlassCard className="p-6">
          <p className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            Supabase server env isn’t configured here yet. This page will save once it is.
          </p>
        </GlassCard>
      ) : null}

      <AdminPostForm action={createPost} mode="create" />
    </div>
  )
}
