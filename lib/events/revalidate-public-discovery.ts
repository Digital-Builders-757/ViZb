import { revalidatePath } from "next/cache"

/** Home (`/`), explore timeline, and optional event detail after listing changes. */
export function revalidatePublicEventDiscoveryPaths(eventSlug?: string | null) {
  revalidatePath("/")
  revalidatePath("/events")
  if (eventSlug?.trim()) {
    revalidatePath(`/events/${eventSlug.trim()}`)
  }
}
