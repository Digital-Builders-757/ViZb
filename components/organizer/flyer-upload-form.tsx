"use client"

import React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { uploadEventFlyer, removeEventFlyer } from "@/app/actions/event"
import {
  EVENT_FLYER_ACCEPT_ATTR,
  EVENT_FLYER_ALLOWED_MIME_TYPES,
  EVENT_FLYER_INVALID_TYPE_MESSAGE,
  EVENT_FLYER_MAX_BYTES,
  EVENT_FLYER_TOO_LARGE_MESSAGE,
} from "@/lib/events/flyer-upload-constraints"
import { Upload, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface FlyerUploadFormProps {
  eventId: string
  currentFlyerUrl: string | null
}

export function FlyerUploadForm({ eventId, currentFlyerUrl }: FlyerUploadFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    if (!(EVENT_FLYER_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      toast.error(EVENT_FLYER_INVALID_TYPE_MESSAGE)
      return
    }
    if (file.size > EVENT_FLYER_MAX_BYTES) {
      toast.error(EVENT_FLYER_TOO_LARGE_MESSAGE)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.set("event_id", eventId)
      formData.set("flyer", file)

      const result = await uploadEventFlyer(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Flyer uploaded successfully.")
        router.refresh()
      }
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleRemove() {
    setRemoving(true)
    try {
      const result = await removeEventFlyer(eventId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Flyer removed.")
        router.refresh()
      }
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        {currentFlyerUrl
          ? "Replace the current flyer or remove it."
          : "Upload a flyer image (JPEG, PNG, WebP, or GIF, max 5MB)."}
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Upload button */}
        <label
          className={`inline-flex items-center gap-2 cursor-pointer px-5 py-2.5 text-xs font-mono uppercase tracking-widest border transition-colors ${
            uploading
              ? "border-muted-foreground/30 text-muted-foreground cursor-not-allowed"
              : "border-neon-a/30 text-neon-a hover:bg-neon-a/10"
          }`}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Uploading..." : currentFlyerUrl ? "Replace Flyer" : "Upload Flyer"}
          <input
            ref={fileInputRef}
            type="file"
            accept={EVENT_FLYER_ACCEPT_ATTR}
            onChange={handleUpload}
            disabled={uploading}
            className="sr-only"
          />
        </label>

        {/* Remove button (only if flyer exists) */}
        {currentFlyerUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-widest border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {removing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {removing ? "Removing..." : "Remove"}
          </button>
        )}
      </div>
    </div>
  )
}
