# ViBE -- Brand System (Canonical Visual Identity)

**Last Updated:** February 5, 2026  
**Layer 1 summary:** `docs/BRAND_CONSTITUTION.md` — non-negotiable laws; this file is the **full** token and pattern spec.  
**Authority:** If code or docs contradict **this** file for visual/voice detail, **this file wins** (constitution wins on stated laws).

> **Origin:** These rules were extracted from the live ViBE landing page (January 2026) and codified so every screen -- marketing, dashboard, admin, mobile -- feels like the same brand.

---

## Table of Contents

1. [Brand Personality](#1-brand-personality)
2. [Color System](#2-color-system)
3. [Typography System](#3-typography-system)
4. [Spacing & Layout](#4-spacing--layout)
5. [Corner Radius (Zero Radius Rule)](#5-corner-radius-zero-radius-rule)
6. [Photography & Imagery](#6-photography--imagery)
7. [Motion & Animation](#7-motion--animation)
8. [Logo Usage](#8-logo-usage)
9. [Component Patterns (Landing to Dashboard)](#9-component-patterns-landing-to-dashboard)
10. [Dashboard-Specific Guidelines](#10-dashboard-specific-guidelines)
11. [Voice & Tone](#11-voice--tone)
12. [Anti-Patterns (Brand Violations)](#12-anti-patterns-brand-violations)

---

## 1. Brand Personality

ViBE sits at the intersection of **streetwear editorial** and **community-first events**. Think Hypebeast meets the local block party flyer.

| Trait | Expression |
|-------|-----------|
| **Bold** | Oversized type, high contrast, unapologetic layouts |
| **Underground** | Dark backgrounds, neon accents, raw photography |
| **Community** | Real photos (never stock), photographer credits, inclusive language |
| **Editorial** | Generous whitespace, magazine-style grids, monospace labels |
| **Premium** | Subtle glow effects, refined spacing, intentional restraint |

**One-line test:** If a screen could belong to any generic SaaS product, it fails the ViBE brand test.

---

## 2. Color System

### 2.1 Canonical Palette

ViBE is a **dark-mode-first** brand. Light mode is not currently supported.

| Role | Name | Hex Approximation | CSS Token | Usage |
|------|------|-------------------|-----------|-------|
| Background | Void Black | `#0D0D0D` | `--background` | Page backgrounds, all screens |
| Foreground | Crisp White | `#F9F9F9` | `--foreground` | Primary text, headings |
| Primary | ViBE Blue | `#0D40FF` | `--primary` | CTAs, active states, links, key UI elements |
| Accent | Neon Cyan | `#00BDFF` | `--accent` | Secondary highlights, hover states, chart accents |
| Card | Deep Charcoal | `#151515` | `--card` | Card surfaces, panels, sidebar |
| Muted | Smoke Gray | `#555555` | `--muted-foreground` | Secondary text, placeholders, captions |
| Border | Dim Edge | `#333333` | `--border` | Dividers, card borders, table lines |
| Input | Charcoal | `#1F1F1F` | `--input` | Form inputs, select backgrounds |
| Secondary | Jet | `#1F1F1F` | `--secondary` | Secondary button backgrounds |
| Destructive | Signal Red | `#E53935` | `--destructive` | Error states, delete actions, warnings |

### 2.2 Neon Gradient (Signature Effect)

The ViBE neon gradient is the brand's most recognizable visual element. It flows through headlines and hero text:

```
#0D40FF -> #0C74E8 -> #00BDFF -> #00E5FF -> #0D40FF
```

| CSS Class | When to Use |
|-----------|-------------|
| `.neon-gradient-text` | Hero headlines, brand moments, page titles |
| `.neon-glow` | Primary CTA hover states, active cards, focus rings |
| `.neon-glow-cyan` | Secondary highlights, accent indicators |

**Rule:** The gradient is reserved for **brand moments** -- hero text, section titles, and key CTAs. Never apply it to body text, form labels, or secondary UI.

### 2.3 Color Rules

| Rule | Detail |
|------|--------|
| **Never use raw colors** | Always reference semantic tokens (`bg-background`, `text-primary`, etc.) |
| **No `bg-white` or `text-white`** | Use `bg-foreground` and `text-foreground` |
| **No `bg-black`** | Use `bg-background` |
| **Blue is the only accent** | No random purples, greens, or oranges unless they serve a data viz purpose |
| **Dark mode only** | Do not create light mode variants (this may change post-MVP) |

---

## 3. Typography System

### 3.1 Font Stack

| Font | Tailwind Class | Role | Weight Range |
|------|---------------|------|-------------|
| **Space Grotesk** | `font-sans` | Body text, buttons, navigation, form labels, UI chrome | 400-700 |
| **Playfair Display** | `font-serif` | Editorial headlines, hero text, section titles, blockquotes | 400-700 |
| **JetBrains Mono** | `font-mono` | Labels, timestamps, badges, metadata, code snippets, photo credits | 400-500 |

### 3.2 Type Scale (Landing Page to Dashboard)

| Context | Class | Font | Weight | Size | Usage |
|---------|-------|------|--------|------|-------|
| Hero headline | `.headline-xl` | `font-serif` | 700 | `clamp(3rem, 12vw, 10rem)` | Landing hero only |
| Section headline | `.headline-lg` | `font-serif` | 700 | `clamp(2rem, 8vw, 6rem)` | Section headers across all pages |
| Page title | `text-3xl font-bold` | `font-serif` | 700 | 1.875rem | Dashboard page headings |
| Card title | `text-lg font-semibold` | `font-sans` | 600 | 1.125rem | Event cards, list items |
| Body text | `text-base` | `font-sans` | 400 | 1rem | Descriptions, paragraphs |
| Small body | `text-sm` | `font-sans` | 400 | 0.875rem | Table cells, secondary info |
| Label / Badge | `text-xs font-mono uppercase tracking-widest` | `font-mono` | 400 | 0.75rem | Status badges, metadata, timestamps |
| Caption / Credit | `text-xs font-mono` | `font-mono` | 400 | 0.75rem | Photo credits, footnotes |

### 3.3 Typography Rules

| Rule | Detail |
|------|--------|
| **Max 2 fonts per screen** | Typically `font-sans` + `font-mono`. Reserve `font-serif` for headings. |
| **Uppercase sparingly** | Navigation links, labels, badges, section tags. Never full paragraphs. |
| **Letter spacing** | `tracking-widest` for uppercase labels. Default for everything else. |
| **Line height** | `leading-relaxed` (1.625) for body text. `.headline-*` classes have built-in tight leading. |
| **`text-balance`** | Apply to all headings and important copy for clean line breaks. |

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

Use the Tailwind spacing scale. Avoid arbitrary values.

| Context | Spacing | Example |
|---------|---------|---------|
| Page padding (mobile) | `px-4` | 1rem sides |
| Page padding (desktop) | `px-8` | 2rem sides |
| Section vertical rhythm | `py-16` to `py-24` | 4-6rem between sections |
| Card internal padding | `p-4` to `p-6` | 1-1.5rem |
| Gap between cards | `gap-4` to `gap-6` | 1-1.5rem |
| Tight lists | `gap-2` to `gap-3` | 0.5-0.75rem |

### 4.2 Layout Rules

| Rule | Detail |
|------|--------|
| **Max content width** | `max-w-[1800px] mx-auto` for wide editorial layouts |
| **Dashboard max width** | `max-w-7xl mx-auto` (80rem) for dashboard content areas |
| **Flexbox first** | Use `flex` for most layouts. `grid` only for 2D (event grids, stat rows). |
| **`gap` for spacing** | Never `space-x-*` or `space-y-*`. Always `gap-*`. |
| **Mobile-first** | Base styles for mobile, `md:` and `lg:` for larger screens. |

---

## 5. Corner Radius (Zero Radius Rule)

**ViBE uses `--radius: 0rem` globally.** This is a deliberate brand choice that creates the editorial, magazine-cut aesthetic.

| Element | Radius | Note |
|---------|--------|------|
| Buttons | `0` | Sharp corners. This is the ViBE look. |
| Cards | `0` | Zero radius by default via `--radius` token |
| Inputs | `0` | Sharp. Consistent with buttons. |
| Modals/Popovers | `0` | Everything sharp. |
| Avatars / Thumbnails | `rounded-full` | **Exception:** circular avatars and small thumbnails are allowed |
| Phone mockup | `rounded-[3rem]` | **Exception:** the app preview phone shell mimics real hardware |
| Pill badges | `rounded-full` | **Exception:** status pills (e.g., in the app mockup tab selector) |

**Dashboard rule:** Do not introduce `rounded-lg`, `rounded-xl`, or any soft radius on dashboard cards, tables, or panels. This is the #1 way dashboards drift from the ViBE brand.

---

## 6. Photography & Imagery

### 6.1 Photography Standards

| Principle | Detail |
|-----------|--------|
| **Real photos only** | Never use stock photography. All images should be from actual ViBE events. |
| **Credit photographers** | Always include photographer credit (e.g., "Photos by @kdshotthat") |
| **Dark treatment** | Images should feel at home on the dark background. Use overlays when needed. |
| **Human-focused** | Show people connecting, dancing, creating -- not empty spaces. |

### 6.2 Image Treatment Patterns

```
Landing page images:     Full color, high contrast
Event card thumbnails:   grayscale-[30%] + gradient overlay (blue fade at bottom)
Dashboard headers:       Full color with dark gradient overlay for text legibility
Background images:       Strong dark gradient overlay (from-black/80 to transparent)
```

### 6.3 Image Overlay Recipe

When placing text over images, always use a gradient overlay:

```tsx
{/* Standard image + text overlay */}
<div className="relative overflow-hidden">
  <Image src={src} alt={alt} fill className="object-cover" />
  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
  <div className="relative z-10">
    {/* Text content here */}
  </div>
</div>
```

### 6.4 Flyer-First Event Display

Events always lead with their flyer image. The flyer is the hero -- event details are secondary.

---

## 7. Motion & Animation

### 7.1 Approved Animations

| Animation | Class / Technique | Where |
|-----------|------------------|-------|
| Gradient text flow | `.neon-gradient-text` | Hero headlines |
| Marquee scroll | `.animate-marquee` | Scrolling text sections |
| Image hover zoom | `.img-zoom` | Event cards, editorial images |
| Fade in on scroll | `opacity-0 -> opacity-100` with IntersectionObserver | Section reveals |
| Glow pulse | `.neon-glow` on hover | Primary CTAs |

### 7.2 Motion Rules

| Rule | Detail |
|------|--------|
| **GPU-composited only** | Use `transform` and `opacity` for animations. Never animate `width`, `height`, `margin`. |
| **`will-change` on animated elements** | Hint the browser for compositing. |
| **No bounce/elastic on dashboards** | Keep dashboard transitions snappy: `transition-colors`, `transition-opacity` only. |
| **Respect reduced motion** | Wrap non-essential animations in `@media (prefers-reduced-motion: no-preference)`. |

---

## 8. Logo Usage

Constants live in [`lib/brand-assets.ts`](../lib/brand-assets.ts). Presentational wrappers: [`components/brand/header-brand-mark.tsx`](../components/brand/header-brand-mark.tsx) (nav wordmark), [`components/brand/full-logo-image.tsx`](../components/brand/full-logo-image.tsx) (footer, auth, loading).

| Variant | File | Context |
|---------|------|---------|
| Wordmark (header + footer + auth) | `/public/vizb-logo.png` | Navbar, dashboard mobile header, sidebar, footer, login/signup/forgot-password, loading, invite claim — single source via [`lib/brand-assets.ts`](../lib/brand-assets.ts) (`HEADER_LOGO_SRC`, `FULL_LOGO_SRC`) |
| Minimum size (header wordmark) | ~28px height minimum | Do not render the nav logo shorter than this |
| Clear space | Equal to the logo height on all sides | Don't crowd the logo |

**Rules:**
- Never stretch, rotate, or recolor the logo
- On dark backgrounds (default), the wordmark displays as-is
- Never place the logo on a busy background without a scrim/overlay

---

## 9. Component Patterns (Landing to Dashboard)

This section maps how each landing page pattern translates to dashboard components to maintain brand continuity.

### 9.1 Pattern Mapping

| Landing Page Element | Dashboard Equivalent | Shared Brand DNA |
|---------------------|---------------------|-----------------|
| Editorial grid cards | Dashboard data cards | Zero radius, `bg-card`, `border-border` |
| Mono uppercase labels (`font-mono tracking-widest`) | Table column headers, stat labels | Same style: `text-xs font-mono uppercase tracking-widest text-muted-foreground` |
| Section headings (`.headline-lg font-serif`) | Page titles | `font-serif text-3xl font-bold` |
| Event cards (image + overlay + details) | Event list rows / grid cards | Same image treatment (grayscale + gradient overlay) |
| CTA buttons (`bg-foreground text-background`) | Primary action buttons | Same: sharp corners, high contrast |
| Neon gradient text | Dashboard empty states, onboarding headlines | Use sparingly for brand moments |
| Stats row (500+ / 25+ / 12 / infinity) | Dashboard metric cards | `text-3xl font-bold text-primary` for numbers, mono labels below |
| Photo credit line | Attribution in event detail views | `text-xs font-mono text-muted-foreground/60` |

### 9.2 Buttons

| Variant | Classes | When |
|---------|---------|------|
| Primary | `bg-foreground text-background hover:bg-primary hover:text-primary-foreground` | Main CTAs: "Create Event", "Publish", "RSVP" |
| Secondary | `bg-secondary text-secondary-foreground border border-border hover:bg-card` | Secondary actions: "Edit", "Cancel" |
| Ghost | `text-muted-foreground hover:text-foreground` | Tertiary: "View All", icon buttons |
| Destructive | `bg-destructive text-foreground hover:bg-destructive/80` | Delete, cancel event |

### 9.3 Data Tables (Dashboard)

```tsx
{/* ViBE-branded table pattern */}
<table className="w-full">
  <thead>
    <tr className="border-b border-border">
      <th className="text-xs font-mono uppercase tracking-widest text-muted-foreground text-left py-3 px-4">
        Event
      </th>
      {/* ... */}
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-border/50 hover:bg-card transition-colors">
      <td className="py-3 px-4 font-sans text-sm text-foreground">
        Summer Block Party
      </td>
      {/* ... */}
    </tr>
  </tbody>
</table>
```

### 9.4 Stat / Metric Cards (Dashboard)

```tsx
{/* Matches the landing page stats row */}
<div className="border border-border p-6">
  <span className="text-3xl font-bold text-primary font-sans">127</span>
  <span className="block text-xs font-mono uppercase tracking-widest text-muted-foreground mt-1">
    Tickets Sold
  </span>
</div>
```

### 9.5 Status Badges

```tsx
{/* Mono uppercase badge style */}
<span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border border-primary/30 text-primary">
  Published
</span>

<span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border border-muted text-muted-foreground">
  Draft
</span>

<span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border border-destructive/30 text-destructive">
  Cancelled
</span>
```

### 9.6 Form Inputs

```tsx
{/* Sharp corners, dark input, monospace label */}
<div className="space-y-2">
  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
    Event Title
  </label>
  <input
    type="text"
    className="w-full bg-input border border-border px-4 py-3 text-foreground font-sans placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
  />
</div>
```

### 9.7 Empty States

```tsx
{/* Brand moment: use neon gradient for empty state headlines */}
<div className="flex flex-col items-center justify-center py-24 text-center">
  <h2 className="headline-lg neon-gradient-text">No Events Yet</h2>
  <p className="text-muted-foreground mt-4 max-w-md font-sans">
    Create your first event and start building your community.
  </p>
  <button className="mt-8 bg-foreground text-background px-6 py-3 text-xs font-mono uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors">
    Create Event
  </button>
</div>
```

---

## 10. Dashboard-Specific Guidelines

### 10.1 Sidebar Navigation

The dashboard sidebar continues the landing page's dark editorial feel:

```
Background:       bg-sidebar (oklch 0.08 -- Deep Charcoal)
Active item:      bg-sidebar-accent text-sidebar-primary (blue text on slightly lighter bg)
Inactive item:    text-sidebar-foreground/60 hover:text-sidebar-foreground
Section labels:   text-xs font-mono uppercase tracking-widest text-sidebar-foreground/40
Dividers:         border-sidebar-border
```

### 10.2 Page Structure

Every dashboard page follows this layout:

```tsx
<main className="flex-1 overflow-auto">
  {/* Page header */}
  <div className="border-b border-border px-6 py-8">
    <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
      Organizer
    </span>
    <h1 className="font-serif text-3xl font-bold text-foreground mt-1 text-balance">
      Your Events
    </h1>
  </div>

  {/* Page content */}
  <div className="p-6 max-w-7xl">
    {/* Content */}
  </div>
</main>
```

### 10.3 Loading States

Use skeleton elements with the card background and a subtle pulse:

```tsx
<div className="border border-border p-6 animate-pulse">
  <div className="h-8 w-24 bg-muted" />
  <div className="h-4 w-48 bg-muted mt-2" />
</div>
```

### 10.4 Toasts / Notifications

```
Success:   border-l-2 border-primary bg-card text-foreground
Error:     border-l-2 border-destructive bg-card text-foreground
Info:      border-l-2 border-accent bg-card text-foreground
```

---

## 11. Voice & Tone

| Context | Voice | Example |
|---------|-------|---------|
| Marketing / Landing | Bold, inviting, culturally aware | "Driving Culture Forward" |
| Dashboard / UI | Clear, concise, action-oriented | "Create Event", "View Attendees" |
| Error messages | Helpful, never blaming | "We couldn't save your changes. Try again." |
| Empty states | Encouraging, brand-forward | "No events yet. Let's change that." |
| Confirmations | Direct | "Event published. Your audience can now see it." |

**Rules:**
- Never use corporate jargon ("synergy", "leverage", "ecosystem")
- Use "you/your" (not "the user")
- Action labels are verbs: "Create", "Publish", "Check In" -- not "Event Creation", "Publishing"

---

## 12. Anti-Patterns (Brand Violations)

| Violation | Why It Breaks Brand | Fix |
|-----------|-------------------|-----|
| `rounded-lg` on dashboard cards | Soft corners kill the editorial edge | Remove. `--radius: 0` handles it. |
| White or light backgrounds | ViBE is dark-mode-only | Use `bg-background` or `bg-card` |
| Stock photography | Feels generic, not community-driven | Use real ViBE event photos |
| Colorful status badges (green/orange/red pills) | Clashes with the monochrome + blue palette | Use bordered mono badges with `text-primary`, `text-muted-foreground`, `text-destructive` |
| Gradient backgrounds on cards | Feels cheap, not editorial | Use solid `bg-card` with `border-border` |
| Sans-serif for hero headlines | Loses the editorial distinction | Use `font-serif` for page/section titles |
| Emojis anywhere | Not the ViBE tone | Remove. Use icons if needed. |
| Multiple accent colors | Breaks the disciplined palette | Blue (`--primary`) is the only accent |
| Busy/cluttered layouts | ViBE is editorial = generous whitespace | Add breathing room, reduce density |
| Generic SaaS templates | If it could be Stripe Dashboard, it's wrong | Apply ViBE patterns from Section 9 |
