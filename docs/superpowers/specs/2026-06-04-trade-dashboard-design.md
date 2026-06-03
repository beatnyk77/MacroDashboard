# Trade Intelligence Dashboard — Design Spec
**Date:** 2026-06-04  
**Route:** `/trade` (replaces `TradeIntelligencePage`)

---

## Goal

Unify the fragmented trade UX into a single terminal page with three togglable modes. Lay clean architecture for Mahanka's API integration. No new backend required.

---

## Route & SEO

- **Path:** `/trade` — `TradeDashboard` replaces `TradeIntelligencePage`
- Sub-routes unchanged: `/trade/hs/:code`, `/trade/playbook/:code`, `/trade/hs/:code/market/:iso`
- **Title:** `Trade Intelligence Terminal — Export Markets & Import Flows | GraphiQuestor`
- **Meta desc:** `Rank global export markets by opportunity score. Track bilateral trade flows. Identify supplier concentration risk. HS code-level trade intelligence with macro health overlay.`
- **Sitemap:** add `/trade` at priority `0.8`

---

## Layout

```
┌─────────────────────────────────────────────────────┐
│  ModuleRow "TRADE INTELLIGENCE TERMINAL" + GQSignalBadge │
├─────────────────────────────────────────────────────┤
│  TradeViewToggle: [EXPORT MARKETS] [IMPORT FLOWS] [BILATERAL] │
├─────────────────────────────────────────────────────┤
│  <ExportMarketsView | ImportFlowsView | BilateralView> │
└─────────────────────────────────────────────────────┘
```

URL param: `?view=exports` (default) | `imports` | `bilateral`  
Toggle persists in URL; browser back/forward works correctly.

---

## Component Map

### New files

| Path | Purpose |
|------|---------|
| `src/pages/TradeDashboard.tsx` | Page shell: SEO, ModuleRow header, toggle, view switcher |
| `src/features/trade/components/TradeViewToggle.tsx` | Pill tabs, reads/writes `?view` URL param |
| `src/features/trade/components/views/ExportMarketsView.tsx` | HSCodeSearch → inline demand ranker |
| `src/features/trade/components/views/ImportFlowsView.tsx` | HSCodeSearch → supplier concentration table |
| `src/features/trade/components/views/BilateralView.tsx` | Two country selectors → side-by-side pulse panels |
| `src/features/trade/components/MacroHealthCell.tsx` | Colored badge from `macro_score` (0–100) |

### Existing files modified

| File | Change |
|------|--------|
| `src/App.tsx` | Swap `/trade` lazy import to `TradeDashboard` |
| `src/features/trade/components/TradeEntryBanner.tsx` | Update link from `/trade/hs/${code}` to `/trade?view=exports`; show last-searched HS from localStorage |
| `public/sitemap.xml` | Add `/trade` entry at priority 0.8 |

### Existing files reused (no changes)

`GlobalDemandRanker`, `GlobalTradePulse`, `GlobalImportPulse`, `HSCodeSearch`, `useHSDemand`, `OpportunityScoreBadge`, `TradeRankerSkeleton`, `GQSignalBadge`, `ModuleRow`

---

## TradeViewToggle

```tsx
// Active pill style
bg-amber-400/20 text-amber-400 border border-amber-400/30

// Inactive pill style  
text-white/40 hover:text-white/70

// Font: IBM Plex Mono text-xs tracking-wider uppercase
```

Reads `useSearchParams()`, writes on click. Default: `exports`.

---

## EXPORT MARKETS VIEW

1. `HSCodeSearch` at top — `onSelect` sets `activeCode` state (does NOT navigate to `/trade/hs/:code`)
2. When `activeCode` is set: renders `GlobalDemandRanker` inline using `useHSDemand(activeCode)`
3. Loading/fetching states: `TradeRankerSkeleton`
4. `OpportunityScoreBadge` already handles green/amber/red by score
5. "Why this score?" tooltip on Opportunity Score column (static text explaining the composite: market size + growth + competition + macro + volatility)
6. Clicking a row expands inline `MarketOpportunityCard` (already exists) — no navigation required

---

## IMPORT FLOWS VIEW

Same `HSCodeSearch`. On select:

**New hook `useHSImportFlows(hsCode)`:**
- Queries `trade_supplier_breakdown` where `hs_code = hsCode`
- Groups by `partner_iso3`, sums `export_value_usd`, computes market share %
- Orders by `export_value_usd` desc, limit 50

**Table columns:**
| Supplier Country | Export Volume | Market Share % | Supply Concentration | GQ Macro Stability |

**Supply Concentration badge (HHI-derived):**
- HHI > 0.25 → `Oligopoly` (red)  
- HHI 0.10–0.25 → `Concentrated` (amber)  
- HHI < 0.10 → `Competitive` (green)

HHI computed client-side from market shares: `Σ(share_i)²`

**GQ Macro Stability** → `MacroHealthCell` (reads `macro_score` from `hs_opportunity_scores` for that supplier country)

---

## BILATERAL VIEW

Two country selectors (reuse the `MAJOR_REPORTERS` list from `TradeIntelligencePage`).

Default: Country A = `CHN`, Country B = `IND`.

Layout: two-column, same as existing side-by-side in `TradeIntelligencePage`:
- Left: `GlobalTradePulse` for Country A
- Right: `GlobalImportPulse` for Country B (showing A's imports from B's perspective)

**Macro Divergence Signal:**
- Reads `macro_score` for both countries from `hs_opportunity_scores` (averaged across all codes)
- Difference ≥ 20 → amber "Divergence Detected" badge + `GQSignalBadge`
- Renders below the two panels

---

## MacroHealthCell

```tsx
// Renders macro_score (0–100) as a pill
score >= 70 → green  bg-emerald-500/10 text-emerald-400 border-emerald-500/20
score >= 45 → amber  bg-amber-500/10 text-amber-400 border-amber-500/20
score < 45  → red    bg-rose-500/10 text-rose-400 border-rose-500/20
```

Shows numeric score + label: `Stable` / `Mixed` / `Stressed`

---

## TradeEntryBanner Update

Replace `navigate(`/trade/hs/${code.code}`)` with `navigate(`/trade?view=exports`)`.  
On mount, read `localStorage.getItem('gq:recent-hs')` to show last 3 HS codes as quick-links.

---

## Data Availability Notes

- **Export Markets:** `hs_opportunity_scores` — fully populated, production-ready
- **Import Flows:** `trade_supplier_breakdown.export_value_usd` — populated but may be sparse for some codes; show "No data" state gracefully
- **Bilateral:** `useGlobalTrade` + `useGlobalImports` — production-ready, same as current `/trade` page

---

## Out of Scope

- New Supabase edge functions (all views use existing tables/views)
- `/trade/hs/:code` page changes
- Mobile-specific bilateral layout (responsive grid handles it)
