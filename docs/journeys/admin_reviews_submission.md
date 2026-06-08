# Journey: admin reviews submission

**Status:** MVP  
**Routes:** `/admin`, `/admin/events/[id]`, `/admin/event-listing-reports`  
**Contracts:** `docs/contracts/auth.md`, `docs/contracts/events.md`, `docs/contracts/media_assets.md`

## Happy path — event review

1. Staff admin opens `/admin`.
2. Admin sees pending event submissions and load-error banners if Supabase queries fail.
3. Admin opens event detail at `/admin/events/[id]`.
4. Admin reviews event fields, flyer, categories, ticket tiers, trust/discovery controls, and notes.
5. Admin publishes or rejects with review notes.
6. Published events appear on public discovery; rejected events stay out of public surfaces.

## Happy path — host/org review

1. Applicant submits `/host/apply`.
2. Staff admin reviews applications on `/admin`.
3. Admin approves by creating/activating org + invite path or rejects with notes.
4. Approved host claims invite and gains org dashboard access.

## Trust queue

- Event reports created from `/events/[slug]` are reviewed at `/admin/event-listing-reports`.
- Staff pick / discovery controls live on admin event detail.

## Acceptance

- Only `platform_role = 'staff_admin'` can reach admin review actions.
- Public visibility follows `events.status = published`.
- Review changes revalidate affected public and admin routes.
- Admin user-facing errors should be visible, not silent redirects.
