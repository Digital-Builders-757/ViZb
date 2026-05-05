# Work Order, ViZb Attendance and Door Flow

**Status:** Shipped May 5, 2026 (Roadmap Runner Item 4). No new migrations; reuses `event_registrations`, ticket QR (`/api/checkin/scan`), organizer check-in pages.

Related roadmap: `docs/plans/VIZB_PRODUCT_ROADMAP.md`.
Execution companion: `docs/ROADMAP_RUNNER.md`.

## Goal
Make RSVP-backed attendance easy to manage for both guests and organizers.

This is the attendance layer after discovery and retention. Once someone RSVPs, ViZb should help them get in the door cleanly.

## Product decision
Build attendance on top of the current RSVP and event model.

Focus on:
- ticket / wallet experience for RSVP-backed events
- QR or code-based check-in
- capacity and attendance states
- clear post-RSVP confirmation
- fast organizer/staff check-in flow

## What to build

### Guest / member experience
- Give RSVP-backed events a clear ticket or wallet-style confirmation path.
- Make the next step obvious after RSVP.
- Show attendance state clearly, such as confirmed, checked in, or cancelled.

### Organizer / staff experience
- Add a fast check-in flow for organizers or staff.
- Support QR or code-based check-in if that fits the current architecture.
- Surface simple attendee states and capacity signals.

### Capacity and confirmations
- Respect RSVP or ticket capacity where the system already supports it.
- Make confirmation and capacity messaging clear.
- Keep the user experience clean when an event is full or nearly full.

## Implementation guidance
- Inspect current RSVP, ticket, and event detail flows.
- Reuse existing attendance / registration data and labels where possible.
- Prefer minimal diff and existing primitives.
- Do not break RSVP or ticket flows that already work.
- If schema, QR signing, or RLS changes are needed, update them safely and document them.

## Acceptance criteria
- Users can RSVP and get a clear attendance confirmation.
- Organizers/staff can check guests in quickly.
- Capacity behavior is visible and respected.
- The flow works on mobile.
- Build passes.

## Suggested implementation order
1. Inspect the current RSVP, ticket, and organizer check-in surfaces.
2. Add the smallest useful guest confirmation improvement.
3. Add or refine the organizer door flow.
4. Tighten capacity and empty states.
5. Verify and document.

## Notes
- This should feel fast at the door.
- Keep it obvious, low-friction, and reliable.
