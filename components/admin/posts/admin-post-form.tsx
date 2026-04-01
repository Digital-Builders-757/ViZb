"use client"

import { useMemo, useState } from "react"

import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"

export type AdminPostDraft = {
  title: string
  slug: string
  excerpt: string
  cover_image_url: string
  video_url: string
  content_md: string
  status: "draft" | "published" | "archived"
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function AdminPostForm({
  initial,
  action,
  submitLabel = "Save",
}: {
  initial?: Partial<AdminPostDraft>
  action: (formData: FormData) => void
  submitLabel?: string
}) {
  const [draft, setDraft] = useState<AdminPostDraft>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    excerpt: initial?.excerpt ?? "",
    cover_image_url: initial?.cover_image_url ?? "",
    video_url: initial?.video_url ?? "",
    content_md: initial?.content_md ?? "",
    status: initial?.status ?? "draft",
  })

  const slugHint = useMemo(() => {
    if (draft.slug.trim()) return null
    if (!draft.title.trim()) return null
    return slugify(draft.title)
  }, [draft.slug, draft.title])

  return (
    <form action={action} className="space-y-6">
      <GlassCard className="p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Title</span>
            <input
              name="title"
              className="vibe-input-glass mt-2"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="What are we posting?"
              required
            />
          </label>

          <label className="block">
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Slug</span>
            <input
              name="slug"
              className="vibe-input-glass mt-2"
              value={draft.slug}
              onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
              placeholder={slugHint ?? "my-post"}
            />
            {slugHint ? (
              <p className="mt-2 text-xs text-[color:var(--neon-text2)]">
                Suggested: <span className="font-mono text-[color:var(--neon-text0)]">{slugHint}</span>
              </p>
            ) : null}
          </label>
        </div>

        <label className="block mt-4">
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Excerpt</span>
          <textarea
            name="excerpt"
            className="vibe-input-glass mt-2 min-h-24"
            value={draft.excerpt}
            onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
            placeholder="1–2 sentences. Shows in the public feed."
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Cover image URL</span>
            <input
              name="cover_image_url"
              className="vibe-input-glass mt-2"
              value={draft.cover_image_url}
              onChange={(e) => setDraft((d) => ({ ...d, cover_image_url: e.target.value }))}
              placeholder="https://..."
            />
          </label>

          <label className="block">
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Video URL (optional)</span>
            <input
              name="video_url"
              className="vibe-input-glass mt-2"
              value={draft.video_url}
              onChange={(e) => setDraft((d) => ({ ...d, video_url: e.target.value }))}
              placeholder="https://youtube.com/..."
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Status</span>
            <select
              name="status"
              className="vibe-input-glass mt-2"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as any }))}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-5 md:p-6">
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Markdown content</span>
          <textarea
            name="content_md"
            className="vibe-input-glass mt-2 min-h-[320px] font-mono text-sm"
            value={draft.content_md}
            onChange={(e) => setDraft((d) => ({ ...d, content_md: e.target.value }))}
            placeholder={`# Title\n\nWrite your post...\n\n- bullets\n- links\n\n`}
            required
          />
        </label>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <NeonButton
            fullWidth
            shape="xl"
            type="submit"
            onClick={() => {
              // keep the input value in sync for submission
              if (!draft.slug.trim() && draft.title.trim()) {
                setDraft((d) => ({ ...d, slug: slugify(d.title) }))
              }
            }}
          >
            {submitLabel}
          </NeonButton>
        </div>

        <p className="mt-3 text-xs text-[color:var(--neon-text2)]">
          MVP: This saves Markdown and renders it as plain text on the public post page. We’ll add proper Markdown rendering + embeds next.
        </p>
      </GlassCard>
    </form>
  )
}
