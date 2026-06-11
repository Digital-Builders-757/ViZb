"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { linkEventRecapPost } from "@/app/actions/event-recap"

export type RecapPostOption = { id: string; title: string; slug: string }

export function AdminEventRecapLinkForm({
  eventId,
  currentPostId,
  posts,
}: {
  eventId: string
  currentPostId: string | null
  posts: RecapPostOption[]
}) {
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="space-y-3"
      action={(formData) => {
        startTransition(async () => {
          const postId = formData.get("postId")
          await linkEventRecapPost(eventId, typeof postId === "string" ? postId : null)
        })
      }}
    >
      <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">
        Link recap post
      </label>
      <select
        name="postId"
        defaultValue={currentPostId ?? ""}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        disabled={pending}
      >
        <option value="">No recap linked</option>
        {posts.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={pending || posts.length === 0}>
        {pending ? "Saving…" : "Save recap link"}
      </Button>
      {posts.length === 0 ? (
        <p className="text-xs text-muted-foreground">Publish a post first to link a recap.</p>
      ) : null}
    </form>
  )
}
