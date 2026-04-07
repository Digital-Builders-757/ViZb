# Resend + Supabase Auth Email — Verification Checklist

Last updated: 2026-04-05

This guide verifies that Supabase Auth emails (sign-up confirmation, magic links, password reset, etc.) are being sent via **Supabase → SMTP → Resend** and that redirect URLs are correct.

## Preconditions

- Resend domain is verified (e.g. `vizbva.com`).
- Supabase project is the one configured in `NEXT_PUBLIC_SUPABASE_URL`.

## Supabase SMTP (Auth → SMTP)

Confirm the following:

- Provider: **Custom SMTP**
- Host: `smtp.resend.com`
- Port: `587`
- Username: `resend`
- Password: **Resend API key**
- Sender email: `noreply@vizbva.com`
- Sender name: e.g. `VIZB` / `ViZb`

> This SMTP config drives **all** Supabase Auth emails (sign-up confirm, forgot password, email change, magic link, etc.).

## Supabase URL Configuration (Auth → URL Configuration)

- Site URL = production site origin (e.g. `https://vizbva.com`)
- Redirect URLs include:
  - `https://vizbva.com/auth/callback`
  - `http://localhost:3000/auth/callback` (optional for local testing)

## Production verification (recommended)

### A) Sign-up confirmation email

1) In an incognito window, sign up with a fresh email.
2) In Resend dashboard, confirm an email appears in logs.
3) In inbox, confirm:
   - From: `noreply@vizbva.com`
   - Links resolve to production domain
4) Click confirm link → should land back in app and complete auth.

### B) Forgot password email

1) Trigger “Forgot password” for a real email.
2) Verify email appears in Resend logs.
3) Click link → should land in app flow and allow password reset.

### C) Magic link (if enabled)

1) Trigger a magic link sign-in.
2) Verify link returns to `/auth/callback`.

## Common failure modes

- **Emails send but links go to wrong domain** → URL configuration is wrong.
- **No emails in Resend logs** → SMTP not enabled, wrong API key, or wrong Supabase project.
- **Emails in Resend but not delivered** → recipient provider blocked; check spam, DKIM/DMARC, and Resend deliverability.

## Separate path: marketing / contact forms

App-originated emails (e.g. `/advertise`) may use `RESEND_API_KEY` and `RESEND_FROM` directly in server actions.
That is independent from Supabase Auth emails.
