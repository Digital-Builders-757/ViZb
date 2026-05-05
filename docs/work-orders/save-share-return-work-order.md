# Work Order, ViZb Save, Share, and Return

**Status:** Shipped May 5, 2026 (Roadmap Runner Item 3). Surfaces: `EventShareRow`, `EventCalendarActions` on public event detail, expanded `TicketAddedSuccessDialog`, `MemberHomeQuickActions` → My Vibes.

Related roadmap: `docs/plans/VIZB_PRODUCT_ROADMAP.md`.
Execution companion: `docs/ROADMAP_RUNNER.md`.

## Goal
Make it easy for users to save events, share them, and come back later.

This is the retention layer after discovery. Once people find something they like, ViZb should help them remember it, send it to friends, and return to it later.

## Product decision
Build on the existing events flow instead of creating a separate saved-items product.

Focus on:
- saved events / My Vibes
- add to calendar
- RSVP confirmation with next-step actions
- reminders or nudges
- share links for friends and group planning

## What to build

### Save and revisit
- Add a simple save action for events.
- Use the existing naming / brand language if there is already a preferred label.
- Surface saved events in a place users can find again quickly.

### Share
- Make it easy to copy or share an event link.
- Keep the share action obvious but not noisy.
- If social share buttons exist already, reuse them.

### Return
- Improve RSVP confirmation so it points users to the next best action.
- Add calendar actions where they fit naturally.
- Add reminder or return messaging if the app already has a notification path.

### Feed and dashboard integration
- Show saved events in the dashboard or a small summary surface if that exists.
- Keep the public events flow and organizer flow untouched unless needed for the feature.

## Implementation guidance
- Inspect existing event detail, timeline cards, and dashboard modules.
- Reuse current event data, labels, and card components.
- Prefer minimal diff and existing primitives.
- Do not introduce a second concept of saved content unless necessary.
- If storage or RLS is needed, update the schema and docs safely.

## Acceptance criteria
- Users can save events and find them again.
- Users can share events easily.
- RSVP confirmation gives a clear next action.
- Calendar / reminder paths are smooth where implemented.
- The experience works on mobile.
- Build passes.

## Suggested implementation order
1. Inspect existing event detail and dashboard surfaces.
2. Add the smallest useful save action.
3. Add share and return actions.
4. Tighten confirmation / empty states.
5. Verify and document.

## Notes
- This should feel like a useful habit loop, not a cluttered social network.
- Keep the UI calm and obvious.
