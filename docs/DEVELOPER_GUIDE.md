# Developer guide

**Last updated:** June 8, 2026  
**Supersedes:** stale sections of [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md) (Feb 2026)

Quick path for humans and agents to work safely on ViZb.

---

## What you are building

ViZb is a **shipped MVP+** events platform — not a landing-page-only prototype. Auth, events, RSVP, paid tickets, organizer tools, admin, posts, and check-in exist in production code paths.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Node.js | 20.x or 22.x LTS (`>=20` in `package.json`; CI uses 22) |
| npm | **Only** npm — do not add `pnpm-lock.yaml` or `bun.lock` |
| Supabase project | Hosted cloud project (normal workflow) |
| Git | Feature branches off `develop` |

Docker and local Supabase are **optional**. `supabase/config.toml` exists for CLI users; default dev uses **hosted Supabase**.

Local Supabase is not the canonical onboarding path yet. `supabase/config.toml` references a seed file that may not exist, and CLI migrations alone do not recreate the historical base schema without the `scripts/` bootstrap track.

---

## Local setup

### 1. Clone and install

```bash
npm install
```

### 2. Environment

Copy `.env.example` → **`.env.local`** (leading dot required; `env.local` is **ignored**).

Minimum for auth and data:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Restart `npm run dev` after any env change.

### 3. Supabase Auth URLs

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/auth/callback`, `http://localhost:3000/**`

Full walkthrough: [guides/LOCAL_DEV_AND_AUTH.md](./guides/LOCAL_DEV_AND_AUTH.md)

### 4. Run dev server

```bash
npm run dev
```

Open http://localhost:3000

### 5. Staff admin (optional)

Grant yourself staff in SQL Editor:

```sql
UPDATE public.profiles p
SET platform_role = 'staff_admin'
FROM auth.users u
WHERE p.id = u.id AND u.email = 'you@example.com';
```

Requires `platform_role` column (from `scripts/020_posts_mvp_platform_role.sql` or org bootstrap).

---

## Common commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run ci` | Full chain: typecheck → test → lint → build |
| `npm run test:e2e` | Playwright (runs in CI too) |
| `npm run redesign:screenshots` | Visual regression captures |

---

## Testing

### Unit tests (Vitest)

- Config: `vitest.config.ts`
- Pattern: `**/__tests__/**/*.test.ts`
- Heavy coverage in `lib/events/`, `lib/posts/`, `lib/payments/`, `app/actions/__tests__/`

```bash
npm run test
```

### E2E (Playwright)

- Config: `playwright.config.ts`
- Specs: `tests/e2e/`
- CI runs `npm run test:e2e` after `npm run ci` (`.github/workflows/pr-ci.yml`)

```bash
npm run test:e2e
```

Mocked Supabase HTTP is used in auth error specs — see `playwright.config.ts` webServer env.

Current coverage gaps: Stripe webhook fulfillment, full RSVP/checkout/check-in flows, and admin review are not covered end-to-end. Use manual smoke tests and runbooks for those paths before release.

---

## Linting and types

- ESLint 9 + `eslint-config-next` — `eslint.config.mjs`
- TypeScript strict — no `ignoreBuildErrors` in `next.config.mjs`
- Prefer `import type` for type-only imports
- Style rules: [CODING_STANDARDS.md](./CODING_STANDARDS.md) (note: UI radius guidance being updated for glass system)

---

## Branching and PRs

| Branch | Role |
|--------|------|
| `develop` | Integration — **default PR target** |
| `main` | Production — only via `develop` → `main` merge-commit PR |
| `feat/*`, `fix/*` | Short-lived work branches |

```bash
git fetch origin
git checkout develop
git pull origin develop
git checkout -b feat/my-change
# work...
npm run ci
git push -u origin feat/my-change
```

Details: [development/BRANCHING.md](./development/BRANCHING.md)

**Before push:** `npm run ci` (or `/verify` in Cursor).

---

## Database / migration workflow

ViZb has **two SQL tracks**:

| Track | Path | When to use |
|-------|------|-------------|
| Bootstrap mirror | `scripts/*.sql` | Historical full schema; SQL Editor on new projects |
| CLI deltas | `supabase/migrations/*.sql` | **Primary** for ongoing changes on linked projects |

### Making schema changes

1. Create migration: `supabase migration new <short_description>`
2. Write SQL + RLS policies in the new file
3. Apply locally or push: `supabase db push` (linked project)
4. Verify: `supabase migration list`
5. Update contract + [database_schema_audit.md](../database_schema_audit.md) if tables change

**Never edit an applied migration file.** Add a new timestamped file instead.

Apply order reference: [database/MIGRATIONS.md](./database/MIGRATIONS.md)  
Production: [operations/SUPABASE_PRODUCTION_MIGRATIONS.md](./operations/SUPABASE_PRODUCTION_MIGRATIONS.md)

---

## Safe contribution patterns

### Before touching code

1. [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) or [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)
2. [ARCHITECTURE_CONSTITUTION.md](./ARCHITECTURE_CONSTITUTION.md)
3. Relevant [contracts/](./contracts/) + Layer 1 domain doc
4. [ARCHITECTURE_SOURCE_OF_TRUTH.md](./ARCHITECTURE_SOURCE_OF_TRUTH.md) — find canonical file before creating new ones

### Coding rules

| Rule | Detail |
|------|--------|
| Server Components default | Add `"use client"` only for state, effects, browser APIs |
| Two Supabase clients | `lib/supabase/client.ts` and `lib/supabase/server.ts` only |
| Mutations in actions | `app/actions/*.ts`; not in components |
| Explicit selects | No `select('*')` in new code |
| RLS with new tables | Policies in same PR as table |
| No profile INSERT | Trigger owns profile creation |
| shadcn/ui | Do not edit `components/ui/` — wrap or compose |

`requireOrgMember` and older code may still contain historical `select("*")`; do not copy that pattern into new code.

### Red zones

Changes to these need extra care (`/redzone` workflow):

- `proxy.ts`, `lib/supabase/middleware.ts`
- `app/auth/callback/route.ts`
- RLS policies, triggers, enums
- `app/api/stripe/webhook/route.ts`

### Documentation updates

When shipping a feature, update in order:

1. SQL / migration proof
2. Layer 2 contract (`docs/contracts/`)
3. Layer 3 journey if UX changed
4. Layer 1 law if invariant changed
5. [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) if architecture boundary changed

---

## Environment variables (summary)

Full template: `.env.example` at repo root. Grouped reference in [OPERATIONS.md](./OPERATIONS.md).

| Variable | Required for | Exposure |
|----------|--------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Everything | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Everything | Public |
| `NEXT_PUBLIC_SITE_URL` | Stripe redirects, ICS, share links | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhook, checkout orders, admin delete | **Server only** |
| `STRIPE_SECRET_KEY` | Paid checkout | Server only |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification | Server only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Checkout UX | Public |
| `TICKET_QR_SECRET` | Door scanner | Server only |
| `RESEND_API_KEY` | `/advertise` leads | Server only |
| `PLATFORM_ORG_SLUG` | Staff platform events | Server (default `vizb`) |

---

## Cursor / AI agents

- Onboarding: [../AGENT_ONBOARDING.md](../AGENT_ONBOARDING.md)
- Pre-change checklist: [../VIBE_PROJECT_CONTEXT_PROMPT.md](../VIBE_PROJECT_CONTEXT_PROMPT.md)
- Commands: [development/ENGINEERING_COMMANDS.md](./development/ENGINEERING_COMMANDS.md)
- Guardrails: [development/LLM_GUARDRAILS.md](./development/LLM_GUARDRAILS.md)

---

## Troubleshooting

Start with [troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md](./troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md).

Common local issues:

| Symptom | Fix |
|---------|-----|
| Auth redirect loop | Check Supabase redirect URLs |
| "Bucket not found" on upload | Apply storage migrations |
| Admin pages empty | Set `platform_role = staff_admin` |
| Env not loading | Rename `env.local` → `.env.local` |
| Schema errors after pull | `supabase migration list` + `db push` |

---

## Related

- [REPO_MAP.md](./REPO_MAP.md) — where files live
- [OPERATIONS.md](./OPERATIONS.md) — deploy and runtime
- [guides/LOCAL_DEV_AND_AUTH.md](./guides/LOCAL_DEV_AND_AUTH.md) — auth deep dive
