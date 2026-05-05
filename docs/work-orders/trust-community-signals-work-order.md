# Work Order, ViZb Trust and Community Signals

Related roadmap: `docs/plans/VIZB_PRODUCT_ROADMAP.md`.
Execution companion: `docs/ROADMAP_RUNNER.md`.

## Goal
Make ViZb feel safer, more curated, and more human.

This is the trust layer. After discovery and organizer tools, ViZb should help users know which listings are reliable, featured, or community-picked.

## Product decision
Add trust signals inside the existing events experience instead of building a separate reputation product.

Focus on:
- verified organizer badges
- staff picks / featured community picks
- report spam or bad listings
- post-event recap or photo surfaces
- attendance / popularity signals where appropriate

## What to build

### Verification and labels
- Add clear badges or labels for trusted organizers or featured events if the current data supports it.
- Make the meaning of each badge obvious.
- Do not overload the UI with too many status chips.

### Curated picks
- Surface staff picks or featured community picks in discovery or event detail where it helps.
- Make featured content feel editorial, not spammy.

### Reporting and moderation
- Add a way to report bad or spammy listings if the moderation flow already exists or can be added cleanly.
- Keep the reporting path simple and unobtrusive.

### Social proof
- Surface attendance or popularity signals only where they add trust.
- Keep recaps, photos, and community proof light and useful.

## Implementation guidance
- Inspect current event detail, admin, and discovery surfaces.
- Reuse existing badges, labels, and moderation patterns where possible.
- Prefer minimal diff and existing primitives.
- Do not create a noisy trust dashboard unless it is necessary.
- If schema or moderation state changes are needed, update them safely and document them.

## Acceptance criteria
- Users can tell which events or organizers are trusted or featured.
- Reporting exists for bad listings if implemented.
- The platform feels curated instead of scraped.
- The UI stays calm and readable.
- Build passes.

## Suggested implementation order
1. Inspect existing badges, moderation, and featured-event surfaces.
2. Add the smallest useful trust signal.
3. Add featured/curated placement if appropriate.
4. Add moderation/reporting affordance if needed.
5. Verify and document.

## Notes
- Trust should be obvious without becoming noisy.
- The goal is confidence, not clutter.

## Ship log
- **2026-05-05:** Shipped **`events.is_staff_pick`** (public **Staff pick** label + curated **ViZb picks** discovery rail), **`event_listing_reports`** with RLS (authenticated insert against **published** events; **staff_admin** select), unobtrusive report dialog on public event detail, and minimal staff queue **`/admin/event-listing-reports`**. Migration: **`supabase/migrations/20260505184652_event_staff_pick_and_listing_reports.sql`**.
