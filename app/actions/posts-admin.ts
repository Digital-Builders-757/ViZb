"use server"

import { requireAdmin } from "@/lib/auth-helpers"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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
