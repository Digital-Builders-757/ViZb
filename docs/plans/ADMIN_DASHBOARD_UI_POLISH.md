# Admin Dashboard UI Polish (P0/P1)

Last updated: 2026-04-05

Scope: **Admin surfaces** only (`/admin`, `/admin/posts`, `/admin/events/[id]`).

Goal: Make admin feel more **operational** (fast scanning + fast actions), reduce scroll fatigue, and improve clarity on what’s happening.

## Source (Browser Relay snapshots)

- `/admin` (Platform Overview)
- `/admin/posts`

## P0 (blockers)

None observed in current screenshots.

## P1 (high-ROI improvements)

### 1) Section rhythm + hierarchy on `/admin`

**Problem:** The admin overview reads like a long, visually flat scroll. Modules blend together.

**Fix:**
- Introduce a consistent module wrapper with:
  - section header (kicker + title + short description)
  - optional right-side action row
  - clearer vertical spacing boundaries between modules

**Acceptance:**
- A user can visually scan the page and distinguish:
  - Content (Posts)
  - Directory (Users)
  - Review queues (Host applications, Event submissions)
  - Management (All events)
  - Manual tools (Create organization)

### 2) “Stats row” should drive action

**Problem:** Stats are informative but not actionable.

**Fix:**
- Make each stat card a link (or button) to the relevant section/route.

**Acceptance:**
- Clicking Users jumps to Users.
- Clicking Events jumps to review queue / management section.

### 3) Utility bars should persist inside long modules

**Problem:** In long lists (Users, Events) the user loses search/filter controls.

**Fix:**
- Add sticky subheaders inside these modules when scrolling within them.

**Acceptance:**
- Search/filter remains visible while scrolling the table/list.

### 4) Admin Posts: improve empty + list utility

**Fix:**
- Add status counts near filter pills.
- Add a one-line note defining “published” semantics.
- On small screens: reduce action clutter via progressive disclosure.

### 5) Admin Event ops (`/admin/events/[id]`)

**Fix:**
- Add filter pills + search (already implemented in code) + add clearer timestamps.
- Add “Copy checked-in list” and keep it visible.

## Implementation plan (in order)

1) Add shared admin module wrapper component (minimal diff).
2) Apply wrapper + section headers to `/admin`.
3) Make stat cards actionable.
4) Tighten `/admin/posts` utilities.
5) Polish `/admin/events/[id]` operations layout.

## Notes

- Keep ViBE brand: dark mode, sharp edges, bold serif headings + mono microcopy.
- Avoid introducing new UI libraries.
