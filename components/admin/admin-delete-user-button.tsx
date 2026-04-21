"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"

import { adminDeleteUser } from "@/app/actions/admin-users"
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

export function AdminDeleteUserButton(props: {
  userId: string
  email: string
  displayLabel: string
  disabled?: boolean
}) {
  const { userId, email, displayLabel, disabled } = props
  const [isPending, startTransition] = useTransition()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={disabled || isPending}
          className="inline-flex items-center justify-center gap-1.5 rounded border border-red-500/35 bg-red-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-500/15 disabled:pointer-events-none disabled:opacity-40"
          title="Delete user"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          <span className="hidden sm:inline">Delete</span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-foreground">Delete user</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
            This permanently removes their login, profile, and related member data tied to cascading
            deletes. Events they created may remain with an empty creator reference.
            <span className="mt-3 block font-semibold text-foreground">{displayLabel}</span>
            <span className="mt-1 block font-mono text-xs text-muted-foreground">{email}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border bg-transparent">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-600/90"
            onClick={() => {
              startTransition(async () => {
                const res = await adminDeleteUser(userId)
                if (res.error) {
                  toast.error(res.error)
                  return
                }
                toast.success("User deleted.")
              })
            }}
          >
            Delete user
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
