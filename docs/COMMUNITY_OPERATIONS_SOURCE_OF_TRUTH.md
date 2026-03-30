# Community operations source of truth — ViBE (Layer 1)

**Last updated:** March 23, 2026

How **members**, **orgs**, **invites**, and **host applications** relate to the platform. Pair with **`docs/contracts/member_profiles.md`**, **`docs/contracts/auth.md`**, and spec auth/org sections.

---

## 1. Member identity

- **Auth user** (Supabase) + **`profiles`** row — created by **trigger**, not hand-inserted by app code.
- **Roles / flags** (e.g. admin) — DB-backed; UI reflects but does not define security.

---

## 2. Organizations & membership

- Orgs have members with roles; creation and invites flow through **Server Actions** and **RLS**.
- Canonical actions: `app/actions/organization.ts`, `app/actions/invite.ts` — verify paths if refactored.

---

## 3. Host / community programs

- **Host application** flow: `app/(dashboard)/host/apply`, `app/actions/host-application.ts` — operational copy and states should match **`docs/brand/*`** and future **`docs/contracts/community_posts.md`** when built.

---

## 4. Community content (roadmap)

- Posts, comments, or social surfaces **must** reuse the same auth + RLS patterns — document in **`docs/contracts/community_posts.md`** when implemented.

---

## 5. Operations

- **Invites:** `app/invite/claim` — treat as red-zone adjacent (auth + membership side effects).
- **Waitlist / subscribers:** marketing capture; policies in SQL + `app/actions/subscribe.ts`.

---

## 6. Command

Use **`/event-flow`** when changes touch event + attendance; use **`/brand-check`** + **`/content-sync`** when community-facing copy or surfaces change.
