# Performance Report - ViBE Website

## Baseline Analysis

### Project Overview
- **Framework**: Next.js 16.0.10 (App Router)
- **React**: 19.2.0
- **Styling**: Tailwind CSS 4.1.9
- **Key Dependencies**: Three.js, Radix UI, Recharts, Supabase

### Estimated Core Web Vitals Impact (Pre-Optimization)

| Metric | Current Risk | Primary Cause |
|--------|-------------|---------------|
| **LCP** | HIGH | Three.js background blocks main thread; hero images load synchronously |
| **INP** | MEDIUM | Three.js animation loop runs continuously; multiple client components |
| **CLS** | LOW | Images use `fill` with containers; fonts use next/font |
| **TBT** | HIGH | Three.js initialization; full bundle loaded on initial render |

---

## Top Bottlenecks (Ranked by Impact)

### 1. **CRITICAL: Three.js Background** (`components/three-background.tsx`)
**Impact**: HIGH - Bundle size + Main thread blocking  
**Root Cause**:
- Three.js (~150KB gzipped) loaded synchronously on page load
- 2000 particles + 100 line segments animated every frame via `requestAnimationFrame`
- No throttling on mouse move handler (fires on every pixel movement)
- Continuous animation loop runs even when tab is hidden
- Creates significant hydration delay

**Evidence**:
```typescript
// Fires continuously every frame
const animate = () => {
  // Updates 2000 particle positions EVERY frame
  for (let i = 0; i < particleCount; i++) {
    positions[i3 + 1] += Math.sin(elapsedTime + x * 0.1) * 0.02
  }
  particles.geometry.attributes.position.needsUpdate = true
  requestAnimationFrame(animate) // Never stops
}
```

### 2. **HIGH: Unnecessary Client Components**
**Impact**: HIGH - Hydration bloat  
**Files Affected**:
- `components/hero-section.tsx` - "use client" but has NO client-side interactivity
- `components/navbar.tsx` - "use client" only for mobile menu toggle (could be isolated)
- `components/waitlist-section.tsx` - Form logic requires client, but outer layout doesn't

**Root Cause**: Entire components marked as client when only small portions need interactivity. Forces hydration of all child elements.

### 3. **MEDIUM: Image Optimization Issues**
**Impact**: MEDIUM - LCP delay  
**Files Affected**: Multiple components

**Issues Found**:
- `quality={100}` on hero images (unnecessary, increases file size ~40%)
- Multiple `priority` images competing for bandwidth
- Missing `sizes` prop on some images causes oversized downloads
- No blur placeholder for perceived performance

**Evidence** (`components/hero-section.tsx`):
```typescript
<Image
  src="/vibe-event-dj.jpg"
  quality={100}  // Unnecessary, default 75 is sufficient
  priority       // Competes with other priority images
  ...
/>
```

### 4. **MEDIUM: CSS Animation Performance**
**Impact**: MEDIUM - INP/TBT  
**Files Affected**: `app/globals.css`, multiple components

**Issues Found**:
- `neon-gradient-text` animation runs continuously (`animation: neon-flow 3s linear infinite`)
- Multiple `animate-pulse` elements running simultaneously
- Marquee animation runs even when off-screen
- No `will-change` hints for GPU acceleration

### 5. **LOW: Bundle Bloat from Unused Radix Components**
**Impact**: LOW - Initial bundle size  
**Root Cause**: Package.json includes 25+ Radix UI component packages, but only a few are actually used in the homepage

**Actually Used**:
- None on homepage (using custom-styled elements)

**Loaded but Unused** (tree-shaking should handle, but worth noting):
- accordion, alert-dialog, aspect-ratio, avatar, calendar, carousel, chart, checkbox, command, context-menu, dialog, drawer, dropdown-menu, hover-card, input-otp, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, sheet, sidebar, slider, switch, table, tabs, textarea, toast, toggle, toggle-group, tooltip

### 6. **LOW: Font Loading**
**Impact**: LOW - Potential FOUT  
**File**: `app/layout.tsx`

**Issue**: Three font families loaded (Space Grotesk, Playfair Display, JetBrains Mono) but Playfair only used in one blockquote.

---

## Component Analysis Summary

| Component | Client? | Needs Client? | Bottleneck |
|-----------|---------|---------------|------------|
| `HeroSection` | Yes | **NO** | Entire component hydrates unnecessarily |
| `ThreeBackground` | Yes | Yes | Heavy, sync-loaded, continuous animation |
| `Navbar` | Yes | Partial | Only mobile toggle needs client |
| `MarqueeSection` | No | No | CSS animation (OK) |
| `EditorialGrid` | No | No | Clean |
| `EventsSection` | No | No | Clean |
| `AppPreview` | No | No | Clean |
| `WaitlistSection` | Yes | Yes | Form requires client (appropriate) |
| `Footer` | No | No | Clean |

---

## Recommendations Summary

### Quick Wins (1-2 hours)
1. Remove `"use client"` from `hero-section.tsx`
2. Lower image quality from 100 to 75 (default)
3. Remove extra `priority` flags
4. Add `loading="lazy"` to below-fold images

### Medium Effort (0.5-1 day)
1. Dynamic import Three.js background with `ssr: false`
2. Isolate mobile menu into separate client component
3. Add intersection observer to pause off-screen animations
4. Add `will-change` to animated elements

### Deep Work (multi-day)
1. Virtualize Three.js particles or reduce count significantly
2. Implement visibility-based animation pausing
3. Add blur placeholders for images
4. Audit and potentially remove unused Radix packages

---

## Implemented Changes

### Summary of Optimizations Applied

#### 1. Hero Section (`components/hero-section.tsx`)
- **Removed `"use client"`**: Component is now a Server Component (no hydration overhead)
- **Dynamic import Three.js**: Loads asynchronously with placeholder, ~150KB removed from initial bundle
- **Removed `quality={100}`**: Using default 75, reduces image size ~30-40%
- **Removed extra `priority`**: Second hero image no longer competes for bandwidth

#### 2. Three.js Background (`components/three-background.tsx`)
- **Reduced particle count**: 2000 → 800 particles (60% reduction in per-frame calculations)
- **Throttled mouse handler**: Capped at ~60fps instead of every pixel movement
- **Visibility-based pausing**: Animation stops when tab is hidden (battery/CPU savings)
- **Optimized renderer**: Disabled antialiasing, capped pixel ratio at 1.5
- **Reduced update frequency**: Particles update every other index per frame

#### 3. CSS Animations (`app/globals.css`)
- **Added `will-change`**: GPU acceleration for marquee, image zoom, and gradient animations
- **Added `backface-visibility: hidden`**: Promotes image transforms to GPU layer

### Expected Improvements

| Metric | Before | After (Expected) |
|--------|--------|------------------|
| Initial JS Bundle | ~150KB Three.js blocking | Deferred loading |
| Particle calculations | 2000/frame | 400/frame (800 particles, every other) |
| Mouse events | Unbounded | ~60fps throttled |
| Tab hidden CPU | 100% (continuous) | ~0% (paused) |
| Image download | quality=100 | quality=75 (~30% smaller) |
| Animation compositing | CPU | GPU (will-change) |

---

## Performance Guardrails

### Preventing Regressions

1. **Bundle Size Monitoring**: Consider adding `@next/bundle-analyzer` to catch bundle growth
   ```bash
   npm install @next/bundle-analyzer --save-dev
   ```

2. **Performance Budget Suggestions**:
   - Initial JS: Keep under 200KB gzipped
   - LCP: Target under 2.5s
   - CLS: Keep under 0.1

3. **Code Review Checklist**:
   - [ ] New components: Does it need `"use client"`?
   - [ ] New images: Are `sizes` and quality appropriate?
   - [ ] New animations: Is `will-change` added?
   - [ ] Heavy imports: Can they be dynamically imported?

4. **Optional CI Integration**:
   - Consider Lighthouse CI for automated performance checks
   - Bundle size limits via `bundlewatch` or similar

---

## Next Steps

See `REFACTOR_PLAN.md` for additional optimization opportunities not yet implemented.
