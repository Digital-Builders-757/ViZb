# Role surfaces — ViBE UI map

**Last updated:** March 23, 2026

**Role-specific dashboards and entry points** (Terminal zone). Authoritative rules for roles and RLS remain in **`docs/VIBE_APP_SPECIFICATION.md`** and SQL — this doc is a **route map**.

---

## Roles (product)

| Role | Who | Primary goals |
|------|-----|----------------|
| **Attendee** | Any signed-in user | Browse **Manifest**, RSVP/buy tickets *(ticketing roadmap)*, wallet, profile |
| **Organizer** | Users with org membership | Manage org, create/edit events, door tools *(roadmap)* |
| **Admin** | `role_admin` (platform) | Approve orgs/events, moderation, metrics |
| **Host applicant** | User applying to host | Submit application; not yet full organizer |

---

## Route → surface (current / planned)

| Surface | Typical routes | Notes |
|---------|----------------|-------|
| Marketing | `/` | Landing, waitlist, brand |
| Manifest (public events) | `/events`, `/events/[slug]` | Discovery + detail |
| Attendee hub | `/dashboard`, `/dashboard/tickets` | Post-login home, ticket wallet |
| Profile | `/profile` | Account / profile settings |
| Organizer | `/organizer/new`, `/organizer/[slug]`, `/organizer/[slug]/events/*` | Org + event CRUD |
| Host apply | `/host/apply` | Application flow |
| Admin | `/admin` | Approval queues, admin tools |
| Auth | `/login`, `/signup`, `/auth/*` | Login, signup, errors, success |
| Invites | `/invite/claim` | Claim invite |

---

## Design constraints

- **Brand:** `docs/BRAND_SYSTEM.md` — dashboards must not look generic SaaS.
- **Data:** Each surface uses **Staff** (actions) + **Locks** (RLS); components do not write to DB directly.

When `/plan` touches “who sees which nav or page,” cite **`role-surfaces.md`**.
