# Wallet passes setup (Apple Wallet + Google Wallet)

This document is for operators enabling **Tickets v2** wallet passes on ViZb. Application code reads **only environment variables**; no signing keys or service account JSON belong in the repo.

## Phase 1 vs Phase 2

| Phase | What ships | Env required for dashboard + API |
|-------|------------|----------------------------------|
| **1 (scaffold)** | “Add to Wallet” buttons; `GET` routes return **JSON stubs** (`ok`, `message`) after auth + ownership checks | Apple: `APPLE_WALLET_TEAM_ID`, `APPLE_WALLET_PASS_TYPE_ID`. Google: `GOOGLE_WALLET_ISSUER_ID`, `GOOGLE_WALLET_CLASS_ID`. |
| **2 (issuance)** | Real `.pkpass` and Google “save to wallet” links; signed barcodes | Phase 1 vars **plus** `TICKET_BARCODE_HMAC_SECRET`, Apple cert block, `GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_BASE64` (see below). |

Phase 1 lets you wire **endpoints, session checks, RLS-backed registration fetch, and UI** before Apple/Google issuer credentials are fully provisioned.

---

## Feature flags (when buttons appear)

On `/dashboard/tickets`, **Add to Apple Wallet** / **Add to Google Wallet** show when the **Phase 1** env pair for that platform is set. If neither platform passes the check, users see **Wallet passes coming soon** (copy in `components/dashboard/tickets/ticket-wallet-actions.tsx`).

---

## Env var checklist

### Phase 1 (identifiers — stubs)

| Variable | Platform |
|----------|----------|
| `APPLE_WALLET_TEAM_ID` | Apple |
| `APPLE_WALLET_PASS_TYPE_ID` | Apple |
| `GOOGLE_WALLET_ISSUER_ID` | Google |
| `GOOGLE_WALLET_CLASS_ID` | Google (full `issuerId.classSuffix` or suffix only if you standardize that in Phase 2) |

### Phase 2 (additional — real passes; not yet implemented in app)

| Variable | Used for |
|----------|-----------|
| `TICKET_BARCODE_HMAC_SECRET` | HMAC for QR / barcode payloads (no PII; registration + event ids only) |
| `APPLE_WALLET_CERT_P12_BASE64` | Apple Pass Type ID signing cert (PKCS#12, base64) |
| `APPLE_WALLET_CERT_PASSWORD` | Export password for `.p12` |
| `APPLE_WALLET_WWDR_PEM_BASE64` | Apple WWDR PEM (base64) |
| `APPLE_WALLET_ORG_NAME` | Apple org display (optional, default `ViZb`) |
| `GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_BASE64` | Google service account key JSON (base64) |

Copy names from `.env.example` into the host’s secret store (e.g. Vercel / your vault).

---

## API (Phase 1 — for QA)

Both routes require a logged-in **Supabase** session (cookie). The registration must belong to `auth.uid()` (enforced via RLS on `event_registrations`).

- `GET /api/tickets/pass/apple?rid=<event_registrations.id>` — **200** JSON: `{ "ok": true, "message": "apple pass not yet generated" }` when Phase 1 Apple env is set and checks pass.
- `GET /api/tickets/pass/google?rid=<event_registrations.id>` — **200** JSON: `{ "ok": true, "message": "google pass not yet generated" }` when Phase 1 Google env is set and checks pass.

Expected HTTP:

- `400` — missing `rid`  
- `401` — not signed in  
- `404` — no such registration **for this user** (or missing join)  
- `403` — registration cancelled  
- `503` — that platform’s Phase 1 env is not configured on this environment  

Implementation references: `lib/tickets/pass-config.ts`, `lib/wallet/fetch-registration-for-pass.ts`, `app/api/tickets/pass/*/route.ts`.

---

## Phase 2 operator notes (preview)

When issuance is implemented:

1. **Apple:** Pass Type ID, signing certificate, WWDR G4 PEM, Team ID — same as Apple’s PassKit docs.
2. **Google:** Enable Wallet API, issuer, service account linked as issuer user, event-ticket **class** id matching `GOOGLE_WALLET_CLASS_ID`.
3. Rotating `TICKET_BARCODE_HMAC_SECRET` invalidates existing barcodes on saved passes; plan format versioning if you rotate.

Never commit `.p12`, PEM, or service account JSON to git.
