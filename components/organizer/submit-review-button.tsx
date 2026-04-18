"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { submitEventForReview } from "@/app/actions/event"
import { Send, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface SubmitReviewButtonProps {
  eventId: string
  variant?: "submit" | "resubmit"
}

export function SubmitReviewButton({ eventId, variant = "submit" }: SubmitReviewButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isResubmit = variant === "resubmit"
  const label = isResubmit ? "Revise & Resubmit" : "Submit for Review"
  const loadingLabel = isResubmit ? "Resubmitting..." : "Submitting..."
  const successMsg = isResubmit ? "Event resubmitted for review!" : "Event submitted for review!"
  const Icon = isResubmit ? RotateCcw : Send

  async function handleSubmit() {
    setLoading(true)
    try {
      const result = await submitEventForReview(eventId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(successMsg)
        router.refresh()
      }
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={loading}
      className={`flex items-center justify-center gap-2 px-6 py-3 text-xs uppercase tracking-widest font-bold transition-all w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed ${
        isResubmit
          ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
          : "bg-gradient-to-r from-neon-b to-neon-a text-white hover:shadow-[0_0_30px_rgba(0,189,255,0.4)]"
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      {loading ? loadingLabel : label}
    </button>
  )
}
