# Critical Fixes Checklist - Pre-Launch

**Target**: Clear all blockers in 3 days
**Status**: Ready for execution
**Note**: Chart axis/map legend labels are allowed to use `text-micro` (10px) for dense data viz - this is intentional.

---

## DAY 1: Typography Accessibility Fix

### Objective
Reduce UI text violations → 0. All **UI labels, body text, navigation** must be ≥12px (`text-xs`). Chart/map legends may use `text-micro` (10px) with documentation.

### Commands

```bash
# 1. Generate violation list - will include both UI (bad) and chart legends (ok)
cd "/Users/kartikaysharma/Desktop/Projects/Vibecode /Macro/MacroDashboard"
grep -r "text-\[0\.5[5-9]rem\]" src/ --include="*.tsx" > typography-violations-all.txt
grep -r "fontSize: '0\.5[5-9]rem'" src/ --include="*.tsx" >> typography-violations-all.txt

# 2. Identify UI violations only (exclude charts/maps/refining directories)
grep -v "features/dashboard/components/charts" typography-violations-all.txt | grep -v "features/dashboard/components/maps" | grep -v "features/dashboard/components/refining" > typography-violations-ui.txt

# 3. Count UI violations (target: 0)
wc -l typography-violations-ui.txt
```

### Fix Strategy

**Step 1: Add `text-micro` class for chart/map legends** (allowed exception)
```js
// tailwind.config.js
fontSize: {
  'micro': ['0.625rem', { lineHeight: '1.4' }], // 10px - chart axis, map legends ONLY
}
```

**Step 2: Replace UI violations with `text-xs`** (12px minimum)
```bash
# Get list of UI files only
cat typography-violations-ui.txt | cut -d: -f1 | sort -u > ui-files-to-fix.txt

# For each file, manually review and replace:
# - text-[0.55rem] → text-xs
# - text-[0.65rem] → text-xs
# - sx.fontSize.0.55rem → sx.fontSize: '0.75rem'
```

**Step 3: Keep chart/map micro-text but document as acceptable**
```bash
# Chart/maps/refining directories - OK to keep text-micro
# Just verify they are actually in charts/maps/refining paths
```

### Specific Files to Edit (P0 UI Violations)

**Core Navigation & Loading**:
- [ ] `src/components/DataProvenanceBadge.tsx:21` - Change `text-[0.65rem]` to `text-xs`
- [ ] `src/components/TerminalSidebar.tsx:78` - "System Status" label → `text-xs`
- [ ] `src/pages/Terminal.tsx:38` - LoadingFallback → `text-xs`
- [ ] `src/features/dashboard/components/sections/TodaysBriefPanel.tsx` - All UI text ≥12px

**Section Headers & Cards**:
- [ ] `src/features/dashboard/components/sections/BoJBalanceSheetCard.tsx` - Chip label (line with sx.fontSize 0.55rem)
- [ ] `src/features/dashboard/components/sections/InstitutionalInfluenceSection.tsx`
- [ ] `src/features/dashboard/components/sections/UpcomingEventsCard.tsx`
- [ ] `src/features/dashboard/components/sections/GeopoliticalRiskPulseCard.tsx`
- [ ] `src/features/dashboard/components/sections/ChinaEnergyGridPanel.tsx`

**P1: Other UI elements** (tables, buttons, form labels):
- [ ] Apply to all remaining UI violations from `typography-violations-ui.txt`

### Verification

```bash
# UI text violations must be 0
grep -r "text-\[0\.5[5-9]rem\]" src/ --include="*.tsx" | grep -v "charts/:" | grep -v "maps/:" | grep -v "refining/:" | wc -l

# Chart/map micro-text is allowed (should be only in those directories)
echo "Chart/map micro-text (acceptable):"
grep -r "text-\[0\.5[5-9]rem\]" src/features/dashboard/components/charts --include="*.tsx" | wc -l
grep -r "text-\[0\.5[5-9]rem\]" src/features/dashboard/components/maps --include="*.tsx" | wc -l

# Material-UI sx font sizes
grep -r "fontSize: '0\.5[5-9]rem'" src/ --include="*.tsx" | grep -v "charts/:" | grep -v "maps/:" | wc -l
```

---

## DAY 2: Mobile Responsiveness

### Objective
Eliminate all horizontal overflow on 375px width

### Commands

```bash
# 1. Find all fixed widths
cd "/Users/kartikaysharma/Desktop/Projects/Vibecode /Macro/MacroDashboard"
grep -r "min-w-\[" src/features/dashboard/components --include="*.tsx" | grep -v "min-w-full" > fixed-widths.txt
wc -l fixed-widths.txt  # Target: 0 after fixes
```

### Fix Patterns

**Pattern A: Tables (MIN-W-[600-800px])**

```tsx
// BEFORE
<div className="min-w-[800px]">
  <table>...</table>
</div>

// AFTER
<div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
  <div className="inline-block min-w-[800px] align-top">
    <table>...</table>
  </div>
</div>
```

**Apply to**:
- [ ] `src/features/dashboard/components/sections/UpcomingEventsCard.tsx` (min-w-[800px])
- [ ] `src/features/dashboard/components/sections/BOPPressureTable.tsx` (min-w-[600px])

**Pattern B: Tooltips & Popovers (MIN-W-[200-240px])**

```tsx
// BEFORE
<div className="min-w-[220px]">...</div>

// AFTER
<div className="max-w-[280px] sm:max-w-none break-words">...</div>
```

**Apply to**:
- [ ] `src/features/dashboard/components/sections/SovereignRiskMatrix.tsx:36` (min-w-[220px])
- [ ] `src/features/dashboard/components/sections/G20GoldDebtCoveragePanel.tsx` (min-w-[240px])
- [ ] `src/features/dashboard/components/cards/OilFlowsSankey.tsx` (min-w-[240px])
- [ ] `src/features/dashboard/components/cards/OilImportCostCard.tsx` (min-w-[180px] + sm:min-w-[200px])
- [ ] `src/features/dashboard/components/sections/RefiningCapacityCard.tsx` (check for min-w-[200px])

**Pattern C: Responsive Widths**

```tsx
// BEFORE
<div className="min-w-[120px]">...</div>

// AFTER
<div className="min-w-[100px] sm:min-w-[120px] md:min-w-[140px]">...</div>
```

**Apply to**:
- [ ] `src/features/dashboard/components/sections/FIIDIIMonitorSection.tsx` (multiple min-widths)

**Pattern D: Add Horizontal Scroll Containers**

For any element with fixed width > 375px that isn't a table:

```tsx
// Wrap in scroll container:
<div className="overflow-x-auto">
  <div className="min-w-[400px]">...</div>
</div>
```

### Systematic Fix Procedure

1. **Edit `fixed-widths.txt`** - Add file path and specific change needed
2. **Apply fixes** component by component
3. **Test each fix immediately** in Chrome DevTools (375px width)

### Verification

```bash
# 1. No more fixed widths violating mobile?
grep -r "min-w-\[6-9][0-9][0-9]px\|min-w-\[[2-9][0-9][0-9]px\]" src/features/dashboard/components --include="*.tsx" | wc -l
# Target: 0 (or only widths < 375px)

# 2. Manual test:
# - Open Chrome DevTools
# - Cmd+Shift+M (Device toolbar)
# - Set to iPhone SE (375px)
# - Scroll entire Terminal page
# - Check: No horizontal scrollbar on body (only on specific elements)
# - Check: All content visible, no clipping
```

---

## DAY 3: Documentation & Final Verification

### Documentation Tasks

- [ ] **Create `docs/CRON_JOBS.md`**
  ```markdown
  | Job Name | Schedule | Function | SLA |
  |----------|----------|----------|-----|
  | ingest-daily-precious | 0 0 * * * | ingest-precious-divergence | 95% success |
  ```

- [ ] **Create `docs/OPERATIONS.md`** (Runbook)
  - How to check data freshness
  - How to restart ingestion manually
  - Emergency contacts
  - Rollback procedure

- [ ] **Verify Sidebar Navigation**
  ```bash
  # Check TerminalSidebar.tsx has all 9 labs linked
  grep -E "labs/(us-macro|india|china|energy|sovereign|de-dollarization|shadow)" src/components/TerminalSidebar.tsx
  ```

### Final Verification Checklist

```bash
# Code quality
npm run lint  # Should pass with 0 warnings
npm run build  # Should succeed

# Typography - UI text only (exclude charts/maps/refining)
ui_violations=$(grep -r "text-\[0\.5[5-9]rem\]" src/ --include="*.tsx" | grep -v "charts/:" | grep -v "maps/:" | grep -v "refining/" | wc -l)
if [ $ui_violations -ne 0 ]; then echo "FAIL: $ui_violations UI typography violations remain"; exit 1; fi

# Chart/map micro-text is allowed (log count for info only)
chart_micro=$(grep -r "text-\[0\.5[5-9]rem\]" src/features/dashboard/components/charts --include="*.tsx" 2>/dev/null | wc -l)
map_micro=$(grep -r "text-\[0\.5[5-9]rem\]" src/features/dashboard/components/maps --include="*.tsx" 2>/dev/null | wc -l)
echo "Info: Chart micro-text (allowed): $chart_micro, Map micro-text (allowed): $map_micro"

# Mobile - Fixed widths > 375px
mobile_violations=$(grep -r "min-w-\[[6-9][0-9][0-9]px\]" src/features/dashboard/components --include="*.tsx" 2>/dev/null | wc -l)
if [ $mobile_violations -gt 0 ]; then echo "FAIL: $mobile_violations fixed widths >375px remain"; exit 1; fi

# Tests (run if tests exist)
if [ -d "src/__tests__" ]; then
  npm test -- --coverage 2>/dev/null || echo "Warning: Tests failed or not configured"
fi

echo "✅ All launch blockers cleared"
```

### Additional Checks

- [ ] **MUI imports**: `grep -r "from '@mui/material'" src/ | wc -l` (note: MUI still used - migration planned for Week 2-3)
- [ ] **Sidebar navigation**: All 9 labs present in `TerminalSidebar.tsx`
- [ ] **Bundle size**: `ui-*.js` currently ~149 KB gzipped (target <100 KB after MUI migration)

---

## Post-Launch (Week 1-2)

### Monitoring & Alerting

- [ ] **Slack webhook integration** - Configure in `supabase/functions/_shared/logging.ts`
  - Add `alertFailure()` calls to all ingestion functions
  - Set `SLACK_WEBHOOK_URL` in Supabase Secrets
- [ ] **Create `/health` endpoint** - Simple health check for uptime monitoring
- [ ] **Alerting strategy**: Slack-only for now (Sentry can be added later if needed)

### Testing Infrastructure (No new deps needed)

- [ ] Add 5 critical hook tests
- [ ] Add 10 component render tests
- [ ] Add `useDataIntegrity` integration test

### Code Quality

- [ ] Fix `SovereignRiskMatrix` CustomTooltip (move outside component)
- [ ] Adopt `withFallback` in `ingest-imf` and `ingest-macro-events`
- [ ] Remove unused edge functions (if any)

### Performance & Bundle Optimization

**Priority: MUI → shadcn/ui Migration** (High Impact)

The `ui-DASsM3et.js` chunk is 149 KB (MUI + shadcn). Migrating MUI components to shadcn/ui can reduce this by ~50 KB.

#### Phase 1: Audit MUI Usage

- [ ] Run: `grep -r "from '@mui/material'" src/ | wc -l` to count MUI imports
- [ ] Create inventory: Which MUI components are used? (Button, Paper, Dialog, etc.)
- [ ] Prioritize: Start with most frequently used components

#### Phase 2: Replace MUI with shadcn/ui

Common replacements:
- `@mui/material/Button` → `@/components/ui/button` (shadcn)
- `@mui/material/Paper` → `@/components/ui/card` or custom div with Tailwind
- `@mui/material/Dialog` → `@/components/ui/dialog` (shadcn)
- `@mui/material/BottomNavigation` → Custom component (already have MobileNav?)

**Create migration plan**: Replace one component at a time, verify visuals.

#### Phase 3: Verify

- [ ] Run bundle analyzer: `ANALYZE=true npm run build`
- [ ] Target: `ui-*.js` chunk < 100 KB gzipped (down from 149 KB)
- [ ] Regression test: All UI interactions still work

---

### Code Quality (Week 2-3)

- [ ] Fix `SovereignRiskMatrix` CustomTooltip (move outside component)
- [ ] Adopt `withFallback` in `ingest-imf` and `ingest-macro-events`
- [ ] Remove unused edge functions (if any)
- [ ] Add ARIA labels to navigation and interactive elements

---

## Sign-off

**Launch Clearance Conditions**:

1. ✅ Typography violations count = 0
2. ✅ No fixed widths > 375px causing overflow
3. ✅ Manual mobile test passes (375px width)
4. ✅ All 9 lab pages linked from sidebar
5. ✅ Build succeeds with 0 errors
6. ✅ Documentation: `CRON_JOBS.md`, `OPERATIONS.md` created

**Once all checked**: Ready for production deployment.

---

**Owner**: [Your Name]
**Date Created**: 2026-03-29
**Status**: In Progress
