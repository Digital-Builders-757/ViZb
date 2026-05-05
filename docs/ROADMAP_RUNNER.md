# ROADMAP_RUNNER — ViZb ship order

Purpose: this is the Cursor-ready execution queue that mirrors `docs/plans/VIZB_PRODUCT_ROADMAP.md`.

Rules
- Work top to bottom, one item at a time.
- Preserve the official vs local/community distinction.
- Prefer minimal diffs and existing primitives.
- Do not create a second event system unless the schema truly requires it.
- After each item, update the docs, verify, and stop in a shippable state.

---

## Item 1 — Local / community events lane
**Status:** DONE (May 5, 2026) — Verified: migration `20260505163945_add_event_kind_and_external_rsvp.sql`; `npm run typecheck` / `test` / `lint` / `build` green.

Use `docs/work-orders/local-events-work-order.md`.

Done means
- Admin can create local/community events under the platform events area.
- Public listings clearly label them as not official ViZb events.
- RSVP links open in a new tab.
- Official ViZb event behavior is unchanged.

---

## Item 2 — Discovery that feels local
**Status:** DONE (May 5, 2026) — `/events`: discovery presets, search, sort, curated rails; see `lib/events/discovery-filters.ts`.

Done means
- Search, filters, and featured rails help users find the right event fast.
- The feed feels curated, local, and useful.

---

## Item 3 — Save, share, and return
**Status:** DONE (May 5, 2026) — My Vibes + share/copy on `/events/[slug]`; calendar (Google + .ics) on detail; RSVP / paid success dialog next steps; dashboard quick action to My Vibes. Verified: `npm run typecheck`, `lint`, `build`.

Done means
- Saved events / My Vibes works cleanly.
- Users can add events to calendar, share them, and get a clear return path.

---

## Item 4 — Attendance and door flow
**Status:** DONE (May 5, 2026) — Guest: event + wallet + success dialog door copy; RSVP cap / “spots left” messaging; checked-in vs confirmed UI. Organizer: published-event door strip; attendees RSVP limit bar; status badges; manual check-in `router.refresh`; scanner clears manual code; revalidate check-in route. Verified: `npm run typecheck`, `lint`, `build`.

Done means
- RSVP-backed attendance is easy to manage.
- Ticket and check-in flows are clear for guests and organizers.

---

## Item 5 — Organizer power tools
**Status:** DONE (May 5, 2026) — Duplicate draft (+ schedule shift), organizer/admin snapshot (views · RSVPs · check-ins), public view beacon + RPC; migration `20260505195500_event_public_detail_views.sql`. Verified: `npm run typecheck`, `lint`, `build`.

Done means
- Recurring events, templates, flyer import, and publish tools reduce admin friction.

---

## Item 6 — Trust and community signals
**Status:** DONE (May 5, 2026) — Staff editorial highlight (`events.is_staff_pick` → **Staff pick** badge + **ViZb picks** rail on `/events`); signed-in **Report listing** on `/events/[slug]` with `event_listing_reports` + staff review at `/admin/event-listing-reports`. Migration `20260505184652_event_staff_pick_and_listing_reports.sql`. Verified: `npm run typecheck`, `lint`, `build`.

Done means
- Users can trust the listings and spot curated or verified content quickly.

---

## Item 7 — Growth and monetization
**Status:** DONE (May 5, 2026) — Inquiry-only revenue path: organizer upsells + expanded `/advertise` labeling; new interest type `organizer_promotion`; email attribution via `lib/partnerships/advertise-context.ts`; `docs/contracts/sponsors.md`. Verified: `npm run typecheck`, `lint`, `build`.

Done means
- Revenue paths exist, but they stay tasteful and do not pollute the experience.
