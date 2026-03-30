---
name: Simplify Authentication Flow - Direct to Talent Dashboard
overview: Refactor the authentication flow to eliminate redundant role selection pages and route users directly to the Talent Dashboard after email verification. Add Career Builder application link to Talent Dashboard header. Disable role selection pages for MVP.
todos:
  - id: update-auth-callback
    content: Update email verification callback to redirect directly to Talent Dashboard instead of choose-role
    status: pending
  - id: update-signup-form
    content: "Ensure signup form sets account_type: talent immediately on profile creation"
    status: pending
  - id: update-auth-actions
    content: Update handleLoginRedirect and ensureProfileExists to default to Talent Dashboard instead of onboarding
    status: pending
  - id: update-middleware
    content: Remove onboarding redirects for unassigned users - send them to Talent Dashboard
    status: pending
  - id: disable-onboarding-page
    content: Redirect /onboarding/select-account-type to Talent Dashboard for authenticated users
    status: pending
  - id: disable-choose-role-page
    content: Redirect /choose-role to Talent Dashboard for authenticated users, show signup for unauthenticated
    status: pending
  - id: add-career-builder-link
    content: Add Apply to be a Career Builder button/link in Talent Dashboard header
    status: pending
  - id: update-login-page
    content: Update login page signup link to point directly to signup instead of choose-role
    status: pending
  - id: update-onboarding-actions
    content: Simplify selectAccountType action to always set talent and redirect to Talent Dashboard
    status: pending
---

# Simplify Authentication Flow - Direct to Talent Dashboard

## Current Flow Analysis

**Current redundant flow:**

1. User signs up → `/verification-pending`
2. Email verification → `/auth/callback` → checks role → redirects to `/choose-role` if no role
3. `/choose-role` page → shows Talent/Career Builder selection (Career Builder disabled)
4. `/onboarding/select-account-type` → another role selection page
5. Middleware redirects `account_type === "unassigned"` users to onboarding
6. `handleLoginRedirect` also checks `account_type` and redirects to onboarding

**Issues:**

- Multiple stopping points before Talent Dashboard
- Career Builder selection is disabled but still shown
- Users hit unnecessary pages even though Career Builder isn't functional
- Extra page requests slow down the app

## Target Flow

**Simplified flow:**

1. User signs up → `/verification-pending`
2. Email verification → `/auth/callback` → **directly to `/talent/dashboard`**
3. Talent Dashboard header → "Apply to be a Career Builder" link → `/client/apply`
4. No role selection pages in the flow

## Implementation Plan

### 1. Update Email Verification Callback (`app/auth/callback/page.tsx`)

**Change:** Always redirect to Talent Dashboard after verification (unless admin/client already set)

- Remove redirect to `/choose-role` fallback
- Default to `/talent/dashboard` for new users
- Only redirect to `/client/dashboard` or `/admin/dashboard` if role is explicitly set

**Lines to modify:** 199-205, 275-281

### 2. Update Signup Form (`components/forms/talent-signup-form.tsx`)

**Change:** Set `account_type: "talent"` immediately on signup via profile creation

- Ensure `ensureProfilesAfterSignup` sets `account_type: "talent"` 
- Update profile creation to include `account_type: "talent"` in addition to `role: "talent"`

**Lines to modify:** 86-93 (signup metadata), ensure profile creation includes account_type

### 3. Update Auth Actions (`lib/actions/auth-actions.ts`)

**Change:** Default to Talent Dashboard instead of onboarding/choose-role

- `handleLoginRedirect`: Remove redirect to `/onboarding/select-account-type`
- Default unassigned users to `/talent/dashboard` instead of onboarding
- Update `ensureProfileExists` to set `account_type: "talent"` if missing

**Lines to modify:** 434-479 (redirect logic), 56-104 (profile creation)

### 4. Update Middleware (`middleware.ts`)

**Change:** Don't redirect unassigned users to onboarding - send to Talent Dashboard

- Remove onboarding redirect for `account_type === "unassigned"`
- Default unassigned users to `/talent/dashboard`
- Keep admin/client redirects as-is

**Lines to modify:** 131-136 (onboarding check)

### 5. Disable Role Selection Pages

**Option A: Redirect to Talent Dashboard (Recommended)**

- `/onboarding/select-account-type/page.tsx`: Redirect authenticated users to `/talent/dashboard`
- `/choose-role/page.tsx`: Redirect authenticated users to `/talent/dashboard`, show signup form for unauthenticated

**Option B: Keep pages but mark as deprecated**

- Add comments indicating these pages are disabled for MVP
- Redirect all traffic to Talent Dashboard

**Files:** `app/onboarding/select-account-type/page.tsx`, `app/choose-role/page.tsx`

### 6. Add Career Builder Application Link to Talent Dashboard

**File:** `app/talent/dashboard/page.tsx`**Change:** Add "Apply to be a Career Builder" button/link in header

- Add button next to Settings/Notifications buttons
- Link to `/client/apply`
- Style consistently with existing header buttons
- Only show if user doesn't already have client role

**Lines to modify:** 404-423 (header section)

### 7. Update Login Page (`app/login/page.tsx`)

**Change:** Update "Create an account" link

- Change link from `/choose-role` to direct signup or Talent Dashboard
- Consider showing signup form inline or linking to a dedicated signup page

**Lines to modify:** 302 (link destination)

### 8. Update Onboarding Actions (`app/onboarding/select-account-type/actions.ts`)

**Change:** Redirect to Talent Dashboard instead of allowing role selection

- `selectAccountType`: Always set to talent and redirect to `/talent/dashboard`
- Remove client selection logic (save for roadmap)

**Lines to modify:** 10-65 (entire function)

## Files to Modify

1. `app/auth/callback/page.tsx` - Email verification redirects
2. `components/forms/talent-signup-form.tsx` - Set account_type on signup
3. `lib/actions/auth-actions.ts` - Login redirect logic and profile creation
4. `middleware.ts` - Remove onboarding redirects
5. `app/onboarding/select-account-type/page.tsx` - Redirect to Talent Dashboard
6. `app/choose-role/page.tsx` - Redirect authenticated users or show signup
7. `app/talent/dashboard/page.tsx` - Add Career Builder application link
8. `app/login/page.tsx` - Update signup link
9. `app/onboarding/select-account-type/actions.ts` - Simplify to always set talent

## Testing Checklist

- [ ] New user signup → email verification → lands on Talent Dashboard
- [ ] Existing user login → lands on Talent Dashboard (if talent)
- [ ] Career Builder application link visible in Talent Dashboard header
- [ ] Career Builder application link goes to `/client/apply`
- [ ] No redirects to `/choose-role` or `/onboarding/select-account-type`
- [ ] Admin users still redirect to `/admin/dashboard`
- [ ] Client users still redirect to `/client/dashboard`
- [ ] Middleware doesn't redirect unassigned users to onboarding

## Roadmap Note