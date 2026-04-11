# Events source of truth — ViBE (Layer 1)

**Last updated:** April 11, 2026

Canonical **event lifecycle**, **ownership**, and **truth boundaries** for the product. Schema detail: **`docs/VIBE_APP_SPECIFICATION.md`** + **`scripts/*.sql`**. Domain contract: **`docs/contracts/events.md`**.

---

## 1. Core concepts

| Concept | Meaning |
|---------|---------|
| **Event** | A time-bounded occurrence with metadata, media (flyer), visibility, and lifecycle status. |
| **Publish / Manifest** | Public discovery (`/events`, `/events/[slug]`) only shows what **RLS + status rules** allow. |
| **Organizer** | Acts through **org membership**; creates and edits events for that org. |
| **Review** | Admin **Control Tower** approves or rejects submissions before broad visibility where required by policy. |

---

## 2. Lifecycle (conceptual)

1. **Draft** — organizer authoring.  
2. **Submitted** — pending admin review *(when enabled by schema)*.  
3. **Published / live** — discoverable per rules.  
4. **Ended / archived** — read-only or hidden per policy.

_Exact enum values and transitions: keep aligned with DB and **`docs/contracts/events.md`**._

---

## 3. RSVP / tickets / check-in (truth)

- **RSVP** is stored on **`event_registrations`**; **wallet / door code** for free attendees is **`tickets`** (minted $0 order). UI must not be the only source of truth.
- Optional **whole-event RSVP cap:** `events.rsvp_capacity` + occupancy RPC — see **`docs/contracts/rsvps.md`**.
- **Check-in** mutates registration (and surfaces in wallet); organizer/staff actions are server actions with path revalidation.
- Paid flows (future): **`docs/contracts/rsvps.md`**, **`docs/contracts/checkins.md`**, spec payments sections.

---

## 4. Canonical code touchpoints (verify in repo)

- Public feed & detail: `app/events/**`
- Organizer event CRUD: `app/(dashboard)/organizer/**`, `app/actions/event.ts`
- Admin review: `app/(dashboard)/admin/**`

---

## 5. Diagrams

- **`docs/diagrams/core-transaction-sequence.md`** — attendee + organizer sequences.  
- **`/event-flow`** command — validate changes against this doc + contracts.
