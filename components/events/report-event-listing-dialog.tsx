"use client"

import { useState, useTransition } from "react"
import { Flag } from "lucide-react"

import { submitEventListingReportMessage } from "@/app/actions/event-trust"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { NeonLink } from "@/components/ui/neon-link"
import { Textarea } from "@/components/ui/textarea"

interface ReportEventListingDialogProps {
  eventId: string
  eventSlug: string
  isSignedIn: boolean
  loginHref: string
}

export function ReportEventListingDialog({
  eventId,
  eventSlug,
  isSignedIn,
  loginHref,
}: ReportEventListingDialogProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function resetFeedback() {
    setFormError(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          setText("")
          resetFeedback()
          setSuccessMsg(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] transition-colors hover:text-[color:var(--neon-text0)]"
        >
          <Flag className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          Report listing
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-[color:var(--neon-text0)]">
            Report this listing
          </DialogTitle>
          <DialogDescription className="text-[color:var(--neon-text2)]">
            Flag incorrect info, spam, or safety concerns. The team reviews reports on a best-effort basis.
          </DialogDescription>
        </DialogHeader>

        {!isSignedIn ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-[color:var(--neon-text1)]">
              Sign in so we can follow up if needed (and reduce spam reports).
            </p>
            <NeonLink href={loginHref} shape="pill" variant="secondary" size="sm" className="w-full sm:w-auto">
              Sign in to report
            </NeonLink>
          </div>
        ) : successMsg ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-emerald-400/90" role="status">
              {successMsg}
            </p>
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(ev) => {
              ev.preventDefault()
              resetFeedback()
              startTransition(async () => {
                const r = await submitEventListingReportMessage(eventId, text)
                if (r.ok) {
                  setFormError(null)
                  setText("")
                  setSuccessMsg(r.message ?? "Thanks, we received your report.")
                } else {
                  setFormError(r.error)
                }
              })
            }}
          >
            <Textarea
              name="message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What’s wrong with this listing? (10–2000 characters)"
              minLength={10}
              maxLength={2000}
              rows={5}
              required
              className="resize-y border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30 text-[color:var(--neon-text0)]"
              disabled={pending}
            />
            {formError ? (
              <p className="text-xs text-amber-400/90" role="alert">
                {formError}
              </p>
            ) : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm" disabled={pending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={pending || text.trim().length < 10}>
                Submit report
              </Button>
            </DialogFooter>
          </form>
        )}

        <p className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
          Event: <span className="text-[color:var(--neon-text1)]">{eventSlug}</span>
        </p>
      </DialogContent>
    </Dialog>
  )
}
