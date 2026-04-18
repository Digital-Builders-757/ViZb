# ViBE -- Coding Standards & Style Guide

**Last Updated:** February 5, 2026
**Applies to:** All code in the ViBE events platform repository

This document defines the coding conventions, patterns, and anti-patterns for the ViBE project. Both human developers and AI agents must follow these rules. Violations should be caught in code review.

---

## Table of Contents

1. [Tech Stack Reference](#1-tech-stack-reference)
2. [Project Structure](#2-project-structure)
3. [TypeScript Standards](#3-typescript-standards)
4. [React & Next.js Patterns](#4-react--nextjs-patterns)
5. [Styling with Tailwind CSS](#5-styling-with-tailwind-css)
6. [Brand Consistency (Landing to Dashboard)](#6-brand-consistency-landing-to-dashboard)
7. [Supabase & Database Patterns](#7-supabase--database-patterns)
8. [Authentication Patterns](#8-authentication-patterns)
9. [Server Actions](#9-server-actions)
10. [API Routes](#10-api-routes)
11. [Error Handling](#11-error-handling)
12. [Performance Guidelines](#12-performance-guidelines)
13. [Security Standards](#13-security-standards)
14. [File Naming Conventions](#14-file-naming-conventions)
15. [Git Conventions](#15-git-conventions)
16. [Anti-Patterns (Never Do This)](#16-anti-patterns-never-do-this)

---

## 1. Tech Stack Reference

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | Strict mode |
| React | React | 19.x |
| Styling | Tailwind CSS | v4 |
| UI Components | shadcn/ui | Latest |
| Database | Supabase (PostgreSQL) | -- |
| Auth | Supabase Auth | via `@supabase/ssr` |
| Storage | Supabase Storage | -- |
| Payments | Stripe Checkout + Webhooks | -- |
| Hosting | Vercel | -- |
| 3D | Three.js (hero only) | Dynamically imported |
| Analytics | Vercel Analytics | -- |

---

## 2. Project Structure

**Authoritative action list:** `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md` (Rule 2).  
**Validation before ship:** `npm run typecheck`, `npm run test`, `npm run lint`, `npm run build`, or `npm run ci` — see `README.md` and `docs/development/ENGINEERING_COMMANDS.md`.

```
/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (fonts, metadata, analytics)
│   ├── page.tsx                # Homepage
│   ├── globals.css             # Tailwind v4 + design tokens + custom CSS
│   ├── actions/                # Server Actions (domain-split *.ts — event, registrations, lineup, …)
│   ├── api/                    # Route handlers (e.g. stripe/, calendar/ics)
│   ├── (dashboard)/            # Logged-in surfaces: dashboard, organizer, admin, profile, tickets
│   ├── events/                 # Public event listing + [slug] detail
│   ├── p/                      # Community posts feed + [slug]
│   ├── lineup/                 # Public lineup board
│   ├── login/, signup/, auth/  # Auth flows
│   └── ...
├── proxy.ts                    # Next.js 16 — session refresh matcher → lib/supabase/middleware.ts
├── components/                 # Shared components
│   ├── ui/                     # shadcn/ui primitives (do not edit directly)
│   ├── navbar.tsx              # Global navigation
│   ├── footer.tsx              # Global footer
│   ├── hero-section.tsx        # Landing hero
│   ├── three-background.tsx    # Three.js particle background (client)
│   ├── three-background-wrapper.tsx  # Dynamic import wrapper (client)
│   ├── editorial-grid.tsx      # About/editorial section
│   ├── events-section.tsx      # Event preview cards
│   ├── app-preview.tsx         # Mobile app mockup
│   ├── waitlist-section.tsx    # Waitlist signup form (client)
│   ├── marquee-section.tsx     # Scrolling text
│   └── culture-section.tsx     # Culture highlight section
├── lib/                        # Shared utilities
│   ├── utils.ts                # cn() helper and general utilities
│   └── supabase/
│       ├── client.ts           # Browser Supabase client
│       └── server.ts           # Server Supabase client (cookie-backed)
├── hooks/                      # Custom React hooks
│   ├── use-mobile.ts           # Mobile detection
│   └── use-toast.ts            # Toast notifications
├── scripts/                    # SQL migration scripts
│   ├── 001_create_subscribers_table.sql
│   └── 002_add_phone_number.sql
├── public/                     # Static assets (images, logos, fonts)
├── docs/                       # Project documentation
└── types/                      # Shared TypeScript types (future)
```

### Ownership Rules

- `components/ui/` -- Owned by shadcn/ui. Do not manually edit these files.
- `lib/supabase/` -- Canonical Supabase clients. Never create alternative clients.
- `app/actions/` -- All server mutations live here. No mutations in components.
- `scripts/` -- SQL migrations. Sequential numbering. Never modify executed scripts.

---

## 3. TypeScript Standards

### Strict Mode

TypeScript strict mode is enforced. Never use `// @ts-ignore` or `// @ts-nocheck`.

### Type Definitions

```typescript
// GOOD: Explicit types for component props
interface EventCardProps {
  title: string
  date: string
  location: string
  category: string
  image: string
}

// GOOD: Use 'type' for unions and simple shapes
type EventStatus = 'draft' | 'pending' | 'published' | 'cancelled'
type OrgRole = 'owner' | 'manager' | 'staff'

// BAD: Never use 'any'
const data: any = fetchSomething() // NEVER

// BAD: Never use type assertions to silence errors
const user = data as User // AVOID unless you've validated the shape
```

### Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Components | PascalCase | `EventCard`, `HeroSection` |
| Files (components) | kebab-case | `event-card.tsx`, `hero-section.tsx` |
| Files (utilities) | kebab-case | `auth-helpers.ts` |
| Functions | camelCase | `requireAuth`, `createEvent` |
| Server Actions | camelCase, verb-first | `subscribeToWaitlist`, `createOrder` |
| Constants | SCREAMING_SNAKE | `MAX_TICKET_QUANTITY`, `API_TIMEOUT` |
| Types/Interfaces | PascalCase | `EventCardProps`, `UserProfile` |
| Database columns | snake_case | `created_at`, `buyer_user_id` |
| CSS classes | kebab-case | `neon-gradient-text`, `img-zoom` |
| Environment variables | SCREAMING_SNAKE | `NEXT_PUBLIC_SUPABASE_URL` |

### Import Order

Imports should be grouped in this order, separated by blank lines:

```typescript
// 1. React/Next.js core
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

// 2. Third-party libraries
import { createClient } from "@supabase/supabase-js"

// 3. Internal utilities and helpers
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"

// 4. Components
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/event-card"

// 5. Types (use 'import type' when possible)
import type { EventCardProps } from "@/types/events"
```

### Prefer `import type`

Always use `import type` for type-only imports. This ensures they are stripped at build time.

```typescript
// GOOD
import type { EventStatus } from "@/types/events"

// BAD
import { EventStatus } from "@/types/events"
```

---

## 4. React & Next.js Patterns

### Server Components by Default

Every component is a Server Component unless it explicitly needs client-side interactivity. The rule is simple:

| Needs... | Server or Client? |
|----------|------------------|
| Database queries | Server |
| `useState`, `useEffect` | Client |
| Event handlers (`onClick`, `onChange`) | Client |
| Browser APIs (`window`, `document`) | Client |
| Forms with validation | Client |
| Static display of data | Server |

```typescript
// GOOD: Server Component (no directive needed)
export function EventCard({ title, date }: EventCardProps) {
  return (
    <div>
      <h3>{title}</h3>
      <p>{date}</p>
    </div>
  )
}

// GOOD: Client Component (only when needed)
"use client"
export function MobileMenuToggle() {
  const [isOpen, setIsOpen] = useState(false)
  return <button onClick={() => setIsOpen(!isOpen)}>Menu</button>
}
```

### Isolate Client Boundaries

When a Server Component needs a small interactive piece, extract only that piece into a Client Component:

```typescript
// BAD: Entire page is client just for one button
"use client"
export default function EventPage() { ... }

// GOOD: Page is server, only the interactive part is client
// components/rsvp-button.tsx
"use client"
export function RSVPButton({ eventId }: { eventId: string }) { ... }

// app/events/[id]/page.tsx (Server Component)
import { RSVPButton } from "@/components/rsvp-button"
export default async function EventPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id)
  return (
    <main>
      <h1>{event.title}</h1>
      <RSVPButton eventId={event.id} />
    </main>
  )
}
```

### Dynamic Imports for Heavy Dependencies

Heavy client libraries (Three.js, chart libraries, etc.) must be dynamically imported with server-side rendering disabled. The dynamic import must live in a `"use client"` wrapper component. See `components/three-background-wrapper.tsx` for the canonical example.

**Pattern:** Create a `"use client"` file that calls `next/dynamic` with the SSR option set to `false` and a loading fallback. Export a wrapper component. Import that wrapper (not the raw component) from any Server Component that needs it.

### Async Components (Next.js 16)

In Next.js 16, `params`, `searchParams`, `headers`, and `cookies` are async. Always await them:

```typescript
// GOOD
export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ...
}

// BAD: Synchronous access will break
export default function EventPage({ params }: { params: { id: string } }) {
  const { id } = params // ERROR in Next.js 16
}
```

### Component Composition

Split large page files into smaller, focused components:

```typescript
// BAD: 500-line page.tsx with everything inline
// GOOD: page.tsx orchestrates smaller components
import { HeroSection } from "@/components/hero-section"
import { EventsSection } from "@/components/events-section"
import { EditorialGrid } from "@/components/editorial-grid"

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <EventsSection />
      <EditorialGrid />
    </main>
  )
}
```

---

## 5. Styling with Tailwind CSS

### Design Token System

All colors are defined as semantic design tokens in `globals.css`. Never use raw color values:

```typescript
// GOOD: Use semantic tokens
<div className="bg-background text-foreground border-border" />
<button className="bg-primary text-primary-foreground" />
<p className="text-muted-foreground" />

// BAD: Raw colors
<div className="bg-black text-white border-gray-800" />
<button className="bg-blue-600 text-white" />
```

### ViBE Brand Tokens

| Token | Purpose | Value |
|-------|---------|-------|
| `--background` | Page background | Near-black `oklch(0.05 0 0)` |
| `--foreground` | Primary text | Near-white `oklch(0.98 0 0)` |
| `--primary` | Brand blue (neon) | `oklch(0.6 0.22 250)` |
| `--muted-foreground` | Secondary text | `oklch(0.55 0 0)` |
| `--card` | Card backgrounds | `oklch(0.08 0 0)` |
| `--border` | Borders and dividers | `oklch(0.2 0 0)` |
| `--accent` | Accent cyan | `oklch(0.7 0.18 200)` |

### Font Usage

Three font families are loaded. Use the correct Tailwind classes:

| Font | Class | Usage |
|------|-------|-------|
| Space Grotesk | `font-sans` | Body text, UI elements, buttons |
| Playfair Display | `font-serif` | Editorial headings, blockquotes |
| JetBrains Mono | `font-mono` | Code, labels, badge text, timestamps |

### Custom CSS Classes

These utility classes are defined in `globals.css`:

| Class | Purpose |
|-------|---------|
| `.headline-xl` | Giant editorial headlines (clamp 3rem-10rem) |
| `.headline-lg` | Large section headers (clamp 2rem-6rem) |
| `.neon-gradient-text` | Animated blue gradient text effect |
| `.neon-glow` | Blue box-shadow glow |
| `.neon-glow-cyan` | Cyan box-shadow glow |
| `.animate-marquee` | Horizontal scrolling animation |
| `.img-zoom` | Hover zoom effect for images |

### Layout Rules

1. **Flexbox first.** Use `flex` for most layouts. Only use `grid` for 2D layouts.
2. **Use `gap` for spacing.** Never use `space-x-*` or `space-y-*`.
3. **Tailwind spacing scale.** Prefer `p-4` over `p-[16px]`. Use arbitrary values only when the scale doesn't have what you need.
4. **Mobile-first responsive.** Write base styles for mobile, add `md:` and `lg:` prefixes for larger screens.
5. **Max width containers.** Use `max-w-[1800px] mx-auto` for wide editorial layouts.

---

## 6. Brand Consistency (Landing to Dashboard)

> **Full reference:** See [BRAND_SYSTEM.md](./BRAND_SYSTEM.md) for the complete visual identity specification with component recipes and anti-patterns.

The ViBE brand is **dark, editorial, streetwear-inspired**. Every screen must feel like it belongs in the same magazine. Here's the quick checklist:

### Pre-Build Brand Checklist

Before building any new page or component, verify these:

- [ ] **Dark background only** -- `bg-background` or `bg-card`, never white/light
- [ ] **Zero radius** -- No `rounded-lg`, `rounded-xl` on cards, buttons, inputs (exception: avatars, pills)
- [ ] **Font hierarchy** -- `font-serif` for page titles, `font-sans` for body/UI, `font-mono` for labels/badges
- [ ] **Mono uppercase labels** -- All metadata, badges, column headers use `text-xs font-mono uppercase tracking-widest`
- [ ] **Blue is the only accent** -- `text-primary` for active states, links, numbers. No random greens/oranges.
- [ ] **Semantic tokens only** -- Never `bg-white`, `text-gray-500`, `border-zinc-800`. Always `bg-background`, `text-muted-foreground`, `border-border`.
- [ ] **Real photos** -- No stock imagery. Credit photographers.

### Dashboard Component DNA

Every dashboard component inherits from the landing page's editorial language:

```typescript
// Page heading -- matches landing page section titles
<h1 className="font-serif text-3xl font-bold text-foreground text-balance">Your Events</h1>

// Breadcrumb / context label -- matches landing page section tags
<span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Organizer</span>

// Metric card -- matches landing page stats row (500+ / 25+ / 12)
<div className="border border-border p-6">
  <span className="text-3xl font-bold text-primary">127</span>
  <span className="block text-xs font-mono uppercase tracking-widest text-muted-foreground mt-1">Tickets Sold</span>
</div>

// Table header -- mono uppercase, same as landing page labels
<th className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-left py-3 px-4">Event</th>

// Status badge -- bordered, mono, zero radius
<span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border border-primary/30 text-primary">Published</span>

// Empty state -- neon gradient headline (brand moment)
<h2 className="headline-lg neon-gradient-text">No Events Yet</h2>
```

### Brand Violation Quick Check

If you find yourself writing any of these, stop and fix:

| Writing This? | Replace With |
|--------------|-------------|
| `rounded-lg` on a card | Remove it (--radius: 0 handles it) |
| `bg-white` or `bg-gray-50` | `bg-background` or `bg-card` |
| `text-green-500` for success | `text-primary` (blue = positive) |
| Sans-serif page title | `font-serif text-3xl font-bold` |
| Colorful pills/badges | Bordered mono badges: `border border-primary/30 text-primary` |
| Stock photo or placeholder | Real ViBE event photo via `GenerateImage` or actual files |

---

## 7. Supabase & Database Patterns

### Client Usage

Two clients exist. Use the right one:

| Context | Client | Import |
|---------|--------|--------|
| Client Components / Browser | `createClient()` | `@/lib/supabase/client` |
| Server Components / Actions / Route Handlers | `createClient()` | `@/lib/supabase/server` |

```typescript
// In a Server Component or Server Action
import { createClient } from "@/lib/supabase/server"

export async function getEvents() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("start_at", { ascending: true })

  if (error) throw error
  return data
}
```

### Query Patterns

```typescript
// GOOD: Always handle errors
const { data, error } = await supabase.from("events").select("*")
if (error) {
  console.error("Failed to fetch events:", error)
  throw new Error("Failed to fetch events")
}

// GOOD: Use .single() for expected single row
const { data: profile, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single()

// GOOD: Use .maybeSingle() when row might not exist
const { data: membership } = await supabase
  .from("organization_members")
  .select("*")
  .eq("user_id", userId)
  .eq("org_id", orgId)
  .maybeSingle()

// BAD: Never ignore errors
const { data } = await supabase.from("events").select("*") // Missing error handling
```

### Migration Script Rules

1. **Sequential numbering.** `001_`, `002_`, `003_`, etc.
2. **Never modify executed scripts.** If you need to change something, create a new migration.
3. **One concern per migration.** Don't mix table creation with RLS policies.
4. **Always include `IF NOT EXISTS` guards** for idempotency when safe to do so.
5. **Test locally** before running against production.

---

## 8. Authentication Patterns

### Session Checking

```typescript
// GOOD: Server-side session check (Server Components / Actions)
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const supabase = await createClient()
const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  redirect("/login")
}

// GOOD: Shared helpers (redirecting / profile-aware)
import { requireAuth, getProfile, requireAdmin } from "@/lib/auth-helpers"
```

### Route Protection

Protected routes are gated by **`proxy.ts`** → **`lib/supabase/middleware.ts`** (session presence). **RLS and server layouts** own fine-grained roles.

| Route Pattern | Requirement |
|--------------|-------------|
| `/dashboard/*`, `/profile/*`, `/organizer/*`, `/admin/*`, `/tickets/*` | Valid session (redirect to `/login` if missing) |
| `/events/*` | Public catalog + detail; mutations still require auth + RLS |
| `/login`, `/signup` | Logged-in users redirected to `/dashboard` |

### Auth Trigger

New user signup automatically creates a `profiles` row via a PostgreSQL trigger (`handle_new_user`). Never create profiles manually from application code.

---

## 9. Server Actions

### Structure

All mutating operations use Next.js Server Actions in `app/actions/`:

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidateTag } from "next/cache"

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in" }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string

  // Validate inputs
  if (!title || title.trim().length === 0) {
    return { error: "Title is required" }
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      org_id: formData.get("org_id") as string,
      status: "draft",
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create event:", error)
    return { error: "Failed to create event" }
  }

  revalidateTag("events", "max")
  return { data }
}
```

### Rules

1. Always start with `"use server"` directive.
2. Always verify authentication first.
3. Always validate and sanitize inputs.
4. Always return `{ data }` or `{ error }` -- never throw from actions called by client forms.
5. Use `revalidateTag()` with a cache life profile to bust relevant caches.
6. Keep actions focused -- one action per mutation type.

---

## 10. API Routes

### Structure

API routes live in `app/api/` and follow RESTful conventions:

```typescript
// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  // Verify webhook signature
  // Process event
  // Return response

  return NextResponse.json({ received: true })
}
```

### Rules

1. Always validate request bodies and headers.
2. Stripe webhooks must verify the signature before processing.
3. Return appropriate HTTP status codes.
4. Never expose internal error details in responses.

---

## 11. Error Handling

### Pattern: Result Objects

Server Actions return result objects instead of throwing:

```typescript
// GOOD: Return result object
export async function createOrder(eventId: string, ticketTypeId: string) {
  try {
    // ... logic
    return { data: order, error: null }
  } catch (err) {
    console.error("createOrder failed:", err)
    return { data: null, error: "Failed to create order" }
  }
}

// In the component
const result = await createOrder(eventId, ticketTypeId)
if (result.error) {
  toast.error(result.error)
  return
}
// Use result.data
```

### Client Error Boundaries

Use React error boundaries for unexpected client errors. Each major route should have one.

### Logging

- **Server-side:** Use `console.error()` for errors, `console.warn()` for recoverable issues.
- **Client-side:** Use `console.log("[v0] ...")` for debug statements during development. Remove before shipping.
- **Never log sensitive data** (tokens, passwords, PII).

---

## 12. Performance Guidelines

### Image Optimization

```typescript
// GOOD: Proper image usage
<Image
  src="/event-flyer.jpg"
  alt="Summer Block Party flyer"
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// BAD: No sizes prop, quality=100, multiple priority flags
<Image src="/image.jpg" quality={100} priority fill />
```

**Rules:**
- Use `quality={75}` (default) unless there's a strong reason for higher.
- Only one image per page should have `priority`.
- Always include `sizes` for responsive images.
- Use `loading="lazy"` for below-fold images (default behavior).

### Bundle Size

- Dynamically import heavy libraries (`Three.js`, chart libraries).
- Prefer Server Components to reduce client JS.
- Check that `"use client"` is only on components that truly need it.

### Animation Performance

- Use `will-change: transform` on animated elements.
- Prefer `transform` and `opacity` for animations (GPU-composited).
- Pause animations when off-screen or tab is hidden.

---

## 13. Security Standards

### Input Validation

All user inputs must be validated server-side, even if client validation exists:

```typescript
// Server Action
const title = formData.get("title") as string
if (!title || title.trim().length === 0) return { error: "Title is required" }
if (title.length > 200) return { error: "Title too long" }
```

### SQL Injection Prevention

Supabase client methods are parameterized by default. Never construct raw SQL from user input:

```typescript
// GOOD: Parameterized via Supabase client
const { data } = await supabase.from("events").select("*").eq("id", eventId)

// BAD: Raw SQL with string interpolation
const { data } = await supabase.rpc("raw_query", { sql: `SELECT * FROM events WHERE id = '${eventId}'` })
```

### RLS is Mandatory

Every table must have RLS enabled. No exceptions. See `VIBE_APP_SPECIFICATION.md` Section 6 for all policies.

### Environment Variables

- Server-only secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Public (browser-safe): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Never prefix secrets with `NEXT_PUBLIC_`.

---

## 14. File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Pages | `page.tsx` (Next.js convention) | `app/events/page.tsx` |
| Layouts | `layout.tsx` | `app/layout.tsx` |
| Components | kebab-case | `event-card.tsx` |
| Server Actions | kebab-case, domain-grouped | `app/actions/events.ts` |
| API Routes | `route.ts` in directory | `app/api/stripe/webhook/route.ts` |
| Utilities | kebab-case | `auth-helpers.ts` |
| Types | kebab-case | `types/events.ts` |
| SQL Migrations | `NNN_description.sql` | `003_create_enums.sql` |
| Documentation | `ALL_CAPS.md` | `CODING_STANDARDS.md` |

---

## 15. Git Conventions

### Commit Messages

Use conventional commits:

```
feat: add event creation form
fix: correct RLS policy for ticket viewing
docs: update migration plan with Phase 3 scripts
refactor: extract RSVP button into client component
perf: dynamically import Three.js background
chore: update dependencies
```

### Branch Naming

```
feature/event-creation
fix/rls-ticket-policy
docs/coding-standards
refactor/server-components
```

---

## 16. Anti-Patterns (Never Do This)

| Anti-Pattern | Why | Do This Instead |
|-------------|-----|----------------|
| `localStorage` for data persistence | Not a real backend, lost on clear | Use Supabase database |
| `"use client"` on everything | Bloats JS bundle, kills performance | Server Components by default |
| `useEffect` for data fetching | Race conditions, no caching | Pass data from RSC or use SWR |
| `// @ts-ignore` | Hides real bugs | Fix the type error properly |
| Raw SQL from user input | SQL injection risk | Use Supabase parameterized queries |
| Fetching in `useEffect` | No caching, waterfall requests | Use SWR or server-side fetching |
| Multiple Supabase clients | Inconsistent auth state | Use canonical clients in `lib/supabase/` |
| Editing `components/ui/*` directly | shadcn updates will overwrite | Wrap or extend in custom components |
| `quality={100}` on images | 40% larger files, no visual difference | Use default 75 |
| Mixing `margin` with `gap` | Unpredictable spacing | Use `gap` consistently |
| `space-x-*` or `space-y-*` | Breaks with flex-wrap, inconsistent | Use `gap-*` instead |
| Committing `.env` files | Exposes secrets | Use Vercel env vars |
| Manual profile creation | Bypasses trigger, creates drift | Auth trigger handles it |
| Modifying executed migrations | Breaks migration history | Create new migration script |
| `rounded-lg` on cards/buttons | Breaks zero-radius editorial brand | Remove; `--radius: 0` handles it |
| `bg-white` or light backgrounds | ViBE is dark-mode-only | Use `bg-background` or `bg-card` |
| Sans-serif page headings | Loses editorial distinction | Use `font-serif` for page/section titles |
| Colorful status badges | Clashes with monochrome+blue palette | Bordered mono badges with brand colors |
| Stock photography | Feels generic, not community | Real ViBE event photos only |

---

## Appendix: Quick Reference Card

### Creating a New Feature

1. Check if a Layer 2 contract exists for the domain. If not, create one.
2. Write the migration script first (schema before code).
3. Run the migration.
4. Create Server Components for display, Client Components only for interactivity.
5. Put mutations in `app/actions/`.
6. Add RLS policies for any new tables.
7. Update the relevant journey document.
8. Test the full flow end-to-end.

### Pre-Push Checklist

- [ ] TypeScript compiles with no errors
- [ ] No `any` types introduced
- [ ] No `"use client"` on components that don't need it
- [ ] All new tables have RLS enabled + policies
- [ ] Server Actions validate inputs and check auth
- [ ] Images have `alt` text and `sizes` prop
- [ ] No raw color values (using design tokens)
- [ ] No `console.log` debug statements left in
- [ ] Documentation updated if schema or routes changed
