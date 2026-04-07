# Wallet Passes Setup (Apple Wallet + Google Wallet)

This doc covers the external setup and environment variables needed to ship **Add to Apple Wallet** + **Add to Google Wallet** for ViZb tickets.

Scope
- **Tickets v2**: passes are for *free RSVP tickets* (no price/seat assumptions).
- QR/barcode payload must remain **non-PII** and **signed** (use the app’s ticket QR token).

Non-goals
- Payments
- Seating maps
- Transfer/secondary market

---

## 0) Key decisions (recommended defaults)
- Passes are **per registration** (1 pass = 1 RSVP)
- QR/barcode encodes a **signed token** with:
  - event_id
  - registration_id
  - expiry
- Pass endpoints require:
  - authenticated user
  - ownership check: `event_registrations.user_id = auth.uid()`

---

## 1) Environment variable checklist

### Shared
- `NEXT_PUBLIC_SITE_URL` — must be set correctly in prod

### Ticket signing
- `TICKET_QR_SECRET`
  - Server-only HMAC secret used for ticket QR tokens.
  - **Rotate carefully** (rotation invalidates existing QR codes unless you support multi-secret verification).

### Apple Wallet (.pkpass)
- `APPLE_WALLET_TEAM_ID`
- `APPLE_WALLET_PASS_TYPE_ID` (e.g., `pass.com.yourcompany.vizb`)
- `APPLE_WALLET_CERT_P12_BASE64`
- `APPLE_WALLET_CERT_PASSWORD`
- `APPLE_WALLET_WWDR_PEM_BASE64`

### Google Wallet
- `GOOGLE_WALLET_ISSUER_ID`
- `GOOGLE_WALLET_CLASS_ID` (or a prefix to derive class IDs)
- `GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_BASE64`

Security notes
- Never commit certs or service account JSON.
- Prefer storing base64 versions of secrets in your hosting provider secret store.

---

## 2) Apple Wallet setup (Pass Type ID + cert)

### 2.1 Enroll in Apple Developer Program
You need an Apple Developer account for the organization.

### 2.2 Create a Pass Type Identifier
Apple Developer portal → **Certificates, Identifiers & Profiles**
- Identifiers → **Pass Type IDs** → Create
- Name: `ViZb Tickets`
- Identifier: `pass.com.<org>.vizb` (example)

### 2.3 Create a Pass certificate
In the same portal:
- Certificates → “+” → **Pass Type ID Certificate**
- Pick the Pass Type ID you created
- Generate / download the certificate

Export as **.p12**
- Add to Keychain
- Export certificate + private key as `.p12`
- Set a strong password

Convert to base64
- Base64 encode the `.p12` file and store as `APPLE_WALLET_CERT_P12_BASE64`

WWDR certificate
- Apple Wallet signing requires the WWDR intermediate certificate.
- Download WWDR certificate from Apple and store PEM as base64 in `APPLE_WALLET_WWDR_PEM_BASE64`.

### 2.4 Pass metadata
You’ll need values for:
- `teamIdentifier` = `APPLE_WALLET_TEAM_ID`
- `passTypeIdentifier` = `APPLE_WALLET_PASS_TYPE_ID`
- `organizationName` = `ViZb`
- `description` = `ViZb RSVP Ticket`

---

## 3) Google Wallet setup (Issuer + service account)

### 3.1 Create / access Google Wallet issuer
- Google Pay & Wallet Console: create an issuer for ViZb
- Note the **Issuer ID** → `GOOGLE_WALLET_ISSUER_ID`

### 3.2 Create a Google Cloud project + service account
- In Google Cloud Console:
  - Create project
  - Create **service account**
  - Create JSON key
- Base64 encode JSON → `GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_BASE64`

### 3.3 Create pass Class
- Define an “Event Ticket” class (or generic pass class)
- Save the class ID → `GOOGLE_WALLET_CLASS_ID`

---

## 4) Product UX expectations

Member ticket wallet
- Buttons appear only when configured:
  - Apple Wallet button shown primarily on iOS/Safari; still ok to show everywhere as download link.
  - Google Wallet shown on Android/Chrome.

Organizer door ops
- Scanner supports:
  - camera scan
  - paste fallback
  - clear success/failure states

---

## 5) Operational checklist (before enabling in production)

1) Confirm `TICKET_QR_SECRET` set
2) Confirm Apple variables set (cert + WWDR)
3) Confirm Google variables set (issuer + service account)
4) Smoke test on:
   - iPhone Safari: add to Apple Wallet
   - Android Chrome: save to Google Wallet
5) Confirm QR scan works:
   - scan from Wallet pass
   - scan from in-app QR

---

## 6) Troubleshooting

Apple
- “Invalid pass” usually means signing/cert mismatch or missing WWDR chain.
- Ensure your `pass.json` has consistent `passTypeIdentifier` and `teamIdentifier`.

Google
- Most failures are issuer permissions, class/object schema mismatch, or service account not authorized.

---

## 7) Future enhancements (optional)
- Pass updates (push) when event changes time/location
- Multi-secret verification for QR rotation
- Ticket transfer flows
