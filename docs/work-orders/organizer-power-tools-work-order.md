# Work Order, ViZb Organizer Power Tools

**Status:** Shipped May 5, 2026 (Roadmap Runner Item 5). Highlights: **`duplicateOrganizerEventDraft`** (dates + tiers, no flyer), **`OrganizerEventPowerToolsCard`** (views · active RSVPs · check-ins), **`POST /api/events/[slug]/view`** + **`public_detail_view_count`** (migration **`20260505195500_event_public_detail_views.sql`**), create-form speed tip.

Related roadmap: `docs/plans/VIZB_PRODUCT_ROADMAP.md`.
Execution companion: `docs/ROADMAP_RUNNER.md`.

## Goal
Make event creation and maintenance faster for organizers.

This is the creator-efficiency layer. Once discovery, saving, and attendance are solid, ViZb should make it easier to build and maintain events than the generic platforms.

## Product decision
Improve the existing organizer flow instead of creating a separate organizer product.

Focus on:
- recurring events
- flyer import or link import
- draft templates
- bulk publish / schedule
- lightweight analytics for views, RSVPs, and attendance

## What to build

### Creation speed
- Add reusable templates or defaults if the current form flow supports them.
- Make recurring event setup simple.
- Reduce repeated input where possible.

### Import and publish help
- Support flyer or link import if it can be done cleanly.
- Make it faster to create an event from an existing flyer or source link.
- Support bulk publish or scheduled publishing only if it fits the current system.

### Lightweight analytics
- Show basic metrics organizers actually use:
  - views
  - RSVPs
  - attendance
- Keep the analytics surface simple and readable.

## Implementation guidance
- Inspect current organizer create/edit surfaces and any event metrics already in the app.
- Reuse current forms, uploads, and admin patterns.
- Prefer minimal diff and existing primitives.
- Do not break official or local/community event creation.
- If schema or storage changes are needed, update them safely and document them.

## Acceptance criteria
- Organizers can create events faster.
- Recurring and reusable event flows are easier.
- Basic metrics are visible.
- The UI stays clean and mobile-friendly.
- Build passes.

## Suggested implementation order
1. Inspect current organizer creation and edit forms.
2. Add the smallest useful reuse or template improvement.
3. Improve recurrence or import flow if it is cleanly supported.
4. Add lightweight metrics.
5. Verify and document.

## Notes
- This should save organizer time, not add admin burden.
- The win is less retyping and better repeatability.
