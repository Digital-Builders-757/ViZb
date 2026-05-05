# Contract: sponsors & partnerships

**Status:** MVP (inquiry-only)  
**Public surface:** `/advertise` — “Advertise with VIZB” partnership form (Resend → `ADMIN_EMAIL`).  
**Code:** `app/advertise/page.tsx`, `components/advertise/advertise-contact-form.tsx`, `app/actions/advertise-contact.ts`, `lib/advertise-contact-schema.ts`, `lib/partnerships/advertise-context.ts`

## Principles

- **No paid units in core discovery yet** — `/events` timelines and **Staff pick** rails stay editorial; monetization is **inquiry-based** and routes to the partnerships inbox.
- **Labeling** — Any future sponsored or paid inventory must ship with **on-site disclosure** agreed before go-live. Staff pick (`events.is_staff_pick`) is **not** a paid product.
- **Organizer upsells** — Dashboard and published event pages link to `/advertise?from=organizer` (optional `org` / `event` query params) with an amber **Partnership · paid placement inquires only** label. Referrer lines are embedded in inquiry email bodies when the hidden `submissionContext` field matches a server-built line (see `parseSubmissionContextAttribution`).

## Interest types (form)

Schema: `INTEREST_OPTIONS` in `lib/advertise-contact-schema.ts`, including **`organizer_promotion`** (“Promote my organizer or events (ViZb partnership)”) for hosts routed from organizer tools.

## Schema / billing

- **No** Stripe product for partnerships in-app in this lane; remain **email / ops** until a billing design is specified.

## Related

- Journey placeholder: `docs/journeys/sponsor_partnership_flow.md` (expand when checkout exists).
