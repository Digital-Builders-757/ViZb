# ViBE -- Developer & AI Agent Onboarding Guide

**Last Updated:** February 5, 2026

Read this first. It takes 5 minutes and prevents hours of mistakes.

---

## What is ViBE?

ViBE is an events discovery and ticketing platform for the Virginia/DMV creative community. Think Eventbrite meets streetwear culture. Users browse events with flyer-first imagery, RSVP for free events, buy tickets for paid events, and present tickets at the door.

**Three account types (layered on one User model):**

| Role | Who | Key Action |
|------|-----|-----------|
| Attendee | Any registered user | Browse, RSVP, buy tickets |
| Organizer | User with org membership | Create events, manage tickets, check-in at door |
| Admin | ViBE team (`role_admin = true`) | Approve orgs/events, moderate users, view metrics |

---

## Current State (February 2026)

**What exists today:**
- Full marketing landing page (Next.js 16, Tailwind v4, Three.js hero)
- Waitlist signup (Supabase `subscribers` table + server action)
- Supabase integration (auth clients for browser and server)
- Performance optimizations (dynamic imports, GPU-accelerated animations)

**What is planned (not yet built):**
- Auth pages (login, signup)
- Event CRUD + public feed
- Ticketing (free RSVP + Stripe Checkout)
- Organizer dashboard + door check-in
- Admin dashboard + approval queues

See `VIBE_APP_SPECIFICATION.md` Section 12 for the full implementation roadmap.

---

## Read These Before Touching Code

In this order:

| Priority | Document | Why |
|----------|----------|-----|
| 1 | `docs/BRAND_SYSTEM.md` | Understand the visual identity before building any UI |
| 2 | `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md` | Know where things live and what owns what |
| 3 | `docs/CODING_STANDARDS.md` | Know the rules before writing code |
| 4 | `docs/VIBE_APP_SPECIFICATION.md` | Full technical spec (schema, RLS, routes, payments) |
| 5 | `PERFORMANCE_REPORT.md` (root) | Understand performance constraints and decisions made |

---

## Key Concepts to Internalize

### 1. Server Components by Default

Everything is a Server Component unless it needs `useState`, `useEffect`, or event handlers. This is the single most important performance decision in the codebase. When you need interactivity, extract only the interactive piece into a Client Component.

**Current Client Components (and why):**
- `three-background.tsx` -- Three.js needs browser APIs
- `three-background-wrapper.tsx` -- Dynamic import with SSR disabled
- `waitlist-section.tsx` -- Form with state and handlers
- `navbar.tsx` -- Mobile menu toggle (candidate for extraction)

Everything else is a Server Component.

### 2. Two Supabase Clients, No More

| When | Use | Import |
|------|-----|--------|
| In a Client Component | `createSupabaseBrowser()` | `lib/supabase/client.ts` |
| Everywhere else (server) | `createSupabaseServer()` | `lib/supabase/server.ts` |

Never create a new Supabase client. Never import `@supabase/supabase-js` directly.

### 3. Mutations = Server Actions

All database writes go through Server Actions in `app/actions/`. Components render data; actions mutate it. This separation is non-negotiable.

### 4. Design Tokens, Not Raw Colors

All colors use semantic tokens defined in `globals.css`. The primary brand color is a neon blue (`--primary: oklch(0.6 0.22 250)`). Never use `bg-blue-600` or `text-white` directly. Use `bg-primary`, `text-foreground`, etc.

### 5. Flyer-First Design

Events are visual. The flyer image leads. Text is secondary. This is a cultural events platform, not a corporate SaaS. The design language is editorial/streetwear -- sharp corners (radius: 0), bold typography, high contrast, neon blue accents.

### 6. Brand Flows from Landing to Dashboard

The dashboard is **not** a separate product. It inherits the same editorial DNA as the landing page. Read `BRAND_SYSTEM.md` Section 9 for exact pattern mappings. The quick test: if your dashboard screen could pass for a generic SaaS template, it's wrong. Sharp corners, `font-serif` titles, mono uppercase labels, and the ViBE blue accent must carry through every screen.

---

## Project Structure Cheat Sheet

```
app/
  layout.tsx          -- Root layout (fonts, metadata)
  page.tsx            -- Homepage (orchestrates sections)
  globals.css         -- Tailwind v4 + all design tokens + custom CSS
  actions/            -- Server Actions (all mutations)

components/
  ui/                 -- shadcn/ui (DO NOT EDIT)
  navbar.tsx          -- Global nav
  footer.tsx          -- Global footer
  hero-section.tsx    -- Hero with Three.js background
  [other sections]    -- Landing page sections

lib/
  utils.ts            -- cn() helper
  supabase/
    client.ts         -- Browser Supabase client
    server.ts         -- Server Supabase client

scripts/
  001_*.sql           -- Migration scripts (sequential, immutable once run)

docs/
  DOCUMENTATION_INDEX.md    -- Start here for all docs
  CODING_STANDARDS.md       -- How to write code
  ARCHITECTURE_SOURCE_OF_TRUTH.md  -- What owns what
  VIBE_APP_SPECIFICATION.md -- Full technical spec
```

---

## Common Pitfalls

### Pitfall 1: Adding "use client" to a Server Component

**Symptom:** You add `"use client"` because you imported a component that needs it.
**Fix:** Don't. Import the Client Component into your Server Component. Only the leaf needs `"use client"`.

### Pitfall 2: Disabling SSR in a Server Component

**Symptom:** Build error about SSR option not being allowed in server components.
**Fix:** Create a separate `"use client"` wrapper component that does the dynamic import with SSR disabled, then import that wrapper from your Server Component. See `three-background-wrapper.tsx` for the pattern.

### Pitfall 3: Fetching Data in useEffect

**Symptom:** You're writing `useEffect(() => { fetch(...) }, [])` to load data.
**Fix:** Either fetch in a Server Component and pass data as props, or use SWR for client-side data that needs to sync.

### Pitfall 4: Ignoring Supabase Errors

**Symptom:** You destructure `{ data }` but ignore `{ error }`.
**Fix:** Always check `error`. If it's non-null, handle it. See Coding Standards Section 6.

### Pitfall 5: Editing shadcn/ui Files

**Symptom:** You modify a file in `components/ui/`.
**Fix:** Don't. Create a wrapper component or use composition. shadcn updates will overwrite your changes.

### Pitfall 6: Creating Tables Without RLS

**Symptom:** You write a migration that creates a table but doesn't enable RLS.
**Fix:** Always include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and at least one policy in the same migration (or a paired migration).

---

## Environment Variables

The project uses Vercel for environment management. Variables are configured via the Vercel dashboard or the v0 sidebar.

**Currently configured:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Needed for future phases:**
- `STRIPE_SECRET_KEY` (Phase 4)
- `STRIPE_WEBHOOK_SECRET` (Phase 4)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Phase 4)

---

## For AI Agents Specifically

1. **Always read before writing.** Use the Read tool on any file before editing it.
2. **Check architecture ownership** in `ARCHITECTURE_SOURCE_OF_TRUTH.md` before creating new files.
3. **Use parallel tool calls** when reading multiple files that don't depend on each other.
4. **Follow the import order** defined in Coding Standards Section 3.
5. **Use `import type`** for type-only imports.
6. **Never generate placeholder images.** Use the GenerateImage tool or reference existing images in `/public/`.
7. **Remove debug `console.log` statements** after resolving issues.
8. **When adding Supabase queries,** always check the schema in `VIBE_APP_SPECIFICATION.md` Section 5 first.
9. **When creating new components,** default to Server Components. Only add `"use client"` if the component truly needs client interactivity.
10. **When updating documentation,** follow the update order in `DOCUMENTATION_INDEX.md`.
