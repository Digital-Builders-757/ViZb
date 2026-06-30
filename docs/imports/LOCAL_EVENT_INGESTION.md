# Local Event Ingestion — Architecture and Operations

**Epic:** #265  
**Roadmap:** `docs/roadmaps/LOCAL_EVENT_INGESTION_ROADMAP.md`  
**Status:** Foundation (#266), geography (#268), and Ticketmaster adapter (#267, June 2026) implemented. Deduplication (#269) and unified review queue (#270) are next.

## Purpose

This document defines the end-to-end system for bringing local event information into ViZb from multiple supported sources while preserving trust, provenance, human review, organizer rights, and ViZb-native ticketing boundaries.

The system is designed to answer five different questions without collapsing them into one:

1. Where did this event information come from?
2. Is it accurate, current, and unique?
3. Should ViZb publish it as a local listing?
4. Who is authorized to manage the event?
5. Is the event eligible to sell tickets through ViZb?

## Product rule

A discovered public event is not automatically a ViZb event.

The lifecycle is:

```text
source record
  -> event candidate
  -> staff-reviewed public listing
  -> verified organizer claim or direct organizer ownership
  -> optional ViZb-native ticketing
```

Each transition requires its own authorization and audit history.

## Current source policy

### Active direction

ViZb will support a shared ingestion layer for:

- supported public event discovery APIs,
- native organizer submissions,
- staff-entered event URLs,
- trusted venue and calendar feeds,
- future partner adapters.

### Parked Eventbrite adapter

The existing Eventbrite integration imports events belonging to one configured Eventbrite organization. It is not a public geographic event feed.

The code remains available, but production activation is deferred:

```env
EVENTBRITE_IMPORT_ENABLED=false
```

Do not add production credentials or enable the Eventbrite cron until the reactivation conditions in #259 and the roadmap are met.

When re-enabled, Eventbrite runs through the shared candidate pipeline (`event_candidates`) via `lib/eventbrite/adapter.ts` — not direct writes to `events`. The legacy admin queue at `/admin/events/imports` still reads historical Eventbrite rows on `events` until #270.

## Foundation implementation (#266)

Shipped June 2026:

| Component | Location |
|-----------|----------|
| Adapter contract | `lib/imports/adapters/event-source-adapter.ts` |
| Adapter registry | `lib/imports/adapters/registry.ts` |
| Shared types | `lib/imports/types.ts` |
| Import orchestrator | `lib/imports/run-source-import.ts` |
| Candidate upsert rules | `lib/imports/candidate-upsert.ts` |
| Candidate repository | `lib/imports/candidate-repository.ts` |
| Source readiness API helpers | `lib/imports/source-readiness.ts` |
| Eventbrite adapter (parked) | `lib/eventbrite/adapter.ts` |
| Schema migration | `supabase/migrations/20260622193458_event_ingestion_foundation.sql` |

**Database tables:**

- `event_sources` — registry + operational health (staff SELECT via RLS)
- `event_candidates` — normalized staging records (staff SELECT via RLS; writes via service role)
- `event_candidate_reviews` — import and moderation audit history
- `event_import_runs` — extended with candidate counters and window metadata

**Runtime gates (both required for automated runs):**

1. Per-source env flag (e.g. `EVENTBRITE_IMPORT_ENABLED=true`)
2. `event_sources.enabled_in_db = true` for that source key

**Staff ops endpoints:**

- `GET /api/admin/imports/sources` — registry + env readiness (no secrets)
- `GET /api/admin/imports/sources/[sourceKey]/health` — adapter health check
- `POST /api/admin/imports/eventbrite/run` — manual Eventbrite run (delegates to shared runner)

Contract reference: `docs/contracts/event-ingestion.md`.

## Geography and schedules (#268)

Shipped June 2026 — centralized server-only configuration in `lib/imports/geography/`:

| Component | Location |
|-----------|----------|
| Launch market + 8 cities | `lib/imports/geography/hampton-roads.ts` |
| Schedule defaults + env parsing | `lib/imports/geography/schedule-config.ts` |
| ET → UTC date windows | `lib/imports/geography/date-window.ts` |
| Pagination / record limits | `lib/imports/geography/limits.ts` |
| Stale threshold helpers | `lib/imports/geography/freshness.ts` |
| Ops coverage summary | `lib/imports/geography/coverage.ts` |
| Overlapping run lock | `lib/imports/geography/run-lock.ts` |

**Launch cities:** Norfolk, Virginia Beach, Chesapeake, Portsmouth, Hampton, Newport News, Suffolk, Williamsburg (`stateCode=VA`, `countryCode=US`, `timezone=America/New_York`).

**Conservative defaults:** 90-day lookahead, 1-day past-event grace, 14-day stale threshold, page size 20, max 5 pages per city, max 500 records per run, 6-hour documented cadence (matches `event_sources.default_cadence_hours`).

**Environment policy:** `INGESTION_DISCOVERY_ENABLED` defaults to **false in production**; preview/development allow discovery unless explicitly disabled.

**Orchestrator integration:** `runSourceImport` uses `buildDiscoveryDateWindow()` for default windows and skips when another `event_import_runs.status = running` row exists for the same source.

Adapters must consume geography helpers — do not hardcode Hampton Roads cities inside source-specific clients.

## Ticketmaster Discovery (#267)

Shipped June 2026 — first public geographic source:

| Component | Location |
|-----------|----------|
| Env helpers | `lib/ticketmaster/env.ts` |
| Discovery client | `lib/ticketmaster/client.ts` |
| Normalizer | `lib/ticketmaster/normalize.ts` |
| Adapter | `lib/ticketmaster/adapter.ts` |
| Import entry | `lib/imports/run-ticketmaster-import.ts` |
| Ops guide | `docs/imports/ticketmaster.md` |

**Staff ops endpoints:**

- `POST /api/admin/imports/ticketmaster/run` — manual Ticketmaster run
- `GET /api/cron/ticketmaster-import` — scheduled run (fail-closed when disabled)

**Production policy:** keep `TICKETMASTER_IMPORT_ENABLED=false` and `event_sources.enabled_in_db = false` until Preview shadow import is approved.

## Domain model

### Source

A configured origin that can produce event records.

Examples:

- Ticketmaster Discovery
- an ICS calendar published by a venue
- a native organizer submission
- a staff URL import
- a future partner-owned Eventbrite organization

A source should include:

- stable source key,
- display name,
- source type and format,
- geographic scope,
- enabled status,
- import cadence,
- attribution requirements,
- last success and last failure,
- operational notes.

### Import run

One attempt to collect records from one source for one configured window.

An import run should record:

- source,
- environment,
- trigger type: manual or scheduled,
- start and finish time,
- requested geography and date window,
- records found,
- candidates created,
- candidates updated,
- records skipped,
- failures,
- safe error summary,
- source response metadata that does not contain secrets.

### Event candidate

A normalized record awaiting moderation. A candidate is not yet a canonical public event.

Minimum fields:

- source key,
- source event ID,
- source URL,
- source attribution label,
- raw payload,
- title,
- plain-text description,
- start and end timestamps,
- source timezone,
- venue name,
- address fields,
- city, region, and postal code,
- coordinates when available,
- image URL and source,
- classifications or categories,
- organizer or promoter hints,
- source ticket URL when supplied,
- source sales status when supplied,
- first seen,
- last seen,
- last imported,
- review status,
- duplicate status and match evidence,
- canonical event link when published or merged.

### Canonical event

The event record used by ViZb public discovery.

A canonical event may originate from:

- a native organizer draft,
- a staff-created platform event,
- an approved external candidate,
- a merge of several candidates,
- an organizer claim that converts a listing into a managed event.

The canonical event owns public copy and display decisions. Source candidates retain provenance and should not overwrite moderator or organizer edits without an explicit reconciliation policy.

### Claim

A request by an organizer to establish management rights over a published listing.

A claim should record:

- claimant user and organization,
- claimed event,
- evidence or verification method,
- submitted timestamp,
- staff reviewer,
- decision and reason,
- dispute state,
- ownership changes,
- audit history.

### Native ticketing eligibility

An event becomes eligible for ViZb-native ticketing only when:

- the canonical event is owned by a verified organization,
- the claimant or creator has event-management permission,
- required payout onboarding is complete,
- staff review requirements are satisfied,
- the event is not locked by an ownership dispute,
- ticket configuration passes existing validation.

## Candidate statuses

Recommended review states:

- `pending_review` — newly created or materially changed candidate
- `needs_changes` — staff requires correction or clarification
- `duplicate_exact` — same stable source record or confirmed canonical match
- `duplicate_likely` — probable match requiring staff decision
- `approved_listing` — approved and linked to a canonical public event
- `rejected` — not approved for publication
- `suppressed` — intentionally prevented from returning without a policy reset
- `stale` — source record has not been seen within the configured freshness window
- `cancelled` — source reports cancellation
- `merged` — candidate attached to another canonical event

Status values must be implemented carefully against the current schema conventions rather than introduced as a parallel state system without review.

## Adapter contract

Every automated source adapter should expose equivalent behavior.

Conceptual TypeScript interface:

```ts
export interface EventSourceAdapter {
  sourceKey: string
  validateConfig(): Promise<SourceReadiness>
  fetchCandidates(input: SourceWindow): AsyncIterable<SourcePage>
  normalize(record: unknown): NormalizedEventCandidate | { error: string }
  health(): Promise<SourceHealth>
}
```

Implemented in `lib/imports/adapters/event-source-adapter.ts`. Register new adapters in `lib/imports/adapters/registry.ts`.

The adapter is responsible for:

- source authentication,
- request construction,
- pagination,
- source-specific rate limits,
- safe retry and timeout policy,
- source response validation,
- normalization,
- source-specific cancellation or sales-state mapping.

The adapter is not responsible for:

- publishing,
- moderator decisions,
- canonical merge decisions,
- organizer ownership,
- ticket-type creation,
- checkout,
- public ranking.

## Security rules

- Source credentials are server-only.
- Never use `NEXT_PUBLIC_*` names for private source credentials.
- Never log access tokens, keys, full authorization headers, or secret-bearing URLs.
- Manual import routes require staff authorization.
- Scheduled routes require the existing cron authentication pattern.
- Raw payload access is staff-only unless a smaller safe slice is explicitly exposed.
- Database policies must prevent public reads of operational import metadata.
- Disabled sources must fail closed.
- A missing credential should produce a safe readiness failure, not a partially configured import.

## Geography

The launch market is Hampton Roads, initially covering:

- Norfolk
- Virginia Beach
- Chesapeake
- Portsmouth
- Hampton
- Newport News
- Suffolk
- Williamsburg

Geographic behavior should be configured centrally. Each adapter may support city, postal code, coordinate radius, or market identifiers differently, but it should map back to one ViZb launch-market configuration.

The configuration should define:

- included cities,
- excluded regions when necessary,
- coordinate centers and radii where used,
- upcoming date window,
- past-event grace period,
- maximum pages or records per run,
- source cadence,
- timezone assumptions,
- environment-specific enabled state.

## Deduplication policy

Deduplication should be conservative.

### Level 1 — Stable source identity

Exact match on:

```text
source_key + source_event_id
```

This is an update to the same candidate, not a new event.

### Level 2 — Confirmed canonical link

A source candidate already linked to a canonical event should update provenance and source freshness without automatically overwriting canonical editorial fields.

### Level 3 — Likely cross-source duplicate

Use a scored comparison across:

- normalized title,
- start date and time,
- venue name,
- city,
- street address,
- organizer or promoter,
- source URL relationships.

Likely matches should be shown to staff with match evidence. Do not silently merge uncertain records.

### Merge rules

- Prefer a native organizer-owned event as canonical.
- Preserve every source link and source ID.
- Preserve staff decisions and audit history.
- Keep a reversible merge trail where practical.
- Do not let lower-confidence source updates overwrite verified organizer content.

### Current duplicate implementation

After each candidate insert/update, `lib/imports/candidate-repository.ts` calls `detectCandidateDuplicates()` from
`lib/imports/candidate-duplicate-detection.ts`. The detector compares nearby native events and candidates, marks
exact/likely duplicate status, stores match evidence, and links only exact native event matches through
`canonical_event_id`. Likely matches remain unresolved until staff reviews them.

Staff merge behavior: merge marks the candidate `merged`, keeps provenance on the candidate record, and writes a
`merge` audit entry. Undo returns the candidate to `pending_review`, clears the canonical link, resets duplicate status,
and writes an `undo` audit entry. Neither action edits organizer-owned canonical content automatically.

## Publishing policy

No automated source may publish directly during the MVP.

Staff review should answer:

- Is the event in the supported geography?
- Is the date current and plausible?
- Is the venue identifiable?
- Is the listing duplicated?
- Is the source trustworthy?
- Is the image usable and attributable?
- Is the event appropriate for the ViZb audience?
- Is the ticket or RSVP CTA represented honestly?
- Does the listing need editorial cleanup?
- Is there any reason to suppress or escalate it?

Approval creates or links a canonical event. Rejection should store a reason and suppression behavior so the same candidate does not return indefinitely without meaningful source changes.

## Public CTA policy

A public event may have one of several CTA states.

### ViZb-native ticketed event

Show the native purchase or RSVP flow only when the event is owned and eligible.

### Verified organizer listing without native ticketing

Show the approved organizer-selected external or informational action, clearly labeled.

### Unclaimed third-party listing

Show a source-attributed information or external action only when product policy permits. Also support a `Claim this event` path.

Never imply that ViZb is the ticket seller for an external listing.

## Organizer claim workflow

1. Organizer opens `Claim this event`.
2. Organizer signs in or creates an account.
3. Organizer selects or requests an organization.
4. Organizer provides relationship evidence.
5. Staff reviews the claim.
6. If approved, the event is assigned to the verified organization.
7. The organizer may edit the canonical event according to permissions.
8. Native ticketing remains unavailable until payout and event requirements pass.
9. Conflicting claims enter a staff dispute state.
10. Source provenance remains attached after ownership conversion.

## Native organizer submission workflow

1. Organizer signs in.
2. Organizer selects an existing organization or requests one.
3. Organizer creates a draft.
4. Organizer supplies event details and media.
5. Organizer selects listing-only or requests native ticketing.
6. Duplicate checks run.
7. Staff reviews the event.
8. Staff approves, rejects, or requests changes.
9. Organizer sees status and next action.
10. Approved events publish; ticketed events require all commerce gates.

## Staff URL import workflow

1. Staff opens the URL import tool.
2. Staff pastes a public event URL.
3. Server validates the URL and fetches only supported public metadata.
4. The system extracts available title, description, image, date hints, venue hints, and canonical URL.
5. Staff reviews and corrects fields.
6. Duplicate checks run.
7. A pending candidate is created with URL provenance.
8. Normal moderation rules apply.

Unsupported or incomplete pages should fail clearly. The system should never silently publish weakly extracted information.

## Venue and calendar feed workflow

1. Staff registers a trusted source.
2. Staff records ownership, format, geography, cadence, and attribution.
3. The source is tested in a disabled or preview state.
4. A manual run verifies parsing and candidate quality.
5. Staff enables the source.
6. Scheduled runs update candidates.
7. Health status shows last success, last error, and freshness.
8. Staff can disable the source without code deployment when the format is already supported.

ICS should be the first general feed format. RSS and vendor-specific JSON may follow through separate adapters or parsers.

## Stale, moved, postponed, and cancelled events

Every source must map its signals into explicit behavior.

- **Cancelled:** keep audit history; hide or clearly mark according to public policy.
- **Postponed:** do not invent a new date; mark as postponed until the source provides one.
- **Moved venue:** create a reviewable change when a published canonical event has staff or organizer edits.
- **Changed time:** flag material changes for review.
- **Not seen recently:** mark stale after the configured threshold rather than deleting immediately.
- **Past event:** allow normal archive behavior; do not keep importing indefinitely.

## Scheduling

Each automated source should support:

- a feature flag,
- a manual staff trigger,
- a protected scheduled route,
- overlap protection,
- timeout handling,
- bounded pagination,
- import-run logging,
- clear success and failure summaries.

Start conservatively. A daily cadence may be sufficient for slower sources; faster public APIs may run every six hours once quality and rate limits are understood.

Do not increase frequency to compensate for poor normalization or stale-event policy.

## Observability

Track:

- readiness by source,
- import duration,
- records requested and returned,
- created, updated, skipped, and failed counts,
- duplicate rates,
- moderation outcomes,
- stale and cancelled counts,
- source error type,
- last successful run,
- consecutive failure count.

Operational logs should include safe source key, run ID, and counts. They should not include secrets or unnecessary personal data.

## Rollout sequence

### Preview

- Apply migrations.
- Configure source settings.
- Keep the source disabled.
- Run readiness checks.
- Run a manual import.
- Inspect candidates and duplicate behavior.
- Verify no candidate publishes automatically.
- Test source disable and safe failure behavior.

### Production shadow mode

- Add production configuration.
- Keep public publishing manual.
- Run a small bounded import.
- Review every candidate.
- Compare source counts and local relevance.
- Confirm source health and moderation workload.

### Production operating mode

- Enable scheduled runs only after shadow-mode acceptance.
- Monitor consecutive failures and duplicate rates.
- Keep human approval as the publication gate.
- Review source value periodically and disable low-quality feeds.

## Source shutdown

To disable a source safely:

1. Turn off its feature flag or registry enabled state.
2. Confirm scheduled routes skip it.
3. Preserve existing candidates and canonical provenance.
4. Decide whether stale public listings need review.
5. Record the reason and shutdown date.
6. Remove credentials only after confirming no other environment uses them.
7. Update operations and roadmap documentation.

## Testing expectations

Every adapter should cover:

- missing configuration,
- successful normalization,
- pagination,
- duplicate source IDs,
- malformed records,
- rate-limit or temporary failure behavior,
- source cancellation or changed dates when available,
- disabled-source behavior,
- no secret exposure.

Shared ingestion tests should cover:

- idempotent candidate upsert,
- review-state preservation,
- rejection suppression,
- canonical-link preservation,
- likely duplicate matching,
- merge audit history,
- staff authorization,
- scheduled route authorization,
- native ticketing blocked for unclaimed events.

## Staff smoke test

For each new source:

- [ ] Readiness reports configured and enabled state correctly.
- [ ] Manual import returns a run summary.
- [ ] Candidates show source attribution and source URL.
- [ ] A second run does not duplicate stable source records.
- [ ] Likely duplicates are flagged instead of silently merged.
- [ ] Approval creates or links a canonical event.
- [ ] Rejection prevents immediate reappearance.
- [ ] Public listing copy is accurate.
- [ ] CTA reflects actual ticket ownership.
- [ ] Claim flow is available where intended.
- [ ] Native ticketing remains blocked before organizer verification.
- [ ] Disabling the source stops future runs.

## Documentation rule

Every implementation pull request under #265 must update the relevant parts of:

- this architecture and operations guide,
- `docs/roadmaps/LOCAL_EVENT_INGESTION_ROADMAP.md`,
- `.env.example` when configuration changes,
- `docs/OPERATIONS.md` when runtime operations change,
- database migration documentation when schema changes,
- smoke-test and troubleshooting documents when behavior changes.

Documentation is part of the acceptance criteria, not a cleanup task after launch.
