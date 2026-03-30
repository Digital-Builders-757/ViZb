# Infrastructure flow — ViBE

**Last updated:** March 23, 2026

Where **request handling, Supabase access, and mutations** run. Complements **`airport-model.md`** (zones) and **`docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`** (file ownership).

---

## Request path (simplified)

```text
Browser
  → middleware.ts (Security: session refresh, routing gate)
  → Next.js App Router
       → Server Components / RSC data loads → createSupabaseServer() (lib/supabase/server.ts)
       → Client islands → user events → Server Actions or route handlers
  → Supabase (Postgres + Auth + Storage) — enforced by Locks (RLS)
```

---

## Canonical integration points

| Concern | Location | Zone |
|---------|----------|------|
| Browser Supabase | `lib/supabase/client.ts` | Terminal (client) |
| Server Supabase | `lib/supabase/server.ts` | Staff (server) |
| Session in middleware | `lib/supabase/middleware.ts` | Security |
| Mutations | `app/actions/*.ts` | Staff |
| Auth OAuth callback | `app/auth/callback/route.ts` | Security + Staff |
| Storage uploads | Server Actions + bucket policies | Baggage + Locks |
| Stripe / webhooks *(roadmap)* | Dedicated server routes, idempotent handlers | Ticketing + Control Tower |

---

## Rules

- No `select('*')` in app code — explicit columns.
- **No** service role or secret keys in Client Components or shared bundles.
- **External webhooks** (future): verify signature, idempotent processing, return 2xx only after durable write.

Use this diagram in **`/plan`** when adding API routes, webhooks, or new Server Action boundaries.
