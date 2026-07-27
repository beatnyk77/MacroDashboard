# Data Integrity & Terminal Surfaces Investigation

**Date:** 2026-07-27  
**Product:** GraphiQuestor MacroDashboard  
**Status:** Root causes confirmed in code — awaiting product decisions before implementation  
**Scope:** Corporate Debt Wall · US Debt Wall · Crude rates · Auction Demand Gauge · Regime Digest · Morning Brief  

---

## Executive verdict

| # | Surface | Verdict | Priority |
|---|---------|---------|----------|
| 1 | Corporate Debt Maturity Wall | **Fix pipeline or hide permanently** — ingest function is missing; UI claims SEC EDGAR while schema says FRED ICE BofA | P0 |
| 2 | US Debt Maturity Wall (Marketable vs T-Bills) | **Keep + redesign segregation** — data path exists; presentation mixes series | P1 |
| 3 | Crude rates stale | **Fix daily spot path** — Brent/WTI only weekly via commodity-terminal; FRED lags | P0 |
| 4 | Auction Demand Gauge zeros | **Term-name mismatch bug** — UI asks for tenors ingest never stores | P0 |
| 5 | Regime Digest stuck at April-26 | **Cron/LLM silent failure** — schedule exists; generation not landing rows | P0 |
| 6 | Daily Morning Brief thin | **Redesign product + data pack** — fallback templates + metric-ID drift | P1 (product) |

**Do not remove** corporate debt *unless* you refuse to ship a real source within ~1 sprint. Prefer: **withhold surface until pipeline green** (component already has this for >30d stale).

---

## 1. Corporate Debt Maturity Wall

### Symptoms
Unreasonable / inaccurate figures (or misleading "live" presentation).

### Root cause (confirmed)

1. **No edge function directory exists** for `ingest-corporate-debt-maturities`.  
   Only migrations + cron references:
   - `supabase/migrations/20260608000002_corporate_debt_maturities.sql`
   - `supabase/migrations/20260608000003_corporate_debt_maturities_cron.sql`
   - `docs/crons.md` lists daily job → slug that has no function body in repo.

2. **Known ops failure (OPERATIONS.md §5.2):**  
   `ingest-corporate-debt-maturity-daily` historically called wrong slug (`maturity` vs `maturities`) → silent 404 every day. Cron success ≠ data written.

3. **Source identity lie in UI:**  
   - UI: `SEC EDGAR XBRL • S&P 500` (`CorporateDebtMaturityWall.tsx`)  
   - Schema comment: FRED ICE BofA US Corporate Index (BAMLCC*), amounts in **USD trillions**  
   Users correctly distrust figures when label and methodology disagree.

4. **Freshness gate** already hides chart when `as_of` > 30 days. If user still sees numbers, either:
   - snapshot is ≤30d but wrong (seeded / partial / unit confusion), or
   - they saw numbers before the gate landed (credibility sprint).

### Recommendation
| Option | Action | When |
|--------|--------|------|
| **A (recommended)** | Rebuild monthly ingest from **FRED ICE BofA maturity market-value series** (or SIFMA outstanding by maturity if licensed). Label honestly. Cron on 5th monthly + health alert if no row in 45d. | Keep feature |
| **B** | Unmount from Terminal + lab; leave archive table; delete dead cron | If no reliable free source in 1 sprint |
| **C** | Buy/partner data (Bloomberg, ICE, TRACE aggregates) | If institutional grade is required |

**Do not** claim SEC EDGAR S&P 500 maturity wall without a real XBRL aggregation pipeline (expensive, non-trivial).

### Acceptance criteria
- [ ] Function `ingest-corporate-debt-maturities` deployed and writes ≥4 buckets per as_of
- [ ] Total outstanding within ±15% of public IG market value benchmark
- [ ] UI source badge matches actual series IDs
- [ ] Stale (>45d) → DataStatePanel empty, never fabricated chart

---

## 2. US Debt Maturity Wall — Marketable vs T-Bills

### Current state
- Source: Treasury FiscalData MSPD Table 3 (`ingest-us-debt-maturities`)
- Already computes `tbill_amount`, cost buckets (low/med/high), total marketable
- Chart stacks **T-Bills + cost bands** in one bar — confuses "security class" with "coupon cost"

### Gap vs request
User wants clear **segregation: Marketable (non-bill) vs T-Bills**.

### Design (recommended)
1. **KPI row:** Total Marketable | T-Bills outstanding | Notes+Bonds+TIPS+FRN | % Bills of marketable  
2. **Primary chart mode toggle:**  
   - Mode A: *Security class* — stacked `[T-Bills | Coupons (Notes/Bonds/TIPS/FRN)]` by maturity bucket  
   - Mode B: *Rollover cost* (current) — low/med/high for coupon securities only; T-Bills separate strip  
3. **Table export:** bucket × (tbill, coupon_total, total) in $T with MSPD record_date  
4. Never double-count: T-bill amounts must not also enter low/med/high stacks (verify ingest step 6)

### Data already available
`us_debt_maturities`: `amount`, `tbill_amount`, `tbill_avg_yield`, cost columns, `total_debt`, `date`.

### Acceptance criteria
- [ ] Toggle or dual chart shows Bills vs Non-bill marketable without double-count
- [ ] Tooltip labels "Marketable (excl. bills)" vs "T-Bills"
- [ ] Totals reconcile to MSPD marketable outstanding ± small rounding

---

## 3. Crude rates stale

### Root cause
| Path | Cadence | Notes |
|------|---------|-------|
| `ingest-commodity-terminal` | **Weekly Sun 08:30** | Writes `WTI_CRUDE_PRICE` / `BRENT_CRUDE_PRICE` from FRED `DCOILWTICO` / `DCOILBRENTEU` |
| `ingest-oil-spread` | Weekdays 05:00 | Spread/regime, not primary spot display |
| `ingest-oil-eia` | Wed weekly | Inventory, not front-month price |
| `ingest-fred` daily | Depends on metric metadata | May not include oil series or lags 1–3 sessions |

FRED DCOIL series are **T+1/T+2** by design. Weekly commodity-terminal makes UI feel "stuck" for days.

### Fix plan
1. **Daily spot job** (weekday 12:00 and 21:00 UTC):  
   - Primary: Yahoo `BZ=F` / `CL=F` → `BRENT_CRUDE_PRICE` / `WTI_CRUDE_PRICE`  
   - Fallback: FRED DCOIL when Yahoo fails  
2. Show **as_of date + source** on every crude chip (never claim "live" if as_of is older than 1 trading day).  
3. Alert if max(as_of) for Brent/WTI age > 2 calendar days on a weekday.

### Acceptance criteria
- [ ] Weekday as_of advances on trading days
- [ ] UI shows last print date + source (Yahoo/FRED)
- [ ] Health job fails closed on zero-write

---

## 4. US Auction Demand Gauge — zeros on 3M / 6M / 5Y

### Root cause (smoking gun)

**UI tenor list** (`USTreasuryDemandGauge.tsx`):
```ts
const tenorList = ['4-Week', '3-Month', '6-Month', '2-Year', '5-Year', '30-Year'];
// + primary chart uses '10-Year'
```

**Ingest targets** (`ingest-us-macro/auctions.ts`):
```ts
{ Bill, '4-Week' }, { Bill, '13-Week' }, { Note, '2-Year' },
{ Note, '10-Year' }, { Bond, '30-Year' }
```

| UI term | Ingested as | Result |
|---------|-------------|--------|
| 3-Month | **13-Week** (never aliased) | always 0 |
| 6-Month | not in TARGET_SECURITIES | always 0 |
| 5-Year | not in TARGET_SECURITIES | always 0 |
| 4-Week / 2Y / 10Y / 30Y | matched | OK when auctions exist |

### Fix
1. Expand TARGET to include: `8-Week`, `13-Week`/`3-Month`, `17-Week`, `26-Week`/`6-Month`, `52-Week`, `5-Year`, `7-Year`, `20-Year` as needed.  
2. **Normalize terms** on write: map FiscalData `security_term` / `original_security_term` → canonical labels used by UI (`3-Month`, `6-Month`, …).  
3. Handle CME reopens / when-issued rows (skip zero `total_accepted` already done).  
4. Backfill 12 months of auctions after deploy.  
5. UI: show "—" / "No auction" empty state instead of `0.00` score when `latest` undefined.

### Acceptance criteria
- [ ] 3-Month chip shows latest 13-week bill BTC/score  
- [ ] 6-Month and 5-Year populate after next auction cycle or backfill  
- [ ] No chip displays numeric 0.00 when data missing  

---

## 5. Regime Digest not updating (last April 2026)

### Expected
Cron `generate-monthly-regime-digest-job` → `30 0 1 * *` → `generate-monthly-regime-digest`.

### Likely failure modes (ordered)
1. **LLM provider fail** — requires `OPENROUTER_API_KEY` or `AIMLAPI_KEY`; throws if neither set.  
2. **Silent cron success** — `pg_cron` + `net.http_post` mark success even on 4xx/5xx (OPERATIONS.md).  
3. **Function not redeployed** / free-tier function cap (ISSUES_LEDGER P0-004 / P3-001).  
4. **Row insert fail** after JSON parse issues (extractJSON helps but model can still return garbage).  
5. **year_month UTC** on the 1st near midnight can edge-case depending on invoke time (minor).

### Fix plan
1. Manually invoke for `2026-05`, `2026-06`, `2026-07` with service role; capture logs.  
2. Add **deterministic template digest** when LLM fails (still publish metrics snapshot HTML) so calendar never skips.  
3. After insert, write `ingestion_runs` with `counts.upserted`; fail job if 0.  
4. **Catch-up cron**: daily 01:00 check — if current month missing and day ≥ 1, regenerate.  
5. Slack/email alert on missing current-month digest after day 2.

### Acceptance criteria
- [ ] `monthly_regime_digests` has row for current `YYYY-MM`  
- [ ] Archive page lists consecutive months with intentional gaps labeled  
- [ ] Catch-up job self-heals within 24h of failure  

---

## 6. Daily Morning Brief — product redesign (brainstorm)

### Why thin today
1. **Fallback template** when OpenRouter fails / free model flaky (`model_used: fallback-template`).  
2. **Metric ID drift** in `FOCUS_AREA_CONFIGS` — IDs like `wti_price`, `us_cpi_yoy`, `india_gsec_10y` may not match live `metric_observations` IDs (`WTI_CRUDE_PRICE`, `US_CPI_YOY`, …) → empty focus metrics.  
3. **Only 0.5% movers** from last 7 days, max 8 — many macro series move slower; brief looks empty.  
4. **No structured packs:** auctions, MSPD, news, calendar, FX, energy curve, India HF indicators.  
5. **max_tokens 800** + free Nemotron → short generic prose.  
6. SEO archive policy weekends skipped — OK; weekdays must be dense.

### Product goal
> "Must-open before 9:30 ET" — 3 minutes to know what changed overnight in global macro, what regime implies, and what to watch today.

### Recommended architecture: **Signal Pack → Narrative Layer → Presentation**

```
[Ingest layer - already mostly exists]
        ↓
[Brief Signal Pack builder]  ← NEW pure function, testable
  - regime + score + confidence
  - top Δ metrics (correct IDs, multi-horizon: 1d/1w/1m)
  - auctions last 5 sessions
  - energy: WTI/Brent/spread regime
  - gold + DXY + VIX + net liquidity
  - India HF: INR, RBI, GST if present
  - calendar: next 48h events from macro_events
  - headlines: top 5 from ingest-macro-news-headlines
        ↓
[Narrative] paid model primary (Claude/GPT mini) + free fallback
  structured JSON schema v2
        ↓
[Presentation]
  - Hero: regime + one-line thesis
  - What changed (with sparklines + as_of)
  - Cross-asset board (6 cells)
  - Focus deep-dive (user selection)
  - Watch today (times in ET)
  - "Why this matters" 2 paragraphs
  - Provenance footer: model, generated_at, data as_of max
```

### Content schema v2 (proposed)
```json
{
  "thesis": "1 sentence regime thesis",
  "what_changed": [{ "metric", "value", "delta_pct", "as_of", "read" }],
  "cross_asset": { "rates", "fx", "equity_vol", "credit_proxy", "gold", "oil" },
  "focus_observations": ["..."],
  "watch_today": [{ "item", "time_et", "why" }],
  "risks": ["..."],
  "data_quality": { "fresh_count", "stale_metrics", "model" }
}
```

### Integrations to make robust
| Integration | Purpose | Cost |
|-------------|---------|------|
| FRED + FiscalData (existing) | Core telemetry | Free |
| Yahoo futures (existing oil-spread pattern) | Daily crude/gold | Free fragile |
| Treasury auctions (fixed) | Demand pulse | Free |
| `ingest-macro-news-headlines` | Overnight narrative anchors | Existing |
| Macro calendar / events table | Watch today | Existing |
| OpenRouter **paid** small model | Reliable prose | ~$5–20/mo |
| Optional: Polygon/TwelveData | Equity/FX reliability | Paid |
| Optional: EIA API key health | Inventory Wed | Free key |

### UX (ui-ux-pro-max notes)
- Dense terminal layout: 8pt rhythm, tabular nums, freshness chips  
- Never blank chart frames — skeleton then filled pack even if narrative fails  
- Color not sole signal (↑/↓ + % + label)  
- Mobile: thesis + 5 bullets first; expand cross-asset  
- Empty/stale metrics show "STALE" chip, not invented numbers  

### Quality bar (auto-fail if not met)
- Word count ≥ 180 (existing `briefQuality` helpers)  
- ≥ 4 concrete numbers with as_of dates  
- Zero metric IDs unresolved in focus pack  
- `model_used` !== fallback more than 2 consecutive weekdays without alert  

---

## Engineering plan (eng review)

### PR sequence (tiny, one concern each)

| PR | Scope | Risk |
|----|-------|------|
| PR1 | Auction term normalize + expand TARGET + UI empty state + backfill script | Low |
| PR2 | Daily crude spot job + UI as_of chip | Low–Med |
| PR3 | Regime digest catch-up + template fallback + alert | Med |
| PR4 | Corporate debt: implement FRED ICE ingest **or** unmount | Med |
| PR5 | US debt wall dual-mode Bills vs Marketable | Low UI |
| PR6 | Morning brief Signal Pack v2 + metric ID map + model upgrade | Med product |

### Non-goals this cycle
- Full SEC EDGAR corp bond wall  
- New paid market data vendor (unless brief quality blocked)  

### Test plan
- Unit: term normalizer, signal pack builder, unit conversion  
- Integration: invoke edge with fixtures  
- Live: curl FiscalData auction terms sample; compare chips  
- Regression: `npm run lint && npm run build`; no mock on live routes  

### Observability
- Every job: fail if `counts.upserted === 0` when source had rows (P2-010)  
- Dashboard card: last success per critical job  
- Slack on P0 job fail  

---

## Design review notes

- **Trust hierarchy:** as_of > big number. Every money figure needs date + source.  
- **Remove decorative "Live" pulse** unless data age < 24h trading.  
- **Corporate wall:** prefer empty honest state over wrong $T.  
- **Auction chips:** missing ≠ weak demand.  
- **Brief:** scannable in 60s; deep links to lab modules for each bullet.  

---

## DX review notes

- Single `docs/crons.md` is good; keep **function slug must exist** CI guard.  
- Add `scripts/verify-critical-pipelines.mjs` that checks last as_of for: auctions, crude, debt walls, digests, briefs.  
- Metric ID registry: one source of truth for brief focus maps.  
- Deploy path remains constrained by function count/spend — prefer fixing existing functions over new ones when possible (combine crude into `ingest-oil-spread` or `ingest-market-pulse`).  

---

## Skills / tooling discovered

| Skill | Use |
|-------|-----|
| `daymade/claude-code-skills@financial-data-collector` | Optional data collection patterns |
| `0juano/agent-skills@yahoo-finance` | Yahoo chart API patterns for crude |
| `rivet-dev/skills@cron-jobs` | Cron reliability patterns |
| Existing gstack investigate / plan reviews | This investigation |

Install only if team wants them; not required to fix above.

---

## Open product decisions (need user)

1. Corporate wall: **rebuild FRED path** vs **remove from Terminal**?  
2. Morning brief: ship **Signal Pack v2 with paid model** vs **template-only dense dashboard** (no LLM)?  
3. Auction UI: keep `3-Month` label (alias 13-Week) or rename chips to Treasury market convention (`13-Week`)?  
---

## Status

**STATUS:** DONE_WITH_CONCERNS — root causes identified in codebase; live DB row ages not verified in this session (needs service-role query or admin health page).  
**Next:** User decides D1–D3 → implement PR1–PR3 immediately (highest user pain, lowest product ambiguity).
