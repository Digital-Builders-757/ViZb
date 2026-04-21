"use client"

import React, { useRef, useState } from "react"
import Image from "next/image"
import { uploadAdminPostCover, removeAdminPostCoverFromStorage } from "@/app/actions/admin-posts"
import {
  POST_COVER_ACCEPT_ATTR,
  POST_COVER_ALLOWED_MIME_TYPES,
  POST_COVER_INVALID_TYPE_MESSAGE,
  POST_COVER_MAX_BYTES,
  POST_COVER_TOO_LARGE_MESSAGE,
} from "@/lib/posts/cover-upload-constraints"
import { Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

interface AdminPostCoverUploadProps {
  /** Set when editing an existing post so uploads land under `post-covers/{postId}/…`. */
  postId?: string
  coverImageUrl: string
  onCoverImageUrlChange: (url: string) => void
}

export function AdminPostCoverUpload({
  postId,
  coverImageUrl,
  onCoverImageUrlChange,
}: AdminPostCoverUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!(POST_COVER_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      toast.error(POST_COVER_INVALID_TYPE_MESSAGE)
      return
    }
    if (file.size > POST_COVER_MAX_BYTES) {
      toast.error(POST_COVER_TOO_LARGE_MESSAGE)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.set("cover", file)
      if (postId) formData.set("post_id", postId)
      if (coverImageUrl.trim()) formData.set("replace_url", coverImageUrl.trim())

      const result = await uploadAdminPostCover(formData)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        onCoverImageUrlChange(result.publicUrl)
        toast.success("Cover image uploaded.")
      }
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleRemove() {
    const url = coverImageUrl.trim()
    if (!url) return

    setRemoving(true)
    try {
      const result = await removeAdminPostCoverFromStorage(url)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        onCoverImageUrlChange("")
        toast.success("Cover removed.")
      }
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[color:var(--neon-text2)] leading-relaxed">
        JPEG, PNG, or WebP, max 3MB. Stored in Supabase; the public URL is saved with the post.
      </p>

      {coverImageUrl ? (
        <div className="relative aspect-[2/1] max-h-40 w-full max-w-md overflow-hidden rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30">
          <Image src={coverImageUrl} alt="Cover preview" fill className="object-cover" unoptimized />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <label
          className={`inline-flex cursor-pointer items-center gap-2 border px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors sm:text-xs ${
            uploading
              ? "cursor-not-allowed border-[color:var(--neon-text2)]/30 text-[color:var(--neon-text2)]"
              : "border-[color:var(--neon-a)]/35 text-[color:var(--neon-a)] hover:bg-[color:var(--neon-a)]/10"
          }`}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : coverImageUrl ? "Replace cover" : "Upload cover"}
          <input
            ref={fileInputRef}
            type="file"
            accept={POST_COVER_ACCEPT_ATTR}
            onChange={handleUpload}
            disabled={uploading}
            className="sr-only"
          />
        </label>

        {coverImageUrl ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="inline-flex items-center gap-2 border border-red-500/35 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
          >
            {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {removing ? "Removing…" : "Remove"}
          </button>
        ) : null}
      </div>
    </div>
  )
}
