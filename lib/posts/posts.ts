import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"

export type PostStatus = "draft" | "published" | "archived"

export interface PostRow {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content_md: string
  cover_image_url: string | null
  video_url: string | null
  content_image_urls: string[] | null
  status: PostStatus
  published_at: string | null
  author_user_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Fetch latest published posts for public surfaces.
 * Safe on dev environments even if Supabase env isn't configured.
 */
export async function getLatestPublishedPosts(limit = 3): Promise<PostRow[]> {
  if (!isServerSupabaseConfigured()) return []
  const supabase = await createClient()

  // If the table isn't migrated yet, return [] rather than throwing and breaking the page.
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id,title,slug,excerpt,content_md,cover_image_url,video_url,content_image_urls,status,published_at,author_user_id,created_at,updated_at",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[posts] getLatestPublishedPosts:", error.message)
    }
    return []
  }

  return (data ?? []) as PostRow[]
}

export async function getPublishedPostBySlug(slug: string): Promise<PostRow | null> {
  if (!isServerSupabaseConfigured()) return null
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("posts")
    .select(
      "id,title,slug,excerpt,content_md,cover_image_url,video_url,content_image_urls,status,published_at,author_user_id,created_at,updated_at",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[posts] getPublishedPostBySlug:", error.message)
    }
    return null
  }
  return data as PostRow
}
