# Plan: Stabilize Data Feeds & Organize Production Components
**Goal:** Transform GraphiQuestor into an institutional-saleable product by stabilizing data ingestion, fixing critical code issues, and properly organizing all 129 production components.

---

## Context

GraphiQuestor is an institutional-grade macro intelligence terminal with excellent architecture but critical data pipeline degradation:
- 9/17 high-frequency feeds delayed (DataHealthBanner confirms)
- Finnhub ingestion failing with 403 Forbidden
- Missing critical metrics (SOFR_OIS_SPREAD, GLOBAL_OIL_REFINING_UTILIZATION)
- 14 metrics overdue by months/years (including TED_SPREAD discontinued, EU_DEBT_GDP_PCT needing ECB API)
- React anti-pattern causing potential instability in SovereignRiskMatrix
- Typography accessibility violations (8.8px text)
- Terminal only shows ~18 of 129 components; labs exist but need organization

**Enterprise Risk:** Current stale data feeds make the platform unsuitable for institutional sales where billion-dollar allocation decisions require real-time, reliable telemetry.

---

## Phase 1: P0 - Stabilize Data Ingestion (Week 1-2)

### Task 1.1: Fix Finnhub Economic Calendar Ingestion
**File:** `supabase/functions/ingest-macro-events/index.ts`

**Problem:** 403 Forbidden error - API key likely invalid or plan limits exceeded.

**Actions:**
1. Check Supabase Secrets for `FINNHUB_API_KEY` validity
2. Verify Finnhub plan tier (free = 60 calls/min, may be insufficient)
3. Add request queuing with exponential backoff
4. Implement circuit breaker pattern to prevent repeated failures
5. Add detailed error logging with machine-readable codes
6. If Finnhub unresolvable, implement fallback to Alpha Vantage or Trading Economics

**Verification:** Function completes successfully, economic calendar data fresh (<24h old)

---

### Task 1.2: Replace Discontinued TED_SPREAD with SOFR_OIS_SPREAD
**Files:**
- `supabase/functions/compute-ratios/index.ts` (or relevant ingestion)
- All charts referencing TED_SPREAD
- `SovereignRiskMatrix.tsx` and any sovereign stress components

**Problem:** TED_SPREAD based on LIBOR is discontinued (1489 days overdue). SEC recommends SOFR_OIS_SPREAD as replacement.

**Actions:**
1. Add FRED series `SOFR_OIS` to ingestion (FRED: `SOFR-OIS`)
2. Update metric definitions: Replace `TED_SPREAD` with `SOFR_OIS_SPREAD`
3. Backfill historical data (FRED has SOFR-OIS from 2018, use OIS proxies before that)
4. Update all dependent composites and charts
5. Update any sovereign risk matrices using this metric

**Verification:** SOFR_OIS_SPREAD shows current value, chart displays continuously from 2018-present

---

### Task 1.3: Migrate EU_DEBT_GDP_PCT to ECB SDMX API
**File:** New or existing ECB ingestion function

**Problem:** EU debt data 5892 days overdue. Current source defunct. ECB provides SDMX-JSON REST API.

**Actions:**
1. Create `ingest-ecb-debt` function or update existing ECB function
2. Use ECB SDMX endpoint: `https://sdw-wsrest.ecb.europa.eu/service/data/` for government debt-to-GDP
3. Implement pagination for full historical series
4. Backfill 5892 days of missing data
5. Update expected_interval_days and staleness flags

**Verification:** EU_DEBT_GDP_PCT updated within last 30 days for all Euro area countries

---

### Task 1.4: Implement Fallback Snapshot System
**Files:** All ingestion functions (systematic update)

**Problem:** When APIs fail, data becomes completely missing rather than "stale but available". Institutions prefer old data over no data.

**Actions:**
1. Add `fallback_snapshot` table: stores last successful value per metric/entity/date
2. Modify ingestion functions: on API failure, query last known good value
3. Upsert with `provenance = 'fallback_snapshot'` and `is_stale = true`
4. Update staleness flag logic to distinguish "fresh", "stale_fresh", "stale_fallback", "missing"
5. Update DataHealthBanner to count "stale_fallback" differently than "missing"
6. Document staleness semantics in `docs/DATA_PROVENANCE.md`

**Verification:** Simulate API failure (disconnect), confirm system uses last known value with amber staleness badge

---

### Task 1.5: Fix Missing Critical Metrics
**Files:** Relevant ingestion functions + Terminal.tsx

**Metrics to Add:**
1. `GLOBAL_OIL_REFINING_UTILIZATION` - Source: EIA (weekly `ingest-oil-eia`)
2. `SOFR_OIS_SPREAD` - Source: FRED (daily `ingest-fred`)
3. `CHINA_CORPORATE_DEFAULTS` - Source: PBOC/SAFE (new monthly function)
4. `INDIA_UPI_CREDIT_GROWTH` - Source: RBI (new function or enhance `ingest-mospi`)

**Actions:**
- Add FRED series for SOFR_OIS (already covered in 1.2)
- Extract refining utilization from existing `ingest-oil-eia` (EIA has global utilization data)
- Create new ingestion for China defaults (monthly)
- Create new ingestion for India UPI credit (monthly, from RBI press releases)
- Add these metrics to Terminal display (appropriate sections)

**Verification:** All 4 metrics appear in terminal with fresh data and proper source attribution

---

## Phase 2: P1 - Code Quality & Accessibility (Week 2-3)

### Task 2.1: Fix React Anti-Pattern in SovereignRiskMatrix
**File:** `src/features/dashboard/components/sections/SovereignRiskMatrix.tsx:31-92, 109`

**Problem:** `CustomTooltip` component defined inside render causes state reset on every render. Lint error: "Components created during render will reset their state."

**Actions:**
1. Move `CustomTooltip` definition outside the `SovereignRiskMatrix` component
2. Pass active/payload as props
3. Ensure component is memoized if needed
4. Verify lint passes with 0 errors
5. Run test: expand/collapse matrix, ensure tooltip state stable

**Verification:** `npm run lint` shows 0 errors, tooltip works without flickering

---

### Task 2.2: Typography Accessibility Overhaul
**Files:** All components with small text (search for `0.55rem`, `0.65rem`, `10px`)

**Problem:** WCAG 2.1 AA requires minimum 12px (0.75rem) for body text. Current `TodaysBriefPanel` uses 8.8px and 10.4px.

**Actions:**
1. Create typography scale in `tailwind.config.js`:
   - `text-xs` = 0.75rem (12px) minimum
   - Captions = 0.625rem (10px) only for secondary metadata
2. Replace all hardcoded `0.55rem`, `0.65rem` with semantic classes: `text-xs`, `text-sm`, `text-base`
3. Focus on `TodaysBriefPanel.tsx` lines 89, 151, 170, 215-247, 249, etc.
4. Test with screen reader (VoiceOver/NVDA) to ensure readable
5. Audit: `grep -r "0\.5[5-9]rem" src/` to find remaining violations

**Verification:** All body text ≥12px, contrast ratio ≥4.5:1, passes Lighthouse a11y audit

---

### Task 2.3: Mobile Responsiveness Fixes
**Files:** `TodaysBriefPanel.tsx`, `DataHealthBanner.tsx`, all Recharts components

**Problem:** Charts become invisible at 375px width; header overlap issues.

**Actions:**
1. Recharts responsive containers: Add `min-width` fallbacks, test at 320px, 375px, 768px
2. DataHealthBanner: Fix header overlap per audit (already identified)
   - Add responsive padding: `px-4 md:px-8`
   - Flex-wrap on small screens
3. Terminal header: Prevent brand text overlap with status indicator
4. Test on actual devices or Chrome DevTools device emulation
5. Consider progressive disclosure: hide non-critical cards on mobile (<640px)

**Verification:** All charts readable at 375px width; no overlapping elements; touch targets ≥44px

---

### Task 2.4: Remove Truly Unused Code (Not 129 Components!)
**Critical:** The 129 components ARE used - they're in labs or sections. Don't delete production components.

**Actions:**
1. Find actually orphaned files: components with 0 imports anywhere
2. Search: `grep -L "from.*ComponentName" src/**/*.tsx` to find never-imported files
3. Check for placeholder/WIP naming: `WIP_`, `Draft_`, `TODO_`, `Placeholder_`
4. Remove only confirmed orphaned components (likely <5)
5. UPDATE: `StateMacroInsights.tsx` is used in `ASISection` and `EnergySection` - KEEP IT

**Verification:** Lint passes with no unused import warnings; build size reduced by removing dead code

---

## Phase 3: P2 - Feature Completeness & Component Organization (Week 3-4)

### Task 3.1: Audit All 129 Components & Create Visibility Map
**Deliverable:** `docs/COMPONENT_REGISTRY.md`

**Actions:**
1. Enumerate all 129 components with:
   - File path
   - Component name
   - Current visibility (Terminal main/IndiaLab/ChinaLab/OtherLab/NotUsed)
   - Page routes that import it
   - Data dependencies (which hooks/ingestions)
2. Create decision matrix:
   - **Tier 1:** Must be on main terminal (core macro signals)
   - **Tier 2:** Lab pages only (specialized deep dives)
   - **Tier 3:** Hidden/experimental (not ready)
3. Cross-check with README.md sections: ensure all mentioned capabilities have visible components

**Current State:**
- Terminal shows: 18 components (rows/sections/cards mixed)
- IndiaLab: ~12 India-specific components
- ChinaLab: ~8 China-specific components
- SovereignStressLab: ~5 stress components
- EnergyCommoditiesLab: ~10 energy components
- DeDollarizationGoldLab: ~8 gold/de-dollarization components
- Others: ~60 components scattered or unassigned

---

### Task 3.2: Reorganize Terminal Layout for Institutional Users
**File:** `src/pages/Terminal.tsx` (major refactor)

**Problem:** Current terminal is a long scrolling list without clear hierarchy. Institutional users need:
- Market opens/closes: Daily brief FIRST
- Liquidity direction immediately visible
- Sovereign stress strips clearly grouped
- Geopolitical risk prominence
- Lab access from sidebar, not buried in scroll

**Proposed New Structure:**
```tsx
<main>
  {/* Row 0: Daily Intelligence Brief - TOP OF MIND */}
  <WeeklyNarrativeSection />  // Market narrative
  <TodaysBriefPanel />         // Headlines + regime+liquidity status

  {/* Row 1: Global Liquidity Direction - PRIMARY CONTEXT */}
  <GlobalLiquidityMonitor />
  <WhiteCollarDebtMonitor />

  {/* Row 2: Capital Flow Visibility */}
  <SmartMoneyFlowMonitor />
  <CapitalFlowsTerminal />

  {/* Row 3: Sovereign Stress Dashboard */}
  <USTreasuryDemandGauge />
  <USDebtMaturityWall />
  <SovereignRiskMatrix />      // G20 heatmap
  <DeflationDebasementMonitor />

  {/* Row 4: Geopolitical Risk Matrix */}
  <GeopoliticalEventsRow />
  <CurrencyWarsMonitor />

  {/* Row 5: India Market Pulse (strategic for EM allocators) */}
  <CompactIndiaCard />
  <IndiaMarketPulseRow />

  {/* Row 6: China Strategic Signals */}
  <CompactChinaCard />
  <China15thFYPTeaserRow />

  {/* Row 7: Energy Security */}
  <RefiningCapacityCard />
  <OilImportVulnerabilityCard />

  {/* Row 8: Hard Assets */}
  <USDebtGoldBackingCard />
  <CentralBankGoldNet />

  {/* Row 9: Market Extremes */}
  <USEquitiesTeaserRow />
  <CorporateTreasuryHedgingSection />
</main>
```

**Actions:**
1. Reorder components in Terminal.tsx according to institutional priority
2. Group related signals into visual sections ( bordered containers with headers )
3. Add clear section headers with live status indicators
4. Move non-essential components to lab pages exclusively
5. Ensure component placement matches branding: "terminal" not "blog"

**Verification:** Terminal loads in <3 seconds, clear visual hierarchy, institutional user tested (if possible)

---

### Task 3.3: Ensure All Labs Are Fully Populated & Functional
**Files:** All files in `src/pages/labs/`

**Labs to Verify:**
- `/labs/us-macro-fiscal` - US fiscal stress, debt maturity
- `/labs/india` - India macro + corporate engine
- `/labs/china` - China PBOC, real economy
- `/labs/de-dollarization-gold` - Reserve shifts, central bank gold
- `/labs/energy-commodities` - Refining, oil flows, SPR
- `/labs/sovereign-stress` - Sovereign debt vulnerability
- `/labs/shadow-system` - Capital flight, illicit flows
- `/labs/sustainable-finance-climate-risk` - Energy import risk, grid carbon
- `/labs/china-15th-fyp` - 2021-2025 policy tracking

**Actions:**
1. Test each lab route: all components load without errors
2. Verify data dependencies: each lab's components have working hooks
3. Add breadcrumbs and consistent navigation from main terminal
4. Update `GlobalLayout` navigation to include all labs in sidebar
5. Document each lab's purpose in a Labs index page
6. Fix any broken imports (missing components)

**Verification:** All 9 lab pages load with live data, navigation works from sidebar

---

## Phase 4: P3 - Data Provenance & Monitoring Enhancements (Week 4)

### Task 4.1: Visualize Data Provenance on Every Chart
**Files:** Chart components, card components

**Problem:** Users need to see "when was this data updated?" to judge reliability.

**Actions:**
1. Create `DataProvenanceBadge` component:
   - Shows: `Last updated: 2h ago (FRED)` or `Data delayed: 5 days`
   - Color coding: green (fresh <24h), amber (stale 1-7d), red (very stale >7d)
2. Add badge to all cards/rows/sections at top-right corner
3. Include source name and staleness flag
4. Make badge clickable to anchor to DataHealthDashboard
5. Test: Disable an ingestion, observe badge update

**Verification:** Every data display has provenance badge; badge updates automatically on data refresh

---

### Task 4.2: Newsletter Pipeline Hardening (Already Started)
**File:** `supabase/functions/generate-newsletter/index.ts`

**Already Fixed:** Staleness guard halts generation if data >7 days old.

**Actions:**
1. Add manual override mechanism (for emergency sends): admin dashboard button
2. Add preview mode: generate with `?preview=true` query param bypassing staleness check
3. Test: Trigger newsletter generation with fresh data, verify send to test email
4. Add subject line personalization with current regime/liquidity state

**Verification:** Test email received with correctly formatted digest, no stale data included

---

### Task 4.3: Implement Comprehensive Error Tracking
**File:** `supabase/functions/_shared/error-handler.ts` (if exists) or create

**Actions:**
1. Centralize error logging to `ingestion_logs` with structured error codes
2. Add Sentry or Logflare integration for alerting (instead of email-only)
3. Create admin dashboard view of last 50 ingestion errors with retry buttons
4. Add metric: `data_freshness_score` (0-100) computed from staleness of top 20 metrics
5. Set up Slack/Discord webhook for critical failures (PagerDuty-style)

**Verification:** Failed ingestion triggers Slack alert within 5 minutes; admin dashboard shows actionable error details

---

## Phase 5: P4 - Strategic Enhancements (Week 5-6+)

### Task 5.1: Add Fixed Income Telemetry
**Files:** New ingestion functions, new chart components

**Why Missing:** No sovereign yields or credit spreads - critical for institutional fixed income allocation.

**Actions:**
1. Ingest US Treasury yields (2Y, 10Y, 30Y) from FRED
2. Ingest sovereign CDS 5-year spreads (Markit or ECB) for G20
3. Ingest credit ETF flows (HYG, LQD) from Alpha Vantage or Finnhub
4. Create components:
   - `GlobalYieldCurveMonitor.tsx` (multi-country yield curves)
   - `SovereignCDSSpreads.tsx` (CDS heatmap)
   - `CreditMarketFlow.tsx` (ETF flows)
5. Add to terminal placement: between Sovereign Stress and Geopolitical Risk

**Verification:** Fixed income section displays live yields, spreads update daily

---

### Task 5.2: Derivatives Positioning Data
**Files:** New ingestion, new components

**Actions:**
1. Ingest CBOE options flow: total put/call ratio, skew (from CBOE or OptionMetrics)
2. Extend COTC data to include non-commercial positioning (CFTC)
3. Add futures positioning: CME IMM (Dollar Index, Gold, Oil)
4. Create `DerivativesPositioningMonitor.tsx`
5. Integrate with SmartMoneyFlowMonitor as a new tab or adjacent section

**Verification:** Derivatives positioning shows current readings, correlates with spot markets

---

### Task 5.3: Machine Learning Anomaly Detection
**Files:** New `src/lib/anomaly-detection.ts`

**Actions:**
1. Compute rolling Z-scores for all metrics (20-day, 60-day)
2. Flag anomalies: |Z-score| > 3σ on any metric
3. Create `AnomalyDetectionPanel` showing:
   - List of anomalous metrics (today vs history)
   - Severity grading (3σ, 4σ, 5σ)
   - Correlation: what else moved simultaneously?
4. Push alerts to DataHealthBanner if >5 anomalies detected
5. Keep it simple: statistical process control, not deep learning

**Verification:** On volatile market day, anomaly panel flags unusual moves; no false positives in stable periods

---

### Task 5.4: API-First Architecture Exploration
**Future consideration:** Extract data layer to standalone GraphQL/REST API

**Why:** Currently Next.js app is monolithic. Institutions may want API access only.

**Actions (if pursuing):**
1. Design GraphQL schema for metrics/series queries
2. Build proof-of-concept API server (FastAPI or tRPC)
3. Reuse ingestion functions as API backend
4. Document API endpoints with GraphQL playground or Swagger
5. Consider Stripe/Braintree integration for API monetization

**NOTE:** This is a major architectural shift - evaluate based on client demand before implementing.

---

## Execution Order & Dependencies

**Critical Path:**
Week 1-2: Tasks 1.1 → 1.2 → 1.3 → 1.4 → 1.5 (data stabilization is foundational)
Week 2-3: Tasks 2.1 → 2.2 → 2.3 → 2.4 (can parallelize with Phase 1 completion)
Week 3-4: Tasks 3.1 → 3.2 → 3.3 (component organization)
Week 4: Tasks 4.1 → 4.2 → 4.3 (polish)
Week 5-6+: Tasks 5.1 → 5.2 → 5.3 (strategic features)

**Cannot Skip:**
- P0 must complete before institutional sales (data credibility)
- P1 essential for accessibility compliance and stability
- P2 necessary to make all 129 components visible and organized
- P3 improves operational reliability
- P4 adds competitive differentiation

---

## Verification & Success Criteria

**Institutional Saleable =**
- ✅ 100% data freshness for top 20 terminal metrics (0 stale)
- ✅ 0 lint errors, 0 TypeScript compile errors
- ✅ All 129 components assigned to visible routes or documented as experimental
- ✅ Passes WCAG 2.1 AA accessibility audit
- ✅ Mobile responsive at 375px width
- ✅ Newsletter generates with fresh data
- ✅ Real-time data provenance visible on all charts
- ✅ New critical metrics (SOFR_OIS, refining utilization) live
- ✅ All lab pages functional with breadcrumb navigation

**Launch Readiness Checklist:**
- [ ] Data Health Dashboard shows ≤2 stale metrics (tier 3 only)
- [ ] No console errors on terminal load
- [ ] All ingestion cron jobs running past 7 days without failure
- [ ] Latest 30 days of data complete across all sources
- [ ] Admin can manually trigger Newsletter with preview
- [ ] Terminal loads in <3 seconds on 3G connection (CDN + code splitting)
- [ ] 0 React anti-pattern warnings
- [ ] Typography minimum 12px verified with Lighthouse
- [ ] All 9 lab pages reachable from sidebar or main terminal
- [ ] Anomaly detection operational (no alerts in normal conditions)

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Finnhub API unfixable (discontinued plan) | Medium | High | Implement fallback to Alpha Vantage/Trading Economics (Task 1.1) |
| ECB SDMX API unfamiliarity delays migration | Medium | Medium | Allocate 2 days research; use existing Deno SDKs |
| Component reorganization breaks existing layout | High | Medium | Use feature flags; A/B test with staging deployment |
| Mobile fixes introduce desktop regressions | Medium | Low | Test on desktop after each mobile change |
| 129 components too many for single terminal | High | Medium | Prioritize: core vs lab; consider "module" system (Task 3.2) |

---

## Notes

**Component Count Clarification:** The 129 components span rows/cards/sections/maps/charts/refining modules. They are NOT unused - they are distributed across:
- Main Terminal (~18 components currently displayed)
- 9 Lab pages (~80 components total across labs)
- Potentially hidden/experimental (~30 components needing review)

**Do NOT delete production components** - they represent significant intellectual property (India state-level ASI insights, energy security metrics, etc.) that differentiate GraphiQuestor from Bloomberg.

**Focus:** Stabilize data feeds → fix code quality → organize visibility → enhance strategic metrics → optional API productization.

---

**Ready to execute. This plan addresses all critical path items for institutional saleability.**
