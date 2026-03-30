# Diagrams (`docs/diagrams/`)

**Last updated:** March 23, 2026

All files here are **Markdown conceptual maps** (tables, bullet flows, pointers to code paths) — not image assets. They exist so `/plan`, `/triage`, `/debug`, and humans share the same mental model.

---

## When to open which diagram

| File | Role | Open when |
|------|------|-----------|
| **`airport-model.md`** | **Always-on** zone map (Security, Terminal, **Manifest**, Staff, Ticketing, Announcements, Baggage, **Locks**, Control Tower). | Every structural feature, triage, or `/plan`. |
| **`signup-bootstrap-flow.md`** | Auth, callback, profile bootstrap, safe vs gated routes. | Signup/login, redirects, middleware, callback, “user has no profile” issues. |
| **`role-surfaces.md`** | Attendee vs organizer vs admin UI entry points and dashboards. | Role-based pages, nav, dashboard layout, permission UX. |
| **`infrastructure-flow.md`** | Server Actions, route handlers, Supabase clients, external integrations. | Where logic runs, new mutations, future Stripe/webhooks. |
| **`core-transaction-sequence.md`** | Core product lifecycle (discover → attend / organize → publish). | End-to-end flows, RSVP/tickets roadmap, event review pipeline. |
| **`system-map-full.md`** | Broad inventory of routes, actions, and SQL touchpoints. | Rare: refactors, onboarding, “where does X live?” deep dives. **Expect drift** — verify against repo. |

---

## What **not** to put here

- Pixel-perfect UI mockups or exported Figma images (use `docs/BRAND_SYSTEM.md` + design tools).
- Duplicates of the full spec — link to `docs/VIBE_APP_SPECIFICATION.md` instead.
- One-off PR notes — use `docs/releasenotes/` or `docs/archive/`.

---

## Stable paths

Commands and onboarding assume **`airport-model.md` always exists**. Other diagrams are **optional context** for `/plan`: list which files you used and why; skip irrelevant ones.
