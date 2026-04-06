# Codebase-to-Live-Site Audit: Missing Component Wiring

## Executive Summary

Comprehensive audit identified **16 orphaned components** (implemented but not rendered). This plan wires the **4 requested components** into appropriate pages to make them fully functional and visible on the frontend.

**Target Components to Wire:**
1. `TradeGravityCard.tsx` (row) → Shadow System Lab
2. `FeedbackSection.tsx` (section) → Terminal landing page
3. `OffshoreDollarStressCard.tsx` (section) → Terminal (Liquidity Plumbline)
4. `MacroEconomicCalendar.tsx` (section) → Terminal (after TodaysBrief)

---

## Component Analysis

### 1. TradeGravityCard (rows/)
- **Purpose**: Shows BRICS+ vs G7 trade gravity shift over time (2018-2023)
- **Hook**: `useTradeGravityData` → `trade_gravity_metrics` table
- **Data Status**: ✅ Table exists (migration `20260222000000_trade_chokepoints.sql`)
- **Placement**: Shadow System Lab (`/labs/shadow-system`) - perfect thematic fit
- **Implementation**: Add lazy import + Suspense boundary

### 2. FeedbackSection (sections/)
- **Purpose**: User feedback CTA (links to Google Form)
- **Hook**: None (static)
- **Data Status**: ✅ No data dependency
- **Placement**: Terminal landing page (`/`) - high visibility
- **Implementation**: Add as new section before footer

### 3. OffshoreDollarStressCard (sections/)
- **Purpose**: Offshore dollar funding stress via SOFR-OIS spread
- **Hook**: `useInstitutionalFeatures` → `institutional_features` table
- **Data Status**: ✅ Requires ingestion (check if cron exists)
- **Placement**: Terminal → Liquidity Plumbline section (with GlobalLiquidityMonitor, NetLiquidityRow)
- **Implementation**: Add as new card in existing Card wrapper

### 4. MacroEconomicCalendar (sections/)
- **Purpose**: Filterable upcoming macro events calendar
- **Hook**: `useMacroEvents` → `macro_events` table
- **Data Status**: ✅ Table exists (migration `20260129000000_upcoming_events.sql` + cron)
- **Placement**: Terminal → after TodaysBriefPanel (high visibility)
- **Implementation**: Add as full-width section with Card wrapper

---

## Implementation Details

### Fix 1: Wire TradeGravityCard into ShadowSystemLab

**File**: `src/pages/labs/ShadowSystemLab.tsx`

Changes:
- Import `TradeGravityCard` (lazy)
- Add import for `ChartInsightSummary` (if not already)
- Insert new section after ShadowTradeCard
- Add section header and Card wrapper

**Why**: Shadow System Lab tracks "off-grid" trade flows. Trade gravity shift between BRICS+ and G7 is core to this intelligence theme.

---

### Fix 2: Wire FeedbackSection into Terminal

**File**: `src/pages/Terminal.tsx`

Changes:
- Import `FeedbackSection` (lazy)
- Add `SectionErrorBoundary` + `Suspense` block with `LoadingFallback`
- Insert as new section **after** CurrencyWarsMonitor (before closing `</main>`)
- Wrap in full-width `<section>` with proper spacing

**Why**: Direct user feedback is critical for institutional product refinement. High-visibility placement at bottom of landing page.

---

### Fix 3: Wire OffshoreDollarStressCard into Terminal Liquidity Section

**File**: `src/pages/Terminal.tsx`

Changes:
- Import `OffshoreDollarStressCard` (lazy)
- Within the "Liquidity Plumbline" section (line ~87-114), after the existing NetLiquidityRow Card, add a new Card:
  ```tsx
  <Card variant="elevated">
      <CardHeader>...</CardHeader>
      <CardContent>
          <OffshoreDollarStressCard />
      </CardContent>
  </Card>
  ```
- Add LiveStatusIndicator: source="FRED / CME"
- Include DataProvenanceBadge appropriately

**Why**: SOFR-OIS spread is a critical liquidity stress indicator. Fits naturally in Liquidity Plumbline as it measures offshore dollar funding conditions.

---

### Fix 4: Wire MacroEconomicCalendar into Terminal

**File**: `src/pages/Terminal.tsx`

Changes:
- Import `MacroEconomicCalendar` (lazy)
- Add new section **after** TodaysBriefPanel (within strategic context section ~line 72-84)
- Wrap in `SectionErrorBoundary` + `Suspense`
- Add SectionHeader: "Upcoming Macro Events" with Calendar icon
- Optional: Add small description about filtering high-impact events

**Why**: Macro events calendar is essential institutional planning tool. High placement ensures visibility early in the page.

---

## Additional Recommendations

### Data Health Checks
Before wiring, verify data exists in these tables:
- `institutional_features` → for OffshoreDollarStressCard
- `trade_gravity_metrics` → for TradeGravityCard
- `macro_events` → for MacroEconomicCalendar

If empty, trigger respective Edge Functions:
```bash
# Via Supabase MCP or direct HTTP POST
ingest-institutional-features
ingest-trade-gravity
ingest-macro-events
```

### Styling Consistency
- All new components use existing Card, SectionErrorBoundary, LoadingFallback patterns
- Maintain spacing: `space-y-24` between major sections
- Use consistent Card variants: `elevated` for standalone sections

### Error Handling
- All lazy-loaded sections wrapped in `SectionErrorBoundary` with meaningful names
- Use existing `LoadingFallback` component
- Components themselves handle empty data states (already implemented)

---

## Post-Implementation Verification

1. **Build & Lint**: `npm run lint && npm run build` must pass clean
2. **Visual Check**: Load `/` and `/labs/shadow-system` - verify 4 new sections render without errors
3. **Console**: No 404/500 errors in browser devtools
4. **Data**: Verify numbers display (not "N/A" or "-") for at least some metrics
5. **Responsive**: Check mobile view for horizontal overflow issues (particularly TradeGravityCard map and calendar table)

---

## Rollout Plan

**Estimated effort**: 30-45 minutes

1. Make edits to `Terminal.tsx` and `ShadowSystemLab.tsx` (4 files total)
2. Run lint + build
3. Verify data presence in Supabase (quick query)
4. If data missing, trigger ingest functions manually
5. Test locally, fix any runtime errors
6. Commit changes with clear message: `feat: wire orphaned components (TradeGravity, Feedback, OffshoreStress, EconomicCalendar)`

---

## Questions for User

1. **Confirm placement**: Is Terminal + ShadowSystem Lab the correct destinations, or would you prefer these on different pages?
2. **Data readiness**: Should I verify/trigger ingestions before or after wiring?
3. **Priority order**: Which component should I wire first?
4. **Other orphaned components**: After these 4, do you want to wire remaining orphaned components (ScenarioStudio, USEquitiesTeaserRow, Gold sections)?

---

## Success Criteria

- ✅ TradeGravityCard visible on `/labs/shadow-system` with working map and chart
- ✅ FeedbackSection visible on `/` with styled CTA and external link
- ✅ OffshoreDollarStressCard visible on `/` showing SOFR-OIS spread (or "-" if data missing)
- ✅ MacroEconomicCalendar visible on `/` with filterable events table
- ✅ No TypeScript or build errors
- ✅ All sections respect dark glassmorphic aesthetic
