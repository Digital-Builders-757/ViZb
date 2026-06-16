"use client"

import { useState } from "react"

import { AdminPostBodyImages } from "@/components/admin/posts/admin-post-body-images"
import { AdminPostCoverUpload } from "@/components/admin/posts/admin-post-cover-upload"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"

export type AdminPostDraft = {
  title: string
  excerpt: string
  cover_image_url: string
  video_url: string
  content_md: string
  content_image_urls: string[]
  status: "draft" | "published" | "archived"
  /** Set on edit only — slug is not editable after create. */
  existing_slug?: string
  /** ISO timestamp or empty — preserves publish date on edit. */
  existing_published_at?: string
}

export function AdminPostForm({
  initial,
  action,
  postId,
  mode = "edit",
}: {
  initial?: Partial<AdminPostDraft>
  action: (formData: FormData) => void
  postId?: string
  mode?: "create" | "edit"
}) {
  const [draft, setDraft] = useState<AdminPostDraft>({
    title: initial?.title ?? "",
    excerpt: initial?.excerpt ?? "",
    cover_image_url: initial?.cover_image_url ?? "",
    video_url: initial?.video_url ?? "",
    content_md: initial?.content_md ?? "",
    content_image_urls: initial?.content_image_urls?.length ? [...initial.content_image_urls] : [],
    status: initial?.status ?? "draft",
    existing_slug: initial?.existing_slug ?? "",
    existing_published_at: initial?.existing_published_at ?? "",
  })

  const isDraft = draft.status === "draft"
  const isPublished = draft.status === "published"
  const isArchived = draft.status === "archived"

  return (
    <form action={action} className="space-y-6">
      <GlassCard className="p-5 md:p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">Content</p>
        <p className="mt-1 text-sm text-[color:var(--neon-text2)]">Title and caption appear on cards and the post page.</p>

        <label className="mt-4 block">
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
            Title <span className="text-[color:var(--neon-a)]">*</span>
          </span>
          <input
            name="title"
            className="vibe-input-glass mt-2"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="What are we posting?"
            required
          />
        </label>

        <label className="block mt-4">
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Caption</span>
          <textarea
            name="excerpt"
            className="vibe-input-glass mt-2 min-h-24"
            value={draft.excerpt}
            onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
            placeholder="Optional. A short line for the feed and cards."
          />
        </label>

        <input type="hidden" name="cover_image_url" value={draft.cover_image_url} readOnly />
        <input type="hidden" name="content_image_urls" value={JSON.stringify(draft.content_image_urls)} readOnly />
        {draft.existing_slug ? (
          <input type="hidden" name="existing_slug" value={draft.existing_slug} readOnly />
        ) : null}
        {draft.existing_published_at !== undefined ? (
          <input type="hidden" name="existing_published_at" value={draft.existing_published_at} readOnly />
        ) : null}

        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">Media</p>
          <p className="mt-1 text-sm text-[color:var(--neon-text2)]">Cover image and optional video link for the card.</p>

          <span className="mt-4 block font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
            Cover image
          </span>
          <div className="mt-2">
            <AdminPostCoverUpload
              postId={postId}
              coverImageUrl={draft.cover_image_url}
              onCoverImageUrlChange={(url) => setDraft((d) => ({ ...d, cover_image_url: url }))}
            />
          </div>
          <details className="mt-4 text-[color:var(--neon-text2)]">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest hover:text-[color:var(--neon-text0)]">
              Paste image URL instead (advanced)
            </summary>
            <label className="mt-3 block">
              <input
                className="vibe-input-glass mt-2"
                value={draft.cover_image_url}
                onChange={(e) => setDraft((d) => ({ ...d, cover_image_url: e.target.value }))}
                placeholder="https://..."
                aria-label="Cover image URL"
              />
            </label>
          </details>
        </div>

        <label className="mt-4 block md:max-w-xl">
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Video URL (optional)</span>
          <input
            name="video_url"
            className="vibe-input-glass mt-2"
            value={draft.video_url}
            onChange={(e) => setDraft((d) => ({ ...d, video_url: e.target.value }))}
            placeholder="https://youtube.com/..."
          />
        </label>

        {mode === "edit" ? (
          <div className="mt-6 border-t border-[color:var(--neon-hairline)] pt-6 md:max-w-xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">Publishing</p>
            <label className="mt-3 block">
              <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
                Archive or change status
              </span>
              <select
                name="status"
                className="vibe-input-glass mt-2"
                value={draft.status}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, status: e.target.value as AdminPostDraft["status"] }))
                }
              >
                <option value="draft">Draft, hidden from /p</option>
                <option value="published">Published, live on /p</option>
                <option value="archived">Archived, removed from public feed</option>
              </select>
            </label>
            <p className="mt-2 text-xs text-[color:var(--neon-text2)]">
              Use Publish below to go live. Choose Archived to hide without deleting.
            </p>
          </div>
        ) : null}
      </GlassCard>

      <GlassCard className="p-5 md:p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">Body</p>
        <p className="mt-1 text-sm text-[color:var(--neon-text2)]">Write the full post. Markdown-style paragraphs and links are supported.</p>

        <label className="mt-4 block">
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
            Post content <span className="text-[color:var(--neon-a)]">*</span>
          </span>
          <textarea
            name="content_md"
            className="vibe-input-glass mt-2 min-h-[320px] font-mono text-sm"
            value={draft.content_md}
            onChange={(e) => setDraft((d) => ({ ...d, content_md: e.target.value }))}
            placeholder={
              "Write your post in paragraphs. You can use blank lines between sections, simple lists, and links, the site will format it for readers."
            }
            required
          />
        </label>

        <div className="mt-6 border-t border-[color:var(--neon-hairline)] pt-6">
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
            Images in post
          </span>
          <div className="mt-3">
            <AdminPostBodyImages
              postId={postId}
              urls={draft.content_image_urls}
              onUrlsChange={(urls) => setDraft((d) => ({ ...d, content_image_urls: urls }))}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {mode === "create" ? (
            <>
              <NeonButton fullWidth shape="xl" type="submit" name="intent" value="draft" variant="secondary">
                Save as draft
              </NeonButton>
              <NeonButton fullWidth shape="xl" type="submit" name="intent" value="publish">
                Create &amp; publish
              </NeonButton>
            </>
          ) : isArchived ? (
            <NeonButton fullWidth shape="xl" type="submit" name="intent" value="save">
              Save changes
            </NeonButton>
          ) : isPublished ? (
            <NeonButton fullWidth shape="xl" type="submit" name="intent" value="save">
              Save changes
            </NeonButton>
          ) : (
            <>
              <NeonButton fullWidth shape="xl" type="submit" name="intent" value="draft" variant="secondary">
                Save draft
              </NeonButton>
              <NeonButton fullWidth shape="xl" type="submit" name="intent" value="publish">
                Publish
              </NeonButton>
            </>
          )}
        </div>

        <p className="mt-3 text-xs text-[color:var(--neon-text2)]">
          {isPublished
            ? "Saving updates the live post on /p immediately."
            : isArchived
              ? "Archived posts stay out of the public feed."
              : "Drafts are only visible here in admin until you publish."}
        </p>
      </GlassCard>
    </form>
  )
}
