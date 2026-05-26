# Work Order, ViZb Local/Community Events

Related roadmap: `docs/plans/VIZB_PRODUCT_ROADMAP.md`.
Execution companion: `docs/ROADMAP_RUNNER.md`.

## Goal
Add support for **local/community events** inside the existing ViZb events system so Elaine can post events she finds around the area.

These are **not official ViZb-hosted events**, but they should appear in the same overall events experience with a clear visual distinction.

## Product decision
Use **one shared events system** with a type discriminator, not a separate parallel system.

Suggested types:
- `official` or `vizb` for ViZb-hosted events
- `local` or `community` for outside/community events

## What to build

### Admin
- Keep the existing **Platform events (ViZb)** admin section.
- Add a second entry under that area for **Local / Community events**.
- The admin flow should let Elaine create, edit, publish, and archive local/community events.
- Event form should support:
  - title
  - flyer/image
  - description
  - date/time
  - area/location
  - RSVP link
  - type flag (`official` vs `local/community`)

### Public UI
- Show local/community events in the public events area, but clearly labeled so users know they are not official ViZb events.
- Use a clean badge/label like:
  - `ViZb Event`
  - `Local Event`
  - `Community Event`
- RSVP should open the external link in a new tab.
- Keep the current look and feel, with minimal visual noise.

## Implementation guidance
- Inspect the current events data model, admin pages, forms, and public listing/detail pages.
- Prefer a minimal diff using the existing design system.
- Do not break current official ViZb event behavior.
- If schema changes are needed, update:
  - types
  - validation
  - queries
  - admin UI
  - public rendering
- Reuse existing flyer/image handling if it already exists.
- Reuse existing publish/archive patterns if possible.

## Acceptance criteria
- Admin can create a local/community event.
- Public users can clearly tell local/community events apart from official ViZb events.
- RSVP opens externally in a new tab.
- Existing official ViZb event flow still works exactly as before.
- Build passes.

## Notes
- The goal is not a second events product.
- The goal is a cleaner, better-labeled version of the same events system.
- If there is already an admin dashboard card for Platform events, add the local/community card right under it.

## Current status
- Baseline local/community event support has shipped through `events.event_kind = 'community'`, external RSVP support, admin creation, and public labels.
- **Flyers:** Community listings may use `events.flyer_url` like official events. Flyer is **optional for submission/review** (review requires `external_rsvp_url` only) but **recommended for feed/discovery visibility**.
- **Admin create:** `/admin/events/new/community` supports optional inline flyer upload during draft creation (`createEvent` → `uploadEventFlyer`).
- **Admin detail:** `/admin/events/[id]` remains the fallback for upload, replace, and remove via `FlyerUploadForm` (including recovery after a failed create-time upload).
- Full flyer-upload execution doc: `docs/work-orders/community-event-flyer-upload-work-order.md`
