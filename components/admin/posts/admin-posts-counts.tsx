import { createClient } from "@/lib/supabase/server"
import { logError } from "@/lib/log"

export async function AdminPostsCounts() {
  const supabase = await createClient()

  const [total, draft, published, archived] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "archived"),
  ])

  if (total.error || draft.error || published.error || archived.error) {
    logError("admin.posts.counts", total.error ?? draft.error ?? published.error ?? archived.error)
    return (
      <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-100">
        Counts unavailable
      </span>
    )
  }

  const counts = {
    total: total.count ?? 0,
    draft: draft.count ?? 0,
    published: published.count ?? 0,
    archived: archived.count ?? 0,
  }

  return (
    <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
      <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/20 px-3 py-1">
        Total {counts.total}
      </span>
      <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/20 px-3 py-1">
        Draft {counts.draft}
      </span>
      <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/20 px-3 py-1">
        Published {counts.published}
      </span>
      <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/20 px-3 py-1">
        Archived {counts.archived}
      </span>
    </div>
  )
}
