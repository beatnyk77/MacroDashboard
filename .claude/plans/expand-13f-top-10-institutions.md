# Plan: Expand 13-F Tracker to Top 10+ Global Institutional Investors

**Objective:** Expand tracked institutions from 8 to 15, adding Blackstone, Bridgewater, State Street, Fidelity, Capital Group, CalSTRS, Ontario Teachers', and more.

**Files to Modify:**
- `supabase/functions/ingest-institutional-13f/index.ts` (add 7 new institutions)
- `src/hooks/useSmartMoneyHoldings.ts` (update keyInstitutions list, increase heatmap limit)
- `src/components/InstitutionalHoldingsWall.tsx` (layout tweaks for more cards)
- (Optional) performance optimizations if ingestion too slow

**Estimated Effort:** ~5 hours including testing

**Risks:** Alpha Vantage rate limits may extend ingestion runtime to 45-60 min (acceptable for weekly cron). Some CIKs may not have 13-F filings (skip gracefully).

**Current Institutions (8):**
1. Norges Bank (Sovereign Wealth) - CIK: 0001164748
2. GIC Private Ltd (Sovereign Wealth) - CIK: 0000930796
3. Abu Dhabi Investment Authority (ADIA) (Sovereign Wealth) - CIK: 0001426425
4. CPPIB (Sovereign Wealth) - CIK: 0001006540
5. CalPERS (Pension Fund) - CIK: 0000919079
6. BlackRock Inc. (Asset Manager) - CIK: 0001364762
7. Vanguard Group Inc. (Asset Manager) - CIK: 0000102905
8. Temasek Holdings (Sovereign Wealth) - CIK: 0001021944

**Proposed New Institutions (7) for total of 15:**

**Asset Managers (4):**
9. State Street Global Advisors (State Street Corp) - CIK: 0000093751
10. Fidelity Management & Research (FMR) - CIK: 0000315066
11. Capital Research and Management Company - CIK: 0000702011
12. Blackstone Inc - CIK: 0001342606

**Hedge Fund (1):**
13. Bridgewater Associates, LP - CIK: 0001352464

**Pension Funds (2):**
14. CalSTRS (California State Teachers' Retirement System) - CIK: 0000919844
15. Ontario Teachers' Pension Plan - CIK: 0001563816

Total: 15 institutions across 5 categories.

*Note: CIKs are sourced from public SEC records but should be validated before production. Ingestion will skip any institution without valid 13-F filings.*

The ingestion pipeline uses SEC 13-F filings with Alpha Vantage enrichment, which is already designed to handle multiple institutions sequentially with rate limiting. The UI component (`InstitutionalHoldingsWall`) is already architected to handle 8+ institutions and can scale with minor adjustments.

## Objectives

1. **Expand tracked institutions** from 8 to minimum 12-15 top global players
2. **Validate data availability** - ensure all added institutions file 13-F reports (most do, but some SWFs may have different filing requirements)
3. **Optimize ingestion performance** - maintain ~15-minute total runtime with Alpha Vantage rate limits (5 calls/min)
4. **UI scaling** - ensure layout remains clean with 12-15 institutions (adjust grid if needed)
5. **Preserve existing functionality** - no regression in enriched analytics (asset allocation, regime signals, etc.)

## Approach

### Phase 1: Identify Target Institutions & Validate Data Availability
**Research Requirements:**
- Verify each candidate institution has a CIK and files 13-F reports
- Prioritize by AUM ranking: Top 10 global asset managers + Top 10 sovereign wealth funds + Top 10 pension funds
- Select cross-section representing diverse strategies (long-only, hedge fund, private equity adjacent)

**Proposed Final List (15 institutions):**

**Asset Managers (6):**
- BlackRock Inc. (already)
- Vanguard Group Inc. (already)
- State Street Global Advisors (to add)
- Fidelity Investments (to add)
- Capital Group (to add) - Note: Capital Group files 13-F for American Funds family
- Blackstone (to add) - files 13-F for listed alternatives

**Sovereign Wealth Funds (4):**
- Norges Bank (already)
- GIC Private Ltd (already)
- Abu Dhabi Investment Authority (already)
- CPPIB (already)
- Temasek Holdings (already)
- China Investment Corporation (to add) - check 13-F filing
- Korea Investment Corporation (to add) - check 13-F

**Pension Funds (5):**
- CalPERS (already)
- CalSTRS (to add)
- New York State Common Retirement Fund (to add)
- Ontario Teachers' Pension Plan (to add)
- Florida State Retirement System (to add) - large public pension

*Note: We'll include all existing 8 and add at least 5 more to reach 15 total.*

### Phase 2: Update Ingestion Configuration
**File:** `supabase/functions/ingest-institutional-13f/index.ts`

**Changes:**
1. Replace the current `INSTITUTIONS` array (lines 89-98) with expanded list including:
   - Name, CIK, type for each new institution
   - Verify CIKs are correct (use SEC EDGAR to confirm)
   - Add any additional types as needed

2. **Performance optimizations:**
   - Current Alpha Vantage rate limit: 5 calls/min, with 12s delay between calls
   - With 15 institutions × ~20 holdings each = 300 CUSIP→ticker lookups
   - Current estimate: 20 min runtime (15 × 20 × 12s = 3600s + overhead)
   - **Mitigation strategies:**
     a. Cache sector mappings in a separate table to avoid repeated Alpha Vantage calls for same CUSIP across quarters
     b. Parallelize within institutions: Process top 10 holdings concurrently with controlled concurrency (e.g., 5 at a time) while respecting rate limits
     c. Explore bulk lookup alternatives if available in Alpha Vantage
     d. Accept longer runtime (may run 30-45 min) - cron is weekly, acceptable

3. **Error handling improvements:**
   - Add per-institution try-catch to ensure one failure doesn't stop entire batch
   - Log failures to `ingestion_logs` with institution name for debugging
   - Add retry logic with exponential backoff for Alpha Vantage rate limit errors (429)

4. **CIK validation:** Before processing, validate that 13-F filing exists; if not, log and skip with clear status

### Phase 3: Database Schema - No Changes Required
The existing `institutional_13f_holdings` table already supports all needed fields. The schema extension migration (`20260331000000_extend_institutional_13f.sql`) is already in place with columns for:
- asset_class_allocation, top_holdings, concentration_score, sector_rotation_signal, spy_comparison, tlt_comparison, gld_comparison, regime_z_score, historical_allocation

**Action:** Verify indexes exist and perform well with 15 institutions.
- Existing indexes: `idx_institutional_13f_holdings_cik_date`, `idx_institutional_13f_holdings_date`
- Should be sufficient.

### Phase 4: UI Component Adjustments
**File:** `src/components/InstitutionalHoldingsWall.tsx`

**Current layout:**
- Header shows total monitored AUM and "8 Institutions" count
- Key Institutions section shows hardcoded 5 institutions: Norges, GIC, ADIA, CPPIB, CalPERS
- Need to update this to reflect expanded universe

**Changes:**
1. **Update header stats:**
   - Change "8 Institutions" to dynamic count from `collective.institution_count`
   - Already dynamic via collective view - ✅

2. **Update Key Institutions section:**
   - Current: `keyInstitutions = ['Norges Bank', 'GIC Private Ltd', 'Abu Dhabi Investment Authority', 'CPPIB', 'CalPERS']`
   - Expand to 8-10 most important ones to fill the card grid
   - Provide visual hierarchy: Sovereign Wealth Funds (SWFs) + Asset Managers + Pension Funds
   - Show up to 8 cards (grid layout 2x4 or 4x2 depending on screen)
   - The `institutionCards` derived data uses `keyInstitutions` filter; need to update that array

3. **Adjust grid layout for 8 cards:**
   - Current Grid: `<Grid item xs={12} lg={4}>` for the institution cards column
   - This gives 3 columns on large screens - each card is 1/3 width; internal grid is `container spacing={2}` with items `xs={12}` (full width)
   - To show 8 cards in a single column, they'll stack vertically - this is fine as cards are compact
   - No layout change needed; just ensure scrolling is smooth

4. **Heatmap scalability:**
   - Current heatmap shows 8 institutions (from `topInstitutions.slice(0,8)`)
   - With 15 total institutions, we may want to show all 15 in heatmap or keep top 10-12
   - Decision: Show all tracked institutions in heatmap (up to 15) - horizontal scroll okay
   - Update: Change `const topInstitutions = institutions.slice(0, 8)` to `slice(0, 12)` or remove limit
   - Consider UX: With 15 rows, heatmap needs to be compact; cell sizing currently ~90px min-width per sector column
   - Test responsiveness: Could wrap on smaller screens

5. **Update hardcoded references:**
   - In `InstitutionalHoldingsWall.tsx`, line 546: "DATA: SEC 13-F EDGAR • ALPHA VANTAGE ENRICHMENT" - keep as is
   - No other hardcoding issues

**Implementation:**
- Update `keyInstitutions` array in `useSmartMoneyHoldings` hook (line 99) to include new institutions
- Possibly increase `topInstitutions` slice from 8 to 10 or 12
- Test visual layout with simulated 12-15 institutions

### Phase 4.5: Update Hook Key Institutions List
**File:** `src/hooks/useSmartMoneyHoldings.ts`

Change:
```typescript
const keyInstitutions = ['Norges Bank', 'GIC Private Ltd', 'Abu Dhabi Investment Authority', 'CPPIB', 'CalPERS'];
```

To:
```typescript
const keyInstitutions = [
    'Norges Bank', 'GIC Private Ltd', 'Abu Dhabi Investment Authority', 'CPPIB', 'Temasek Holdings',
    'BlackRock Inc.', 'Vanguard Group Inc.', 'State Street Global Advisors', 'Fidelity Investments',
    'Blackstone', 'Bridgewater Associates', 'CalPERS', 'CalSTRS', 'Ontario Teachers'' Pension Plan'
];
```

Then slice to show top 8-10 in order of priority (SWFs first, then asset managers, then pensions).

**Better approach:** Dynamic selection: top 8 by AUM, but ensure at least 2 SWFs, 2 asset managers, 2 pensions are included. For now, static prioritized list is okay.

### Phase 5: Testing & Validation

**Local Testing:**
1. Update INSTITUTIONS array with CIKs for new institutions
2. Run ingestion function locally (Deno) or deploy to Supabase and trigger manually
3. Monitor logs for:
   - Rate limit errors from Alpha Vantage
   - Missing 13-F filings (should log and skip)
   - CUSIP→ticker mapping failures
4. Verify all 15+ institutions appear in `institutional_13f_holdings` table after run
5. Check that all enriched fields (asset_class_allocation, top_holdings, etc.) are populated

**UI Testing:**
1. Start dev server and view `InstitutionalHoldingsWall`
2. Verify all new institutions appear in heatmap
3. Verify Cards section shows up to 8 key institutions (check that new ones appear)
4. Check responsive behavior on different screen sizes
5. Verify total AUM aggregation includes all 15+

**Production Rollout:**
1. Deploy updated ingestion function to Supabase Edge Functions
2. Update cron if needed (already weekly)
3. Manually trigger ingestion and monitor `ingestion_logs` table
4. Verify data appears in UI within 1 hour
5. Check for any console errors in production

**Performance Monitoring:**
- Track ingestion duration; if >60 minutes, consider optimizations:
  - Increase Alpha Vantage delay tolerance (maybe use premium API key with higher rate limit)
  - Implement caching layer for CUSIP→ticker mappings across all institutions (store in a `cusip_ticker_cache` table with TTL)
  - Process holdings in smaller batches with backoff

### Phase 6: Data Quality & Fallbacks

**CUSIP Mapping Failure Handling:**
- Current code: If Alpha Vantage SYMBOL_SEARCH fails, sector defaults to 'Other' and ticker remains null
- With 15 institutions, we should:
  - Log each failure to a `cusip_mapping_failures` table for manual review
  - Count failures and surface in admin dashboard
  - Consider manual override table where operator can pre-map known CUSIPs to tickers

**Missing 13-F Handling:**
- Some institutions may not file 13-F (e.g., if they qualify as investment advisers but not managers, or foreign SWFs file different forms)
- If no 13F found, log and continue; don't fail whole batch
- In UI, show "No 13F Data Available" badge for that institution (already handled? Check)

**Stale Data Detection:**
- Current data: as_of_date from latest filing
- UI shows "Inferred from latest 13-F filings (quarterly, ~45-day lag)"
- Verify that for institutions without recent filings, the component handles gracefully (should show last available data if still in table)

## Files to Modify

1. **`supabase/functions/ingest-institutional-13f/index.ts`**
   - Update `INSTITUTIONS` array with 15+ entries (names, CIKs, types)
   - Add per-institution error isolation (try-catch inside Promise.allSettled already handles this)
   - Consider caching layer (optional optimization)
   - Add logging for missing 13-Fs

2. **`src/hooks/useSmartMoneyHoldings.ts`**
   - Update `keyInstitutions` array to include new names (expand to 10-12 entries)
   - Optionally increase `topInstitutions` slice from 8 to 10 or 12
   - Update `institutionCards` logic to ensure newly added key institutions appear

3. **`src/components/InstitutionalHoldingsWall.tsx`**
   - Adjust metadata: header to show dynamic institution count (already uses collective.institution_count)
   - Grid layout tweaks if needed for more cards (currently 4 cols on large screens? Actually 3 cols; internal grid `xs={12}` means full width per card, external `lg={4}` means 1/3 width, so 3 cards side-by-side on large screens)
   - Current: Institution Cards column shows 5 cards; with 10 cards they'll stack with 3 visible side-by-side if we adjust internal grid to `xs={12} sm={6} lg={4}` (3 per row)
   - Update: Change internal Grid to `xs={12} sm={6}` for 2 per row on medium screens

4. **Optional new file: `supabase/migrations/20260401000000_add_cusip_ticker_cache.sql`**
   - Create cache table to speed up repeated CUSIP lookups across quarters
   - Only implement if ingestion runtime becomes problematic

## Verification Steps

1. **After deployment, verify:**
   - All 15+ institutions appear in the dropdown/selector if there's any filter (check page)
   - Heatmap includes all institutions (or top 12 as limited)
   - Cards section displays diverse set (SWFs, asset managers, pensions)
   - Total AUM aggregated reflects all institutions
   - No console errors in browser dev tools
   - Ingestion completes successfully (check `ingestion_logs`)

2. **Performance:**
   - Measure ingestion runtime (should be <60 min even with 15 institutions)
   - If >60 min, implement caching optimization

3. **Data Quality:**
   - Spot-check a few institutions to verify top_holdings have proper ticker names (not "Other")
   - Verify sector rotation signals are computed
   - Ensure no NULL values in critical fields (asset_class_allocation, top_holdings)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Alpha Vantage rate limits cause ingestion to take hours | Implement caching of CUSIP→ticker mappings; reduce API calls; accept longer runtime if weekly is okay |
| Some institutions don't file 13-F (e.g., certain SWFs) | Pre-validate CIKs via SEC API; skip gracefully; replace with alternative institution |
| UI becomes cluttered with 15 institutions | Limit heatmap to top 12 by AUM; use scrolling; maintain cards at 8 most important |
| Top holdings enrichment fails for many CUSIPs | Add manual mapping table; improve fallback logic using sector from filing if available |
| CIKs change or are incorrect | Verify CIKs from authoritative source (SEC EDGAR) before adding; add validation step |

## Implementation Order

1. Research & finalize list of 12-15 institutions with verified CIKs
2. Update ingestion `INSTITUTIONS` array
3. Test ingestion manually on staging (trigger function, watch logs)
4. Update `useSmartMoneyHoldings` keyInstitutions and slice limits
5. Adjust `InstitutionalHoldingsWall` grid layout for more cards
6. Deploy to production, trigger weekly ingestion
7. Monitor data quality and UI rendering
8. If ingestion too slow, implement caching optimization

## Estimated Timeline

- Research & CIK verification: 1 hour
- Ingestion update & testing: 2 hours
- UI updates: 1 hour
- Production deployment & monitoring: 1 hour
- **Total:** ~5 hours (may be less if CIKs readily available)

## Success Criteria

- Minimum 12 institutions tracked (target 15)
- All major categories represented: SWFs, Asset Managers, Pension Funds, Hedge Funds
- Ingestion completes within 60 minutes (or acceptable overnight window)
- UI displays all institutions cleanly without layout issues
- No data quality alerts or significant enrichment failures
