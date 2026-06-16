# Advertise inquiries setup

**Last updated:** June 15, 2026

The `/advertise` partnership form saves valid submissions to Supabase (`public.advertise_inquiries`). Resend is **not** required for this flow.

Public contact email: **admin@thevavibe.com**

---

## 1. Apply the database migration

From the repo root:

```bash
supabase migration new advertise_inquiries   # only if creating a new migration locally
supabase db push                             # staging / linked remote
# or, for local reset:
supabase db reset
```

Migration file: `supabase/migrations/20260615120000_advertise_inquiries.sql`

The table has RLS enabled with **no** public read/write policies. Inserts run server-side via `SUPABASE_SERVICE_ROLE_KEY` in `app/actions/advertise-contact.ts`.

---

## 2. Local environment (`.env.local`)

Copy from `.env.example` and set:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (browser + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (browser + server) |
| `SUPABASE_URL` | Server duplicate of project URL |
| `SUPABASE_ANON_KEY` | Server duplicate of anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** — required for saving inquiries |
| `ADMIN_EMAIL` | Shown in success/error copy (default: `admin@thevavibe.com`) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Public mailto links (default: `admin@thevavibe.com`) |

**Not required for advertise capture:** `RESEND_API_KEY`, `RESEND_FROM`

Restart the dev server after changing env vars:

```bash
npm run dev
```

---

## 3. Vercel (Preview + Production)

In the Vercel project → **Settings → Environment Variables**, add the same Supabase and contact keys for Preview and Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL` = `admin@thevavibe.com`
- `NEXT_PUBLIC_SUPPORT_EMAIL` = `admin@thevavibe.com`

Apply the migration to the Supabase project used by each environment before testing.

---

## 4. Test a submission

1. Open `/advertise` locally or on Preview.
2. Fill out the form (no Resend warning should appear).
3. Submit — expect: *"Thanks — we received your inquiry… You can also reach us at admin@thevavibe.com."*
4. In **Supabase Studio → Table Editor → `advertise_inquiries`**, confirm a new row:
   - `status` = `new`
   - `metadata` contains `{ "source": "advertise_form" }`

If save fails (e.g. missing service role key), users see a friendly message asking them to email **admin@thevavibe.com** — not technical Supabase/Resend errors.

---

## 5. Email fallback

Users can always reach the team at **admin@thevavibe.com**. ImprovMX / partnerships@vizbva.com are not used in this phase.

Optional later: add Resend to notify staff when a new inquiry is inserted (out of scope for initial DB capture).

---

## Related

- Server action: `app/actions/advertise-contact.ts`
- Form UI: `components/advertise/advertise-contact-form.tsx`
- Validation: `lib/advertise-contact-schema.ts`
- Service role client: `lib/supabase/service-role.ts`
