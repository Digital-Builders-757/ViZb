import { requireAdmin } from "@/lib/auth-helpers"
import { isServerSupabaseConfigured } from "@/lib/supabase/server"
import { createPost } from "@/app/actions/posts-admin"

import { AdminPostErrorBanner } from "@/components/admin/posts/admin-post-error-banner"
import { AdminPostForm } from "@/components/admin/posts/admin-post-form"
import { GlassCard } from "@/components/ui/glass-card"

export default async function AdminNewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; slug?: string; message?: string }>
}) {
  await requireAdmin()
  const { error, slug, message } = await searchParams

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
            New, not public until published
          </span>
        </p>
      </header>

      <AdminPostErrorBanner error={error} slug={slug} dbMessage={message} />

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
