#!/usr/bin/env node
/**
 * Audit organizer-created events for naive UTC storage (intended Eastern wall time).
 * Usage: node scripts/audit-event-timezones.mjs
 * Requires DATABASE_URL or SUPABASE_DB_URL in environment for live audit.
 */

import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

function loadEasternHelpers() {
  // Vitest/ts path — run via: node --experimental-vm-modules or use compiled output.
  // For simplicity, inline the reinterpret logic matching lib/events/eastern-datetime.ts
  const { TZDate } = require("@date-fns/tz")
  const TZ = "America/New_York"

  function parseEasternDatetimeLocalToIso(value) {
    const trimmed = value.trim()
    if (!trimmed) return null
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed)
    if (!match) return null
    const zoned = new TZDate(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      match[6] ? Number(match[6]) : 0,
      TZ,
    )
    const ms = zoned.getTime()
    return Number.isNaN(ms) ? null : new Date(ms).toISOString()
  }

  function reinterpretUtcComponentsAsEasternToIso(iso) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    const localLike = `${String(d.getUTCFullYear()).padStart(4, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}T${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")}`
    return parseEasternDatetimeLocalToIso(localLike)
  }

  return { reinterpretUtcComponentsAsEasternToIso }
}

const { reinterpretUtcComponentsAsEasternToIso } = loadEasternHelpers()

const dbUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL

async function main() {
  if (!dbUrl) {
    console.log("No DATABASE_URL — showing SQL audit query only:\n")
    console.log(`SELECT id, title, slug, starts_at, ends_at,
  ((starts_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York') AS corrected_starts_at
FROM public.events
WHERE source IS NULL
  AND starts_at IS NOT NULL
  AND starts_at <> ((starts_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York');`)
    return
  }

  let pg
  try {
    pg = await import("pg")
  } catch {
    console.error("Install pg to run live audit: npm install pg")
    process.exit(1)
  }

  const client = new pg.default.Client({ connectionString: dbUrl })
  await client.connect()

  const { rows } = await client.query(`
    SELECT id, title, slug, starts_at, ends_at, source
    FROM public.events
    WHERE source IS NULL AND starts_at IS NOT NULL
    ORDER BY starts_at ASC
  `)

  const suspects = []
  for (const row of rows) {
    const current = new Date(row.starts_at).toISOString()
    const corrected = reinterpretUtcComponentsAsEasternToIso(current)
    if (corrected && corrected !== current) {
      suspects.push({
        id: row.id,
        title: row.title,
        slug: row.slug,
        current_starts_at: current,
        corrected_starts_at: corrected,
        ends_at: row.ends_at ? new Date(row.ends_at).toISOString() : null,
      })
    }
  }

  console.log(`Scanned ${rows.length} manual events; ${suspects.length} need Eastern reinterpretation.\n`)
  if (suspects.length > 0) {
    console.log("id,title,slug,current_starts_at,corrected_starts_at")
    for (const s of suspects) {
      console.log(`${s.id},"${s.title.replace(/"/g, '""')}",${s.slug},${s.current_starts_at},${s.corrected_starts_at}`)
    }
  }

  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
