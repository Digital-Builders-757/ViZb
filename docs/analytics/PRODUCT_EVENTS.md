# Product analytics events

VIZB product funnel events are sent via **`@vercel/analytics`** custom events (`track()`). Implementation: **`lib/analytics/product-events.ts`**.

## Privacy

- No email, user id, display name, or phone in event properties.
- Payload builder strips blocked keys and values containing `@`.

## Event catalog

| Event | When | Typical properties |
|-------|------|-------------------|
| `event_detail_viewed` | Public `/events/[slug]` mount | `event_slug`, `city`, `category`, `event_kind`, `staff_pick`, `signed_in`, `source` |
| `event_save_clicked` | My Vibes click (signed in) | `event_slug`, `source`, `signed_in: true` |
| `event_save_completed` | Save succeeds | same |
| `event_rsvp_started` | Free RSVP or buy click (signed in) | `event_slug`, `source` |
| `event_rsvp_completed` | Free RSVP succeeds | `event_slug` |
| `event_rsvp_cancelled` | RSVP cancelled | `event_slug` |
| `paid_checkout_started` | Stripe checkout session created | `event_slug` |
| `paid_checkout_returned` | Return with `session_id` | `event_slug`, `checkout_status` |
| `paid_checkout_confirmed` | Fulfillment sync confirms ticket | `event_slug` |
| `event_share_clicked` | Copy link or native share | `event_slug`, `channel` (`copy` / `native`) |
| `calendar_export_clicked` | Google or `.ics` export | `event_slug`, `channel` (`google` / `ics`) |
| `signup_login_redirect` | Signed-out gated CTA → login | `event_slug`, `source`, `signed_in: false` |

## Surfaces wired

- **`/events/[slug]`** — detail view beacon, My Vibes, RSVP/checkout, share, calendar
- **`EventTimelineCard`** — save + login redirect from timeline
- **`EventStripeReturn`** — paid checkout return/confirm

## Verification

```powershell
npm run test -- lib/analytics/__tests__/product-events.test.ts
```

View events in the Vercel project **Analytics → Events** tab after deploying to Preview/Production.
