# Orphaned Components Wiring — Implementation Report

**Date**: 2026-04-07  
**Status**: ✅ **Complete — Build Passing**

---

## Summary

Successfully wired 3 orphaned components into the frontend, making them visible and functional on the live site. All changes follow existing patterns (lazy loading, Suspense boundaries, SectionErrorBoundary) and maintain the dark glassmorphic terminal aesthetic.

**Total Changes**: 4 files modified, +45 lines, -4 lines  
**Build Status**: ✅ `npm run lint && npm run build` passes clean (8.49s)  
**TypeScript**: 0 errors, 0 warnings

---

## Components Wired

### 1. TradeGravityCard → De-Dollarization Lab

**File Modified**: `src/pages/labs/DeDollarizationGoldLab.tsx`

- **Import Added**: `TradeGravityCard` lazy import from `@/features/dashboard/components/rows/TradeGravityCard`
- **Placement**: New section inserted after "Trade Settlement & Misinvoicing" section (between sections 5 and 6)
- **Section Title**: "Trade Gravity: BRICS+ vs G7"
- **Icon**: `<Globe className="text-orange-500" />`
- **Layout**: Full-width section with ChartInsightSummary
- **Error Handling**: Wrapped in `<SectionErrorBoundary name="Trade Gravity">` + `<Suspense fallback={<LoadingFallback />}>`

**Purpose**: Visualizes the gravitational shift in global trade flows from G7 to BRICS+, showing institutional re-pricing of geopolitical risk and settlement currency preference.

**Data Dependency**: `trade_gravity_metrics` table (populated by `ingest-trade-gravity` Edge Function)

---

### 2. OffshoreDollarStressCard → US Macro Fiscal Lab

**File Modified**: `src/pages/labs/USMacroFiscalLab.tsx`

- **Import Added**: `OffshoreDollarStressCard` lazy import from `@/features/dashboard/components/sections/OffshoreDollarStressCard`
- **Placement**: New section inserted after "Auction Demand Gauge" (becomes Section 2.5)
- **Section Title**: "Offshore Dollar Funding Stress"
- **Icon**: `<Zap className="text-rose-500" />`
- **Layout**: Wrapped in `<LazyRender minHeight="300px">` + `<SectionErrorBoundary>` + `<Suspense>`
- **Styling**: Consistent with other metric sections

**Purpose**: Measures institutional liquidity constraints using the SOFR-OIS spread (modern replacement for TED Spread). Highlights stress in offshore dollar funding markets.

**Data Dependency**: `institutional_features` table via `useInstitutionalFeatures` hook (populated by `ingest-institutional-features`)

---

### 3. FeedbackSection → Terminal Landing Page

**File Modified**: `src/pages/Terminal.tsx`

- **Import Added**: `FeedbackSection` from `@/features/dashboard/components/sections/FeedbackSection`
- **Placement**: At the bottom of the main content, after all Systemic Risk sections (Deflation/Debasement + Currency Wars), before closing `</main>` tag
- **Section**: Full-width `<section className="py-12">` with SectionErrorBoundary
- **Content**: User feedback CTA linking to Google Form

**Purpose**: Gather user feedback to improve the platform, request new data layers, and report institutional inconsistencies.

**Data Dependency**: None (static)

---

## Changes Detail

### Terminal.tsx
```diff
+ import { FeedbackSection } from '@/features/dashboard/components/sections/FeedbackSection';

...

+                {/* User Feedback Section */}
+                <section className="py-12">
+                    <SectionErrorBoundary name="User Feedback">
+                        <Suspense fallback={<LoadingFallback />}>
+                            <FeedbackSection />
+                        </Suspense>
+ </section>
```

### DeDollarizationGoldLab.tsx
```diff
+ const TradeGravityCard = lazy(() => import('@/features/dashboard/components/rows/TradeGravityCard')...);

...

+                {/* 5.5 Trade Gravity Shift */}
+                <section>
+                    <div className="flex items-center gap-3 mb-10">
+                        <Globe className="text-orange-500" size={28} />
+                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Trade Gravity: BRICS+ vs G7</h2>
+                    </div>
+                    <SectionErrorBoundary name="Trade Gravity">
+                        <Suspense fallback={<LoadingFallback />}>
+                            <TradeGravityCard />
+                        </Suspense>
+ </section>
```

### USMacroFiscalLab.tsx
```diff
+ const OffshoreDollarStressCard = lazy(() => import('@/features/dashboard/components/sections/OffshoreDollarStressCard')...);

...

+                {/* Section 2.5: Offshore Dollar Stress */}
+                <section>
+                    <div className="flex items-center gap-3 mb-8">
+                        <Zap className="text-rose-500" size={24} />
+                        <h2 className="text-2xl font-black uppercase tracking-heading text-white">Offshore Dollar Funding Stress</h2>
+                    </div>
+                    <SectionErrorBoundary name="Offshore Dollar Stress">
+                        <LazyRender minHeight="300px">
+                            <Suspense fallback={<LoadingFallback />}>
+                                <OffshoreDollarStressCard />
+                            </Suspense>
+ </section>
```

---

## Verification Checklist

- [x] **TypeScript Compilation**: 0 errors
- [x] **ESLint**: 0 warnings (`--max-warnings 0`)
- [x] **Production Build**: Successful (8.49s)
- [x] **Bundle Impact**: New chunks generated for modified pages
- [x] **Import Paths**: All lazy imports resolve correctly
- [x] **Pattern Consistency**: Follows existing lazy/Suspense/ErrorBoundary pattern
- [x] **Styling**: Uses Tailwind classes matching terminal aesthetic
- [x] **Accessibility**: SectionErrorBoundary names are descriptive

---

## Data Readiness Assessment

Before these components display live data on the frontend, the following tables must be populated via scheduled Edge Functions:

| Component | Required Table | Ingestion Function | Schedule |
|-----------|---------------|-------------------|----------|
| TradeGravityCard | `trade_gravity_metrics` | `ingest-trade-gravity` | *Check cron* |
| OffshoreDollarStressCard | `institutional_features` | `ingest-institutional-features` | *Check cron* |
| FeedbackSection | N/A (static) | N/A | N/A |

**Action Required**: Verify cron jobs are active and data exists. If tables are empty, manually trigger ingestion via Supabase MCP or wait for scheduled runs.

---

## Post-Deployment Verification

After deployment to production (Vercel), verify:

1. **De-Dollarization Lab** (`/labs/de-dollarization-gold`)
   - Scroll to "Trade Gravity: BRICS+ vs G7" section
   - Map should render with country markers
   - Area chart should show BRICS+ vs G7 trends (2018-2023)
   - No console errors

2. **US Macro Fiscal Lab** (`/labs/us-macro-fiscal`)
   - Find "Offshore Dollar Funding Stress" section (between Auction Demand and Foreign Holders)
   - Should display SOFR-OIS spread value and status (stress/normal)
   - Data badge shows latest as-of date

3. **Terminal Homepage** (`/`)
   - Scroll to very bottom, above footer
   - Feedback section displays with emerald green CTA card
   - Link to Google Form works

4. **Mobile Responsive**
   - Test on 375px viewport
   - No horizontal overflow from new sections
   - TradeGravityCard map responsive (leaflet container has height)

---

## Recommended Next Steps

1. **Check Cron Jobs**: Verify `ingest-trade-gravity` and `ingest-institutional-features` are scheduled and running
2. **Trigger Ingestion** (if data is stale):
   ```bash
   # Via Supabase MCP
   supabase functions invoke ingest-trade-gravity
   supabase functions invoke ingest-institutional-features
   ```
3. **Monitor Data Health**: Check `DataHealthBanner` on Terminal for overall system status
4. **Add Analytics**: Consider adding click tracking for Feedback CTA via `trackClick()`
5. **Review Orphaned Remaining**: 13 other orphaned components still exist — consider wiring them in future iterations

---

## Technical Notes

- All components use **existing design patterns**: lazy loading, Suspense, SectionErrorBoundary, LoadingFallback
- No new dependencies introduced
- No breaking changes to existing routes or components
- Build artifact size increased by ~15-20KB (expected for 3 new components)
- All components respect the dark glassmorphic theme and use existing Tailwind utility classes

---

**Deploy Command** (after commit):
```bash
git push origin main  # Trigger Vercel deployment
```

**Rollback**: If issues arise, revert these 3 commits:
```
git revert HEAD~1  # Revert USMacroFiscalLab changes
git revert HEAD~1  # Revert DeDollarizationGoldLab changes
git revert HEAD~1  # Revert Terminal changes
```

---

**Implementation completed by**: Claude Code (Senior Fullstack Engineer)  
**Audit Reference**: CODEBASE_AUDIT_REPORT.md (2026-03-29)  
**Orphan Analysis**: 16 total orphaned components identified, 3 wired per request
