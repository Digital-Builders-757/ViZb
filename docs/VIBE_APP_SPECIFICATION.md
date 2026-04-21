# ViBE App - MVP Technical Specification

> **Layer 1 Source of Truth** -- Canonical technical specification for the ViBE events platform.
> Covers user flows, database architecture, authentication, payments, and implementation roadmap.
>
> **Last Updated:** February 5, 2026

### Related Documentation

| Document | Purpose |
|----------|---------|
| [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) | Documentation spine and navigation |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Code style, patterns, and anti-patterns |
| [ARCHITECTURE_SOURCE_OF_TRUTH.md](./ARCHITECTURE_SOURCE_OF_TRUTH.md) | Module ownership and wiring laws |
| [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md) | Quick-start guide for developers and AI agents |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Account Model & Roles](#2-account-model--roles)
3. [User Flows](#3-user-flows)
4. [Page Map & Route Structure](#4-page-map--route-structure)
5. [Database Schema (Supabase / Postgres)](#5-database-schema-supabase--postgres)
6. [Row Level Security (RLS) Policies](#6-row-level-security-rls-policies)
7. [Authentication](#7-authentication)
8. [Stripe Payments Architecture](#8-stripe-payments-architecture)
9. [File Storage (Supabase Storage)](#9-file-storage-supabase-storage)
10. [API Routes & Server Actions](#10-api-routes--server-actions)
11. [Migration Plan (SQL Scripts)](#11-migration-plan-sql-scripts)
12. [Implementation Roadmap](#12-implementation-roadmap)
13. [Existing Infrastructure](#13-existing-infrastructure)
14. [Technical Stack](#14-technical-stack)
15. [Data Synchronization Strategy](#15-data-synchronization-strategy)

---

## 1. Project Overview

ViBE is an events discovery and ticketing platform targeting the Virginia/DMV creative community. The MVP enables:

- **Attendees** to browse events, RSVP for free events, purchase tickets for paid events, and present tickets at the door.
- **Organizers** (venues, partners, promoters) to create and manage events, sell tickets, and check attendees in at the door.
- **Admins** (ViBE team) to moderate content, approve organizers, and monitor platform metrics.

### Core Design Principles

- **Flyer-first**: Events are presented visually, led by flyer imagery.
- **Unified ticket model**: Free RSVPs are treated as $0 tickets, providing one consistent door-check flow.
- **Role layering**: Everyone is a User. Roles and organization memberships are layered on top.
- **Progressive complexity**: Ship the simplest version first, enhance later (e.g., manual check-in before QR scanning).

---

## 2. Account Model & Roles

### Philosophy

Rather than three separate account types, every person is a **User** (via Supabase Auth). Capabilities are determined by **role flags** and **organization memberships**.

### Role Definitions

| Role | Who | Capabilities |
|------|-----|-------------|
| **Attendee** | Any registered user | Browse events, RSVP, buy tickets, view own tickets |
| **Organizer** | User with org membership | All attendee capabilities + create events, manage ticket types, view attendee lists, check-in at door |
| **Admin** | ViBE team (`role_admin = true`) | All capabilities + approve orgs/events, moderate users, view platform metrics |

### How Roles Work

```
User (profiles table)
  ├── role_admin: boolean (ViBE team only)
  └── organization_members (join table)
       ├── org_id → organizations
       └── role: 'owner' | 'manager' | 'staff'
```

- **Attendee**: Any authenticated user with no special flags.
- **Organizer**: A user who belongs to at least one organization via `organization_members`.
- **Admin**: A user with `role_admin = true` on their profile.
- A user can be both an attendee AND an organizer (they can attend other people's events).

---

## 3. User Flows

### 3.1 Attendee Flow

```
Sign Up / Login
    │
    ▼
Browse Events (flyer-first feed, filterable by city/date/category)
    │
    ▼
Open Event Detail Page
    │
    ├── Free Event ──► RSVP (creates $0 order + ticket instantly)
    │
    └── Paid Event ──► Select Ticket Type + Quantity
                           │
                           ▼
                       Stripe Checkout (redirect)
                           │
                           ▼
                       Payment Confirmed (webhook)
                           │
                           ▼
                       Tickets Minted → appear in "My Tickets"
    │
    ▼
Event Day: Open "My Tickets" → Show Ticket (code/QR) at Door
```

**Key screens:**
- Event feed with flyer images, date, city, category badges
- Event detail with description, ticket tiers, RSVP/buy buttons
- Ticket wallet showing all upcoming + past tickets
- Individual ticket view with large ticket code (QR-ready for v2)

### 3.2 Organizer Flow

```
Apply to Become Organizer (or get invited by admin)
    │
    ▼
Admin Approves → User gains org membership
    │
    ▼
Create / Join Organization (Venue, Partner, or Promoter)
    │
    ▼
Create Event (draft)
    ├── Upload Flyer
    ├── Set Date / Time / Location
    ├── Add Ticket Types (free or paid, with capacity)
    └── Submit for Review
    │
    ▼
Admin Publishes Event → Appears in Public Feed
    │
    ▼
Event Day: Open Door Screen
    ├── View Attendee / Ticket List
    └── Mark Tickets as "Checked In" (manual tap)
```

**Key screens:**
- Organizer dashboard with event list and stats
- Event creation/edit form with flyer upload
- Ticket type management (name, price, capacity, sale window)
- Door screen with attendee list and check-in toggle

### 3.3 Admin Flow

```
Login (role_admin = true)
    │
    ▼
Admin Dashboard
    ├── Pending Organizers / Organizations → Approve / Reject
    ├── Pending Events → Review → Publish / Reject
    ├── User Management → Moderate / Remove
    └── Metrics → Events created, RSVPs, ticket sales, revenue
```

**Key screens:**
- Approval queues (orgs, events)
- User management table
- Basic metrics dashboard (counts, totals)

---

## 4. Page Map & Route Structure

### Public / Attendee Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Landing page (current website) | No |
| `/events` | Event feed (flyer grid, filterable) | No (browsing), Yes (RSVP/buy) |
| `/events/[id]` | Event detail + RSVP / ticket purchase | No (viewing), Yes (actions) |
| `/tickets` | My ticket wallet | Yes |
| `/tickets/[id]` | Individual ticket (showable at door) | Yes |
| `/login` | Sign in | No |
| `/signup` | Create account | No |
| `/profile` | User profile / settings | Yes |

### Organizer Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/organizer` | Organizer dashboard (overview) | Yes + Org Member |
| `/organizer/events` | List of org's events + create new | Yes + Org Member |
| `/organizer/events/new` | Create event form | Yes + Org Member |
| `/organizer/events/[id]` | Edit event, manage ticket types | Yes + Org Member |
| `/organizer/events/[id]/door` | Door check-in screen | Yes + Org Member |
| `/organizer/settings` | Organization settings, Stripe Connect | Yes + Org Owner |

### Admin Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/admin` | Admin dashboard (metrics) | Yes + Admin |
| `/admin/events` | Event approval queue | Yes + Admin |
| `/admin/orgs` | Organization approval queue | Yes + Admin |
| `/admin/users` | User moderation | Yes + Admin |

---

## 5. Database Schema (Supabase / Postgres)

### 5.1 Enums

```sql
-- Organization types
CREATE TYPE org_type AS ENUM ('venue', 'partner', 'promoter');

-- Organization status
CREATE TYPE org_status AS ENUM ('pending', 'active', 'suspended');

-- Organization member roles
CREATE TYPE org_member_role AS ENUM ('owner', 'manager', 'staff');

-- Event status lifecycle
CREATE TYPE event_status AS ENUM ('draft', 'pending', 'published', 'cancelled');

-- Order status lifecycle
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');

-- Event media types
CREATE TYPE media_kind AS ENUM ('flyer', 'gallery');
```

### 5.2 Core Tables

#### `profiles` - User profiles linked to Supabase Auth

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  role_admin   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Notes:**
- `id` mirrors `auth.users.id` (set via trigger on signup).
- `role_admin` should only be set via direct DB access or admin RPC, never client-side.

#### `organizations` - Venues, Partners, Promoters

```sql
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  type        org_type NOT NULL DEFAULT 'partner',
  status      org_status NOT NULL DEFAULT 'pending',
  description TEXT,
  logo_url    TEXT,
  stripe_account_id TEXT,          -- Stripe Connect account (nullable until onboarded)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `organization_members` - Who can manage an organization

```sql
CREATE TABLE organization_members (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role    org_member_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);
```

#### `events` - The core event listing

```sql
CREATE TABLE events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  start_at       TIMESTAMPTZ NOT NULL,
  end_at         TIMESTAMPTZ,
  location_text  TEXT NOT NULL,
  location_city  TEXT,              -- For filtering
  category       TEXT,              -- e.g., 'party', 'workshop', 'networking', 'social'
  status         event_status NOT NULL DEFAULT 'draft',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_events_org_id ON events(org_id);
CREATE INDEX idx_events_city ON events(location_city);
```

#### `event_media` - Flyers and gallery images

```sql
CREATE TABLE event_media (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,       -- Supabase Storage path
  kind         media_kind NOT NULL DEFAULT 'flyer',
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `ticket_types` - Ticket tiers per event

```sql
CREATE TABLE ticket_types (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,       -- e.g., 'General Admission', 'VIP', 'Free RSVP'
  price_cents  INT NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'usd',
  capacity     INT,                 -- NULL = unlimited
  sales_start  TIMESTAMPTZ,
  sales_end    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Key design decision:** Free RSVPs are a ticket type with `price_cents = 0`. This means every "RSVP" still creates an order + ticket, giving us one unified door-check flow.

#### `orders` - Purchase records

```sql
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id     UUID NOT NULL REFERENCES profiles(id),
  event_id          UUID NOT NULL REFERENCES events(id),
  status            order_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,           -- Stripe Checkout session ID (null for free)
  total_cents       INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_user_id);
CREATE INDEX idx_orders_event ON orders(event_id);
CREATE INDEX idx_orders_stripe ON orders(stripe_session_id);
```

#### `order_items` - Line items within an order

```sql
CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_type_id  UUID NOT NULL REFERENCES ticket_types(id),
  qty             INT NOT NULL DEFAULT 1,
  unit_price_cents INT NOT NULL DEFAULT 0
);
```

#### `tickets` - What attendees show at the door

```sql
CREATE TABLE tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id   UUID NOT NULL REFERENCES order_items(id),
  owner_user_id   UUID NOT NULL REFERENCES profiles(id),
  event_id        UUID NOT NULL REFERENCES events(id),
  ticket_code     TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  checked_in_at   TIMESTAMPTZ,     -- NULL = not checked in
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_owner ON tickets(owner_user_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_code ON tickets(ticket_code);
```

**Notes:**
- `ticket_code` is a unique hex string (16 chars). In v2, this becomes a QR code payload.
- `checked_in_at` being non-null = attendee was checked in at the door.

### 5.3 Existing Tables (Already in Production)

The following table already exists from the waitlist feature and should be preserved:

```sql
-- Already exists: subscribers (waitlist)
-- Columns: id, email, phone_number, subscribed_at, source
-- RLS: Public insert, public select
```

### 5.4 Entity Relationship Diagram

```
auth.users
    │ 1:1
    ▼
profiles ──────────┐
    │               │
    │ 1:N           │ 1:N
    ▼               ▼
organization    orders ────► order_items ────► tickets
_members            │               │
    │               │               │
    │ N:1           │ N:1           │ N:1
    ▼               ▼               ▼
organizations ──► events ──► ticket_types
                    │
                    │ 1:N
                    ▼
              event_media
```

---

## 6. Row Level Security (RLS) Policies

All tables must have RLS enabled. Below are the exact policies needed.

### 6.1 `profiles`

```sql
-- Users can read any profile (for display names, avatars)
CREATE POLICY "Public profiles are viewable" ON profiles
  FOR SELECT USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profile is created via trigger (not direct insert)
```

### 6.2 `organizations`

```sql
-- Anyone can view active organizations
CREATE POLICY "Public can view active orgs" ON organizations
  FOR SELECT USING (status = 'active');

-- Admins can view all orgs (including pending)
CREATE POLICY "Admins can view all orgs" ON organizations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_admin = true)
  );

-- Admins can update org status (approve/suspend)
CREATE POLICY "Admins can update orgs" ON organizations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_admin = true)
  );

-- Authenticated users can create an org (it starts as 'pending')
CREATE POLICY "Authenticated can create org" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### 6.3 `organization_members`

```sql
-- Members can view their own memberships
CREATE POLICY "Users can view own memberships" ON organization_members
  FOR SELECT USING (user_id = auth.uid());

-- Org owners can view all members of their org
CREATE POLICY "Org owners can view org members" ON organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

-- Org owners can add members
CREATE POLICY "Org owners can add members" ON organization_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = org_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );
```

### 6.4 `events`

```sql
-- Anyone can view published events
CREATE POLICY "Public can view published events" ON events
  FOR SELECT USING (status = 'published');

-- Org members can view their own org's events (any status)
CREATE POLICY "Org members can view own events" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = events.org_id AND om.user_id = auth.uid()
    )
  );

-- Org members can create events for their org
CREATE POLICY "Org members can create events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = org_id AND om.user_id = auth.uid()
    )
  );

-- Org members can update their own org's events
CREATE POLICY "Org members can update own events" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = events.org_id AND om.user_id = auth.uid()
    )
  );

-- Admins can do everything with events
CREATE POLICY "Admins full access to events" ON events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_admin = true)
  );
```

### 6.5 `ticket_types`

```sql
-- Anyone can view ticket types for published events
CREATE POLICY "Public can view ticket types" ON ticket_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events WHERE events.id = ticket_types.event_id AND events.status = 'published'
    )
  );

-- Org members can manage ticket types for their events
CREATE POLICY "Org members can manage ticket types" ON ticket_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organization_members om ON om.org_id = e.org_id
      WHERE e.id = ticket_types.event_id AND om.user_id = auth.uid()
    )
  );
```

### 6.6 `orders`

```sql
-- Buyers can view their own orders
CREATE POLICY "Buyers can view own orders" ON orders
  FOR SELECT USING (buyer_user_id = auth.uid());

-- Org members can view orders for their events
CREATE POLICY "Org members can view event orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organization_members om ON om.org_id = e.org_id
      WHERE e.id = orders.event_id AND om.user_id = auth.uid()
    )
  );

-- Authenticated users can create orders
CREATE POLICY "Authenticated can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_user_id);
```

### 6.7 `tickets`

```sql
-- Ticket owners can view their own tickets
CREATE POLICY "Owners can view own tickets" ON tickets
  FOR SELECT USING (owner_user_id = auth.uid());

-- Org members can view tickets for their events (door check)
CREATE POLICY "Org members can view event tickets" ON tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organization_members om ON om.org_id = e.org_id
      WHERE e.id = tickets.event_id AND om.user_id = auth.uid()
    )
  );

-- Org members can update tickets (check-in)
CREATE POLICY "Org members can check in tickets" ON tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organization_members om ON om.org_id = e.org_id
      WHERE e.id = tickets.event_id AND om.user_id = auth.uid()
    )
  );
```

---

## 7. Authentication

### 7.1 Provider: Supabase Auth

The project already uses `@supabase/ssr` with both client and server helpers (see `lib/supabase/client.ts` and `lib/supabase/server.ts`).

### 7.2 Auth Methods (MVP)

| Method | Priority | Notes |
|--------|----------|-------|
| Email + Password | Must have | Standard sign up / login |
| Google OAuth | Nice to have | Easy add via Supabase dashboard |
| Magic Link | Nice to have | Good for mobile users |

### 7.3 Profile Creation Trigger

When a new user signs up, automatically create a `profiles` row:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 7.4 Session refresh and route protection (proxy)

```
/organizer/*  → Requires auth + org membership
/admin/*      → Requires auth + role_admin = true
/tickets/*    → Requires auth
/events/*     → Public (but actions require auth)
```

Implementation: Root **`proxy.ts`** (Next.js 16) delegates to **`lib/supabase/middleware.ts`** (`updateSession`) for cookie refresh and **session-presence** redirects; unauthenticated users hitting protected prefixes are sent to `/login`. Fine-grained roles still come from layouts + RLS.

### 7.5 Helper: Check User Role

```typescript
// lib/auth-helpers.ts
export async function getUserRole(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, isAdmin: false, orgMemberships: [] }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role_admin')
    .eq('id', user.id)
    .single()

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('org_id, role, organizations(name, slug)')
    .eq('user_id', user.id)

  return {
    user,
    isAdmin: profile?.role_admin ?? false,
    orgMemberships: memberships ?? []
  }
}
```

---

## 8. Stripe Payments Architecture

### 8.1 MVP Approach: Stripe Checkout

Use Stripe Checkout (hosted payment page) for ticket purchases. This is the fastest, most secure approach - no custom payment forms needed.

### 8.2 Payment Flow

```
User clicks "Buy Ticket"
    │
    ▼
Server Action: Create Order (status: 'pending')
    │
    ▼
Server Action: Create Stripe Checkout Session
    ├── line_items: ticket types + quantities
    ├── metadata: { order_id, event_id, user_id }
    ├── success_url: /tickets?success=true
    └── cancel_url: /events/[id]?cancelled=true
    │
    ▼
Redirect user to Stripe Checkout
    │
    ▼
User completes payment on Stripe
    │
    ▼
Stripe sends webhook: checkout.session.completed
    │
    ▼
Webhook handler:
    ├── Update order status → 'paid'
    ├── Create order_items
    └── Mint tickets (one per qty per line item)
    │
    ▼
User redirected to /tickets (tickets now visible)
```

### 8.3 Free RSVP Flow (No Stripe)

```
User clicks "RSVP"
    │
    ▼
Server Action:
    ├── Create order (status: 'paid', total_cents: 0)
    ├── Create order_item (ticket_type with price_cents: 0)
    └── Mint ticket immediately
    │
    ▼
Redirect to /tickets (ticket visible)
```

### 8.4 Stripe Connect (Phase 2 - Organizer Payouts)

When ViBE needs to pay out organizers:

1. Add `stripe_account_id` to `organizations` table (already included in schema above).
2. Create an onboarding endpoint that generates a Stripe Connect onboarding link.
3. Checkout sessions use `payment_intent_data.transfer_data.destination` to route funds.
4. ViBE takes a cut via `payment_intent_data.application_fee_amount`.

**MVP Fallback:** Run all sales through ViBE's own Stripe account. Do manual payouts to organizers. Add Connect after traction.

### 8.5 Required API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/stripe/create-checkout-session` | POST | Creates Stripe Checkout session |
| `/api/stripe/webhook` | POST | Handles Stripe webhook events |
| `/api/stripe/connect/onboard` | POST | (Phase 2) Generates Connect onboarding link |

### 8.6 Required Environment Variables

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 9. File Storage (Supabase Storage)

### 9.1 Buckets

| Bucket | Purpose | Public |
|--------|---------|--------|
| `event-flyers` | Event flyer images | Yes (public URLs for feed) |
| `event-gallery` | Additional event photos | Yes |
| `avatars` | User profile photos | Yes |
| `org-logos` | Organization logos | Yes |

### 9.2 Upload Flow

1. Organizer selects image in event creation form.
2. Client uploads directly to Supabase Storage (using signed upload URL or client library).
3. On success, save the storage path to `event_media.storage_path`.
4. Public URL is constructed: `{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}`.

### 9.3 Storage Policies

```sql
-- Anyone can view public bucket files
-- Only org members can upload to event-flyers (validated via RPC or server-side upload)
-- Users can upload their own avatar
```

---

## 10. API Routes & Server Actions

### 10.1 Server Actions (Next.js)

| Action | File | Purpose |
|--------|------|---------|
| `subscribeToWaitlist` | `app/actions/subscribe.ts` | **Exists** - Waitlist signup |
| `createEvent` | `app/actions/events.ts` | Create event draft |
| `updateEvent` | `app/actions/events.ts` | Update event details |
| `submitEventForReview` | `app/actions/events.ts` | Change status to 'pending' |
| `publishEvent` | `app/actions/admin.ts` | Admin: Change status to 'published' |
| `createOrder` | `app/actions/orders.ts` | Create order + handle free RSVP |
| `checkInTicket` | `app/actions/tickets.ts` | Mark ticket as checked in |
| `createOrganization` | `app/actions/orgs.ts` | Create new org (pending) |
| `approveOrganization` | `app/actions/admin.ts` | Admin: Activate org |

### 10.2 API Routes

| Route | Purpose |
|-------|---------|
| `app/api/stripe/create-checkout-session/route.ts` | Create Stripe Checkout session |
| `app/api/stripe/webhook/route.ts` | Handle Stripe webhooks |
| `app/auth/callback/route.ts` | Supabase auth callback (OAuth) |

---

## 11. Migration Plan (SQL Scripts)

Migrations should be executed sequentially. Existing migrations (001, 002) are preserved.

| Script | Purpose | Dependencies |
|--------|---------|-------------|
| `scripts/001_create_subscribers_table.sql` | **Exists** - Waitlist table | None |
| `scripts/002_add_phone_number.sql` | **Exists** - Phone number column | 001 |
| `scripts/003_create_enums.sql` | Create all enum types | None |
| `scripts/004_create_profiles.sql` | Profiles table + auth trigger | 003 |
| `scripts/005_create_organizations.sql` | Organizations + members tables | 004 |
| `scripts/006_create_events.sql` | Events + media tables | 005 |
| `scripts/007_create_tickets.sql` | Ticket types, orders, order items, tickets | 006 |
| `scripts/008_enable_rls.sql` | Enable RLS + all policies | 004-007 |
| `scripts/009_create_indexes.sql` | Performance indexes | 006-007 |

---

## 12. Implementation Roadmap

### Phase 1: Foundation (Auth + Profiles + Roles)

**Goal:** Users can sign up, log in, and have profiles with role support.

- [ ] Run migrations 003-005
- [ ] Implement auth pages (`/login`, `/signup`)
- [ ] Set up middleware for route protection
- [ ] Create `getUserRole` helper
- [ ] Build profile page (`/profile`)

### Phase 2: Events + Media (Public Feed)

**Goal:** Organizers can create events with flyers. Public can browse published events.

- [ ] Run migration 006
- [ ] Build event creation form (organizer)
- [ ] Implement flyer upload to Supabase Storage
- [ ] Build public event feed (`/events`) - flyer-first grid
- [ ] Build event detail page (`/events/[id]`)
- [ ] Build admin event approval queue (`/admin/events`)

### Phase 3: Ticket Types + Free RSVP

**Goal:** Events have ticket tiers. Attendees can RSVP to free events and receive tickets.

- [x] Run ticketing migrations — `028_tickets_core_free_rsvp.sql` / `20260410142142_tickets_core_free_rsvp.sql` (+ `029` / `20260410144936_*` for tier editor); see `docs/database/MIGRATIONS.md`
- [x] Build **free** ticket type management (organizer) — `app/actions/ticket-types.ts`, organizer event panel
- [x] Implement free RSVP flow (instant ticket minting) — `app/actions/registrations.ts` + `mint_free_rsvp_ticket_for_registration`
- [x] Build ticket wallet (`/tickets`; `/dashboard/tickets` alias)
- [x] Build individual ticket view (`/tickets/[ticketId]`)
- [ ] Paid tier management + checkout (Phase 4)

### Phase 4: Paid Tickets (Stripe)

**Goal:** Attendees can purchase paid tickets via Stripe Checkout.

- [ ] Set up Stripe environment variables
- [ ] Build `/api/stripe/create-checkout-session`
- [ ] Build `/api/stripe/webhook` (order confirmation + ticket minting)
- [ ] Integrate Stripe Checkout redirect into event detail page
- [ ] Test full purchase flow end-to-end

### Phase 5: Door Check-In

**Goal:** Organizers can check in attendees at the door.

- [ ] Build door screen (`/organizer/events/[id]/door`)
- [ ] Implement manual check-in (tap to mark `checked_in_at`)
- [ ] Show check-in stats (checked in / total)

### Phase 6: Admin + Polish

**Goal:** Admin dashboard, organization management, platform metrics.

- [ ] Build org approval queue (`/admin/orgs`)
- [ ] Build user management (`/admin/users`)
- [ ] Build basic metrics dashboard
- [ ] Polish responsive design for all screens

### Future Phases (Post-MVP)

- QR code scanning for door check-in
- Stripe Connect for organizer payouts
- Push notifications for event reminders
- Event recommendations / "For You" feed
- Social features (follow organizers, invite friends)
- Event chat / community features

---

## 13. Existing Infrastructure

### Already Built

| Component | Location | Notes |
|-----------|----------|-------|
| Landing page | `app/page.tsx` | Full homepage with hero, events preview, editorial grid, app mockup, waitlist |
| Supabase client | `lib/supabase/client.ts` | Browser client using `@supabase/ssr` |
| Supabase server | `lib/supabase/server.ts` | Server client with cookie handling |
| Waitlist signup | `app/actions/subscribe.ts` | Server action inserting to `subscribers` table |
| Subscribers table | `scripts/001-002` | Email + phone waitlist with RLS |

### Supabase Config

- **Client library:** `@supabase/ssr` (already installed)
- **Auth:** Email/password ready (configured in Supabase dashboard)
- **Environment variables needed:**
  - `NEXT_PUBLIC_SUPABASE_URL` (should exist from waitlist)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (should exist from waitlist)

---

## 14. Technical Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Payments | Stripe Checkout + Webhooks |
| Hosting | Vercel |

### Key Dependencies (to add)

```json
{
  "stripe": "^17.0.0",
  "@stripe/stripe-js": "^5.0.0"
}
```

---

## Appendix: Quick Reference

### Ticket Lifecycle

```
ticket_type created (by organizer)
    │
    ▼
order created (by attendee) → status: 'pending'
    │
    ├── Free: immediately → status: 'paid' → ticket minted
    │
    └── Paid: Stripe Checkout → webhook → status: 'paid' → ticket minted
    │
    ▼
ticket exists (ticket_code generated)
    │
    ▼
door check-in → checked_in_at = now()
```

### Event Lifecycle

```
draft → pending (submitted for review) → published (approved by admin)
                                        → cancelled (by organizer or admin)
```

### Order Status State Machine

```
pending ──► paid ──► refunded
    │
    └──► cancelled
```

---

## 15. Data Synchronization Strategy

### 15.1 Real-Time Subscriptions (Supabase Realtime)

For features that need live updates without polling:

| Feature | Table | Channel | When |
|---------|-------|---------|------|
| Door check-in counter | `tickets` | `event:{id}:checkins` | Organizer sees live count as attendees check in |
| Attendee list updates | `tickets` | `event:{id}:tickets` | New RSVPs/purchases appear on organizer's list |
| Event status changes | `events` | `event:{id}:status` | Admin publishes event, organizer sees status change |

**Implementation pattern (client-side):**

```typescript
"use client"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export function LiveCheckInCount({ eventId }: { eventId: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    // Initial count
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .not("checked_in_at", "is", null)
      .then(({ count }) => setCount(count ?? 0))

    // Subscribe to changes
    const channel = supabase
      .channel(`event:${eventId}:checkins`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "tickets",
        filter: `event_id=eq.${eventId}`,
      }, () => {
        // Re-fetch count on any ticket update
        supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
          .not("checked_in_at", "is", null)
          .then(({ count }) => setCount(count ?? 0))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  return <span>{count}</span>
}
```

### 15.2 Cache Invalidation Strategy

Next.js cache is busted via `revalidateTag()` in Server Actions:

| Action | Tags to Invalidate | Cache Life Profile |
|--------|--------------------|--------------------|
| `createEvent()` | `events` | `"max"` |
| `publishEvent()` | `events`, `event:{id}` | `"max"` |
| `createOrder()` | `event:{id}:tickets` | `"max"` |
| `checkInTicket()` | `event:{id}:checkins` | `"max"` |
| `approveOrganization()` | `organizations` | `"max"` |

**Pattern:**

```typescript
"use server"
import { revalidateTag } from "next/cache"

export async function publishEvent(eventId: string) {
  // ... mutation logic ...
  revalidateTag("events", "max")
  revalidateTag(`event:${eventId}`, "max")
}
```

### 15.3 Optimistic Updates (Client-Side)

For interactive features like RSVP buttons, use SWR's `mutate()` for instant UI feedback:

```typescript
"use client"
import useSWR, { mutate } from "swr"

function RSVPButton({ eventId }: { eventId: string }) {
  const handleRSVP = async () => {
    // Optimistic: update UI immediately
    mutate(`/api/events/${eventId}/rsvp`, true, false)

    // Server Action: create the actual RSVP
    const result = await createFreeRSVP(eventId)

    if (result.error) {
      // Rollback on failure
      mutate(`/api/events/${eventId}/rsvp`, false, false)
      toast.error(result.error)
    }
  }

  return <button onClick={handleRSVP}>RSVP</button>
}
```

### 15.4 Webhook-Driven Sync (Stripe)

Stripe webhooks are the **only** mechanism for confirming paid orders. The flow is:

1. Client creates Stripe Checkout session (server action)
2. User completes payment on Stripe's hosted page
3. Stripe sends `checkout.session.completed` webhook to `/api/stripe/webhook`
4. Webhook handler verifies signature, then:
   - Updates `orders.status` to `'paid'`
   - Creates `order_items`
   - Mints `tickets` (one per quantity per line item)
5. Next user page load shows tickets via normal Supabase query

**Critical:** Never trust the client redirect from Stripe as confirmation. Only the webhook is authoritative.

### 15.5 Offline Considerations

The MVP does not support offline mode. All operations require an active internet connection. Door check-in specifically requires connectivity to update `tickets.checked_in_at` in real time.

**Future consideration:** A service worker could cache the attendee list for offline check-in, then sync when reconnected. This is post-MVP scope.
