# Frontend Documentation Consolidation - 2026-06-28

**Purpose:** Record the current ViZb frontend documentation spine, the drift corrected in this pass, and the docs that should be treated as historical evidence instead of living instructions.

---

## Current Truth

| Area | Current source |
| --- | --- |
| Documentation front door | [README.md](README.md) |
| System design | [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) |
| Short architecture orientation | [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) |
| File ownership and module boundaries | [ARCHITECTURE_SOURCE_OF_TRUTH.md](ARCHITECTURE_SOURCE_OF_TRUTH.md), [REPO_MAP.md](REPO_MAP.md) |
| Local setup and engineering commands | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md), [development/ENGINEERING_COMMANDS.md](development/ENGINEERING_COMMANDS.md) |
| Coding standards | [CODING_STANDARDS.md](CODING_STANDARDS.md) |
| Release and branching | [development/BRANCHING.md](development/BRANCHING.md), [development/RELEASING.md](development/RELEASING.md) |
| Database/migrations | [database/MIGRATIONS.md](database/MIGRATIONS.md), [OPERATIONS.md](OPERATIONS.md) |
| Current follow-ups | [plans/NEXT_ROADMAP.md](plans/NEXT_ROADMAP.md) |

---

## Consolidation Decisions

| Drift found | Decision |
| --- | --- |
| Homepage ownership still pointed at the pre-redesign hero/Three.js stack | Updated the source-of-truth map to the live `components/home/*` redesign stack mounted by `app/page.tsx`. |
| System design said there were no cron jobs | Replaced that with the current scheduled/background route list: event reminders, Eventbrite import, Ticketmaster import, payout release, and trusted admin import triggers. |
| Server Action ownership list was missing newer domains | Added follows, member preferences, imports, recaps, organizer Stripe Connect, admin payments, and Sentry diagnostics to the module map. |
| Route/API lists omitted newer checkout, import, cron, payout, and diagnostics endpoints | Updated the living repo map and system design API inventory. |
| Several root/status/roadmap docs still preserve older MVP language | Keep them as historical or status snapshots unless they are linked from the docs front door as current source-of-truth. |
| v0 references remain in root README | Keep as optional provenance only; in-repo code, migrations, and docs are the source of truth. |
| Coding standards and onboarding still showed the old hero/Three.js homepage stack | Updated coding standards to the live `components/home/*` pattern and marked onboarding examples as historical where appropriate. |
| Redesign handoff still mapped `/` to the June 2 homepage composition | Added a current-state note and replaced the route map with the live homepage section files. |
| MVP roadmap contains dated entries for retired component names | Kept them as evidence but added a current-source banner pointing to the docs spine and architecture map. |
| Impression packs and old visual audits still named retired homepage files | Marked them as historical work orders/audits and remapped reusable homepage work to `components/home/*`. |
| Underwater visual system treated homepage WebGL as active budget | Reframed WebGL as optional/future enhancement; CSS-first atmosphere is current default. |

---

## Still Current And Useful

- [README.md](README.md)
- [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md)
- [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md)
- [ARCHITECTURE_SOURCE_OF_TRUTH.md](ARCHITECTURE_SOURCE_OF_TRUTH.md)
- [REPO_MAP.md](REPO_MAP.md)
- [OPERATIONS.md](OPERATIONS.md)
- [MIGRATION_MAP.md](MIGRATION_MAP.md)
- [contracts/INDEX.md](contracts/INDEX.md)
- [journeys/INDEX.md](journeys/INDEX.md)
- [imports/LOCAL_EVENT_INGESTION.md](imports/LOCAL_EVENT_INGESTION.md)
- [imports/eventbrite.md](imports/eventbrite.md)
- [imports/ticketmaster.md](imports/ticketmaster.md)
- [vizb-payments-pricing-and-payouts.md](vizb-payments-pricing-and-payouts.md)

---

## Historical Or Evidence Only

- Dated roadmap/execution files under [archive/](archive/).
- Older work orders under [work-orders/](work-orders/) unless a current roadmap links one explicitly.
- Screenshot docs and old redesign notes that describe the previous homepage composition before `components/home/home-redesign-hero.tsx`.
- [IMPRESSION_PACKS.md](IMPRESSION_PACKS.md), [design/LAUNCH_VISUAL_POLISH_AUDIT.md](design/LAUNCH_VISUAL_POLISH_AUDIT.md), and [work-orders/](work-orders/) are implementation history unless a current plan reactivates them.
- [DEVELOPER_ONBOARDING.md](DEVELOPER_ONBOARDING.md) and [MVP_STATUS_ROADMAP.md](MVP_STATUS_ROADMAP.md) are historical/status references where they conflict with the docs spine.
- Root status files such as `PRODUCT_STATUS_REPORT.md`, `PAST_PROGRESS_HISTORY.md`, and `BRAND_STATUS.md` when they conflict with the docs spine or code.

Historical docs should not be deleted casually because they preserve decision and launch evidence. When they conflict with current code, trust code and migrations first, then this docs spine.

---

## Backend Coordination

This repo is the ViZb Next.js/Supabase monolith. It is separate from `mosaic-backend`, the Mosaic Biz Hub Express/MongoDB service. Keep cross-project assumptions explicit:

- ViZb does not call Mosaic backend routes as part of the events/ticketing app.
- Mosaic backend docs live in the sibling repo at `docs/README.md` and `docs/DOCUMENTATION_CONSOLIDATION_2026_06_28.md`.
- Do not copy backend route contracts into ViZb docs unless a real integration is added.

---

## Maintenance Rule

When a feature changes a route, action, table, cron, or integration:

1. Update the code and migration/source first.
2. Update the domain contract or operations doc.
3. Update [ARCHITECTURE_SOURCE_OF_TRUTH.md](ARCHITECTURE_SOURCE_OF_TRUTH.md) or [REPO_MAP.md](REPO_MAP.md) if ownership changed.
4. Update this consolidation file only when the docs hierarchy or historical/current classification changes.
