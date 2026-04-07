"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { toast } from "sonner"

import { seedStaffTestNotification } from "@/app/actions/notifications"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"

export function NotificationSeedCard() {
  const [pending, setPending] = useState(false)

  async function onSeed() {
    setPending(true)
    try {
      const result = await seedStaffTestNotification()
      if ("error" in result && result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Unread notification created — check the bell.")
    } finally {
      setPending(false)
    }
  }

  return (
    <GlassCard className="p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Inserts one unread row for <strong>your</strong> staff account so you can validate the bell, unread
            badge, and mark-read flows without waiting on product triggers. See also{" "}
            <code className="text-xs">docs/database/NOTIFICATIONS_QA_SEED.md</code>.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-border"
          disabled={pending}
          onClick={() => void onSeed()}
        >
          {pending ? "Seeding…" : "Seed test notification"}
        </Button>
      </div>
    </GlassCard>
  )
}
