"use client"

import React, { useRef, useState } from "react"
import Image from "next/image"
import { uploadAdminPostBodyImage, removeAdminPostBodyImageFromStorage } from "@/app/actions/admin-posts"
import {
  POST_BODY_IMAGE_ACCEPT_ATTR,
  POST_BODY_IMAGE_ALLOWED_MIME_TYPES,
  POST_BODY_IMAGE_INVALID_TYPE_MESSAGE,
  POST_BODY_IMAGE_MAX_BYTES,
  POST_BODY_IMAGE_MAX_COUNT,
  POST_BODY_IMAGE_TOO_LARGE_MESSAGE,
} from "@/lib/posts/body-image-upload-constraints"
import { Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

interface AdminPostBodyImagesProps {
  postId?: string
  urls: string[]
  onUrlsChange: (urls: string[]) => void
}

export function AdminPostBodyImages({ postId, urls, onUrlsChange }: AdminPostBodyImagesProps) {
  const addInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadKind, setUploadKind] = useState<"add" | "replace" | null>(null)
  const [replaceSpinIndex, setReplaceSpinIndex] = useState<number | null>(null)
  const pendingReplaceIndexRef = useRef<number | null>(null)
  const [removingIndex, setRemovingIndex] = useState<number | null>(null)

  async function runUpload(file: File, opts: { replaceUrl?: string }) {
    if (!(POST_BODY_IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      toast.error(POST_BODY_IMAGE_INVALID_TYPE_MESSAGE)
      return
    }
    if (file.size > POST_BODY_IMAGE_MAX_BYTES) {
      toast.error(POST_BODY_IMAGE_TOO_LARGE_MESSAGE)
      return
    }

    setUploading(true)
    if (opts.replaceUrl) {
      setUploadKind("replace")
      const i = urls.indexOf(opts.replaceUrl)
      setReplaceSpinIndex(i !== -1 ? i : null)
    } else {
      setUploadKind("add")
    }
    try {
      const formData = new FormData()
      formData.set("body_image", file)
      if (postId) formData.set("post_id", postId)
      if (opts.replaceUrl) {
        formData.set("replace_url", opts.replaceUrl)
      } else {
        formData.set("current_count", String(urls.length))
      }

      const result = await uploadAdminPostBodyImage(formData)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        if (opts.replaceUrl) {
          const i = urls.indexOf(opts.replaceUrl)
          if (i !== -1) {
            const next = [...urls]
            next[i] = result.publicUrl
            onUrlsChange(next)
          }
        } else {
          onUrlsChange([...urls, result.publicUrl])
        }
        toast.success("Image uploaded.")
      }
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setUploading(false)
      setUploadKind(null)
      setReplaceSpinIndex(null)
      pendingReplaceIndexRef.current = null
      if (addInputRef.current) addInputRef.current.value = ""
      if (replaceInputRef.current) replaceInputRef.current.value = ""
    }
  }

  function handleAddChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    void runUpload(file, {})
  }

  function handleReplaceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const idx = pendingReplaceIndexRef.current
    if (!file || idx === null) return
    const replaceUrl = urls[idx]
    if (!replaceUrl) return
    void runUpload(file, { replaceUrl })
  }

  function startReplace(index: number) {
    pendingReplaceIndexRef.current = index
    replaceInputRef.current?.click()
  }

  async function handleRemove(index: number) {
    const url = urls[index]?.trim()
    if (!url) return

    setRemovingIndex(index)
    try {
      const result = await removeAdminPostBodyImageFromStorage(url)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        onUrlsChange(urls.filter((_, i) => i !== index))
        toast.success("Image removed.")
      }
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setRemovingIndex(null)
    }
  }

  const canAdd = urls.length < POST_BODY_IMAGE_MAX_COUNT

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[color:var(--neon-text2)] leading-relaxed">
        Up to {POST_BODY_IMAGE_MAX_COUNT} images for the article body (JPEG, PNG, or WebP, max 5MB each). Shown below the
        text on the public post.
      </p>

      <input
        ref={replaceInputRef}
        type="file"
        accept={POST_BODY_IMAGE_ACCEPT_ATTR}
        onChange={handleReplaceChange}
        disabled={uploading}
        className="sr-only"
        aria-hidden
      />

      {urls.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {urls.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="flex flex-col gap-2 rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/20 p-3"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30">
                <Image src={url} alt="" fill className="object-cover" unoptimized />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startReplace(index)}
                  disabled={uploading}
                  className="inline-flex flex-1 items-center justify-center gap-2 border border-[color:var(--neon-a)]/35 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] hover:bg-[color:var(--neon-a)]/10 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
                >
                  {uploading && uploadKind === "replace" && replaceSpinIndex === index ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => void handleRemove(index)}
                  disabled={removingIndex === index || uploading}
                  className="inline-flex items-center justify-center gap-2 border border-red-500/35 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
                >
                  {removingIndex === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {canAdd ? (
        <label
          className={`inline-flex w-fit cursor-pointer items-center gap-2 border px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors sm:text-xs ${
            uploading
              ? "cursor-not-allowed border-[color:var(--neon-text2)]/30 text-[color:var(--neon-text2)]"
              : "border-[color:var(--neon-a)]/35 text-[color:var(--neon-a)] hover:bg-[color:var(--neon-a)]/10"
          }`}
        >
          {uploading && uploadKind === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading && uploadKind === "add" ? "Uploading…" : "Add image"}
          <input
            ref={addInputRef}
            type="file"
            accept={POST_BODY_IMAGE_ACCEPT_ATTR}
            onChange={handleAddChange}
            disabled={uploading}
            className="sr-only"
          />
        </label>
      ) : (
        <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
          Maximum {POST_BODY_IMAGE_MAX_COUNT} images. Remove one to add another.
        </p>
      )}
    </div>
  )
}
