import Link from "next/link"

import { requireAdmin } from "@/lib/auth-helpers"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { AdminPostRowActions } from "@/components/admin/posts/admin-post-row-actions"
import { AdminPostsCounts } from "@/components/admin/posts/admin-posts-counts"

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireAdmin()
  const { status } = await searchParams
  const activeStatusRaw = (status ?? "all").toLowerCase()
  const activeStatus: "all" | "draft" | "published" | "archived" =
    activeStatusRaw === "draft" || activeStatusRaw === "published" || activeStatusRaw === "archived"
      ? activeStatusRaw
      : "all"

  let posts: Array<{ id: string; title: string; slug: string; status: string; published_at: string | null; updated_at: string }> = []
  let schemaReady = true

  if (!isServerSupabaseConfigured()) {
    schemaReady = false
  } else {
    const supabase = await createClient()
    let q = supabase
      .from("posts")
      .select("id,title,slug,status,published_at,updated_at")
      .order("updated_at", { ascending: false })
      .limit(50)

    if (activeStatus !== "all") {
      q = q.eq("status", activeStatus)
    }

    const { data, error } = await q

    if (error) {
      schemaReady = false
    } else {
      posts = (data ?? []) as any
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Admin</span>
          <h1 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)]">Posts</h1>
          <p className="mt-1 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            Publish updates that show up on the public site feed.
          </p>
          <p className="mt-2 text-xs text-[color:var(--neon-text2)]">
            <span className="font-mono uppercase tracking-widest">Published</span> posts are visible on the homepage module and the public <span className="font-mono">/p</span> feed.
          </p>
        </div>

        <NeonLink href="/admin/posts/new" shape="xl" className="sm:w-auto">
          New post
        </NeonLink>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "all", label: "All" },
            { key: "draft", label: "Draft" },
            { key: "published", label: "Published" },
            { key: "archived", label: "Archived" },
          ].map((opt) => {
            const isActive = activeStatus === opt.key
            const href = opt.key === "all" ? "/admin/posts" : `/admin/posts?status=${opt.key}`
            return (
              <Link
                key={opt.key}
                href={href}
                className={
                  "rounded-full border px-4 py-2 text-[10px] font-mono uppercase tracking-widest backdrop-blur transition-colors " +
                  (isActive
                    ? "border-[color:var(--neon-a)]/45 bg-[color:var(--neon-surface)]/65 text-[color:var(--neon-text0)] shadow-[var(--vibe-neon-glow-subtle)]"
                    : "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/20 text-[color:var(--neon-text2)] hover:border-[color:var(--neon-a)]/35 hover:text-[color:var(--neon-text0)]")
                }
              >
                {opt.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          <AdminPostsCounts />
        </div>
      </div>

      {!schemaReady ? (
        <GlassCard className="p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">Setup required</p>
          <h2 className="mt-2 font-serif text-xl font-bold text-[color:var(--neon-text0)]">Posts table not detected</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            Run the SQL in <code className="font-mono text-[color:var(--neon-text0)]">docs/plans/POSTS_MVP.md</code> to create the
            <code className="ml-1 font-mono text-[color:var(--neon-text0)]">posts</code> table + RLS.
          </p>
        </GlassCard>
      ) : null}

      <GlassCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/30 px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
            Latest
          </p>
          <p className="text-xs text-[color:var(--neon-text2)]">{posts.length} shown</p>
        </div>

        {posts.length === 0 ? (
          <div className="p-6">
            <p className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]">No posts yet.</p>
            <div className="mt-4">
              <NeonLink href="/admin/posts/new" shape="xl" className="sm:w-auto">
                Create your first post
              </NeonLink>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--neon-hairline)]">
            {posts.map((p) => (
              <li key={p.id} className="px-5 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/posts/${p.id}`}
                      className="block truncate font-semibold text-[color:var(--neon-text0)] hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                      /p/{p.slug}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                    <span
                      className={
                        "rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/45 px-3 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur " +
                        (p.status === "published"
                          ? "text-[color:var(--neon-a)]"
                          : p.status === "draft"
                            ? "text-[color:var(--neon-text1)]"
                            : "text-[color:var(--neon-c)]")
                      }
                    >
                      {p.status}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                      {p.published_at
                        ? `Published ${new Date(p.published_at).toLocaleDateString()}`
                        : `Updated ${new Date(p.updated_at).toLocaleDateString()}`}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/posts/${p.id}`}
                        className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur hover:shadow-[var(--vibe-neon-glow-subtle)]"
                      >
                        Edit
                      </Link>
                      {p.status === "published" ? (
                        <Link
                          href={`/p/${p.slug}`}
                          target="_blank"
                          className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur hover:shadow-[var(--vibe-neon-glow-subtle)]"
                        >
                          View public
                        </Link>
                      ) : null}
                      <AdminPostRowActions postId={p.id} status={p.status} title={p.title} slug={p.slug} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  )
}
