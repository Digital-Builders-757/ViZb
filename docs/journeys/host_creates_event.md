# Journey: host / organizer creates event

**Status:** MVP  
**Routes:** `/host/apply`, `/invite/claim`, `/organizer/[slug]`, `/organizer/[slug]/events/new`, `/organizer/[slug]/events/[eventSlug]`  
**Contracts:** `docs/contracts/events.md`, `docs/contracts/media_assets.md`, `docs/contracts/rsvps.md`

## Happy path

1. Host gets an org membership through staff approval/invite, or applies through `/host/apply`.
2. Staff admin approves host application or creates an org/invite.
3. Organizer claims invite at `/invite/claim` if needed and sees org in dashboard sidebar.
4. Organizer opens `/organizer/[slug]/events/new` and creates a draft event.
5. Organizer adds required details, flyer for official events, categories, capacity, and ticket tiers as needed.
6. Organizer submits for review.
7. Staff admin reviews and publishes; the event appears on `/events` when published.

## Community listings

Community/third-party listings are staff-created under the platform org through `/admin/events/new/community`. They use `event_kind = community` and external RSVP URL instead of ViZb-hosted RSVP/ticketing.

## Acceptance

- Organizer can only mutate events for orgs where they hold an allowed role.
- Editors can create/update draft workflow but cannot bypass review.
- Published official events can expose RSVP/ticket tiers; community listings use external RSVP.
- Cross-org edits are blocked by app gates and RLS.
