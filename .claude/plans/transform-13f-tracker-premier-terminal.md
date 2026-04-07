# Plan: Transform 13F Tracker into Premier Institutional Holdings Terminal

## Context

The 13F tracker is **functionally complete** but suffers from significant UI/UX issues that undermine its credibility as a professional-grade intelligence terminal. The current implementation has:
- Data not displaying clearly (missing labels, unreadable charts)
- Cluttered layout that fails to showcase high-value institutional data
- Top holdings names invisible (tickers only, many null)
- Heatmap overflow with 15 institutions making it unscalable
- Institution cards limited to 10, hiding data for 5 tracked institutions
- Poor visual hierarchy that doesn't match the "go-to source" ambition

The backend infrastructure is solid:
- ✅ 15 institutions tracked (Norges, GIC, ADIA, CPPIB, Temasek, BlackRock, Vanguard, State Street, Fidelity, Capital, Blackstone, Bridgewater, CalPERS, CalSTRS, Ontario Teachers)
- ✅ Full ingestion pipeline via Supabase Edge Functions with SEC EDGAR + Alpha Vantage
- ✅ Rich schema with asset allocation, top holdings, concentration scores, regime signals
- ✅ Automated weekly cron scheduling
- ✅ MCP tools available for Supabase & SEC integration (user confirmed)

**Goal**: Redesign the UI to be **clean, high-density, Bloomberg-grade** - the single destination for institutional 13F intelligence.

---

## Design Principles (Refreshed)

1. **Information Density with Clarity**: Show more data without visual noise
2. **Professional Terminal Aesthetic**: Dark mode, crisp typography, consistent color language
3. **Readable Charts**: Every chart must have clear labels, proper scaling, and readable text
4. **Complete Coverage**: All 15 tracked institutions visible in appropriate sections
5. **Data Integrity**: Always show names (not just tickers), sectors, and meaningful aggregates

---

## Phase 1: Critical UI Fixes (Immediate)

### 1.1 Fix Top Holdings Bar Chart

**Problem**: Y-axis shows tickers (many null), tooltips lack company names, chart is hard to interpret.

**File**: `src/components/InstitutionalHoldingsWall.tsx` (lines 340-385)

**Changes**:
- Y-axis dataKey: Change from `ticker` to a computed field that falls back: `ticker || name || cusip`
- Tooltip: Show full company name, ticker, sector, and exact value
- Add data labels on bars (value in billions)
- Sort top 15 holdings by total value (already correct)
- Increase bar thickness for better readability

```tsx
// Before: dataKey="ticker"
// After: dataKey="displayName"
// Add to aggregatedTopHoldings mapping:
displayName: h.ticker ? `${h.ticker}` : (h.name || h.cusip?.slice(-4))
```

### 1.2 Fix Heatmap Layout Scalability

**Problem**: With 15 institutions, the heatmap overflows horizontally; institution names truncated; sector labels unclear.

**File**: `InstitutionalHoldingsWall.tsx` (lines 387-443)

**Changes**:
- Increase minimum width to 700px (from 500px) to accommodate more columns
- Make institution names more readable: show full name on hover tooltip, display curated short name (14 chars is fine)
- Improve sector labels: add abbreviations? No, keep full names but rotate 45° if needed
- Add vertical scroll for the heatmap container (max-height: 500px, overflow-y: auto) to prevent page length explosion
- Add column freezing for institution name column (sticky left positioning)
- Color scheme: enhance cell contrast for better differentiation
- Delta arrows: make them larger and more visible (↑↓)

### 1.3 Institution Cards Grid

**Problem**: Only 10 cards shown, hiding 5 institutions; grid layout suboptimal.

**File**: `useSmartMoneyHoldings.ts` (lines 109-112) and `InstitutionalHoldingsWall.tsx` (lines 326-334)

**Changes**:
- In hook: Increase `institutionCards` slice from 10 to **15** to show all tracked institutions
  OR create two sections: "Key Institutions" (8) and "Additional Coverage" (7)
- Better approach: Show all 15 in a scrollable grid with 3 columns (md) / 2 columns (sm)
- Update Grid: `xs={12} sm={6} md={4}` to support responsive 1-2-3 columns
- Add card hover effects (already present but enhance)
- Ensure cards have equal height (h-full)

**Recommended**: Keep all 15 in a single scrollable section with clear section title "All Tracked Institutions (15)". If we want priority, show top 10 by AUM in main grid and remaining 5 in separate "Extended Coverage" row.

### 1.4 Typography & Label Clarity

**Issues**: Chart axis labels too small, missing units, unclear legends.

**Global fixes**:
- Increase font weight on all numeric displays to 900 (already mostly there)
- Add units (%, $B) explicitly in axis labels and tooltips
- Ensure contrast ratios meet accessibility (≥ 4.5:1)
- Legend in stacked area chart: move inside chart area or make horizontal to save space
- Benchmark comparison cards: add icons to labels (SPY, TLT, GLD icons if available)

---

## Phase 2: Data Presentation Enhancements

### 2.1 Top Holdings Table (Replace Bar Chart)

**Rationale**: Bar chart with 15 items is too tall and lacks context. Switch to a compact, sortable table with richer columns.

**New Component**: `TopHoldingsTable` replacing the current BarChart

**Columns**:
- Rank (1-15)
- Ticker / Name (combined)
- Sector (badge with color)
- Total Value ($B) - format: $12.4B
- % of Total AUM (color-coded: >5% red, 2-5% orange, <2% green)
- Concentration Contribution (last column)

**Features**:
- Sticky header
- Sortable by any column
- Hover highlights row
- Compact density (tight row height)

**Implementation**: Use a simple table with Tailwind, not recharts.

### 2.2 Institutional Cards — Add Price Change Sparklines

**Enhancement**: Each institution card should show 3-month price change of their top holdings (vs SPY benchmark) as a mini sparkline.

**Add to InstitutionCard**:
- Small sparkline (area chart) showing portfolio equity trend over last 8 quarters (from historical_allocation)
- Benchmark comparison line (SPY total return)
- Current equity allocation vs 8-quarter average (already present)
- Add "Recent Trades" teaser: "3 new positions, 2 exits last quarter" (if there are trades in `institutional_trades_inferred`)

**Data**: Use `historical_allocation` from hook; pass to card as `history`

### 2.3 Add "Top Trades" Section (NEW)

**Rationale**: The ingestion already infers trades (`institutional_trades_inferred`). This is high-value signal data not currently displayed.

**Add new row below heatmap**:
- TradeTape component already exists — use it!
- The component is already in the page (line 219) but maybe it's empty or not showing data.
- **Fix**: Ensure TradeTape component is fed with data from `institutional_trades_inferred` for the latest quarter.
- If TradeTape component is generic, create a dedicated "Recent Institutional Trades" table with columns: Date, Fund, Ticker, Name, Sector, Type (INITIATE/INCREASE/DECREASE/EXIT), Delta %, Conviction, Price Change %.

**Check**: Does TradeTape component exist? Yes imported from '@/components/TradeTape'. Verify it works with 13F trades.

---

## Phase 3: MCP Integration (Backend Tooling)

### 3.1 Supabase MCP

**Goal**: Provide Claude with direct query access to the 13F data for ad-hoc analysis, debugging, and user support.

**Implementation**: Add Supabase MCP server configuration to the project.

**Steps**:
1. Install Supabase MCP server: `npm install -g @supabase/mcp-server` (or use npx)
2. Create `.mcp/config.json` with connection details (use SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY from Deno env)
3. Expose specific resources:
   - `institutional_13f_holdings` table (query interface)
   - `institutional_trades_inferred` table
   - `vw_smart_money_collective` view
   - `ingestion_logs` table (for monitoring)
4. Add MCP server to Claude Desktop config (or VSCode extension settings)

**Usage**: Once configured, we can ask Claude to "query latest 13F data for BlackRock" or "show ingestion failures last week" directly.

### 3.2 SEC-Edgar MCP

**Goal**: Enables direct querying of SEC EDGAR API for on-demand 13F lookups (real-time or supplemental).

**Implementation**: Use existing SEC EDGAR MCP server or create a simple custom one.

**Steps**:
- Check if `sec-edgar-mcp` is available as a package
- Configure with user-agent and rate limits
- Expose tools: `search_13f_filings`, `get_13f_xml`, `list_institutions`
- Add to `.mcp/config.json`

**Use Cases**:
- Fetch latest 13F for any CIK on demand
- Validate new institution CIKs before adding
- Compare our ingested data against raw SEC filings
- Provide user with " latest available" data between ingestion cycles

### 3.3 MCP Tools in Application (Optional)

If we want to use MCP tools directly in the app for live lookups:
- Create a server action that calls MCP tools via child_process (npx)
- Use sparingly: real-time SEC lookups from frontend would expose credentials
- Better: keep MCP for analytics/debugging only

---

## Phase 4: Performance & Scalability

### 4.1 Ingestion Runtime Optimization

**Current**: 15 institutions with Alpha Vantage (5 calls/min) = ~60-90 minutes runtime (12s delay × 20 holdings × 15 institutions = 3600s + overhead)

**Improvements**:
1. **CUSIP cache already exists** - ensure TTL is 90 days and working
2. **Parallelize within institution**: Already processing top 20 sequentially; could batch in groups of 5 with Promise.all but must respect rate limit (max 5/min). Current code is already sequential due to sleep(12s). Could reduce delay to 10s? Risk hitting rate limit.
3. **Benchmark fetch parallelization**: Currently fetches SPY/TLT/GLD sequentially with 200ms delays. Keep as is.
4. **Database performance**: Ensure indexes exist: `idx_institutional_13f_holdings_cik_date` and `idx_institutional_13f_holdings_date`. Already in migration.
5. **Trade inference optimization**: Trade calculation loops through all holdings - acceptable at this scale.

**Decision**: Accept 60-90 min runtime as it's weekly. Consider splitting ingestion into two functions: one for bulk CUSIP enrichment (cheaper) and one for trade inference.

### 4.2 Database Query Optimization

**Hook** currently does:
- `SELECT * FROM institutional_13f_holdings ORDER BY total_aum DESC` → full table scan
- `SELECT * FROM vw_smart_money_collective` → single row, good
- Individual lookups for historical data per institution card (N+1 problem!)

**Fix**: 
- The view `vw_smart_money_collective` is fine
- For institutionCards: Already filtered from institutions array (no extra query). But `historical_allocation` is populated per card with `institutions.find()` which is in-memory. That's fine.
- The N+1 is inside `InstitutionCard` component? No, history is computed in hook (lines 178-208) so it's a single multi-query? Actually it's computed from `institutions` array which is already fetched. So no N+1.

**Conclusion**: Queries are acceptable.

---

## Phase 5: Feature Additions (Polish)

### 5.1 "Compare Institutions" Mode

Add a dropdown selector to let users pick 2-3 institutions and see side-by-side:
- Asset allocation pie chart comparison
- Sector rotation comparison
- Top 5 holdings overlap

**UI**: Add a "Compare" button above the institution cards that opens a modal or inline comparison matrix.

### 5.2 Export Functionality

Allow export of:
- Current 13F data to CSV
- Top holdings list
- Trade signals

**Implementation**: Simple client-side CSV generation with `blob` and download link.

### 5.3 Data Freshness Indicator

Current metadata shows date but not recency. Add:
- "Data as of: Q1 2025" with quarter label
- "Next update: ~May 15" (45 days after quarter end)
- Ingestion status: "Live" or "Failed" based on latest `ingestion_logs`

---

## Phase 6: Testing & Verification

### 6.1 Visual Regression Testing

Use Chromatic or manual screenshots to compare before/after.

### 6.2 Data Validation

- Spot-check 3 institutions against raw SEC 13F filings
- Verify top holdings have valid tickers (not "Other" for >80% of top 10)
- Verify sector classifications are accurate (Financials vs Tech etc.)

### 6.3 Cross-Browser Testing

Test on Chrome, Safari, Firefox with different viewport widths.

### 6.4 Performance Budget

- Page load: < 3s
- Interaction to first paint: < 200ms
- Scrolling smooth at 60fps

---

## Implementation Order

**Day 1 (Critical fixes)**:
1. Fix Top Holdings table (replace bar chart)
2. Fix heatmap scrolling & labels
3. Show all 15 institutions in cards grid
4. Deploy and verify

**Day 2 (Enhancements)**:
5. Add TradeTape integration (verify data flow)
6. Improve typography & contrast everywhere
7. Add data freshness indicators

**Day 3 (Polish)**:
8. Add comparison mode (or skip if tight)
9. Add export buttons
10. MCP configuration (document and set up)

---

## Files to Modify

1. `src/components/InstitutionalHoldingsWall.tsx` - main UI overhaul
2. `src/hooks/useSmartMoneyHoldings.ts` - adjust institutionCards limit, add derived data for display names
3. `src/components/TradeTape.tsx` - verify it works with 13F trades data
4. (Optional) `src/components/TopHoldingsTable.tsx` - new component
5. `.mcp/config.json` - MCP server configuration
6. `CLAUDE.md` - update with 13F MCP integration docs

---

## Success Metrics

- All 15 institutions visible in UI (cards or extended list)
- Top 15 holdings show clear names and sectors
- Heatmap scrollable, readable, no truncation
- All charts render with readable labels at 1920px width
- Page loads in < 3 seconds
- No console errors or Supabase query failures
- MCP tools available for debugging: `npx @anthropic-ai/claude-code-mcp supabase:query "SELECT * FROM ..."`

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Table replacement may reduce visual appeal | Design table with clean terminal styling (alternating rows, subtle borders) |
| 15-card grid may be too long | Use collapsible sections or pagination |
| TradeTape component may not support 13F data | Extend TradeTape or create new `Recent13FTrades` component |
| MCP config may expose secrets | Use environment variables, never commit keys; document setup |
| QoQ Delta calculations may be incorrect | Verify against previous quarter data manually |

---

## Estimated Effort

- **Phase 1 (Critical fixes)**: 4-6 hours
- **Phase 2 (Data presentation)**: 3-4 hours
- **Phase 3 (MCP integration)**: 2 hours (configuration mainly)
- **Phase 4 (Performance)**: 1 hour (monitoring)
- **Phase 5 (Polish)**: 3 hours
- **Testing & verification**: 2 hours

**Total**: ~14-18 hours of focused work

---

## Post-Implementation Checklist

- [ ] All 15 institutions appear in UI
- [ ] Top holdings show ticker + name + sector
- [ ] Heatmap horizontal scroll with sticky institution names
- [ ] Card grid responsive (1-2-3 columns)
- [ ] No console errors
- [ ] TradeTape shows recent trades
- [ ] Data freshness indicator accurate
- [ ] MCP tools configured for Supabase & SEC
- [ ] Page load < 3s on production
- [ ] Screenshots taken for portfolio/record
