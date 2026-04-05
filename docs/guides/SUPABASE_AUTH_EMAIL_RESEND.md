# Supabase Auth emails through Resend (SMTP)

**Last updated:** April 6, 2026  

Sign-up, magic links, password reset, and other **Auth** messages are sent by **Supabase Auth**, not by the Next.js app. This guide wires **Resend** in as Supabase’s **custom SMTP** so mail delivers to real inboxes (and avoids Supabase’s default “team-only” sender limits).

**App code:** `app/signup/page.tsx` only calls `supabase.auth.signUp()`. No Resend SDK is involved for auth.  
**Partnership form:** `/advertise` still uses `RESEND_API_KEY` in the app (`app/actions/advertise-contact.ts`). You can use the **same** Resend API key for both, or create separate keys in Resend for rotation.

---

## Why do this?

From [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp):

- Default in-project email is **not** meant for production (rate limits, no SLA).
- Without custom SMTP, Auth may only send to **organization team** addresses (“Email address not authorized” for everyone else).

---

## Prerequisites (Resend)

1. [Resend account](https://resend.com) and a **[verified domain](https://resend.com/domains)** (required for production `From` addresses other than onboarding tests).
2. [API key](https://resend.com/api-keys) — used as the SMTP **password** (see below).
3. Choose a **sender** address on that domain, e.g. `auth@yourdomain.com` or `noreply@yourdomain.com` (transactional; keep separate from marketing if possible).

Resend SMTP values ([docs](https://resend.com/docs/send-with-supabase-smtp)):

| Field | Value |
|--------|--------|
| Host | `smtp.resend.com` |
| Port | `465` (SMTPS) or `587` (STARTTLS) — match what Supabase’s form expects for “TLS”. Official pairings: [SMTP](https://resend.com/docs/send-with-smtp) |
| Username | `resend` |
| Password | Your **Resend API key** |

---

## Configure Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your **project** (same one as `NEXT_PUBLIC_SUPABASE_URL`).
2. Go to **Authentication** → **Email** (or **Settings** → **Authentication**), then **SMTP Settings** — direct pattern: `https://supabase.com/dashboard/project/_/auth/smtp` (replace with your project ref).
3. **Enable custom SMTP** and enter:
   - **Sender email:** your verified address (e.g. `auth@yourdomain.com`).
   - **Sender name:** e.g. `ViZb` (short; avoid heavy marketing copy in auth mail per Supabase guidance).
   - **Host:** `smtp.resend.com`
   - **Port:** `465` or `587`
   - **Username:** `resend`
   - **Password:** paste the **Resend API key** (not your Supabase keys).
4. Save.

**Management API:** You can also PATCH auth config — see [Supabase Auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp) for the JSON shape (`smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_admin_email`, etc.).

After enabling custom SMTP, review **Authentication → Rate Limits** and raise limits from the conservative default if needed for your launch.

---

## URL configuration (still required)

Confirmation links must match **Site URL** and **Redirect URLs** in Supabase → **Authentication** → **URL Configuration**.

- Production: `https://<your-domain>/auth/callback`
- Local: `http://localhost:3000/auth/callback`

See `docs/guides/LOCAL_DEV_AND_AUTH.md`. Avoid setting `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` to localhost on **production** Vercel env.

---

## Verify

1. Use an email **not** on the Supabase org team.
2. Sign up at `/signup`.
3. Confirm the message appears in [Resend → Emails](https://resend.com/emails) and in the inbox (check spam once).
4. Click the link; you should hit `/auth/callback` and then `/dashboard`.

If sending fails, check **Supabase → Logs** (Auth) and Resend dashboard for bounces or domain/DKIM issues.

---

## References

- [Supabase: Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Resend: Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp)
- [Resend: SMTP credentials](https://resend.com/docs/send-with-smtp)
