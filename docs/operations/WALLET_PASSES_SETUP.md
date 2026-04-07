# Wallet passes setup (Apple Wallet + Google Wallet)

This document is for operators enabling **Tickets v2** wallet passes on ViZb. Application code reads **only environment variables**; no signing keys or service account JSON belong in the repo.

## Feature flags (when buttons appear)

On `/dashboard/tickets`, **Add to Apple Wallet** / **Add to Google Wallet** show only when the relevant env block is complete. If neither platform is configured, users see **coming soon**.

Shared requirement:

- `TICKET_BARCODE_HMAC_SECRET` — long random secret used to HMAC signage for barcode/QR payloads. Must **not** contain personal data; payload is only registration id + event id.

---

## Env var checklist

| Variable | Used for |
|----------|-----------|
| `TICKET_BARCODE_HMAC_SECRET` | Apple + Google barcode message (required for both) |
| `APPLE_WALLET_TEAM_ID` | Apple |
| `APPLE_WALLET_PASS_TYPE_ID` | Apple |
| `APPLE_WALLET_CERT_P12_BASE64` | Apple (base64 of `.p12`) |
| `APPLE_WALLET_CERT_PASSWORD` | Apple |
| `APPLE_WALLET_WWDR_PEM_BASE64` | Apple (base64 of PEM) |
| `APPLE_WALLET_ORG_NAME` | Apple (optional, default `ViZb`) |
| `GOOGLE_WALLET_ISSUER_ID` | Google (numeric issuer id from console) |
| `GOOGLE_WALLET_CLASS_ID` | Google (full `issuerId.classId` **or** suffix; code prefixes issuer if no dot) |
| `GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_BASE64` | Google (base64 of single service account JSON file) |

Copy names from `.env.example` into the host’s secret store (e.g. Vercel / Supabase Edge secrets / your vault).

---

## API (for QA)

Both routes require a logged-in **Supabase** session (cookie). The registration must belong to `auth.uid()`.

- `GET /api/tickets/pass/apple?rid=<event_registrations.id>` — returns `application/vnd.apple.pkpass`
- `GET /api/tickets/pass/google?rid=<event_registrations.id>` — **302** redirect to Google’s save URL
- `GET /api/tickets/pass/google?rid=...&format=json` — `{ "saveUrl", "jwt" }` for tooling

Expected HTTP:

- `401` — not signed in  
- `404` — no such registration **for this user** (or missing join)  
- `403` — registration cancelled  
- `503` — wallet stack not configured on this environment  

---

## Apple Wallet

### One-time (Apple Developer)

1. Enroll in the **Apple Developer Program**.
2. Create a **Pass Type ID** (Identifiers → Pass Type IDs) matching `APPLE_WALLET_PASS_TYPE_ID` (e.g. `pass.com.yourco.vizb.tickets`).
3. Create a **Signing Certificate** for that pass type (Certificates → Pass Type ID Certificate). Export as `.p12` with a password → base64 for `APPLE_WALLET_CERT_P12_BASE64`.
4. Download **Apple Worldwide Developer Relations (WWDR) G4** certificate, export as **PEM** → base64 for `APPLE_WALLET_WWDR_PEM_BASE64`.
5. Note your **Team ID** (10 characters) → `APPLE_WALLET_TEAM_ID`.

### Base64 on your machine (examples)

**PowerShell**

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\signer.p12"))
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\wwdr.pem"))
```

**macOS / Linux**

```bash
base64 -i signer.p12 | tr -d '\n'
base64 -i wwdr.pem | tr -d '\n'
```

Paste the single-line result into the env var (no newlines).

### QA

- Signed-in user: download opens Wallet on iOS / adds pass on macOS.
- Wrong `rid` or another user’s id: `404`.

---

## Google Wallet

### One-time (Google Cloud + Wallet Console)

1. In **Google Cloud**, create or select a project; enable **Google Wallet API**.
2. Create a **service account** with permission to issue passes; download **JSON key** → base64 entire file for `GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_BASE64`.
3. In **Google Pay & Wallet Console**, create an **issuer** and note the numeric **issuer id** → `GOOGLE_WALLET_ISSUER_ID`.
4. Link the service account as a **Wallet API issuer user** (Google’s docs: “Authorize requests” for the issuer).
5. Create an **Event ticket** (or compatible) **class** with id `issuerId.yourClassSuffix` — set `GOOGLE_WALLET_CLASS_ID` to that **full** id (or suffix only; the app prepends `issuerId.` when the value has no dot).

### QA

- Hit the **Google** route while signed in; you should land on Google’s add-to-wallet flow.
- JSON variant: `format=json` returns `saveUrl` for testing.

---

## Operations notes

- Rotating `TICKET_BARCODE_HMAC_SECRET` invalidates existing barcodes on **printed or saved** passes; plan rotation with a new format version in code if you need a migration.
- Pass imagery ships from `lib/wallet/assets/` (icon/logo); replace files there if branding changes (keep Apple’s recommended sizes).
- Never commit `.p12`, PEM, or service account JSON to git.
