import Link from "next/link"
import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/auth-helpers"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { AdminPostForm } from "@/components/admin/posts/admin-post-form"

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default async function AdminEditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

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
    const slug = slugRaw || slugify(title)

    const excerpt = String(formData.get("excerpt") ?? "").trim()
    const cover_image_url = String(formData.get("cover_image_url") ?? "").trim()
    const video_url = String(formData.get("video_url") ?? "").trim()
    const content_md = String(formData.get("content_md") ?? "").trim()
    const status = String(formData.get("status") ?? "draft")

    if (!title || !slug || !content_md) return

    const supabase = await createClient()

    // Preserve published_at once set. If transitioning to published with no published_at, set now.
    const shouldSetPublishedAt = status === "published" && !existingPublishedAt

    await supabase
      .from("posts")
      .update({
        title,
        slug,
        excerpt: excerpt || null,
        cover_image_url: cover_image_url || null,
        video_url: video_url || null,
        content_md,
        status,
        published_at: shouldSetPublishedAt ? new Date().toISOString() : existingPublishedAt,
      })
      .eq("id", id)

    // keep user in editor; they can open public link in a new tab
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
          <Link
            href={`/p/${post.slug}`}
            target="_blank"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-6 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur hover:shadow-[var(--vibe-neon-glow-subtle)]"
          >
            View public
          </Link>
        </div>
      </header>

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
        <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
          Updated {new Date(post.updated_at).toLocaleString()}
        </p>
      </GlassCard>
    </div>
  )
}
