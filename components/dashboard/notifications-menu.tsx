"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Bell } from "lucide-react"

import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications"
import type { DashboardNotificationItem } from "@/lib/notifications/dashboard-queries"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface NotificationsMenuProps {
  initialUnreadCount: number
  initialItems: DashboardNotificationItem[]
}

export function NotificationsMenu({ initialUnreadCount, initialItems }: NotificationsMenuProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead()
      router.refresh()
    })
  }

  function handleOpenItem(item: DashboardNotificationItem) {
    startTransition(async () => {
      if (!item.read_at) {
        await markNotificationRead(item.id)
      }
      if (item.href) {
        router.push(item.href)
      } else {
        router.refresh()
      }
    })
  }

  const badge =
    initialUnreadCount > 0 ? (initialUnreadCount > 99 ? "99+" : String(initialUnreadCount)) : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-transparent",
            "text-[color:var(--neon-text0)] transition-colors hover:border-[color:var(--neon-hairline)] hover:bg-[color:var(--neon-bg1)]/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--neon-bg0)]",
          )}
          aria-label={`Notifications${badge ? `, ${initialUnreadCount} unread` : ""}`}
        >
          <Bell className="h-5 w-5" aria-hidden />
          {badge ? (
            <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[color:var(--neon-a)] px-1 font-mono text-[10px] font-bold leading-none text-[color:var(--neon-bg0)]">
              {badge}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-[60] w-[min(100vw-2rem,22rem)] border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)]/95 p-0 text-[color:var(--neon-text0)] shadow-xl backdrop-blur-xl"
      >
        <DropdownMenuLabel className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
          Notifications
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[color:var(--neon-hairline)]" />

        {initialItems.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="font-serif text-sm font-semibold text-[color:var(--neon-text0)]">
              {"You're all caught up"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--neon-text2)]">
              When there is news about your account or events, it will land here.
            </p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {initialItems.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className={cn(
                  "cursor-pointer items-start gap-0 rounded-none px-3 py-3 focus:bg-[color:var(--neon-a)]/10",
                  !item.read_at && "bg-[color:var(--neon-a)]/5",
                )}
                onSelect={(e) => {
                  e.preventDefault()
                  handleOpenItem(item)
                }}
              >
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold text-[color:var(--neon-text0)]">{item.title}</p>
                  {item.body ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-[color:var(--neon-text1)]">{item.body}</p>
                  ) : null}
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-text2)]">
                    {new Date(item.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator className="bg-[color:var(--neon-hairline)]" />
        <div className="p-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-full border-[color:var(--neon-hairline)] bg-transparent font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] hover:bg-[color:var(--neon-bg1)]/50"
            disabled={pending || initialUnreadCount === 0}
            onClick={() => handleMarkAll()}
          >
            Mark all as read
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
