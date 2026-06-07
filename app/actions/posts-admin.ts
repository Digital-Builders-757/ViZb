"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth-helpers"
import { isTrustedBodyImageUrl, parseContentImageUrlsJson } from "@/lib/posts/body-image-upload-constraints"
import type { AdminPostFormErrorCode } from "@/lib/posts/admin-post-errors"
import { deriveExcerptFromMarkdown, slugify } from "@/lib/posts/utils"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"

function redirectWithPostError(path: string, code: AdminPostFormErrorCode, extra?: Record<string, string>) {
  const params = new URLSearchParams({ error: code })
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) params.set(key, value)
    }
  }
  redirect(`${path}?${params.toString()}`)
}

function revalidatePostSurfaces(slug: string | undefined, status: string) {
  revalidatePath("/admin/posts")
  revalidatePath("/admin")
  if (status === "published") {
    revalidatePath("/p")
    revalidatePath("/")
    if (slug) revalidatePath(`/p/${slug}`)
  }
}

export async function createPost(formData: FormData) {
  await requireAdmin()

  if (!isServerSupabaseConfigured()) {
    redirectWithPostError("/admin/posts/new", "not_configured")
  }

  const title = String(formData.get("title") ?? "").trim()
  const resolvedSlug = slugify(title)

  const excerptRaw = String(formData.get("excerpt") ?? "").trim()
  const cover_image_url = String(formData.get("cover_image_url") ?? "").trim()
  const video_url = String(formData.get("video_url") ?? "").trim()
  const content_md = String(formData.get("content_md") ?? "").trim()
  const content_image_urls_raw = String(formData.get("content_image_urls") ?? "")
  const status = String(formData.get("status") ?? "draft")

  if (!title || !content_md) {
    redirectWithPostError("/admin/posts/new", "validation")
  }

  if (!resolvedSlug) {
    redirectWithPostError("/admin/posts/new", "empty_slug")
  }

  const content_image_urls_parsed = parseContentImageUrlsJson(content_image_urls_raw)
  if (content_image_urls_parsed === null || !content_image_urls_parsed.every(isTrustedBodyImageUrl)) {
    redirectWithPostError("/admin/posts/new", "invalid_images")
  }

  const supabase = await createClient()
  const excerpt = excerptRaw || deriveExcerptFromMarkdown(content_md)

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title,
      slug: resolvedSlug,
      excerpt: excerpt ? excerpt : null,
      content_md,
      cover_image_url: cover_image_url || null,
      video_url: video_url || null,
      content_image_urls: content_image_urls_parsed,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id,slug,status")
    .single()

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      redirectWithPostError("/admin/posts/new", "slug_taken", { slug: resolvedSlug })
    }
    redirectWithPostError("/admin/posts/new", "db_error", { message: error.message })
  }

  const createdId = data?.id
  const createdSlug = data?.slug
  const createdStatus = data?.status
  if (!createdId) {
    redirectWithPostError("/admin/posts/new", "db_error", { message: "Post was not created." })
  }

  revalidatePostSurfaces(createdSlug, createdStatus ?? status)
  redirect(`/admin/posts/${createdId}?created=1`)
}

export async function updatePost(postId: string, formData: FormData) {
  await requireAdmin()

  const editPath = `/admin/posts/${postId}`

  if (!isServerSupabaseConfigured()) {
    redirectWithPostError(editPath, "not_configured")
  }

  const title = String(formData.get("title") ?? "").trim()
  const existingSlug = String(formData.get("existing_slug") ?? "").trim()

  const excerptRaw = String(formData.get("excerpt") ?? "").trim()
  const cover_image_url = String(formData.get("cover_image_url") ?? "").trim()
  const video_url = String(formData.get("video_url") ?? "").trim()
  const content_md = String(formData.get("content_md") ?? "").trim()
  const content_image_urls_raw = String(formData.get("content_image_urls") ?? "")
  const status = String(formData.get("status") ?? "draft")
  const existingPublishedAtRaw = String(formData.get("existing_published_at") ?? "").trim()
  const existingPublishedAt = existingPublishedAtRaw || null

  if (!title || !existingSlug || !content_md) {
    redirectWithPostError(editPath, "validation")
  }

  const content_image_urls_parsed = parseContentImageUrlsJson(content_image_urls_raw)
  if (content_image_urls_parsed === null || !content_image_urls_parsed.every(isTrustedBodyImageUrl)) {
    redirectWithPostError(editPath, "invalid_images")
  }

  const supabase = await createClient()
  const shouldSetPublishedAt = status === "published" && !existingPublishedAt
  const excerpt = excerptRaw || deriveExcerptFromMarkdown(content_md)

  const { error } = await supabase
    .from("posts")
    .update({
      title,
      slug: existingSlug,
      excerpt: excerpt ? excerpt : null,
      cover_image_url: cover_image_url || null,
      video_url: video_url || null,
      content_md,
      content_image_urls: content_image_urls_parsed,
      status,
      published_at: shouldSetPublishedAt ? new Date().toISOString() : existingPublishedAt,
    })
    .eq("id", postId)

  if (error) {
    redirectWithPostError(editPath, "db_error", { message: error.message })
  }

  revalidatePostSurfaces(existingSlug, status)
  redirect(`${editPath}?saved=1&status=${encodeURIComponent(status)}`)
}

export async function archivePost(postId: string) {
  await requireAdmin()
  const supabase = await createClient()

  if (!postId) return { error: "Missing post ID." }

  const { error } = await supabase
    .from("posts")
    .update({ status: "archived" })
    .eq("id", postId)

  if (error) return { error: error.message }

  revalidatePath("/admin/posts")
  revalidatePath("/admin")
  revalidatePath("/p")
  revalidatePath("/")
  return { success: true }
}

export async function unarchivePost(postId: string) {
  await requireAdmin()
  const supabase = await createClient()

  if (!postId) return { error: "Missing post ID." }

  const { error } = await supabase
    .from("posts")
    .update({ status: "draft", published_at: null })
    .eq("id", postId)

  if (error) return { error: error.message }

  revalidatePath("/admin/posts")
  revalidatePath("/admin")
  return { success: true }
}

export async function deletePost(postId: string) {
  await requireAdmin()
  const supabase = await createClient()

  if (!postId) return { error: "Missing post ID." }

  const { data: post } = await supabase
    .from("posts")
    .select("slug")
    .eq("id", postId)
    .single()

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)

  if (error) return { error: error.message }

  revalidatePath("/admin/posts")
  revalidatePath("/admin")
  revalidatePath("/p")
  if (post?.slug) revalidatePath(`/p/${post.slug}`)
  revalidatePath("/")

  return { success: true }
}
