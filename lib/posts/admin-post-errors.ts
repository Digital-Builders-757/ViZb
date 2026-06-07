export type AdminPostFormErrorCode =
  | "slug_taken"
  | "empty_slug"
  | "invalid_images"
  | "validation"
  | "db_error"
  | "not_configured"

export function isAdminPostFormErrorCode(value: string | undefined): value is AdminPostFormErrorCode {
  return (
    value === "slug_taken" ||
    value === "empty_slug" ||
    value === "invalid_images" ||
    value === "validation" ||
    value === "db_error" ||
    value === "not_configured"
  )
}

export function adminPostFormErrorMessage(
  code: AdminPostFormErrorCode,
  opts?: { slug?: string; dbMessage?: string },
): { title: string; body: string } {
  switch (code) {
    case "slug_taken":
      return {
        title: "Link already in use",
        body: opts?.slug
          ? `Another post already uses a URL like /p/${opts.slug}. Try a more specific title so the link is unique, then save again.`
          : "Another post already uses that URL. Try a more specific title, then save again.",
      }
    case "empty_slug":
      return {
        title: "Title needs letters or numbers",
        body: "The post link is generated from the title. Add at least one letter or number so we can create a valid URL.",
      }
    case "invalid_images":
      return {
        title: "Gallery images could not be saved",
        body: 'Use only images added via "Images in post" (Supabase Storage URLs under /posts/). Remove pasted or external image URLs and try again.',
      }
    case "validation":
      return {
        title: "Missing required fields",
        body: "Add a title and post content before saving.",
      }
    case "db_error":
      return {
        title: "Could not save post",
        body: opts?.dbMessage?.trim() || "The database rejected this save. Check Supabase logs or try again.",
      }
    case "not_configured":
      return {
        title: "Supabase not configured",
        body: "Server environment variables are missing. Connect Supabase before creating or editing posts.",
      }
  }
}

export function looksLikePostsSchemaDrift(message: string): boolean {
  return /column|schema cache|does not exist|42703|42P01/i.test(message)
}

export function isPostNotFoundError(message: string | undefined): boolean {
  if (!message) return false
  return /PGRST116|0 rows|multiple \(or no\) rows/i.test(message)
}
