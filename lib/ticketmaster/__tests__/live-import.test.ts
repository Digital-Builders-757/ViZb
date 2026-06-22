import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { createClient } from "@supabase/supabase-js"
import { runTicketmasterImport } from "@/lib/imports/run-ticketmaster-import"

function loadEnvLocal(): void {
  const path = resolve(process.cwd(), ".env.local")
  const raw = readFileSync(path, "utf8")
  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx <= 0) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "")
    if (!process.env[key]) process.env[key] = value
  }
}

const LIVE = process.env.TICKETMASTER_LIVE_TEST === "1"

describe.skipIf(!LIVE)("ticketmaster live import (manual)", () => {
  it("imports Hampton Roads candidates into event_candidates", async () => {
    loadEnvLocal()
    process.env.INGESTION_DISCOVERY_ENABLED = "true"

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    expect(url).toBeTruthy()
    expect(serviceKey).toBeTruthy()
    expect(process.env.TICKETMASTER_API_KEY).toBeTruthy()

    const admin = createClient(url!, serviceKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    await admin
      .from("event_sources")
      .update({ enabled_in_db: true })
      .eq("source_key", "ticketmaster")

    const summary = await runTicketmasterImport(admin, { trigger: "manual" })

    const { count: candidateCount } = await admin
      .from("event_candidates")
      .select("id", { count: "exact", head: true })
      .eq("source_key", "ticketmaster")

    const { count: eventsCount } = await admin
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("source", "ticketmaster")

    await admin
      .from("event_sources")
      .update({ enabled_in_db: false })
      .eq("source_key", "ticketmaster")

    console.log(
      JSON.stringify({
        ok: summary.ok,
        found: summary.found,
        created: summary.created,
        updated: summary.updated,
        skippedRecords: summary.skippedRecords,
        errors: summary.errors.slice(0, 5),
        candidateCount,
        eventsCount,
      }),
    )

    expect(summary.ok).toBe(true)
    expect(eventsCount ?? 0).toBe(0)
  }, 120_000)
})
