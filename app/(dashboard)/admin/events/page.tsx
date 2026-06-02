import { redirect } from "next/navigation"

/** Admin event management lives on `/admin#events`; avoid 404 for bare `/admin/events`. */
export default function AdminEventsIndexPage() {
  redirect("/admin#events")
}
