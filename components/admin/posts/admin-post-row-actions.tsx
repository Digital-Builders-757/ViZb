"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import Link from "next/link"

import { Archive, Loader2, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { archivePost, deletePost, unarchivePost } from "@/app/actions/posts-admin"

export function AdminPostRowActions({
  postId,
  status,
  title,
  slug,
}: {
  postId: string
  status: "draft" | "published" | "archived" | string
  title: string
  slug: string
}) {
  const [isPending, startTransition] = useTransition()

  const archiveLabel = status === "archived" ? "Restore" : "Archive"

  const isPublished = status === "published"

  return (
    <div className="flex items-center gap-2">
      {/* Mobile: compact Actions menu */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isPending}
              className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur hover:shadow-[var(--vibe-neon-glow-subtle)] disabled:opacity-50"
            >
              <MoreHorizontal className="inline h-4 w-4" />
              <span className="sr-only">Actions</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="bg-[#111111] border-border text-foreground"
          >
            <DropdownMenuItem asChild>
              <Link href={`/admin/posts/${postId}`} className="cursor-pointer">
                Edit
              </Link>
            </DropdownMenuItem>

            {isPublished ? (
              <DropdownMenuItem asChild>
                <Link href={`/p/${slug}`} target="_blank" className="cursor-pointer">
                  View public
                </Link>
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuSeparator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="cursor-pointer">
                  {archiveLabel}
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#111111] border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif text-foreground">
                    {status === "archived" ? "Restore post" : "Archive post"}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
                    {status === "archived"
                      ? "This will move the post back to draft (not public)."
                      : "Archiving removes this post from public discovery, but keeps it for audit."}
                    <span className="block mt-2 font-semibold text-foreground">{title}</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border text-muted-foreground font-mono text-xs uppercase tracking-widest bg-transparent hover:bg-muted/10">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      startTransition(async () => {
                        const result =
                          status === "archived" ? await unarchivePost(postId) : await archivePost(postId)
                        if (result?.error) {
                          toast.error(result.error)
                          return
                        }
                        toast.success(status === "archived" ? "Post restored." : "Post archived.")
                      })
                    }}
                    className="bg-[color:var(--neon-a)] text-black font-mono text-xs uppercase tracking-widest border-0 hover:opacity-90"
                  >
                    {status === "archived" ? (
                      <>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restore
                      </>
                    ) : (
                      <>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem variant="destructive" className="cursor-pointer">
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#111111] border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif text-foreground">Delete post</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
                    This permanently deletes the post. This cannot be undone.
                    <span className="block mt-2 font-semibold text-foreground">{title}</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border text-muted-foreground font-mono text-xs uppercase tracking-widest bg-transparent hover:bg-muted/10">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      startTransition(async () => {
                        const result = await deletePost(postId)
                        if (result?.error) {
                          toast.error(result.error)
                          return
                        }
                        toast.success("Post deleted.")
                      })
                    }}
                    className="bg-red-500 text-white font-mono text-xs uppercase tracking-widest border-0 hover:bg-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: keep explicit buttons */}
      <div className="hidden sm:flex items-center gap-2">
        <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            disabled={isPending}
            className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur hover:shadow-[var(--vibe-neon-glow-subtle)] disabled:opacity-50"
          >
            {isPending ? <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" /> : null}
            {archiveLabel}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-[#111111] border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-foreground">
              {status === "archived" ? "Restore post" : "Archive post"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
              {status === "archived"
                ? "This will move the post back to draft (not public)."
                : "Archiving removes this post from public discovery, but keeps it for audit."}
              <span className="block mt-2 font-semibold text-foreground">{title}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground font-mono text-xs uppercase tracking-widest bg-transparent hover:bg-muted/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                startTransition(async () => {
                  const result =
                    status === "archived" ? await unarchivePost(postId) : await archivePost(postId)
                  if (result?.error) {
                    toast.error(result.error)
                    return
                  }
                  toast.success(status === "archived" ? "Post restored." : "Post archived.")
                })
              }}
              className="bg-[color:var(--neon-a)] text-black font-mono text-xs uppercase tracking-widest border-0 hover:opacity-90"
            >
              {status === "archived" ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            disabled={isPending}
            className="rounded-full border border-red-500/35 bg-red-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-red-200 backdrop-blur hover:border-red-500/60 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" /> : null}
            Delete
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-[#111111] border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-foreground">Delete post</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
              This permanently deletes the post. This cannot be undone.
              <span className="block mt-2 font-semibold text-foreground">{title}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground font-mono text-xs uppercase tracking-widest bg-transparent hover:bg-muted/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                startTransition(async () => {
                  const result = await deletePost(postId)
                  if (result?.error) {
                    toast.error(result.error)
                    return
                  }
                  toast.success("Post deleted.")
                })
              }}
              className="bg-red-500 text-white font-mono text-xs uppercase tracking-widest border-0 hover:bg-red-400"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  )
}
