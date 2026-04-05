# Local dev server + Supabase auth (login & dashboard)

**Last updated:** March 30, 2026

Use this when you want **localhost** working end-to-end: **Next.js dev server**, **Supabase Auth**, and **dashboard** after sign-in.

---

## Do you need Docker?

**No — not for the normal workflow in this repo.**

- The app is built for **hosted Supabase** (cloud project). You only need **Node.js**, **npm**, and a **`.env.local`** file with your project URL and anon key.
- **Docker** (or `supabase start`) is **optional**. Some teams run Supabase locally via the [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started); this repository does **not** ship a `docker-compose.yml` or `supabase/config.toml`. If you add local Supabase later, that is a separate setup.

---

## 1. Install and run the dev server

1. **Node:** 20.x or 22.x LTS recommended (`>=20` per `package.json`).
2. From the repo root:

   ```bash
   npm install
   npm run dev
   ```

3. Open **http://localhost:3000**.

---

## 2. Environment variables (required for auth)

Next.js only loads files like **`.env.local`** (note the **leading dot**). A file named `env.local` is **ignored**.

1. Copy **`.env.example`** → **`.env.local`**, or keep a single source of truth as **`.env.local`** only.
2. Set at least:

   | Variable | Where to find it |
   |----------|------------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → **Project Settings** → **API** → Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → `anon` `public` key |

3. Optionally duplicate the same values as **`SUPABASE_URL`** and **`SUPABASE_ANON_KEY`** if your `.env.example` uses them — server code falls back to those names.

4. **Restart** `npm run dev` after any change to `.env.local`.

---

## 3. Supabase Dashboard — URLs for local login

In the [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **URL Configuration**:

1. **Site URL** (for local work):  
   `http://localhost:3000`

2. **Redirect URLs** — add:

   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**` (wildcard is convenient for dev; tighten for production)

Without these, email confirmation or OAuth can fail with “redirect URL not allowed”.

**Optional:** In `.env.local`, for signup email links in dev you can set:

```env
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

(`app/signup/page.tsx` uses this when set; otherwise it uses `window.location.origin` + `/auth/callback`.)

---

## 4. Verify auth and dashboard

1. Go to **http://localhost:3000/signup** and create a test user (use a real inbox you can open, or disable “confirm email” temporarily in Supabase → **Authentication** → **Providers** → **Email** for **local-only** testing — re-enable for anything shared).
2. Confirm the email if required; you should land on **`/auth/callback`** then **`/dashboard`** (see `app/auth/callback/route.ts` and middleware).
3. Sign out from the dashboard sidebar, then go to **http://localhost:3000/login** and sign in again.
4. Protected routes (`/dashboard`, `/profile`, `/organizer`, `/admin`, etc.) should redirect to **`/login`** when logged out (`middleware.ts` + `lib/supabase/middleware.ts`).

**Database:** A row in **`profiles`** should be created for new users if the **`handle_new_user`** trigger from your SQL migrations is applied on that Supabase project. If login works but dashboard errors on profile, check Supabase logs and `scripts/004_create_profiles.sql`.

---

## 5. Quick troubleshooting

| Symptom | Check |
|---------|--------|
| “URL and Key required” / Supabase client errors | `.env.local` exists, vars are filled, dev server restarted |
| Redirect or “invalid redirect” after email | Redirect URLs in Supabase include `http://localhost:3000/auth/callback` |
| Stuck on login / instant redirect loop | `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md` |
| `npm install` odd errors on Windows | `npm cache clean --force`, retry; try Node 22 LTS |

---

## 6. After this works

Run **`npm run ci`** before pushing. For dashboard UI work, follow **`docs/BRAND_CONSTITUTION.md`** and use **`/brand-check`** for visible changes. Next priorities: **`docs/development/PUSH_FORWARD_ROADMAP.md`**.

---

## 7. Advertising / partnership form (`/advertise`)

1. Create a [Resend](https://resend.com) API key and add **`RESEND_API_KEY`** to **`.env.local`**.
2. Set **`ADMIN_EMAIL`** if the inbox should differ from the default **`admin@thevavibe.com`**.
3. Set **`RESEND_FROM`** to a **verified sender** in Resend (e.g. `ViZb <partners@yourdomain.com>`). For quick tests only, Resend’s docs allow **`onboarding@resend.dev`** as the from-address with restrictions.
4. Restart **`npm run dev`**, open **`http://localhost:3000/advertise`**, submit the form, and confirm the message arrives in the admin inbox (check spam if needed).

---

## 8. Staff admin + posting events (local / staging)

1. **Role:** In Supabase → **SQL Editor**, promote your user (use the UUID from **Authentication → Users**):

   ```sql
   update public.profiles
   set platform_role = 'staff_admin'
   where id = 'YOUR_USER_UUID';
   ```

2. **Schema:** Run repo SQL scripts in order (see `docs/database/MIGRATIONS.md`). For staff event workflows, apply at least through **`scripts/024_allow_staff_update_archived.sql`** so staff can **insert** events, **upload flyers**, and also **restore archived events** (fixes a policy regression introduced by `023`).

3. **Flow:** Sign in → **`/admin`** → **Create Organization** (note the org **slug**) → open **`/organizer/{slug}/events/new`** → create draft → upload flyer → **Submit for review** → **`/admin`** → **Event Submissions** → approve (or use another staff account to approve). Published events appear on **`/events`**, **dashboard “Trending”**, and the **month calendar** on **`/dashboard`**.

4. **Month view:** Use **`/dashboard?cal=2026-03`** (`YYYY-MM`) to jump months; arrows on the card update the same query param.

---

## 9. Design seed — populate `/events` and dashboard (optional)

For layout and visual design, you can insert **published** mock events without clicking through the organizer flow.

1. **Sign up once** on the project so **`auth.users`** has at least one row (the script attaches the seed org to the **oldest** user by `created_at`).
2. **Schema:** Prefer **`020_event_categories_array.sql`** on every shared environment so the app matches `events.categories`. The seed script still runs if you only have legacy **`events.category`** (it stores the **first** tag per row).
3. **Run:** Supabase → **SQL Editor** → paste **`scripts/021_seed_design_events.sql`** → **Run**.

This creates an **`active`** org with slug **`vibe-design-preview`**, **~11** upcoming/past events (Norfolk, Richmond, DMV, etc.) with Unsplash **flyer** URLs, and **skips** rows that already exist (`ON CONFLICT DO NOTHING` on `(org_id, slug)`).

**Why not Playwright for this?** Browser automation would need a logged-in session, org membership, staff approval paths, and storage uploads — it is brittle for “fill the feed.” SQL seeding matches production RLS-shaped data in one step.

**Remove later:** Cleanup SQL is in the header comment of **`scripts/021_seed_design_events.sql`**.
