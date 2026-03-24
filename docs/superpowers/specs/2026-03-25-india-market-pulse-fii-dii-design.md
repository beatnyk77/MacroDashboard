# India Market Pulse: FII/DII Data Enhancement Design

## Understanding Summary
- **What is being built:** An enhancement to the India Macro Pulse terminal integrating comprehensive FII/DII flow data scraped from NSDL and NSE.
- **Why it exists:** To track institutional capital flow and provide a "Smart Money Regime Indicator" directly within the dashboard.
- **Who it is for:** Institutional investors wanting deep, real-time insights into Indian market flows.
- **Key constraints:** Must be strictly additive, relying solely on Supabase MCP for backend operations.
- **Explicit non-goals:** We are completely dropping the GRIT Index correlation as part of this enhancement.

## Assumptions
- Supabase edge functions have enough execution time/timeout to scrape multiple pages.
- The Stitch MCP components can be cleanly layered within the existing `IndiaLab.tsx` layout.

## Decision Log
- **Decision:** Unified Pulse Approach
  - **Considered:** Unified Pulse Approach vs. Isolated Flows Domain Approach
  - **Why Chosen:** Reduces backend sprawl and makes querying easier by aligning all data on the same date timeline.

## Final Design

### 1. Backend Data Flow & Supabase Architecture
- Extend the `market_pulse_daily` table with columns for F&O flows (`fii_idx_fut_net`, `fii_stk_fut_net`, etc.) and debt/hybrid flows.
- Add `sentiment_score` (Smart Money Regime).
- Create a new `fpi_sector_flows` table for fortnightly sector heatmaps.
- Refactor the `ingest-nse-flows` Edge Function to scrape both NSE daily cash APIs and NSDL fortnightly archives.
- A Supabase cron job will run daily post-market close.

### 2. Frontend Layout & Components (UI/UX)
- Build an "FII/DII Flow Monitor" inside `IndiaLab.tsx`.
- **Information Density & Layout:** Adopt a tighter, one-card-per-row layout with reduced padding for a purely functional aesthetic.
- **Top Row:** FII vs DII Tug-of-War gauge and the Smart Money Regime Indicator focus card.
- **Middle Row:** Mixed-axis chart overlaying Nifty 50 historical returns against stacked bar flows, paired with a capital flow Sankey diagram.
- **Bottom Row:** Sector Allocation Heatmap for fortnightly flows.

### 3. Error Handling, Edge Cases, & Monitoring
- Include robust retry mechanisms, user-agent rotation, and proxies in the Supabase scraper to prevent blocking.
- Gracefully handle holidays/weekends.
- Use `SectionErrorBoundary` to manage raw data type mismatches (e.g., numeric strings from Supabase).
- Display a fallback skeleton state for the Sector Heatmap if the NSDL release is delayed.
- **Data Health Integration:** Actively integrate with `DataHealthDashboard` to include comprehensive staleness monitoring for `market_pulse_daily` and `fpi_sector_flows`.
