# Refactor Plan - ViBE Website Performance

## Quick Wins (1-2 hours)

### QW-1: Convert HeroSection to Server Component
**File**: `components/hero-section.tsx`  
**Change**: Remove `"use client"` directive  
**Risk**: LOW - Component has no useState, useEffect, or event handlers  
**Expected Impact**: Reduce hydration JS, faster TTI

### QW-2: Optimize Image Quality Settings
**Files**: `components/hero-section.tsx`  
**Change**: Remove `quality={100}` (use default 75)  
**Risk**: NONE - Visual difference imperceptible  
**Expected Impact**: ~30-40% reduction in hero image file sizes

### QW-3: Fix Priority Image Competition
**Files**: `components/hero-section.tsx`, `components/navbar.tsx`  
**Change**: Keep `priority` only on logo + first visible hero image  
**Risk**: LOW  
**Expected Impact**: Faster LCP for critical content

### QW-4: Add Lazy Loading to Below-Fold Images
**Files**: `components/editorial-grid.tsx`, `components/events-section.tsx`, `components/app-preview.tsx`  
**Change**: Ensure images below fold don't have `priority`  
**Risk**: NONE  
**Expected Impact**: Reduced initial bandwidth

---

## Medium Effort (0.5-1 day)

### ME-1: Dynamic Import Three.js Background
**File**: `components/hero-section.tsx`  
**Change**: 
```tsx
import dynamic from 'next/dynamic'
const ThreeBackground = dynamic(() => import('./three-background').then(mod => ({ default: mod.ThreeBackground })), { 
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-background" />
})
```
**Risk**: MEDIUM - Three.js loads after initial paint, brief flash possible  
**Mitigation**: Add skeleton/placeholder background  
**Expected Impact**: ~150KB removed from initial bundle, faster FCP

### ME-2: Throttle Mouse Move Handler
**File**: `components/three-background.tsx`  
**Change**: Throttle mousemove to 60fps max
```tsx
let lastMove = 0
const handleMouseMove = (event: MouseEvent) => {
  const now = Date.now()
  if (now - lastMove < 16) return // ~60fps
  lastMove = now
  mouse.x = (event.clientX / width) * 2 - 1
  mouse.y = -(event.clientY / height) * 2 + 1
}
```
**Risk**: NONE  
**Expected Impact**: Reduced main thread work

### ME-3: Pause Animation When Tab Hidden
**File**: `components/three-background.tsx`  
**Change**: Use `document.visibilityState` to pause RAF loop
**Risk**: NONE  
**Expected Impact**: Battery savings, reduced background CPU

### ME-4: Isolate Mobile Menu Toggle
**File**: `components/navbar.tsx`  
**Change**: Extract mobile menu button into `NavbarMobileToggle` client component, keep rest as server component  
**Risk**: LOW  
**Expected Impact**: Reduce navbar hydration scope

### ME-5: Add will-change to Animations
**File**: `app/globals.css`  
**Change**: Add `will-change: transform` to `.animate-marquee`, `.img-zoom`  
**Risk**: LOW - Increases memory usage slightly  
**Expected Impact**: Smoother animations, GPU compositing

---

## Deep Work (Multi-day)

### DW-1: Reduce Particle Count or Use Instancing
**File**: `components/three-background.tsx`  
**Change**: Reduce from 2000 to 500 particles, or implement InstancedMesh  
**Risk**: MEDIUM - Visual change  
**Expected Impact**: Significant FPS improvement

### DW-2: Implement Intersection Observer for Animations
**Files**: `components/marquee-section.tsx`, various  
**Change**: Pause CSS animations when elements are off-screen  
**Risk**: LOW  
**Expected Impact**: Reduced painting work

### DW-3: Add Blur Placeholders
**Files**: All image components  
**Change**: Use `placeholder="blur"` with `blurDataURL`  
**Risk**: NONE  
**Expected Impact**: Better perceived performance

---

## Implementation Order

1. **QW-1**: Remove "use client" from HeroSection ✅
2. **ME-1**: Dynamic import ThreeBackground ✅
3. **QW-2**: Optimize image quality ✅
4. **ME-2 + ME-3**: Throttle + visibility pause ✅
5. **QW-3 + QW-4**: Fix priority flags ✅
6. **ME-4**: Isolate mobile menu (if time permits)
7. **ME-5**: CSS will-change optimizations ✅

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Three.js flash on load | Add dark placeholder div with same bg color |
| Visual regression | Test in preview before committing |
| Breaking interactivity | Verify form submission still works |
| Animation jank | Test on low-power devices if possible |

---

## Success Criteria

- [ ] Initial JS bundle reduced by >100KB
- [ ] No visual regressions
- [ ] LCP improved (will verify in Lighthouse)
- [ ] No accessibility regressions
- [ ] All links and forms functional
