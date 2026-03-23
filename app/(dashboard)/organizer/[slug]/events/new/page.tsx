import { requireOrgMember } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import { CreateEventForm } from "@/components/organizer/create-event-form"

export default async function CreateEventPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { org, membership } = await requireOrgMember(slug)

  // Only owner, admin, and editor can create events
  if (!["owner", "admin", "editor"].includes(membership.role)) {
    redirect(`/organizer/${slug}`)
  }

  return (
    <CreateEventForm
      orgId={org.id}
      orgSlug={slug}
      orgName={org.name}
    />
  )
}
