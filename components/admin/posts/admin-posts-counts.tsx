import { createClient } from "@/lib/supabase/server"

export async function AdminPostsCounts() {
  const supabase = await createClient()

  // NOTE: Keep it simple + fast. If this query ever becomes slow, we can cache.
  const { data, error } = await supabase
    .from("posts")
    .select("status", { count: "exact", head: false })

  if (error) return null

  const counts = { draft: 0, published: 0, archived: 0, total: 0 }
  for (const r of data ?? []) {
    counts.total += 1
    if (r.status === "draft") counts.draft += 1
    if (r.status === "published") counts.published += 1
    if (r.status === "archived") counts.archived += 1
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
