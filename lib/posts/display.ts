/** Shared formatting for public post surfaces. */

export function formatPostPublishedDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export type PostCardKicker = "update" | "recap"

export function getPostCardKicker(isRecap: boolean): PostCardKicker {
  return isRecap ? "recap" : "update"
}

export function postCardKickerLabel(kicker: PostCardKicker): string {
  return kicker === "recap" ? "Event recap" : "Update"
}
