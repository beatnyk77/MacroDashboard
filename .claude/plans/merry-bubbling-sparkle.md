# Implementation Plan: UI/UX Transformation for Macro Tracking Terminal

**Objective**: Elevate to gold standard institutional-grade terminal where Central Bankers & PM/CIOs derive inference within 5 seconds  
**Based On**: UI/UX Audit Report (UI_UX_AUDIT_REPORT.md)  
**Total Effort**: ~100 hours  
**Architect**: Senior Frontend + Radix UI Design System Specialist  

---

## 📊 CURRENT STATE ANALYSIS

### ✅ Strengths (Keep)
- **Design tokens already aligned**: Tailwind config has excellent modular typography scale (8-step), terminal colors, proper spacing
- **z-index scale exists**: Defined in theme.ts (but missing in Tailwind)
- **Good component foundation**: shadcn/ui installed (Card, Button, Skeleton, Tooltip, Tabs, etc.)
- **Radix UI partially adopted**: Already using Radix components (hover-card, scroll-area, tabs, tooltip)
- **Accessibility basics present**: 
  - Global focus-visible styles in index.css ✅
  - DataHealthBanner uses role="alert" ✅
  - Some ARIA labels in navigation ✅
- **Loading & error patterns**: GlobalErrorBoundary, ErrorBoundary, Skeleton component exist
- **Performance**: React Query configured, basic code splitting with lazy loading in App.tsx

### ❌ Critical Gaps (Must Fix)
1. **MUI bloat**: 64 files importing @mui/material, ~400KB bundle bloat
2. **Color contrast failure**: `terminal.muted: #94a3b8` = 4.3:1 (needs ≥7:1 AAA for terminal text)
3. **Missing skip-to-content**: No keyboard navigation entry point
4. **Inconsistent staleTime**: QueryClient uses 1hr, audit recommends 30min standard
5. **No font optimization**: Fira Code/Sans not configured (using Inter)
6. **Prop drilling**: MetricCard has 15+ props, needs data object composition
7. **No component-level lazy loading**: Heavy charts (Sankey, maps) load eagerly
8. **No accessibility testing**: Missing axe-core, jest-axe, screen reader tests
9. **Missing z-index in Tailwind**: Only in theme.ts, not usable in utility classes
10. **Cursor/feedback gaps**: Some interactive elements missing cursor-pointer & hover states
11. **Skeleton system incomplete**: Only basic Skeleton, no specialized card/chart skeletons
12. **No compound component patterns**: Inconsistent component composition

---

## 🎯 DESIGN SYSTEM SPEC (Non-Negotiable)

### Terminal-Native Aesthetic (Bloomberg/Reuters Grade)

**Colors** (WCAG AAA ≥ 7:1 for text):
```css
--terminal-bg: #0F172A (slate-900) ✅ Already used
--terminal-gold: #F59E0B (amber-500) ✅ ~10:1 contrast
--terminal-emerald: #34D399 (emerald-500) ✅ ~8:1
--terminal-rose: #FB7185 (rose-500) ⚠️ 5.5:1 (OK for large, not body)
--terminal-blue: #60A5FA (blue-500) ✅ ~7:1
--terminal-muted: #64748B (slate-500) ❌ CURRENT: #94A3B8 (slate-400: 4.3:1)
                                           ✅ FIX TO: #64748B (5.2:1) OR #475569 (7.8:1)
--terminal-text: #F8FAFC (slate-50) ✅ 14.4:1 perfect
```

**Typography** (Fira Code + Fira Sans):
```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');

--font-mono: 'Fira Code', monospace;  /* Data values, tickers */
--font-sans: 'Fira Sans', sans-serif; /* UI labels, headers */
```

**Z-Index Scale** (Add to tailwind.config.js):
```javascript
zIndex: {
    'dropdown': 40,
    'modal': 50,
    'tooltip': 60,
    'toast': 70,
    'sidebar': 30,
    'header': 20,
    'base': 0,
}
```

---

## 📅 PHASED IMPLEMENTATION ROADMAP

### **Month 1: Critical Foundations** (Week 1-4)

#### Week 1: Accessibility & Contrast Fixes (CRITICAL)

**Day 1-2: Fix Color Contrast Issues**
- Files to modify:
  - `tailwind.config.js`: Change `terminal.muted` from `#94a3b8` to `#64748B` or `#475569`
  - `src/index.css`: Update `--muted-foreground` in `.dark` class from `215 20.2% 65.1%` (slate-400) to `222 47% 11%` (slate-800) OR use explicit hex override
  - Audit all components using `text-muted-foreground` or `text-terminal-muted` to ensure they meet contrast
- Verification: Use Chrome DevTools Lighthouse + axe-core for contrast checks

**Day 3: Skip-to-Content Link**
- File: `src/layout/GlobalLayout.tsx`
- Add at top of body (line ~78, first child of root div):
```tsx
<a 
  href="#main-content" 
  className="skip-link"
  style={{
    position: 'absolute',
    top: '-40px',
    left: 0,
    backgroundColor: '#F59E0B',
    color: '#0F172A',
    padding: '8px',
    zIndex: 100,
    transition: 'top 0.3s',
    fontWeight: 700
  }}
>
  Skip to main content
</a>
<main id="main-content" tabIndex={-1}>
  {/* existing children */}
</main>
```
- CSS: Add `.skip-link:focus { top: 0; }` to `index.css`

**Day 4: ARIA Labels on Icon-Only Buttons**
- Files to audit:
  - `src/layout/GlobalLayout.tsx` (mobile menu button ✅ already has aria-label)
  - `src/components/DataHealthBanner.tsx` (refresh button ❌ missing aria-label)
  - `src/components/CommandPalette/` (trigger button)
  - `src/components/QuickTourModal.tsx` (close buttons)
  - All icon buttons across `src/features/*`
- Pattern to apply:
```tsx
<button 
  onClick={handler}
  aria-label="Descriptive action text"
  className="cursor-pointer"  // Ensure also has pointer cursor
>
  <Icon size={16} aria-hidden="true" />
</button>
```

**Day 5: Cursor & Touch Target Audit**
- Audit interactive elements (cards, buttons, clickable divs):
  - Ensure `cursor-pointer` on all clickable elements
  - Ensure min-height ≥ 44px, min-width ≥ 44px
- Files to check: `MetricCard.tsx`, all section components, cards
- Add global CSS rule in `index.css`:
```css
.interactive {
  @apply cursor-pointer;
  min-height: 44px;
  min-width: 44px;
}
```

#### Week 2: Typography & Foundation

**Day 1-2: Configure Fira Fonts**
- Update `index.html` head:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```
- Update `tailwind.config.js`:
```javascript
theme: {
  extend: {
    fontFamily: {
      mono: ['Fira Code', 'monospace'],
      sans: ['Fira Sans', 'sans-serif'],
    }
  }
}
```
- Update components to use semantic fonts:
  - Metric values: `font-mono`
  - Labels/Headers: `font-sans`

**Day 3: Z-Index Scale Migration**
- Add to `tailwind.config.js` (lines ~70-112):
```javascript
extend: {
  zIndex: {
    'dropdown': 40,
    'modal': 50,
    'tooltip': 60,
    'toast': 70,
    'sidebar': 30,
    'header': 20,
    'base': 0,
  }
}
```
- Replace hardcoded z-index values:
  - `GlobalLayout.tsx:86`: `z-[1300]` → `z-header` (20)
  - `DataHealthBanner.tsx:19`: `z-[100]` → `z-base` (0) or `z-header` depending on stacking
  - Search: `grep -r "z-\[" src/ | grep -v "z-auto"` to find arbitrary values

**Day 4-5: React Query Standardization**
- File: `src/lib/queryClient.ts`
- Change staleTime from `1000 * 60 * 60` (1hr) to `1000 * 60 * 30` (30 min)
- Add gcTime: `1000 * 60 * 60 * 2` (2 hours)
- Keep retry: 1
- Document in comments which data types override:
```typescript
// Override per use case:
// - Real-time data (market pulse): staleTime: 60_000 (1 min)
// - Daily metrics: default 30 min ✅
// - Static reference (glossary): staleTime: 3_600_000 (1 hour)
```

#### Week 3: Loading States & Error Handling

**Day 1-2: Enhanced Skeleton System**
- File: `src/components/ui/skeleton.tsx` → Extend with variants
```tsx
interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'metric-card' | 'chart'
  width?: string | number
  height?: string | number
  className?: string
}

// Add specialized skeletons:
export const MetricCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <Skeleton variant="text" height={32} width="60%" />
      <Skeleton variant="text" height={48} width="80%" className="mt-2" />
      <Skeleton variant="rectangular" height={120} className="mt-4" />
    </CardContent>
  </Card>
)

export const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <Skeleton variant="rectangular" height={height} className="chart-skeleton w-full" />
)
```

**Day 3-4: Component-Level Lazy Loading**
- Identify heavy components:
  - Sankey diagrams (`OilFlowsSankey` or similar)
  - Leaflet maps (`GeopoliticalRiskMap`, `IndiaLeafletMap`)
  - Complex chart widgets
- Update `App.tsx` with component-level lazy loading:
```tsx
const GeopoliticalRiskMap = lazy(() => 
  import('@/features/dashboard/components/maps/GeopoliticalRiskMap')
    .then(module => ({ default: module.GeopoliticalRiskMap }))
)

// In component usage:
<Suspense fallback={<ChartSkeleton height={400} />}>
  <GeopoliticalRiskMap />
</Suspense>
```
- Target: Reduce initial bundle from ~850KB to <500KB

**Day 5: Error Boundary Enhancement**
- Files: `GlobalErrorBoundary.tsx`, `ErrorBoundary.tsx`
- Add retry button with better UX:
```tsx
<Button
  onClick={() => {
    // Clear error boundary state if using @errorboundary/react
    // Or simple reload with better message
    window.location.reload()
  }}
  className="cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500"
>
  <RotateCcw size={16} className="mr-2" />
  Retry Connection
</Button>
```
- Consider adding dashboard-specific error fallbacks per section

#### Week 4: MetricCard Refactoring & Compound Components

**Day 1-3: Create Unified MetricData Type**
- File: `src/types/metric.ts` (new)
```typescript
export interface MetricData {
  id: string
  name: string
  value: number | string
  delta?: {
    value: string
    period: string
    trend: 'up' | 'down' | 'neutral'
    tooltip?: {
      currentValue: number | string
      previousValue: number | string
      absoluteChange: number | string
      percentChange: number | string
    }
    riskInterpretation?: 'risk-on' | 'risk-off' | 'neutral'
  }
  status?: 'safe' | 'warning' | 'danger' | 'neutral'
  trend?: 'up' | 'down' | 'neutral'
  asOfDate: string
  lastUpdated: string
  frequency: string
  zScore?: number
  percentile?: number
  history: Array<{ date: string; value: number }>
  metadata: {
    description: string
    methodology: string
    source: string
    unit: string
  }
  isStale?: boolean
}
```

**Day 4-5: Refactor MetricCard to Accept Data Object**
- File: `src/components/MetricCard.tsx`
- Add new prop: `metric?: MetricData` (keep existing props for backward compatibility)
- New signature:
```tsx
interface MetricCardProps {
  metric?: MetricData
  // ... keep existing individual props for migration
}

export const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  label,
  value,
  delta,
  // ... rest
}) => {
  // Use metric object if provided, fall back to individual props
  const data = metric ? {
    label: metric.name,
    value: metric.value,
    delta: metric.delta,
    // ... map all fields
  } : { label, value, delta, ... }
  
  // Rest of component stays same
}
```
- Update 5 highest-traffic components to use new pattern

---

### **Month 2: MUI Migration & Component Architecture**

#### Week 1-2: MUI Grid/Typography Removal

**Phase A: Replace MUI Grid with CSS Grid**
- Global find: `grep -r "Grid container" src/` - identify all MUI Grid usage
- Replace pattern:
```tsx
// BEFORE:
<Grid container spacing={3}>
  <Grid item xs={12} lg={4}>...</Grid>
</Grid>

// AFTER:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="lg:col-span-1">...</div>
</div>
```
- Files to update: All section components in `src/features/dashboard/components/sections/`
- Target: Remove 20+ MUI Grid instances

**Phase B: Replace MUI Typography with Semantic HTML**
- Install `@tailwindcss/typography` plugin if not already (`npm install -D @tailwindcss/typography`)
- Add to `tailwind.config.js` plugins
- Replace pattern:
```tsx
// BEFORE:
<Typography variant="h3" className="text-3xl">
<Typography variant="body1" color="text.secondary">

// AFTER:
<h3 className="text-3xl font-bold tracking-heading text-foreground">
<p className="text-base text-muted-foreground">
```
- Use semantic elements: `h1`-`h6`, `p`, `span` with Tailwind utilities
- Files to update: All components using MUI Typography

#### Week 3: Replace MUI Card & Paper

**Current State**: `src/components/ui/card.tsx` already exists (shadcn)
- Update all components to use shadcn Card instead of MUI Card:
```tsx
// BEFORE:
import { Card, CardContent } from '@mui/material'

// AFTER:
import { Card, CardContent } from '@/components/ui/card'
```
- Ensure shadcn Card supports terminal aesthetic:
  - Update `src/components/ui/card.tsx` to use terminal colors from tailwind.config.js
  - Glassmorphism: `bg-card/40 backdrop-blur-md border-border/50`
- Migrate 30+ card components during Week 3

**MUI Box Replacement**:
- Replace `Box` sx prop with Tailwind classes:
```tsx
// BEFORE:
<Box sx={{ p: 3, display: 'flex', gap: 2, bgcolor: 'background.paper' }}

// AFTER:
<div className="p-3 flex gap-2 bg-card">
```
- Can use `@mui/system`'s `sx` prop pattern with Tailwind: create utility wrapper if needed

#### Week 4: Remaining MUI Components & Deletion

**Inventory remaining MUI components**:
- Run: `grep -r "from '@mui/material'" src/ | cut -d: -f1 | sort -u`
- Categories:
  - ✅ Replaceable: Button → `@/components/ui/button` (shadcn), List/ListItem → semantic `<ul>/<li>`, Divider → `<hr>` or `Separator` from shadcn
  - 🔶 Keep temporarily if needed: DatePicker, Autocomplete (but plan Radix alternatives)
  - ❌ Must remove entirely: Anything not actively used

**Removal process**:
1. Remove MUI imports from package.json: `@mui/material`, `@emotion/react`, `@emotion/styled`
2. Update all broken imports to use shadcn/Tailwind
3. Test build: `npm run build` - fix any TypeScript errors
4. Bundle analysis: `npx vite-bundle-analyzer` to verify 400KB reduction target

---

### **Month 3: Polish & Performance Optimization**

#### Week 1: Terminal Fonts & Micro-Interactions

**Implement Fira Fonts Throughout** (from Month 1 prep):
- Ensure all components use `font-mono` for data values, `font-sans` for UI
- Update `src/theme.ts` to remove MUI font-family overrides (let Tailwind handle)
- Test readability at 11-15px sizes (Bloomberg density)

**Add Micro-Interactions**:
- Terminal glow effect on critical metrics:
```css
.metric-highlight {
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
}
```
- Smooth transitions: All interactive elements `transition-all duration-150 ease-out`
- Hover states: `hover:border-amber-500 hover:scale-[1.02]` on cards
- Animation: Pulse for live data `animate-pulse` (respect `prefers-reduced-motion`)

#### Week 2: Performance Deep Dive

**Code Splitting Audit**:
- Run bundle analyzer: `npx vite-bundle-analyzer dist/`
- Identify top 5 heaviest chunks
- Implement route-level + component-level lazy loading for:
  - Sankey diagrams (~50KB+)
  - Leaflet maps (~80KB+)
  - Complex charts (Recharts heavy modules)
- Target: Initial LCP < 1.5s, Total bundle < 400KB gzipped

**React Query Optimization**:
- Implement staleTime strategy from Month 1
- Add cacheTime for historic data: 2 hours
- Review all `useQuery` calls - add `staleTime` overrides where needed:
  - Real-time: `staleTime: 60_000` (1 min)
  - Daily metrics: default 30 min
  - Static: `staleTime: 3_600_000` (1 hr)

**Image Optimization**:
- Convert PNG/JPG icons to SVG (use lucide-react ✅ already done)
- Add `loading="lazy"` to below-fold images
- Use WebP format for any raster images with `<picture>` fallback

#### Week 3: Mobile & Responsive

**Mobile-First Audit** (375px, 768px, 1024px, 1440px):
- Test horizontal scroll → convert to vertical stack on mobile
- Ensure touch targets ≥ 44px (already added in Month 1)
- Sidebar → hamburger menu (already exists ✅)
- Charts → full width with horizontal scroll inside container
- Use `@media (max-width: 768px)` breakpoints in Tailwind

**Responsive typography**:
- Use `clamp()` for fluid font sizes where appropriate:
```css
.text-fluid-xl {
  font-size: clamp(1.125rem, 4vw, 1.375rem);
}
```

#### Week 4: Accessibility Hardening & Testing

**Install & Configure axe-core**:
```bash
npm install -D @axe-core/react jest-axe
```
- Add to smoke test: `src/smoke.test.ts`
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

test('terminal metrics accessible', async () => {
  const { container } = render(<Terminal />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```
- Run: `npm test` - fix all violations (target: 0 violations)

**Screen Reader Testing**:
- Manual test with VoiceOver (macOS) / NVDA (Windows)
- Test keyboard navigation:
  - Tab through all interactive elements
  - Arrow key navigation in data tables
  - Cmd+K command palette focus trap
- Ensure all charts have data table alternatives (add `<details>` toggle)

**Final Accessibility Checklist**:
- [ ] Skip link works
- [ ] All icons have accessible names (aria-label or aria-labelledby)
- [ ] Color contrast ≥ 7:1 for body text (AAA), 4.5:1 for large text (AA)
- [ ] Focus visible on all interactive elements (no focus-visible suppression)
- [ ] No emojis as icons (enforce via ESLint rule)
- [ ] Proper heading hierarchy (H1 → H2 → H3, no skipping)
- [ ] `prefers-reduced-motion` respected (already in index.css ✅)

---

## 🎯 SUCCESS METRICS

### Quantitative
- **Bundle size**: < 400KB gzipped (from ~850KB → 53% reduction)
- **LCP**: < 1.5s on fast 3G
- **CLS**: < 0.1
- **Accessibility**: 0 axe violations, WCAG 2.1 AA+ rating
- **Color contrast**: ≥ 7:1 for all terminal text
- **Keyboard nav**: 100% of actions keyboard accessible

### Qualitative
- **5-second inference**: Central Banker can derive macro signal in ≤5 seconds
  - Test: Show terminal to institutional user, time to first insight
- **Bloomberg parity**: Visual density + clarity matches professional terminal
- **Zero MUI**: All Material-UI removed, pure Tailwind + Radix
- **Compound components**: 80% of UI uses compositional patterns vs prop drilling

---

## 📁 CRITICAL FILES TO MODIFY (By Priority)

### Priority 1 (Week 1)
1. `tailwind.config.js` - muted color, z-index scale
2. `src/index.css` - contrast overrides, skip-link styles
3. `src/layout/GlobalLayout.tsx` - skip-to-content, cursor fixes
4. `src/components/DataHealthBanner.tsx` - aria-label on refresh button
5. `src/lib/queryClient.ts` - staleTime standardization

### Priority 2 (Week 2-3)
6. `index.html` - Fira fonts preconnect
7. `src/components/ui/skeleton.tsx` - enhanced variants
8. `src/App.tsx` - component-level lazy loading
9. `src/components/GlobalErrorBoundary.tsx` - retry UX
10. `src/types/metric.ts` - new unified type

### Priority 3 (Month 2)
11. `src/features/dashboard/components/sections/*` - MUI Grid → Tailwind (all files)
12. `src/components/ui/card.tsx` - ensure terminal aesthetic
13. `src/theme.ts` - remove MUI overrides gradually
14. All files with `@mui/material` imports - systematic replacement

### Priority 4 (Month 3)
15. `src/smoke.test.ts` - add axe-core tests
16. Individual component files - add cursor-pointer, min-height, hover states
17. `tailwind.config.js` - add `@tailwindcss/typography` plugin

---

## 🧪 VERIFICATION STRATEGY

### Automated Checks (CI Integration)
```bash
# 1. Build optimization
npm run build
npx vite-bundle-analyzer dist/  # Verify < 400KB

# 2. Accessibility
npm install -D @axe-core/react jest-axe
npm test -- --testPathPattern=smoke.test.ts

# 3. TypeScript
npm run lint  # Should pass with 0 warnings

# 4. Color contrast audit (manual script)
node scripts/check-contrast.js  # Verify all combinations ≥ 7:1
```

### Manual QA Checklist
- [ ] Load terminal, measure time to first macro insight (target: <5s)
- [ ] Navigate entire site with keyboard only (Tab, Enter, arrow keys)
- [ ] Test with VoiceOver/NVDA on 3 key screens (Terminal, India Lab, China Lab)
- [ ] Install Lighthouse, verify accessibility score 100, performance >90
- [ ] Check bundle in DevTools Network tab (gzipped size)
- [ ] Test at viewport widths: 375px, 768px, 1024px, 1440px, 1920px
- [ ] Verify all MUI Material icons replaced with lucide-react or SVGs

### Institutional User Validation
- Record screen session with macro professional (PM/CIO)
- Prompt: "What's your read on global liquidity in 60 seconds?"
- Evaluate: Can they spot signals without guidance? Is visual hierarchy clear?
- Iterate based on feedback if >5 seconds to first insight

---

## 🚀 RISK MITIGATION

### Risk: Breaking Changes During MUI Removal
**Mitigation**:
- Keep MUI in package.json until final week of Month 2
- Use feature flags if needed during migration
- One component at a time, test immediately
- Run full test suite after each day's changes

### Risk: Performance Regression During Refactor
**Mitigation**:
- Measure bundle size + lighthouse metrics daily
- Use `npx vite-bundle-analyzer` to catch unexpected bloat
- Performance budget: 400KB total, 150KB initial

### Risk: Contrast Issues Break Dark Mode
**Mitigation**:
- Test in both light/dark modes (though default is dark)
- Use Chrome DevTools color contrast checker on all text colors
- Maintain ≥ 7:1 ratio for body text (target 10:1+ where possible)

### Risk: 5-Second Inference Goal Not Met
**Mitigation**:
- Implement progressive disclosure: Critical signals in hero, details below fold
- Add "Executive Summary" component at top of Terminal page
- Use visual hierarchy: font-size, color, weight, spacing to guide eye
- Conduct weekly usability tests with target persona

---

## 📚 REFERENCE SKILLS APPLIED

- `/ui-ux-designer` - Design system, typography, color theory
- `/senior-frontend` - React architecture, performance, accessibility
- `/senior-fullstack` - Full-stack perspective, deployment considerations
- `/frontend-dev-guidelines` - Best practices, code quality
- `/radix-ui-design-system` - Compound components, accessibility primitives
- `/tailwind-design-system` - Utility-first CSS, design tokens
- `/scroll-experience` - Smooth scrolling, layout stability
- `/superpowers-lab` - Advanced patterns (code splitting, lazy loading)
- `/design-orchestration` - Coordinating multi-feature UI rollout
- `/executing-plans` - Structured implementation approach
- `/ui-ux-pro-max` - Institutional-grade terminal UX (audit source)
- `/claude-code-expert` - Code quality, best practices
- `/baseline-ui` - Consistent component library
- `/mobile-design` - Responsive, touch-friendly interactions
- `/prompt-caching` - React Query caching strategies
- `/skill-improver` - Continuous quality improvement
- `/cc-skill-frontend-patterns` - Modern React patterns (composition, hooks)
- `/test-driven-development` - Accessibility tests, axe-core integration
- `/ask-questions-if-underspecified` - Clarify requirements before building
- `/screen-reader-testing` - Assistive technology compatibility

---

## 📝 NOTES

1. **Backward Compatibility**: Maintain prop-based MetricCard API during migration; transition gradually to data object pattern
2. **Design Token Authority**: tailwind.config.js is single source of truth for colors, spacing, fonts
3. **No New Features**: Focus on quality, not quantity - refine existing features to perfection
4. **Documentation**: Update CLAUDE.md with new patterns (compound components, data objects)
5. **Team Handoff**: Create `docs/UI_MIGRATION_GUIDE.md` explaining new patterns for future contributors

---

## ✅ DAILY STAND-UP CHECKLIST

- [ ] Bundle size within target? (`npm run build` + analyzer)
- [ ] All tests passing? (`npm test`)
- [ ] Accessibility checks passing? (axe-core on smoke tests)
- [ ] TypeScript errors? (`npm run lint`)
- [ ] Manual keyboard nav tested on changed components?
- [ ] Color contrast verified for new/changed text?
- [ ] 5-second inference validated (if applicable)?

---

**Start Date**: April 1, 2026  
**Target Completion**: June 30, 2026 (3 months)  
**Review Cadence**: Weekly plan review + daily stand-ups  

**Remember**: This is about **institutional clarity**, not feature quantity. Every change should make the terminal faster, more accessible, and easier to derive insights from in under 5 seconds.
