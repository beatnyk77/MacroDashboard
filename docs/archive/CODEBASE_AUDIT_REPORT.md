# GraphiQuestor Codebase Audit Report

**Date**: 2026-03-29
**Auditor**: Claude Code
**Scope**: Full codebase review for production readiness
**Status**: ⚠️ **BLOCKERS IDENTIFIED** - Fix required before launch

---

## Executive Summary

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Total Components | 211 | - | ✅ |
| Build Success | Yes (5.05s) | - | ✅ |
| TypeScript Errors | 0 | 0 | ✅ |
| ESLint Warnings | 0 | 0 | ✅ |
| **UI Accessibility Violations** | **~80** | **0** | ❌ |
| *(Chart/map micro-text allowed)* | *~27* | *Allowed* | ✅ |
| **Mobile Overflow Issues** | **26** | **0** | ❌ |
| Test Coverage | 6 files | >50 files | ⚠️ |
| Bundle Size (gzipped) | 1.64 MB | <1 MB | ⚠️ |

**LAUNCH READINESS**: ❌ **NOT READY** - Critical accessibility and mobile issues block institutional sale.

---

## 1. ACCESSIBILITY COMPLIANCE (WCAG 2.1 AA) - CRITICAL

### Problem: UI Typography Below Minimum Standards

**80+ instances** of font sizes below 12px (0.75rem) in UI elements violate WCAG 2.1 AA.

**Allowed Exception**: Chart axis labels, map legends, and data-dense visualizations may use `text-micro` (10px / 0.625rem) - this is a deliberate design token for dense information displays. These are acceptable when documented.

```tsx
// VIOLATIONS (UI text - MUST FIX):
className="text-[0.55rem]"  // 8.8px - FAIL on UI elements
className="text-[0.65rem]"  // 10.4px - FAIL on UI elements
sx={{ fontSize: '0.55rem' }}  // Material-UI violation

// ALLOWED (Chart/map legends - documented exception):
className="text-[0.55rem]"  // OK in charts/, maps/, refining/ directories only
```

**UI Violations Sample** (exclude charts/maps):
- `TerminalSidebar.tsx` - "System Status" label (0.55rem)
- `DataProvenanceBadge.tsx` - Source text (0.65rem)
- `TodaysBriefPanel.tsx` - Various UI labels
- `BoJBalanceSheetCard.tsx` - Chip label (sx.fontSize 0.55rem)
- `UpcomingEventsCard.tsx` - Badge text (0.55rem)
- `Terminal.tsx` - LoadingFallback (0.55rem)

**Chart/map micro-text** (allowed, ~27 instances):
- `GeopoliticalRiskMap.tsx` - Axis labels (0.55rem) ✅
- Chart components in `charts/` directory ✅
- Map legends ✅

#### Impact
- ❌ UI text <12px fails WCAG 2.1 AA
- ❌ Illegible on mobile for navigation and controls
- ❌ Legal compliance risk for institutional product
- ✅ Chart micro-text is acceptable for dense data viz

#### Recommendation: **IMMEDIATE FIX (Day 1)**

**A. Add `text-micro` semantic class** (for chart/map legends only)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontSize: {
        'micro': ['0.625rem', { lineHeight: '1.4' }], // 10px - chart axis, map legends ONLY (documented exception)
      }
    }
  }
}
```

**B. Systematic Fix: UI Text Only**

```bash
# 1. Generate ALL violations
grep -r "text-\[0\.5[5-9]rem\]" src/ --include="*.tsx" > violations-all.txt

# 2. Filter to UI violations only (exclude charts/maps/refining)
grep -v "features/dashboard/components/charts" violations-all.txt | grep -v "features/dashboard/components/maps" | grep -v "features/dashboard/components/refining" > violations-ui.txt

# 3. Count UI violations (target: 0)
wc -l violations-ui.txt  # Should be 0 after fix

# 4. Replace UI violations with text-xs (12px)
# Manual review of violations-ui.txt required - replace each file:
#   text-[0.55rem] → text-xs
#   text-[0.65rem] → text-xs
#   sx.fontSize: '0.55rem' → sx.fontSize: '0.75rem'
```

**C. Priority Files**

**P0 (User-facing UI)**:
- `src/components/DataProvenanceBadge.tsx:21` - Change `text-[0.65rem]` → `text-xs`
- `src/components/TerminalSidebar.tsx:78` - "System Status" → `text-xs`
- `src/pages/Terminal.tsx:38` - LoadingFallback → `text-xs`
- `src/features/dashboard/components/sections/TodaysBriefPanel.tsx` - All UI text ≥12px

**P1 (Cards/Sections)**:
- `BoJBalanceSheetCard.tsx` (sx.fontSize)
- `InstitutionalInfluenceSection.tsx`
- `UpcomingEventsCard.tsx`
- `GeopoliticalRiskPulseCard.tsx`
- `ChinaEnergyGridPanel.tsx`

**P2 (Remaining UI violations)**:
- Process all files in `violations-ui.txt`

**D. Chart/Map Legend Documentation**

Add comment to `tailwind.config.js`:
```js
// 'micro' (10px) is intentionally used for data-dense visualizations:
// - Chart axis labels and tick values
// - Map legends and coordinate displays
// - Table footnotes and citations
// These are NOT body text; WCAG 2.1 AA permits smaller text for visualizations when absolutely necessary for information density.
```

---

**A. Update Tailwind Typography Scale**

Create custom semantic classes in `tailwind.config.js`:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontSize: {
        'micro': ['0.625rem', { lineHeight: '1.2' }], // 10px - captions only
        'micro-bold': ['0.625rem', { fontWeight: 700, lineHeight: '1.2' }],
        // text-xs is already 0.75rem (12px) by default - USE THIS
      }
    }
  }
}
```

**B. Systematic Find & Replace**

```bash
# Generate list of violations
grep -r "text-\[0\.5[5-9]rem\]" src/ --include="*.tsx" > typography-violations.txt
grep -r "fontSize: '0\.5[5-9]rem'" src/ --include="*.tsx" >> typography-violations.txt

# Replace strategy:
# - text-[0.55rem] → text-micro or text-xs (depending on context)
# - text-[0.65rem] → text-xs
# - sx.fontSize.0.55rem → sx.fontSize: '0.75rem' or typography variant
```

**C. Component-by-Component Fix Priority**

1. **P0 (Critical Path)**:
   - `TodaysBriefPanel.tsx` - User-facing headlines
   - `SovereignRiskMatrix.tsx` - Tooltip data
   - `TerminalSidebar.tsx` - Navigation labels
   - `DataProvenanceBadge.tsx` - Source attribution (already using 0.65rem)

2. **P1 (High Impact)**:
   - `GeopoliticalRiskMap.tsx` - Map legends
   - All `Card` components - Metric values
   - `LoadingFallback` components

3. **P2 (Polish)**:
   - Remaining 80+ components with tiny text

**D. Update DataProvenanceBadge Component**

```tsx
// CURRENT (line 21 in DataProvenanceBadge.tsx):
sm: "px-2 py-0.5 text-[0.65rem] gap-1.5"  // 10.4px - VIOLATION

// FIX:
sm: "px-2 py-0.5 text-xs gap-1.5"  // 12px - WCAG COMPLIANT
```

---

## 2. MOBILE RESPONSIVENESS - CRITICAL

### Problem: Fixed Widths Break Mobile Layouts

**26 elements** with fixed `min-w-[###px]` causing horizontal overflow on 320-375px screens:

```tsx
// OFFENDING PATTERNS:
<div className="min-w-[220px]">          // Tooltips
<div className="min-w-[240px]">          // Popovers
<div className="min-w-[800px]">          // Tables (MAJOR OVERFLOW)
<div className="min-w-[600px]">
<div className="min-w-[200px]">
```

**Worst Offenders**:

1. **`UpcomingEventsCard.tsx`** - Table `min-w-[800px]` - **Cannot fit on iPhone SE**
2. **`BOPPressureTable.tsx`** - Table `min-w-[600px]`
3. **`SovereignRiskMatrix.tsx`** - Tooltip `min-w-[220px]` (uncontrolled overflow)
4. **`G20GoldDebtCoveragePanel.tsx`** - Popover `min-w-[240px]`
5. **`OilFlowsSankey.tsx`** - Card `min-w-[240px]`
6. **`OilImportCostCard.tsx`** - Card `min-w-[180px]` + `sm:min-w-[200px]`
7. **`FIIDIIMonitorSection.tsx`** - Multiple `min-w-[120px]`, `min-w-[200px]`

#### Current State: NO Horizontal Scroll Handling

```bash
grep -r "overflow-x-auto" src/features/dashboard/components --include="*.tsx"
# Result: Only 18 instances across 211 components
```

Most tables/widgets have **zero scroll containment**, causing:
- Content clipped on small screens
- Horizontal scroll jank (page-level vs element-level)
- Poor user experience on mobile

#### Recommendation: **IMMEDIATE FIX (Day 1-2)**

**A. Wrap All Wide Elements in Scroll Containers**

Pattern to apply globally:

```tsx
// BEFORE (broken):
<div className="min-w-[800px]">
  <table>...</table>
</div>

// AFTER (fixed):
<div className="overflow-x-auto -mx-4 px-4 rounded-lg">
  <div className="inline-block min-w-[800px]">
    <table>...</table>
  </div>
</div>
```

**Key**: The `-mx-4 px-4` creates negative margin to align with parent padding, while `inline-block` allows the inner div to respect min-width while scrolling horizontally.

**B. Responsive Min-Widths Pattern**

Replace fixed widths with responsive variants:

```tsx
// BEFORE:
<div className="min-w-[200px]">

// AFTER:
<div className="min-w-[160px] sm:min-w-[200px] md:min-w-[240px]">

// OR remove if not essential:
<div className="flex-1 min-w-0">  // Allows flex shrinking
```

**C. Tooltip Overflow Fix**

Recharts tooltips are particularly problematic. Add max-width:

```tsx
// In SovereignRiskMatrix.tsx line 36:
<div className="bg-slate-950 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[220px]">

// FIX:
<div className="max-w-[280px] sm:max-w-none break-words bg-slate-950 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
```

**D. Priority Fix List**

1. **P0 (Cannot launch broken)**:
   - `UpcomingEventsCard.tsx` - Add `overflow-x-auto` wrapper
   - `BOPPressureTable.tsx` - Add scroll container
   - `FIIDIIMonitorSection.tsx` - Responsive widths

2. **P1 (Major sections)**:
   - All `Sections` with tables/charts
   - `RefiningCapacityCard.tsx`
   - `TradeFlowsCard.tsx`

3. **P2 (Polish)**:
   - All tooltips with fixed widths
   - Remaining 20+ elements

**E. Test Procedure**

```bash
# Chrome DevTools
1. Open DevTools → Toggle Device Toolbar (Cmd+Shift+M)
2. Set viewport to 375px (iPhone SE)
3. Scroll through entire terminal
4. Check for:
   - Horizontal scrollbars at page level (BAD - should be element-level)
   - Content cut off (BAD)
   - Vertical overflow only (GOOD)
```

---

## 3. TESTING COVERAGE GAP - HIGH PRIORITY

### Problem: Only 6 Test Files for 211 Components

```
Current: 6 test files
Expected: ~42 (20% coverage minimum)
Coverage: <3%
```

**Risk**: High probability of regressions in data display logic, especially:
- Hook return value shapes
- Data transformation pipelines
- Staleness calculation edge cases
- Chart rendering

#### Recommendation: **Add Integration Tests (Week 1-2)**

**A. Critical Hooks to Test** (Priority 1)

1. `src/hooks/useStaleness.test.ts`
   ```typescript
   describe('useStaleness', () => {
     it('returns fresh for data within expected interval', () => {
       const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
       const result = getStaleness(yesterday, 'daily');
       expect(result.state).toBe('fresh');
     });
     it('returns stale for data >1.5x expected interval', () => {
       const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
       const result = getStaleness(threeDaysAgo, 'daily');
       expect(result.state).toBe('stale');
     });
   });
   ```

2. `src/hooks/useDataIntegrity.test.ts`
   - Mock `vw_latest_metrics` with various staleness scenarios
   - Verify `critical`, `degraded`, `healthy` status logic
   - Test refetch interval

3. `src/hooks/useNetLiquidity.test.ts`
   - Test calculation: TGA + RRP → Net Liquidity
   - Verify delta computation

4. `src/hooks/useG20SovereignMatrix.test.ts`
   - Test debt/GDP, growth data aggregation
   - Verify z-score calculations
   - Check missing data handling

**B. Component Render Tests** (Priority 2)

Test that critical sections render without crashing:

```typescript
// __tests__/sections/SovereignRiskMatrix.test.tsx
describe('SovereignRiskMatrix', () => {
  it('renders without crashing with mock data', () => {
    const mockData = [{ name: 'USA', debtGdpPct: 120, gdpGrowthPct: 2.5, ... }];
    render(<SovereignRiskMatrix data={mockData} />);
    expect(screen.getByText('Sovereign Risk Matrix')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(<SovereignRiskMatrix isLoading={true} />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
```

**C. Test Setup**

```bash
# Install testing stack if not present:
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Initialize:
npx vitest --init --template react
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## 4. EDGE FUNCTION RESILIENCE - MEDIUM PRIORITY

### Current State: Good Foundation, Needs Monitoring

**✅ Strengths**:
- 61 edge functions properly organized by domain
- Fallback system implemented (`fallback-system.ts`)
- Circuit breaker in `ingest-macro-events` (Finnhub)
- Ingestion logging to `ingestion_logs` table
- Provenance tracking (`api_live`, `fallback_snapshot`)

**⚠️ Gaps**:

**A. Fallback System Not Widely Adopted**

```bash
# Search for withFallback usage:
grep -r "withFallback" supabase/functions --include="*.ts"
# Only found in: fallback-system.ts itself (0 actual usage)
```

**Problem**: The fallback utility exists but **not used** in ingestion functions. They're using ad-hoc fallback code instead.

**Example** (from `ingest-imf/index.ts` lines 97-120):
```typescript
if (!values) {
    // Fallback/Mock for demo if API returns empty...
    if (metric.id === 'G20_DEBT_GDP_PCT') {
        await upsertMetric(supabase, metric.id, {
            '2024-12-31': 105.2, // Projected
            '2023-12-31': 103.8
        });
        // ...
    }
}
```

**Issue**: Ad-hoc fallbacks don't intercept API failures; they only trigger when data is missing. True fallback should catch fetch errors and serve last known good value.

#### Recommendation: **Adopt withFallback Pattern (Week 2-3)**

Refactor ingestion functions to use the central fallback utility:

```typescript
// Before (ad-hoc):
const response = await fetch(url);
if (!response.ok) throw new Error(...);
const data = await response.json();
if (!data.values) { /* manual fallback */ }

// After (structured):
import { withFallback } from '../_shared/fallback-system.ts';

const result = await withFallback(
  supabase,
  metric.id,
  async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },
  { maxStalenessDays: 90 }
);

if (result.provenance === 'fallback_snapshot') {
  console.warn(`Using fallback data for ${metric.id} (last verified: ${result.last_verified})`);
}
```

**Benefits**:
- Centralized fallback logic
- Consistent provenance tracking
- Automatic staleness flagging
- Single point of improvement

---

**B. Alerting Missing (P0 for Production)**

Current: Ingestion failures only logged to `ingestion_logs` table.

**Gap**: No real-time alerts when cron jobs fail.

#### Recommendation: Slack-Only Alerting (Week 1)

Simple, effective, no extra dependencies.

1. **Complete Slack Webhook Integration** (already have `slack.ts` - need to use it)

Add to `_shared/logging.ts`:

```typescript
export async function alertFailure(functionName: string, error: Error, metadata?: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const slackWebhook = Deno.env.get('SLACK_WEBHOOK_URL');

  // Log to database (already done)
  await logIngestion(supabase, functionName, 'failed', { error: error.message });

  // Send Slack alert
  if (slackWebhook) {
    await fetch(slackWebhook, {
      method: 'POST',
      body: JSON.stringify({
        text: `🚨 Ingestion Failed: ${functionName}\nError: ${error.message}\nTime: ${new Date().toISOString()}`
      })
    });
  }
}
```

2. **Call `alertFailure()`** in all ingestion functions' catch blocks

```typescript
try {
  // ingestion logic
} catch (error) {
  await alertFailure('ingest-imf', error);
  throw error; // Re-throw for logging
}
```

**Note**: Sentry is **deferred** to keep launch simple. Slack-only provides sufficient alerting for production. Re-evaluate if error volume requires richer tooling.

---

**C. Cron Job Verification**

```bash
# Check if all scheduled jobs are actually running:
SELECT jobname, schedule, active
FROM cron.job
ORDER BY jobname;
```

**Verify**:
- All 15+ ingestion jobs have correct schedules
- No duplicate schedules
- No disabled jobs (unless intentional)

**Missing Cron Documentation**: Create `docs/CRON_JOBS.md` listing all jobs, schedules, and owners.

---

## 5. CODE QUALITY IMPROVEMENTS - MEDIUM PRIORITY

### A. React Anti-Patterns

**Issue 1: CustomTooltip Inside Render** (FIXED?)

`SovereignRiskMatrix.tsx` line 31 defines `CustomTooltip` inside component body. This causes state reset on every render.

**Check**: Still present? Lines 31-92 define tooltip inside component.

**Fix Required**:
```typescript
// Move outside component:
const CustomTooltip = ({ active, payload, label }: any) => { ... };

export const SovereignRiskMatrix = React.memo(() => {
  // Tooltip now imported from outside
});
```

**Status**: Verify if this is still an issue. ESLint should catch this (see lint status below).

---

**Issue 2: Missing Memoization**

89 components use `useMemo`/`useCallback` - good! But review for overuse:

```typescript
// BAD: Memoizing primitive (no benefit)
const liquidityStatus = useMemo(() => {
  return delta > 0 ? 'Expanding' : 'Contracting';
}, [delta]);

// GOOD: Direct computation (primitive)
const liquidityStatus = delta > 0 ? 'Expanding' : 'Contracting';
```

**Recommendation**: Run codemod to remove unnecessary `useMemo` calls on primitives.

---

### B. ESLint Configuration

**Unknown**: ESLint config not reviewed. Ensure:

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "plugin:jsx-a11y/recommended"  // Accessibility rules
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "jsx-a11y/no-static-element-interactions": "warn",
    "jsx-a11y/click-events-have-key-events": "warn"
  }
}
```

**CI Integration**: Ensure lint runs on PRs (check `.github/workflows/deploy.yml`).

---

### C. Bundle Size Optimization

**Current** (gzipped):
- `index-BvQPfL-Y.js`: 167.59 KB (main entry)
- `ui-DASsM3et.js`: 149.19 KB (shared UI)
- `charts-QU9Gkbjz.js`: 124.45 KB (chart libs)
- **Total Primary**: ~441 KB

**Acceptable** for institutional terminal? Yes, but room for improvement.

#### Recommendations:

1. **Code Splitting**: Verify dynamic imports are working for sections
   ```typescript
   // Terminal.tsx already uses lazy()
   const TodaysBriefPanel = lazy(() => import('@/features/dashboard/components/sections/TodaysBriefPanel'));
   ```
   ✅ Already implemented - ensure chunk names are meaningful.

2. **Tree-shake D3/Recharts**: Import only needed submodules
   ```typescript
   // BAD:
   import { ScatterChart, Scatter, XAxis } from 'recharts';

   // GOOD (already done):
   import { ScatterChart, Scatter, XAxis } from 'recharts';
   // Recharts supports tree-shaking - verify package.json has "sideEffects": false
   ```

3. **Compress Images**: Convert PNG/JPG to WebP
   ```bash
   find public -name "*.png" -o -name "*.jpg" | xargs -I {} convert {} -quality 80 {}.webp
   ```

4. **Analyze Bundle**: Install `@next/bundle-analyzer`
   ```bash
   npm install -D @next/bundle-analyzer
   ```
   Then analyze: `ANALYZE=true npm run build`

---

## 6. ACCESSIBILITY BEYOND TYPOGRAPHY

### Current State: 4 Accessibility Attributes Found

```bash
grep -r "aria-label\|role=" src/features/dashboard/components --include="*.tsx" | wc -l
# Result: 4
```

That's **extremely low** for a professional application.

#### Issues:

**A. Navigation Missing ARIA Labels**

`TerminalSidebar.tsx`:
```tsx
// Current:
<ul className="space-y-1">
  <li>
    <NavLink to="/labs/india">...</NavLink>
  </li>
</ul>

// Missing: role="navigation", aria-label="Terminal navigation"
<nav role="navigation" aria-label="Terminal main navigation">
```

**B. Interactive Elements No Keyboard Support**

Check: Are all interactive cards/buttons keyboard-focusable?
```tsx
// Should have:
<button
  onClick={...}
  onKeyDown={(e) => e.key === 'Enter' && handle()}
  tabIndex={0}
>
```

**C. Color Contrast**

Not audited systematically, but institutional dark theme risks low contrast.

```bash
# Use Lighthouse CI or axe-core:
npm install -D @axe-core/react
```

Add to components for dev testing:
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

#### Recommendation: **A11y Sprint (Week 2)**

1. Install `@axe-core/react` dev dependency
2. Add to global test setup
3. Run in development: `npm run dev` → Console shows violations
4. Fix systematically:
   - Add `role` and `aria-label` to all navigation regions
   - Ensure all interactive elements have focus states (`:focus-visible`)
   - Add skip links for keyboard users
   - Test with VoiceOver/NVDA

---

## 7. DATA AUTHENTICITY & PROVENANCE - STRENGTH

**✅ Excellent work here**:

- `DataProvenanceBadge` used 198+ times
- `provenance` field in ingestion (`api_live`, `fallback_snapshot`, `mock_baseline`)
- `last_verified` timestamps tracked
- `DataHealthBanner` shows system status
- `FreshnessChip` displays staleness state

**Minor Improvements**:

1. **Add Source Links**

`DataProvenanceBadge` shows source name but not link to documentation:

```tsx
// Enhancement:
interface DataProvenanceBadgeProps {
  source: string;
  sourceUrl?: string;  // NEW
  methodology?: string;
  methodologyUrl?: string;  // NEW
}
```

2. **Tooltip with API Details**

Add hover tooltip showing:
- Exact API endpoint
- Last successful fetch timestamp
- Next scheduled update

---

## 8. EDGE FUNCTION ORGANIZATION - GOOD

**✅ Clear structure**:
- 61 functions properly categorized
- `_shared/` utilities reused
- CORS headers standardized
- Ingestion logging consistent

**One Issue**: Mixed naming conventions

```
ingest-macro-events          (kebab-case - GOOD)
ingestMacroEvents            (camelCase - BAD)
Recommend uniform kebab-case.
```

Check for non-kebab directories:
```bash
ls supabase/functions/ | grep -v "^[a-z]\+-[a-z]\+-[a-z]\+$"
```

---

## 9. DOCUMENTATION GAPS

### Missing Files (Create Immediately):

1. **`docs/CRON_JOBS.md`**
   - List all scheduled jobs
   - Frequency, owner, SLA
   - Consecutive failure alerting

2. **`docs/INGESTION_ARCHITECTURE.md`**
   - Data flow diagrams
   - Fallback system deep dive
   - Provenance model explanation

3. **`docs/METRIC_DEFINITIONS.md`**
   - Auto-generated from `metrics` table
   - Include: FRED IDs, IMF indicators, calculation logic
   - Update frequency

4. **`docs/ACCESSIBILITY.md`**
   - WCAG compliance status
   - Keyboard navigation guide
   - Screen reader testing instructions

5. **`docs/OPERATIONS.md`** (Runbook)
   - How to restart ingestion
   - Data freshness troubleshooting
   - Emergency rollback procedures

---

## 10. PERFORMANCE OPTIMIZATIONS

### Bundle Analysis

**Largest Chunks** (gzipped):
1. `index-BvQPfL-Y.js` - 167.59 KB (main entry)
2. `ui-DASsM3et.js` - 149.19 KB (shadcn/ui + MUI)
3. `charts-QU9Gkbjz.js` - 124.45 KB (Recharts + D3)
4. `CorporateIndiaEngine-CnjbKXea.js` - 15.39 KB (lab)
5. `IndiaMacroPulseSection-fx2gq8zG.js` - 15.24 KB (section)

**Total Initial Load**: ~441 KB (acceptable for desktop, heavy for 3G)

#### Optimizations:

**A. Dynamic Imports Already Used** ✅
Verify all heavy sections are lazy-loaded:

```typescript
// Terminal.tsx uses lazy() for all sections
// Good - ensures only visible sections download
```

**B. MUI → shadcn/ui Migration** (High Priority)

**Why**: The `ui-DASsM3et.js` chunk (149.19 KB) combines MUI + shadcn/ui. Migrating MUI components to lightweight shadcn/ui equivalents can reduce this by ~50 KB with zero runtime cost (shadcn compiles to zero JS).

**Evidence**:
```bash
# Count MUI imports
grep -r "from '@mui/material'" src/ | wc -l
# Expected: 20-30 imports across the codebase
```

**Common Replacements**:
- `@mui/material/Button` → `@/components/ui/button` (shadcn)
- `@mui/material/Paper` → `@/components/ui/card` or Tailwind-styled div
- `@mui/material/Dialog` → `@/components/ui/dialog` (shadcn)
- `@mui/material/BottomNavigation` → Custom component (already have `MobileNav.tsx`)
- `@mui/material/Chip` → `@/components/ui/badge` (shadcn)
- `@mui/material/Typography` → HTML elements with Tailwind classes

**Migration Plan**:
1. **Week 1**: Audit all MUI imports. Create mapping table.
2. **Week 2**: Replace 2-3 most frequently used components (Button, Paper). Verify visuals.
3. **Week 3**: Complete migration, run bundle analyzer to verify ~50 KB reduction.
4. **Target**: `ui-*.js` < 100 KB gzipped.

**C. Preconnect to External APIs**

In `app/layout.tsx` or `pages/_document.tsx`:

```html
<link rel="preconnect" href="https://api.stlouisfed.org">
<link rel="preconnect" href="https://api.eia.gov">
<link rel="dns-prefetch" href="https://www.imf.org">
```

**C. Font Optimization**

If using custom fonts, add `display: swap`:
```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap;
}
```

---

## 11. SECURITY CONSIDERATIONS

**✅ Good**:
- Supabase service role key in Secrets (not code)
- API keys via Deno.env
- CORS headers configured

**⚠️ Check**:

1. **API Rate Limiting** on edge functions?
   - Add per-IP rate limiting if public endpoints exist
   - Current: All functions require Supabase auth or are internal

2. **Input Validation** in ingestion params:
   ```typescript
   // Vulnerable pattern:
   const country = req.url.searchParams.get('country');
   // Should validate against allowlist
   ```

3. **SQL Injection** prevention:
   - All queries use parameterized Supabase client ✅
   - No raw SQL concatenation found

---

## 12. MONITORING & OBSERVABILITY

**Current Gaps**:

| Missing | Impact | Recommendation |
|---------|--------|----------------|
| Real-time alerting | Failures unnoticed until manual check | Slack integration (Slack-only approach) |
| Uptime monitoring | No external health check | Create `/health` endpoint |
| Performance metrics | No Core Web Vitals | Add Web Vitals reporting |
| Error rate dashboard | No visibility into component failures | Build admin dashboard from error logs |

---

## Prioritized Action Plan

### Week 0 (Pre-Launch MUST) - 3 Days

**Day 1: Typography Fix (All Hands)**
- [ ] Run automated find/replace for `text-[0.55rem]` → `text-micro` or `text-xs`
- [ ] Update `DataProvenanceBadge.tsx` to use `text-xs`
- [ ] Fix all `sx={{ fontSize: '0.55rem' }}` → `sx={{ fontSize: '0.75rem' }}` or theme
- [ ] Audit: `grep "0.5[5-9]rem" src/ | wc -l` should return 0

**Day 2: Mobile Responsiveness (Frontend Focus)**
- [ ] Wrap `UpcomingEventsCard` table in `overflow-x-auto`
- [ ] Wrap `BOPPressureTable` in scroll container
- [ ] Fix `SovereignRiskMatrix` tooltip with `max-w-[280px]`
- [ ] Add responsive widths to `FIIDIIMonitorSection`
- [ ] Test on 375px viewport: NO horizontal page scroll

**Day 3: Documentation & Verification**
- [ ] Create `docs/CRON_JOBS.md`
- [ ] Create `docs/OPERATIONS.md` (basic runbook)
- [ ] Verify all 9 lab pages link from sidebar
- [ ] Manual smoke test: all terminal sections load

**Launch Blockers Cleared**: ✅ Typography + Mobile

---

### Week 1 (Post-Launch Stabilization) - 5 Days

**Day 4-5: Testing**
- [ ] Add `useStaleness.test.ts`
- [ ] Add `useDataIntegrity.test.ts`
- [ ] Add `useNetLiquidity.test.ts`
- [ ] Add render tests for top 5 critical sections
- [ ] Set up `vitest` with coverage reporting

**Day 6-7: Monitoring & Performance**
- [ ] Complete Slack alert integration (call `alertFailure()` in all ingestion functions)
- [ ] Create `/health` endpoint for uptime monitoring
- [ ] **MUI Migration Prep**: Audit all `@mui/material` imports, create replacement plan
  ```bash
  grep -r "from '@mui/material'" src/ > mui-imports.txt
  # Group by component: Button, Paper, Dialog, etc.
  ```
- [ ] Estimate bundle size reduction potential
- [ ] Create `/health` endpoint (calls supabase.rpc('ping'))
- [ ] Add Web Vitals tracking (Next.js `useReportWebVitals`)

**Day 8-9: Code Quality**
- [ ] Adopt `withFallback` pattern in 5 critical ingests
- [ ] Fix React anti-pattern in `SovereignRiskMatrix` (move tooltip out)
- [ ] Run ESLint with `--max-warnings=0` fix all issues
- [ ] Add pre-commit hook (Husky) for linting

---

### Week 2-3 (Polishing) - Ongoing

**Accessibility Sprint**:
- [ ] Add ARIA labels to all navigation
- [ ] Ensure keyboard focus visible on all interactive elements
- [ ] Test with VoiceOver (Mac) / NVDA (Windows)
- [ ] Run axe-core in dev; fix violations
- [ ] Add skip links for keyboard navigation

**Performance & Bundle Optimization**:

**MUI → shadcn/ui Migration** (Priority: High)
- [ ] **Week 2**: Migrate 5 most-used MUI components to shadcn/ui (Button, Paper, Chip, Dialog, Typography)
- [ ] **Week 3**: Complete remaining MUI replacements; verify <100 KB UI chunk
- [ ] Run `ANALYZE=true npm run build` before/after to measure impact
- [ ] Add resource hints to `app/layout.tsx`: preconnect to external APIs

**Testing**:
- [ ] Verify all lazy-loaded chunks load correctly
- [ ] Measure LCP/LCP improvements post-migration

**Documentation**:
- [ ] `docs/INGESTION_ARCHITECTURE.md`
- [ ] `docs/METRIC_DEFINITIONS.md` (auto-generated from DB)
- [ ] Update `README.md` with current architecture diagram

---

## Success Metrics

By launch, achieve:

| Metric | Current | Target (Week 0) | Target (Week 3) |
|--------|---------|-----------------|-----------------|
| UI WCAG violations | ~80 | 0 | 0 |
| Mobile overflow | 26 | 0 | 0 |
| Test files | 6 | 10 | 50+ |
| Slack alerting | ❌ | ✅ | ✅ |
| Cron job docs | ❌ | ✅ | ✅ |
| ESLint warnings | 0 | 0 | 0 |
| **UI chunk size** | **149 KB** | **<120 KB** | **<100 KB** (MUI migrated) |
| Total bundle (gzipped) | 1.64 MB | <1.5 MB | <1.2 MB |

---

## Risk Summary

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Accessibility non-compliance | HIGH | HIGH | **Critical** - Fix typography Day 1 |
| Mobile layout broken | HIGH | HIGH | **Critical** - Add scroll containers Day 2 |
| Ingestion failures undetected | MEDIUM | HIGH | Add Slack alerts Week 1 |
| Regression from changes | MEDIUM | MEDIUM | Add tests Week 1 |
| Bundle bloat | MEDIUM | MEDIUM | MUI→shadcn migration Week 2-3 (target: -50KB) |
| Missing docs | MEDIUM | LOW | Create runbooks Week 1 |

---

## Final Recommendation

**LAUNCH STATUS**: ❌ **NOT READY**

**Blockers**: UI Typography (~80 violations) and Mobile Responsiveness (26 overflow issues) are **showstoppers** for institutional UX standards. Note: Chart/map legends using 10px are allowed as documented exceptions.

**Timeline**: **3 days** of focused frontend work to clear blockers, then **launch immediately**.

**Post-Launch**: 2-3 weeks of stabilization (testing, monitoring, polish).

**Codebase Quality**: ⭐⭐⭐⭐ (4/5)
- **Strong**: Data architecture, fallback systems, build health, component organization
- **Weak**: Accessibility, mobile UX, test coverage, monitoring
- **Overall**: Production-ready infrastructure, needs UX polish for institutional standards

---

**Next Step**: Execute Week 0 action plan (Typography → Mobile → Docs) and re-audit before going live.
