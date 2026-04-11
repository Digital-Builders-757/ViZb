# Core transaction sequence — ViBE

**Last updated:** March 23, 2026

**Product lifecycle** for ViBE (events platform), analogous to “gig → application → booking” elsewhere. Use for end-to-end planning, acceptance framing, and journey docs.

This is **not** a substitute for **`docs/VIBE_APP_SPECIFICATION.md`** or **`scripts/*.sql`**.

---

## Sequence A — Attendee: discover → attend

| Stage | Actor | What happens | Zones |
|-------|--------|----------------|-------|
| 1. Discover | Attendee | Browse **Manifest** (`/events`), filters *(as built)* | Terminal + Locks (read policies) |
| 2. Detail | Attendee | Open event page; see flyer, time, ticket types *(as built)* | Manifest |
| 3. Commit | Attendee | Free RSVP or paid checkout *(paid = roadmap)* | Staff (actions) + Ticketing (future) |
| 4. Proof | Attendee | Ticket in **`/tickets`**, show at door *(check-in roadmap)* | Terminal + Staff |

**Failure modes to design for:** sold out, auth required, RLS denial, payment canceled webhook *(later)*.

---

## Sequence B — Organizer: propose → publish

| Stage | Actor | What happens | Zones |
|-------|--------|----------------|-------|
| 1. Org | Organizer | Create org or join via invite; admin may approve | Staff + Control Tower |
| 2. Draft event | Organizer | Create event, upload flyer (**Baggage**), set ticket types | Staff + Baggage + Locks |
| 3. Submit | Organizer | Submit for review *(status lifecycle per spec)* | Staff |
| 4. Review | Admin | Approve/reject in **Control Tower** | Control Tower + Locks |
| 5. Publish | System | Event visible on **Manifest** | Locks + Manifest reads |

---

## Sequence C — Platform trust (cross-cutting)

- **Subscribers / waitlist:** marketing capture; insert-only public path where designed; admin read per RLS.
- **Invites:** claim flow ties org membership to user — see **`/invite/claim`** and invite actions.

When `/plan` spans multiple sequences, list which sequence (A/B/C) applies and which steps are in scope.
