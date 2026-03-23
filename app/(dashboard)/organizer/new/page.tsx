import { redirect } from "next/navigation"

/**
 * Self-serve org creation is disabled. Redirect to Request to Host page.
 * Orgs are now created by staff admins via the invite system.
 */
export default function CreateOrgPage() {
  redirect("/host/apply")
}
