# Ticketmaster Discovery import (#267)

## Status: implemented, disabled by default

Ticketmaster Discovery is the first public geographic event source for ViZb local ingestion. It writes normalized records to **`event_candidates`** only — never directly to canonical **`events`**.

Product boundary:

- Imported listings remain third-party Ticketmaster events until staff approval (#270) and optional organizer claim (#274).
- ViZb must not create native ticket inventory for unclaimed Ticketmaster listings.
- Public CTAs must preserve Ticketmaster source attribution and external ticket URLs.

## Credentials

Obtain a **Consumer Key** from [Ticketmaster Developer](https://developer.ticketmaster.com/) (Discovery API).

- Server env var: `TICKETMASTER_API_KEY`
- **Consumer Secret is not required** for Discovery API v2 read-only event search.
- Never commit, log, or expose the key in client bundles, import metadata, or error responses.

## Environment variables (server-only)

Add to `.env.local` (local) or Vercel Preview when testing — **keep Production disabled** until shadow import is approved:

| Variable | Description |
|----------|-------------|
| `TICKETMASTER_API_KEY` | Ticketmaster Discovery Consumer Key |
| `TICKETMASTER_IMPORT_ENABLED` | `true` / `false` — master switch; keep `false` in Production during rollout |
| `TICKETMASTER_IMPORT_LOOKAHEAD_DAYS` | Optional override (default from `INGESTION_DISCOVERY_LOOKAHEAD_DAYS`, 90) |
| `TICKETMASTER_IMPORT_PAGE_SIZE` | Optional override (default 20) |
| `TICKETMASTER_IMPORT_MAX_PAGES` | Optional max pages per city (default 5) |
| `TICKETMASTER_IMPORT_MAX_RECORDS` | Optional max records per run (default 500) |

Shared geography controls (`INGESTION_DISCOVERY_*`) live in [`.env.example`](../../.env.example). See [`docs/imports/LOCAL_EVENT_INGESTION.md`](./LOCAL_EVENT_INGESTION.md).

Also required for imports:

- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (scheduled route on Vercel)
- `event_sources.enabled_in_db = true` for `ticketmaster` (in addition to env flag)

## Double-gate behavior

Both must be true before a run proceeds:

1. `TICKETMASTER_IMPORT_ENABLED=true`
2. `UPDATE event_sources SET enabled_in_db = true WHERE source_key = 'ticketmaster';`

Production should remain **disabled on both gates** until Preview shadow import is reviewed.

## Release workflow (Preview-first)

Deploying ingestion code to **Production** (`main`) does **not** activate imports. Use this order:

| Phase | Where | Env + DB gates | Purpose |
|-------|--------|----------------|---------|
| **A — Preview shadow** | Vercel Preview + Preview DB (or shared DB with gate toggled briefly) | `TICKETMASTER_IMPORT_ENABLED=true` + `enabled_in_db=true` | Validate candidates, rate limits, ops endpoints |
| **B — Local dev** | `.env.local` + dev Supabase | Same double-gate on your dev project | Fast iteration (see Local setup below) |
| **C — Production** | Vercel Production + Production DB | Only after Preview sign-off | Manual import first, then cron |

**Production verification (gates OFF):**

- Cron without auth → `401 Unauthorized`
- Cron with `CRON_SECRET` while disabled → `{ ok: true, skipped: true, reason: "disabled" }`
- `event_sources.enabled_in_db = false` for `ticketmaster`
- Candidates do not appear on public `/events` until #270 approval UI

After Preview review, disable the Preview DB gate unless continuing active testing.

## Geographic coverage

Uses centralized Hampton Roads config from `lib/imports/geography/`:

Norfolk, Virginia Beach, Chesapeake, Portsmouth, Hampton, Newport News, Suffolk, Williamsburg (`stateCode=VA`, `countryCode=US`).

Query strategy: one bounded request sequence per city with `sort=date,asc`. Duplicate Ticketmaster event IDs across nearby city searches dedupe via `source_key + source_event_id` upsert.

## Local setup

1. Apply migration `20260622193458_event_ingestion_foundation.sql`.
2. Set `TICKETMASTER_API_KEY` and `TICKETMASTER_IMPORT_ENABLED=true` in `.env.local`.
3. Enable the DB gate locally:

```sql
UPDATE public.event_sources
SET enabled_in_db = true
WHERE source_key = 'ticketmaster';
```

4. Start the app: `npm run dev`
5. Sign in as `staff_admin`.
6. Verify readiness:

```bash
curl -b "your-session-cookie" http://localhost:3000/api/admin/imports/sources
curl -b "your-session-cookie" http://localhost:3000/api/admin/imports/sources/ticketmaster/health
```

7. Run manual import:

```bash
curl -X POST -b "your-session-cookie" http://localhost:3000/api/admin/imports/ticketmaster/run
```

8. Inspect candidates:

```sql
SELECT
  source_key,
  source_event_id,
  title,
  starts_at,
  city,
  source_url,
  review_status,
  first_seen_at,
  last_seen_at
FROM public.event_candidates
WHERE source_key = 'ticketmaster'
ORDER BY starts_at
LIMIT 100;
```

9. Disable the DB gate after testing unless continuing development:

```sql
UPDATE public.event_sources
SET enabled_in_db = false
WHERE source_key = 'ticketmaster';
```

## Preview setup

1. Add `TICKETMASTER_API_KEY` to Vercel Preview env.
2. Set `TICKETMASTER_IMPORT_ENABLED=true` on Preview only.
3. Redeploy Preview.
4. Enable `ticketmaster` in the Preview database only.
5. Run one manual import and inspect `event_candidates`.
6. Disable the Preview DB gate after verification.

## Scheduled import

`vercel.json` schedules `GET /api/cron/ticketmaster-import` every 6 hours (`0 */6 * * *`).

The route fail-closes when `TICKETMASTER_IMPORT_ENABLED=false` or the DB gate is off.

Manual cron test:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-host>/api/cron/ticketmaster-import
```

Do **not** activate Production cron until explicit approval.

## Rate limits

Ticketmaster Discovery documented limits:

- 5 requests per second
- 5,000 requests per day
- `size × page` must stay below 1,000

The client uses sequential city requests, conservative pacing (~250ms), bounded pagination, and `Retry-After` handling on HTTP 429.

## Disable and rollback

1. Set `TICKETMASTER_IMPORT_ENABLED=false`.
2. Set `event_sources.enabled_in_db = false` for `ticketmaster`.
3. Confirm cron and manual routes return `{ skipped: true }`.
4. Existing `event_candidates` and provenance remain for audit; no automatic deletion.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `{ skipped: true, reason: "disabled" }` | Env flag false |
| `{ reason: "registry_disabled" }` | DB gate false |
| `{ reason: "missing_credentials" }` | `TICKETMASTER_API_KEY` missing |
| `{ reason: "invalid_geography" }` | `INGESTION_DISCOVERY_ENABLED` false in production |
| `{ reason: "overlap_in_progress" }` | Another import run still `running` |
| Zero candidates | Date window, city coverage, or upstream empty results |
| Duplicate candidates on rerun | Should not happen — verify unique `(source_key, source_event_id)` |

## Code map

| Component | Location |
|-----------|----------|
| Env helpers | `lib/ticketmaster/env.ts` |
| Discovery client | `lib/ticketmaster/client.ts` |
| Normalizer | `lib/ticketmaster/normalize.ts` |
| Adapter | `lib/ticketmaster/adapter.ts` |
| Import entry | `lib/imports/run-ticketmaster-import.ts` |
| Manual route | `POST /api/admin/imports/ticketmaster/run` |
| Cron route | `GET /api/cron/ticketmaster-import` |

Contract: [`docs/contracts/event-ingestion.md`](../contracts/event-ingestion.md)
