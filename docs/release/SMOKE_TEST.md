# Production smoke test (VIZB)

Run this after a release or before a high-traffic event. Use a **staff admin** account, an **organizer** account, and a **plain attendee** account (or incognito for signed-out checks).

## How to run

1. Open a **private/incognito** window for public and attendee flows (no stale cookies).
2. Keep **DevTools → Network** handy to confirm failed requests are expected (e.g. 401 before sign-in).
3. Use **`NEXT_PUBLIC_SITE_URL`** (or your preview URL) consistently so calendar links and redirects match the environment.
4. Optional: second browser profile for organizer vs admin so you do not keep signing out.

---

## Public event page — RSVP funnel

| Step | Route | Verify |
|------|--------|--------|
| 1 | `/events` | List loads; open a **published** event. |
| 2 | `/events/[slug]` **signed out** | Primary CTA reads like **Sign in to RSVP** (or equivalent); helper text explains account needed. |
| 3 | Click RSVP / sign-in | Redirects to login with **return URL** to the same event. |
| 4 | After sign-in | Same event: **RSVP** works; success state shows **on the list** (or equivalent). |
| 4b | Multiple free tiers (if configured) | Tier chooser appears; RSVP respects selected tier. |
| 5 | Cancel RSVP | **Cancel RSVP** succeeds; state returns to not RSVPed without errors. |
| 6 | Re-RSVP after cancel | RSVP works again (no stuck state). |
| 7 | Layout | No horizontal overflow on a narrow viewport (~390px); title, date, venue readable. |

---

## Admin — posts (mobile)

| Step | Route | Verify |
|------|--------|--------|
| 1 | `/admin/posts` on **mobile width** | Row actions do not overflow; overflow menu or stacked actions work. |
| 2 | Open a post | Edit / publish / archive (whatever your role allows) completes without console errors. |

---

## Admin — events door ops

| Step | Route | Verify |
|------|--------|--------|
| 1 | `/admin/events/[id]` (published event with RSVPs) | Filter pills + search work; **RSVP** and **check-in** times visible where applicable. |
| 2 | Check-in / undo | Succeeds; counts or list update after refresh if needed. |
| 3 | Copy / export (if present) | **Copy checked-in list** / UUIDs / CSV does not throw; clipboard or download works in a secure context. |

---

## Organizer — attendees & check-in

| Step | Route | Verify |
|------|--------|--------|
| 1 | `/organizer/[slug]/events/[eventSlug]` | Attendees section lists RSVPs. |
| 2 | Check-in / undo | Same behavior as admin expectation for org-owned event. |
| 3 | Timestamps | **RSVP** time and **checked_in_at** (or equivalent) show correctly when present. |

---

## Tickets wallet

| Step | Route | Verify |
|------|--------|--------|
| 1 | **`/tickets`** (canonical) or **`/dashboard/tickets`** with **no RSVPs** | Empty state copy + link to **`/events`**. |
| 2 | After RSVP | **Upcoming** shows the event; **ticket code** / detail link works on **`/tickets/[ticketId]`**. |
| 3 | Calendar | **Google Calendar** opens with prefilled fields; **.ics** downloads (desktop). |
| 4 | Past events | After event start time passes, item appears under **Past** (if implemented). |

---

## Regression quick pass

- `/admin` loads without blank screen when Supabase is configured.
- `/dashboard` and `/login` reachable; sign-out works.

---

## Notes

- If **`event_registrations`** or the **tickets** migrations are missing in an environment, RSVP/tickets modules should show a **clear configuration message**, not a white screen (see onboarding copy referencing `028` / `029` scripts or matching `supabase/migrations`).
- Document any **environment-specific** skips (e.g. no email in dev) in the release ticket.
