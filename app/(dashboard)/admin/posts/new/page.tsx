import { requireAdmin } from "@/lib/auth-helpers"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

import { AdminPostForm } from "@/components/admin/posts/admin-post-form"
import { GlassCard } from "@/components/ui/glass-card"

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default async function AdminNewPostPage() {
  await requireAdmin()

  async function createPost(formData: FormData) {
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

    const { data, error } = await supabase
      .from("posts")
      .insert({
        title,
        slug,
        excerpt: excerpt || null,
        content_md,
        cover_image_url: cover_image_url || null,
        video_url: video_url || null,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select("id")
      .single()

    if (error || !data?.id) return

    redirect(`/admin/posts/${data.id}`)
  }

  return (
    <div className="space-y-6">
      <header>
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Admin</span>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)]">New Post</h1>
        <p className="mt-1 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          Create a Markdown post for the public feed.
        </p>
      </header>

      {!isServerSupabaseConfigured() ? (
        <GlassCard className="p-6">
          <p className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            Supabase server env isn’t configured here yet. This page will save once it is.
          </p>
        </GlassCard>
      ) : null}

      <AdminPostForm submitLabel="Create post" action={createPost} />
    </div>
  )
}
