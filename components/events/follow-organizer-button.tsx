"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { followOrganizer, unfollowOrganizer } from "@/app/actions/follows"

export function FollowOrganizerButton({
  orgId,
  orgName,
  initialFollowing,
  signedIn,
}: {
  orgId: string
  orgName: string
  initialFollowing: boolean
  signedIn: boolean
}) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [pending, startTransition] = useTransition()

  if (!signedIn) return null

  return (
    <Button
      type="button"
      variant={following ? "secondary" : "default"}
      size="sm"
      disabled={pending}
      className="font-mono text-[10px] uppercase tracking-widest"
      onClick={() => {
        startTransition(async () => {
          const result = following ? await unfollowOrganizer(orgId) : await followOrganizer(orgId)
          if (!("error" in result && result.error)) {
            setFollowing(!following)
            router.refresh()
          }
        })
      }}
    >
      {pending ? "…" : following ? `Following ${orgName}` : `Follow ${orgName}`}
    </Button>
  )
}
