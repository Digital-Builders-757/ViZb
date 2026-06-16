import Link from "next/link"
import { requireAdmin } from "@/lib/auth-helpers"
import { fetchImportedEventQueue } from "@/app/actions/event-import"
import { EventImportQueue } from "@/components/admin/event-import-queue"
import { NeonLink } from "@/components/ui/neon-link"

export default async function AdminEventImportsPage() {
  await requireAdmin()
  const { events, error } = await fetchImportedEventQueue()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-neon-a"
        >
          ← Admin
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-bold text-foreground md:text-3xl">
          Eventbrite imports
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Review events pulled from Eventbrite before they appear on the public timeline. Approve to
          publish, or edit details first.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <NeonLink href="/admin#event-submissions" variant="secondary" shape="xl" className="sm:w-auto">
            Organizer review queue
          </NeonLink>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive">Failed to load import queue: {error}</p>
      ) : (
        <EventImportQueue events={events} />
      )}
    </div>
  )
}
