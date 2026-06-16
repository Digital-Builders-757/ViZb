"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import {
  adminPlacePayoutHold,
  adminReleaseOrganizerPayout,
  adminRemovePayoutHold,
} from "@/app/actions/admin-payments"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { NeonButton } from "@/components/ui/neon-button"

export function AdminPayoutOrderActions({
  orderId,
  payoutId,
  payoutBlocked,
  payoutBlockedReason,
  payoutReleasedAt,
  releaseEligible,
  releaseBlockReason,
  payoutStatus,
}: {
  orderId: string
  payoutId: string | null
  payoutBlocked: boolean
  payoutBlockedReason: string | null
  payoutReleasedAt: string | null
  releaseEligible: boolean
  releaseBlockReason: string | null
  payoutStatus: string
}) {
  const [pending, startTransition] = useTransition()
  const released = payoutStatus === "released" || Boolean(payoutReleasedAt)

  function run(action: () => Promise<{ success?: true; transferId?: string; error?: string }>, successMessage: string) {
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(successMessage)
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!released && !payoutBlocked ? (
        <NeonButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => run(() => adminPlacePayoutHold(orderId), "Manual payout hold placed.")}
        >
          Place hold
        </NeonButton>
      ) : null}

      {!released && payoutBlocked && payoutBlockedReason === "manual" ? (
        <NeonButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => run(() => adminRemovePayoutHold(orderId), "Manual payout hold removed.")}
        >
          Remove hold
        </NeonButton>
      ) : null}

      {payoutId && !released ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <NeonButton type="button" size="sm" disabled={pending || !releaseEligible}>
              Release payout
            </NeonButton>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-border bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-foreground">Release organizer payout</AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
                This creates a Stripe transfer to the organizer&apos;s connected account. Only proceed when payment,
                refund, and dispute checks pass.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={pending}
                onClick={(event) => {
                  event.preventDefault()
                  run(
                    () => adminReleaseOrganizerPayout(payoutId),
                    "Payout released via Stripe transfer.",
                  )
                }}
              >
                Confirm release
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      {!releaseEligible && releaseBlockReason && !released ? (
        <p className="w-full text-xs text-amber-200">
          Release blocked: {releaseBlockReason.replace(/_/g, " ")}
        </p>
      ) : null}
    </div>
  )
}
