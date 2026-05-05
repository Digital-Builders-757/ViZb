# Work Order, ViZb Event Discovery That Feels Local

Related roadmap: `docs/plans/VIZB_PRODUCT_ROADMAP.md`.
Execution companion: `docs/ROADMAP_RUNNER.md`.

## Goal
Make ViZb feel like the best place to discover what is happening nearby, not just a list of events.

This is the next step after the Local / Community events lane. The goal is to help users find the right event quickly, with a feed that feels curated, local, and useful.

## Product decision
Keep the existing events system, but improve how users browse it.

Focus on:
- filters
- search/sort
- featured rails
- better empty states
- local area context
- simple discovery hierarchy

## What to build

### Public discovery surfaces
- Improve `/events` so it feels local and easy to scan.
- Add filters such as:
  - Tonight
  - This weekend
  - Free
  - Family-friendly
  - After hours
  - Open mic
- Add sort options if the current UI supports them cleanly.
- Surface featured or curated local/community events where they fit.
- Make the distinction between official ViZb events and local/community events easy to understand at a glance.

### Search and browse
- Improve event search if there is an existing input or query flow.
- Make it easy to narrow by time, vibe, and category.
- Keep the filter UI lightweight and mobile-friendly.

### Area context
- Add simple location / area context where useful.
- If a map is too heavy for the first pass, use a lighter area/venue summary.
- Keep the UI useful, not cluttered.

### Empty states and fallback states
- Improve no-results states so users know what to try next.
- Add helpful copy and a clear next action.
- If there are no local/community events, show official events or featured picks instead of a dead end.

## Implementation guidance
- Inspect the current `/events` page, timeline cards, filter components, and any related query helpers.
- Reuse existing event cards and labels.
- Prefer minimal diff and existing design tokens.
- Do not break the current event feed or official/local labels.
- If a small data/query adjustment is needed, keep it backwards compatible.
- Update any docs or journey files that describe public discovery if the UX changes materially.

## Acceptance criteria
- Users can quickly filter and scan events by vibe/time/category.
- The feed feels local and curated.
- Official vs local/community events remain obvious.
- The page works well on mobile.
- Existing event behavior still works.
- Build passes.

## Suggested implementation order
1. Inspect current discovery UI and helpers.
2. Add the smallest useful filter improvement.
3. Improve featured/curated surface.
4. Tighten empty states.
5. Verify and document.

## Notes
- This should feel like a local guide, not a giant marketplace.
- The win is clarity and speed, not more stuff on screen.

---

## Implementation (ViZb codebase)

Shipped **`/events`** UX (May 2026): query params **`discover`**, **`q`**, **`sort`** (+ existing **`category`**, **`vibes`**); presets and search implemented in **`app/events/page.tsx`** with **`lib/events/discovery-filters.ts`**. See **`docs/journeys/guest_discovers_event.md`**.
