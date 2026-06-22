# Contract: event ingestion (#266)

**Status:** Foundation + geography + Ticketmaster adapter shipped (#266, #268, #267)  
**Epic:** #265  
**Architecture:** `docs/imports/LOCAL_EVENT_INGESTION.md`  
**Code:** `lib/imports/*`, `lib/imports/geography/*`, `lib/eventbrite/adapter.ts`, `lib/ticketmaster/*`

## Invariants

- Source adapters may create or update **`event_candidates`** only.
- Source adapters must **not** publish `events`, create ticket types, assign organizer ownership, approve candidates, or merge duplicates.
- Disabled sources fail closed (env flag and/or `event_sources.enabled_in_db`).
- Source credentials are server-only; never `NEXT_PUBLIC_*`.
- Candidate writes use the **service role**; staff reads use RLS (`is_staff_admin()`).

## Tables

| Table | Purpose |
|-------|---------|
| `event_sources` | Registry, cadence metadata, operational health |
| `event_candidates` | Normalized staging records awaiting moderation |
| `event_candidate_reviews` | Immutable audit of import and review actions |
| `event_import_runs` | Per-run summaries (legacy `events_*` + `candidates_*` counters) |

Migration: `supabase/migrations/20260622193458_event_ingestion_foundation.sql`

## Candidate identity

Idempotent upsert key:

```text
source_key + source_event_id
```

## Review statuses (`event_candidates.review_status`)

- `pending_review` — default for new or materially changed imports
- `needs_changes` — staff requested corrections (#270+)
- `approved_listing` — linked to canonical event (#270+)
- `rejected` — not approved; re-import may reopen if payload changes
- `suppressed` — blocked from returning until policy reset
- `stale`, `cancelled`, `merged` — reserved for freshness and dedup workflows (#269+)

## Duplicate statuses (`event_candidates.duplicate_status`)

- `none` (default)
- `exact` — same source identity or confirmed link (#269)
- `likely` — scored match requiring staff action (#269)

## Adapter contract

```ts
// lib/imports/adapters/event-source-adapter.ts
export interface EventSourceAdapter {
  readonly sourceKey: string
  validateConfig(): Promise<SourceReadiness>
  fetchCandidates(input: SourceWindow): AsyncIterable<SourcePage>
  normalize(record: unknown): NormalizedEventCandidate | { error: string }
  health(): Promise<SourceHealth>
}
```

Register implementations in `lib/imports/adapters/registry.ts`.

## Import orchestration

`runSourceImport(admin, { sourceKey, trigger, triggeredBy, window? })` in `lib/imports/run-source-import.ts`:

1. Resolve adapter from registry
2. Check env readiness (`validateConfig`)
3. Check `event_sources.enabled_in_db`
4. Skip if overlapping run in progress (`event_import_runs.status = running` for same source)
5. Build default date window via `buildDiscoveryDateWindow()` when `window` not supplied
6. Insert `event_import_runs` row
7. Fetch pages → normalize → `upsertCandidate`
8. Finish run + update source health

## Discovery geography (#268)

- **Launch market:** Hampton Roads — 8 cities in `lib/imports/geography/hampton-roads.ts`
- **Date windows:** Eastern civil calendar → UTC ISO (`buildDiscoveryDateWindow`)
- **Limits:** page size, max pages per city, max records per run (`lib/imports/geography/limits.ts`)
- **Stale threshold:** `isCandidateStale()` for freshness workflows (#269+)
- **Environment:** `INGESTION_DISCOVERY_ENABLED` defaults false in production
- **Overlap lock:** one active run per source at a time

Adapters must use geography helpers for city lists and limits — no hardcoded Hampton Roads cities in source clients.

Eventbrite entry point: `runEventbriteImport` → delegates to `runSourceImport` with `sourceKey: eventbrite`.

## Re-import merge rules

Pure logic in `lib/imports/candidate-upsert.ts` (`buildCandidateUpsertPlan`):

- **New candidate** → insert `pending_review`
- **`approved_listing` / `merged`** → update source metadata only (no content overwrite)
- **`rejected` / `suppressed` unchanged hash** → skip
- **`rejected` / `suppressed` changed hash** → reset to `pending_review` (unless active suppression window)
- **`pending_review` / `needs_changes`** → refresh normalized fields

## RLS

| Table | anon | authenticated member | staff_admin | service role |
|-------|------|----------------------|-------------|--------------|
| `event_sources` | — | — | SELECT | full |
| `event_candidates` | — | — | SELECT | full |
| `event_candidate_reviews` | — | — | SELECT | full |
| `event_import_runs` | — | — | SELECT | full |

## API routes (staff)

| Route | Auth |
|-------|------|
| `GET /api/admin/imports/sources` | `requireStaffAdminApi` |
| `GET /api/admin/imports/sources/[sourceKey]/health` | `requireStaffAdminApi` |
| `POST /api/admin/imports/eventbrite/run` | `requireStaffAdminApi` + service role |
| `POST /api/admin/imports/ticketmaster/run` | `requireStaffAdminApi` + service role |

Cron:

- `GET /api/cron/eventbrite-import` (Bearer `CRON_SECRET`; fail-closed when disabled)
- `GET /api/cron/ticketmaster-import` (Bearer `CRON_SECRET`; fail-closed when disabled)

## Canonical events boundary

Candidates are **not** public listings. Approval that creates or links an `events` row is implemented in #270. Until then, the legacy Eventbrite admin queue may still show pre-foundation rows on `events.source = eventbrite`.

See also: `docs/contracts/events.md` (community listings, external RSVP, ticketing gates).
