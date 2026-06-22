import type { EventSourceAdapter } from "@/lib/imports/adapters/event-source-adapter"
import { eventbriteSourceAdapter } from "@/lib/eventbrite/adapter"

const ADAPTERS: EventSourceAdapter[] = [eventbriteSourceAdapter]

const byKey = new Map<string, EventSourceAdapter>(
  ADAPTERS.map((adapter) => [adapter.sourceKey, adapter]),
)

export function getRegisteredAdapter(sourceKey: string): EventSourceAdapter | null {
  return byKey.get(sourceKey) ?? null
}

export function listRegisteredSourceKeys(): string[] {
  return [...byKey.keys()]
}

export function listRegisteredAdapters(): EventSourceAdapter[] {
  return [...byKey.values()]
}
