# ViZb Local Event Ingestion Roadmap

**Status:** Active planning  
**Started:** June 22, 2026  
**Epic:** #265  
**Documentation owner issue:** #275

## Why this roadmap exists

ViZb needs a reliable way to discover local events without depending on one organizer-owned Eventbrite account. The product goal is broader than an importer: ViZb should become a curated local event intelligence layer that can collect event candidates from multiple supported sources, preserve provenance, remove duplicates, support human review, and eventually help verified organizers move into ViZb-native ticketing.

The existing Eventbrite organization importer is implemented but parked under #259. It stays disabled and available for a future partner migration or optional sync use case. It is not the foundation of public local discovery.

## Product boundaries

The following states must remain separate:

1. **Discovered candidate** — raw or normalized information received from a source.
2. **Reviewed listing** — a candidate approved by staff for public discovery.
3. **Claimed event** — an event connected to a verified organizer with management rights.
4. **ViZb-native ticketed event** — a claimed or directly created event whose organizer completed the required commerce and payout setup.

A public listing does not automatically grant ViZb the right to sell tickets. Native ticket inventory must never be created for an unclaimed third-party event.

## Architecture principle

Build the ingestion layer like a power strip, not an extension cord welded to one vendor.

Each source adapter should only know how to:

- authenticate when required,
- fetch source records,
- paginate and retry safely,
- normalize records into the shared candidate contract,
- report import health and counts.

The shared platform owns:

- candidate storage,
- provenance,
- deduplication,
- staff review,
- canonical event publishing,
- organizer ownership,
- native ticketing eligibility,
- analytics and operations.

## Workstream

### Phase 1 — Foundation

#### #266 — Ingestion foundation ✅ (June 2026)

Build the source-adapter contract, normalized candidate model, provenance fields, source flags, and import-run logging.

**Exit gate:** A second source can be added without copying the Eventbrite implementation or changing the public event domain. **Met** — register adapters in `lib/imports/adapters/registry.ts`; Ticketmaster (#267) can plug in without touching Eventbrite code paths.

#### #268 — Hampton Roads geography and schedules ✅ (June 2026)

Centralize launch-market coverage for:

- Norfolk
- Virginia Beach
- Chesapeake
- Portsmouth
- Hampton
- Newport News
- Suffolk
- Williamsburg

Define date windows, cadence, stale-event handling, source controls, and environment rollout policy.

**Exit gate:** Operators can explain exactly what geographic inventory each enabled source is expected to return. **Met** — `describeActiveSourceCoverage()` in `lib/imports/geography/coverage.ts` and env vars documented in `.env.example`.

#### #275 — Documentation and roadmap

Maintain the architecture, operations, moderation, ownership, commerce, troubleshooting, and rollout documentation.

**Exit gate:** A new engineer and a staff operator can understand the system without reconstructing decisions from issue history.

### Phase 2 — First public discovery source

#### #267 — Ticketmaster Discovery adapter ✅ (June 2026)

Implement the first supported public discovery source and send its results into the shared candidate queue.

**Exit gate:** A configured import can produce idempotent, attributed, pending candidates for the launch geography. **Met** — adapter registered; manual + cron routes wired; writes to `event_candidates` only. Production remains disabled until shadow import approval.

#### #269 — Cross-source deduplication

Detect exact and likely duplicates across public sources, organizer submissions, native ViZb events, and staff imports.

**Exit gate:** Staff can compare and safely merge likely duplicates without losing provenance or overwriting a native canonical event.

#### #270 — Unified review queue ✅ (partial — June 2026)

Turn `/admin/events/imports` into a source-agnostic moderation workspace.

**Shipped:** Candidate queue + detail, source filters, audit trail, manual import controls, import history, source health, publish-to-community-`events` for approved candidates. **Remaining:** staff edit form, automated dedup merge (#269), deprecate legacy `events` import queue when drained.

**Exit gate:** Staff can filter, inspect, edit, approve, reject, merge, and audit candidates from more than one source. **Partially met** — filter, inspect, reject, suppress, link, publish, and audit are live; full edit/merge workflows follow #269/#270 polish.

### Phase 3 — Grow local supply

#### #271 — Native organizer submission

Allow organizers to submit events directly into ViZb and choose listing-only or native ticketing when eligible.

**Exit gate:** Staff no longer need to retype complete organizer-submitted events.

#### #272 — Staff URL import

Allow staff to paste a public event URL and create a reviewable candidate from permitted metadata.

**Exit gate:** One-off local events can enter the review queue with provenance and duplicate checking.

#### #273 — Venue and calendar feed registry

Support trusted recurring local sources, starting with ICS feeds, through a staff-managed registry.

**Exit gate:** Supported feeds can be enabled, disabled, inspected, and monitored without creating one-off code for every venue.

### Phase 4 — Convert discovery into native commerce

#### #274 — Organizer claim and native ticket conversion

Create the verified path from third-party listing to organizer-owned ViZb event management and ticketing.

**Exit gate:** A verified organizer can claim an approved listing, staff can resolve disputes, and ticket inventory remains blocked until all ownership and payout gates pass.

## Recommended delivery order

1. #266
2. #268
3. #267
4. #269
5. #270
6. #271 and #272 in parallel
7. #273
8. #274
9. #275 continuously across every implementation pull request

## Launch gates

The public-source MVP is not ready until all of the following are true:

- [ ] At least one supported source produces candidates for the launch market.
- [ ] Imports are idempotent.
- [ ] No source adapter can auto-publish.
- [ ] Staff can see source, source URL, first seen, last seen, last imported, freshness, and import-run history.
- [ ] Exact and likely duplicate states are visible.
- [ ] Rejected candidates follow a documented suppression policy.
- [ ] Cancelled, postponed, moved, and stale events follow explicit rules.
- [ ] A source outage does not break the public events experience.
- [ ] Source credentials remain server-only.
- [ ] Operators can enable, verify, disable, and roll back a source.
- [ ] Moderators have a written review playbook.
- [ ] Unclaimed imported events cannot create ViZb ticket types or checkout sessions.
- [ ] Source attribution remains visible after publishing or organizer claim.

## Metrics for the first operating period

Track at minimum:

- candidates found per source,
- candidates created and updated,
- exact and likely duplicate rate,
- approval and rejection rate,
- time from first seen to moderation,
- stale and cancelled event rate,
- source error rate,
- percentage of published listings later claimed by an organizer,
- percentage of claimed events converted to native ticketing,
- staff corrections required per source.

Do not optimize for raw event count alone. A smaller, accurate, current catalog is more valuable than a large feed filled with duplicates and expired listings.

## Parked Eventbrite policy

The Eventbrite organization importer remains in the repository with `EVENTBRITE_IMPORT_ENABLED=false`.

It may be reconsidered when:

- a partner organizer asks to migrate or sync its owned catalog,
- the attendee handoff policy is approved,
- source attribution and claim behavior are compatible with the shared ingestion model,
- product leadership decides whether imported Eventbrite events remain external listings or become organizer-managed ViZb events.

Until then:

- do not add production Eventbrite credentials,
- do not enable its cron,
- do not present it as public geographic discovery,
- do not make it the default organizer onboarding path.

## Explicit non-goals

- Recreating Eventbrite search through unsupported methods
- Automatically publishing third-party content
- Selling tickets for events ViZb does not manage
- Building every source adapter in the first release
- Adding recommendations before catalog quality is stable
- Hiding source attribution
- Treating duplicate detection as an irreversible automated merge

## Definition of complete

This roadmap is complete when ViZb has a maintainable multi-source ingestion foundation, one proven public source, a strong human review workflow, direct organizer supply, safe ownership conversion, and documented operations that can support expansion beyond Hampton Roads.