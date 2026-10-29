# Energy & Commodities Lab — Authority Rebuild (PRD)

**Date:** 2026-10-29
**Status:** Draft for review
**Page:** `/labs/energy-commodities` → `src/pages/labs/EnergyCommoditiesLab.tsx`
**Supersedes:** `2026-05-31-energy-commodities-lab-overhaul-design.md`. That spec removed the hardcoded India reserves and tanker table, and both have since come back. This PRD adds guardrails so the regression cannot recur.
**Direction:** (1) Honest core → (2) EIA weekly balance desk + (3) India transmission → (4) Curve & inventory (gated on licensing)

---

## 1. Problem Statement

The lab is the site's main energy offering, but a professional reader can see through it within a minute. Only five series behind it are actually live: WTI, Brent, the CL1–CL2 spread, US SPR and US refinery utilisation. Everything else is made up, frozen, empty or mislabelled. The India Fuel Security Clock is a set of constants (9.5 days, 128 tankers, risk 48, scenario days) stored again with today's date every day, so it shows as "fresh". This breaks the site's core rule that no data is fabricated. It also undermines the India angle, which is the one place GraphiQuestor could beat generic energy dashboards.

**Evidence (live DB and code, 2026-10-29):**

| Panel | State | Root cause |
|---|---|---|
| India Fuel Security Clock | Fabricated | Literals in `ingest-energy-oil/index.ts:304-329`, upserted daily |
| Brent / USD-INR / CL2 when a fetch fails | Silent fake values | Fallbacks `82.50`, `87.00`, `CL1 − 0.50`, capacity `18162` |
| Refining capacity, import origins, metal imports | Frozen seed | Migration `20260911000000`, no writer; rows labelled "Energy Institute 2026", which EI has not published |
| EIA weekly (utilisation %, capacity), 3:2:1 crack, RBOB, HO | 0 rows | `ir.eia.gov/wpsr/table2.csv` now 302-redirects to a signed `/secure/` URL; the parser gets nothing |
| EU gas storage | Shows "UNAVAILABLE" though data exists (65.6%, Sep) | `useEnergyRegime` reads the 30 newest rows across three metrics; daily Brent rows push out the monthly gas row |
| Brent | Two series, different prices, unlabelled | `BRENT_CRUDE_PRICE` (BZ=F, last 10-26) vs `OIL_BRENT_PRICE_USD` (last 10-28); FRED Dated Brent spot was $123.10 on 10-27 against front-month ~$110.70 |
| Regime card when data is missing | Shows "NORMAL" | `useEnergyRegime` defaults to `0` / `'NORMAL'` |

**Cost of not fixing it:** A single fabricated number found by a hedge-fund or central-bank reader discredits every other panel on the site. This lab is also linked from the Terminal, the Observatory and the regime digests.

---

## 2. Goals

1. **Zero fabricated values.** Every number on the page comes from a stored observation with `source_ref` and an `as_of_date` taken from the source's own release. The audit finds 0 constant-restamped series and 0 rendered seed rows.
2. **Freshness held to each source's cadence.** Each panel's latest observation stays within its SLO (daily ≤ 2 business days; weekly ≤ 9 days; monthly ≤ 45 days after period end) on ≥ 95% of days over a rolling 30 days.
3. **A weekly heartbeat.** The US weekly balance is live within 3 hours of the EIA Wednesday release on ≥ 90% of weeks.
4. **India built from primary sources.** Every India-tab number comes from PPAC, UN Comtrade, RBI, FRED or ISPRL disclosures, with a written method.
5. **Organic authority.** Google Search Console clicks to the lab URL rise ≥ 50% (stretch 100%) within 90 days of the Phase 2 launch, measured against the 28 days before launch.

## 3. Non-Goals

- **Forecasts, price targets or "fair value".** These break the site's "observe, do not forecast" philosophy.
- **Tanker or AIS vessel tracking.** No licensed AIS feed exists, and the previous attempt was fabricated.
- **Licensed price-reporting data** (Platts, Argus, Kpler, Vortexa). Too costly for now; v1 uses public-domain and free sources only.
- **Metals.** Copper storage mixes $/lb and $/t (see the data-defects ledger). Metals get their own lab later; the Metals tab is removed here.
- **Composite scores** ("sovereign energy security score", "geopolitical risk score") until a method doc exists. An unexplained number reads as made up.
- **Intraday prices.** Daily is enough for allocators, and intraday would raise licensing risk.

---

## 4. User Stories

**Global macro PM / energy-curious allocator**
- As a macro PM, I want US crude and product stocks against their 5-year range every Wednesday, so I can see physical tightness without opening the EIA PDF.
- As a macro PM, I want to know whether a Brent number is Dated spot or front-month futures, so I don't compare two different things.
- As a macro PM, I want the curve shape set beside inventory deviation, so I can judge whether the spread is backed by physical stocks.

**India-focused allocator / central-bank research desk**
- As an India allocator, I want the rupee cost of a barrel and India's import dependence in one place, so I can track how oil feeds the current-account deficit and inflation.
- As an India allocator, I want India's crude imports by origin over time, so I can see how concentrated supply is (Russia share, Hormuz exposure).
- As a research desk, I want strategic reserves shown as published capacity with its source, so I'm never shown a made-up coverage figure.

**Analyst / journalist citing the page**
- As an analyst, I want every panel to show source, as-of date, cadence and a method link, so I can cite it.

**Edge cases**
- As any reader, when a source fails I want an explicit "unavailable since <date>" state, not a stand-in value or "NORMAL".
- As any reader, in a holiday week when EIA publishes on Thursday, I want the panel to show last week's data marked as on schedule, not an alarm.
- As any reader, when EIA revises prior weeks, I want the revised values shown.

---

## 5. Requirements

### Phase 0 — Honest core (P0)

**R0.1 Remove the fabricated India clock writer.**
- `ingestIndiaEnergyTransmission` writes no constant fields: reserve days, deviation, tankers, risk score, scenarios.
- `FuelSecurityClockIndia` and the header "India Cover" tile stop reading those fields. The tile is replaced by "India ₹/bbl" (see R2.1).
- Historical constant rows in `fuel_security_clock_india` are deleted **only after the user approves**.
- *Acceptance:* `grep` finds no numeric literal assigned to an observation value in `supabase/functions/ingest-energy-oil`. The page does not render the strings "128" or "9.5d".

**R0.2 Remove silent fallbacks.**
- When Brent or USD-INR can't be fetched, nothing is written and the failure goes to `ingestion_logs`.
- When CL2 can't be fetched, the spread row is skipped. No synthetic `CL1 − 0.50`.
- When capacity can't be parsed, it is skipped, not set to `18162`.
- *Acceptance:* A unit test mocks failed fetches and asserts that zero rows are upserted.

**R0.3 Quarantine seed tables.**
- Rows in `oil_refining_capacity`, `commodity_imports`, `oil_imports_by_origin` and `global_refining_capacity` are hidden from the UI unless they carry a verifiable `source_ref` and a year that the source has actually published.
- Rows labelled "Energy Institute 2026" are removed (after the user approves).
- Refining-tab panels that are left with no data show "Source pending: <name>". No figures.

**R0.4 Fix the regime hook.**
- `useEnergyRegime` fetches each metric's latest rows separately, not with a shared `limit(30)`.
- A missing input gives `null`, never `0` or `'NORMAL'`. The card shows "Insufficient data" when any regime input is missing.
- *Acceptance:* `CurrentEnergyRegimeCard.test.tsx` covers the "spread missing" and "gas monthly older than 30 Brent rows" cases.

**R0.5 Settle on two labelled Brent series.**
- `BRENT_SPOT_USD`: Dated Brent from EIA via FRED `DCOILBRENTEU`, labelled "Brent spot (Dated)".
- `BRENT_CRUDE_PRICE` keeps the ICE BZ=F front-month history it already holds, renamed "Brent Crude — Front-Month Futures" and detached from the FRED series so the two writers can no longer overwrite each other. (Revised during build: no history is moved or renamed. `WTI_CRUDE_PRICE` is treated the same way.)
- The UI never shows a bare "Brent". `OIL_BRENT_PRICE_USD` (openbb, also front-month) is left for `useCrossAssetRadar` and noted as a duplicate.

**R0.6 Add an anti-fabrication guardrail.** This is the step the May spec lacked.
- Extend `data-freshness-audit.yml` with a constant-restamp detector: any metric whose last ≥ 5 observations are identical while `as_of_date` advances fails the audit. Allow-list genuinely fixed series such as ISPRL capacity.
- The audit also fails if a rendered table holds rows with `provenance` in (`seed`, `fallback:*`).

**R0.7 Provenance on every panel.**
- Each panel shows source name, observation `as_of_date` (not ingest time), native cadence and a method link, using `DataProvenanceBadge` and `FreshnessChip`.

### Phase 1 — US Weekly Balance desk (P0)

**R1.1 Ingest from EIA API v2.**
- Replace the CSV scrape with `api.eia.gov/v2` using the existing `EIA_API_KEY` secret.
- Series (to be confirmed against the API during build — the weekly petroleum series are no longer on FRED):

  | Metric | EIA series | Route | Status (2026-10-29) |
  |---|---|---|---|
  | Commercial crude stocks ex-SPR | `WCESTUS1` | `petroleum/stoc/wstk` | Verified, 410,625 kbbl for 2026-10-23 |
  | Cushing crude stocks | `W_EPC0_SAX_YCUOK_MBBL` | `petroleum/stoc/wstk` | Verified |
  | SPR stocks | `WCSSTUS1` | `petroleum/stoc/wstk` | Verified, matches stored `OIL_SPR_LEVEL_US` |
  | Total gasoline stocks | `WGTSTUS1` | `petroleum/stoc/wstk` | Verified |
  | Distillate stocks | `WDISTUS1` | `petroleum/stoc/wstk` | Verified |
  | Jet fuel stocks | `WKJSTUS1` | `petroleum/stoc/wstk` | Verified |
  | Refinery utilisation % | `WPULEUS3` | `petroleum/pnp/wiup` | Verified, 92.8 |
  | Total product supplied | `WRPUPUS2` | `petroleum/cons/wpsup` | Verified, 20,209 kbd |
  | Crude production | `WCRFPUS2` | `petroleum/sum/sndw` | **Route unconfirmed** (`petroleum/crd/crpdn` is monthly only) |
  | Net crude imports | `WCRNTUS2` | `petroleum/sum/sndw` | **Route unconfirmed** |

  SPR and utilisation are stored under their existing metric ids (`OIL_SPR_LEVEL_US`, `OIL_REFINERY_UTILIZATION_US`) rather than duplicated; the values are identical. The two unconfirmed series report a per-series error in the response without blocking the rest.

- Backfill from 2015-01-01 so the 5-year band is available.
- Schedule with pg_cron: Wednesday at 14:45, 15:45 and 17:00 UTC (covers both EDT and EST release times), plus Thursday at the same times for holiday weeks. Each run is idempotent.
- Re-upsert the last 8 weeks on every run so revisions are picked up.

**R1.2 Show the balance.**
- **Stocks vs 5-year band.** Crude, Cushing, gasoline and distillate, each against the min/max/average of the same week over the prior 5 years (excluding the current year). Shows the weekly change and the deviation from the 5-year average (mb and %).
- **Crude cover.** Commercial crude stocks (ex-SPR) ÷ 4-week average total product supplied, in days. The formula is shown on the tile; a product-specific cover is a later refinement.
- **Implied demand.** 4-week average product supplied, year on year.
- **Supply.** Production and net imports, 4-week averages.
- **Refinery utilisation** against its 5-year band.
- *Acceptance:* On a Wednesday after release, the crude stock figure matches the EIA Weekly Petroleum Status Report Table 1 to within 0.1 mb. On a holiday week, the freshness chip reads "On schedule" until Thursday 18:00 UTC.

**R1.3 Rebuild the header strip.** Six tiles, all real:
1. Crude stocks vs 5-year average
2. SPR
3. Refinery utilisation
4. Brent spot
5. WTI CL1–CL2
6. India ₹/bbl

### Phase 2 — India Transmission (P0)

**R2.1 Rupee cost of a barrel.**
- Primary: the Indian crude basket (PPAC, USD/bbl) × the RBI reference rate.
- Interim proxy: `DCOILBRENTEU` × `DEXINUS`, both on FRED, labelled "Proxy: Dated Brent × USD/INR".

**R2.2 Import dependence and import bill.**
- PPAC monthly figures: crude import volume, domestic production, import dependence % (= imports ÷ (imports + domestic production)), net oil import bill in USD.
- Show 36 months plus the year-on-year change.

**R2.3 Consumption.**
- PPAC monthly petroleum product consumption ('000 t), total plus diesel/petrol/LPG/ATF, year on year.

**R2.4 Origin mix.**
- UN Comtrade, HS 2709, reporter India (699), imports by partner, monthly.
- Top-8 shares over time, plus a Hormuz-exposed share. The Hormuz figure uses a documented static mapping of origins (Iraq, Saudi Arabia, UAE, Kuwait, Qatar, Iran) and links to its method page.
- Shown with its publication lag (typically 2–4 months).

**R2.5 Strategic reserve, stated honestly.**
- ISPRL capacity: 5.33 MMT (Vizag 1.33, Mangalore 1.5, Padur 2.5), with citation.
- A capacity-equivalent day count = capacity in bbl ÷ the latest PPAC daily consumption, showing the formula.
- A permanent label: "Capacity; fill level not publicly disclosed." No daily "coverage" figure.
- This is the one allow-listed constant in R0.6.

### Phase 3 — Curve & Inventory (P1, gated on open question Q3)

**R3.1 Futures curves.**
- WTI and Brent, 12 monthly contracts, from the existing Yahoo integration.
- Today vs 1 week ago vs 1 month ago, plus the Brent–WTI spread.

**R3.2 Real 3:2:1 crack.**
- Formula: `(2 × RBOB × 42 + HO × 42 − 3 × CL) / 3` in $/bbl, using front-month RB, HO and CL.
- Feeds `/tools/refinery-crack-spread`, which is empty today.

**R3.3 Inventory vs curve.**
- Weekly scatter of crude stock deviation from the 5-year average against the CL1–CL6 spread, since 2015, with the current week highlighted.
- Descriptive only; no fitted forecast line.

### P1 — Gas and retail pass-through
- **R4.1** EU gas storage from GIE AGSI+, daily, against its 5-year band. Needs a free API key.
- **R4.2** Henry Hub (`DHHNGSP`), plus EU and Asia gas monthly (`PNGASEUUSDM`, `PNGASJPUSDM`).
- **R4.3** US weekly gas storage (EIA `natural-gas/stor/wkly`).
- **R4.4** US retail gasoline and diesel (`GASREGW`, `GASDESW`) against RBOB/HO, showing the pass-through spread.

### P2 — Future (design so these stay possible)
- CFTC managed-money positioning in crude (Socrata API, weekly).
- JODI global oil balances for China/India demand context.
- China customs crude imports.
- A "Wednesday balance" email or alert, and exposure through the public API/MCP server.
- An embeddable `?embed=true` widget for the 5-year band chart.

### Page structure (v1)
1. Header strip (R1.3)
2. Regime card (R0.4)
3. Tabs, in this order: **Weekly Balance** · **India** · **Curve** (Phase 3) · **Gas** (P1)

The Refining, Sovereign Buffers and Metals tabs are removed. Refining comes back only with a verified source.

---

## 6. Success Metrics

| Type | Metric | Success | Stretch | How measured | When |
|---|---|---|---|---|---|
| Leading | Fabrication audit failures | 0 | 0 | `data-freshness-audit.yml` (R0.6) | Every run |
| Leading | Panels within freshness SLO | ≥ 95% of days | 99% | Audit job over 30 days | 30 days after Phase 1 |
| Leading | Wednesday ingest lag after EIA release | ≤ 3 h, 90% of weeks | ≤ 1 h | `ingestion_logs` timestamp vs release time | 8 weeks after Phase 1 |
| Leading | Crude stock match with WPSR Table 1 | 100% of weeks within 0.1 mb | — | Spot-check script | 8 weeks |
| Lagging | GSC clicks to the lab URL | +50% | +100% | Search Console, 28 days pre vs days 63–90 post | 90 days after Phase 2 |
| Lagging | GSC impressions for target queries ("crude inventories vs 5 year average", "India crude import dependence", "India oil imports by country") | Page-1 average position on ≥ 1 query | ≥ 3 queries | Search Console query report | 90 days |
| Lagging | Returning visitors on Wednesday/Thursday | Baseline + 30% | +60% | Analytics tool (Q6) | 60 days |

---

## 7. Open Questions

| # | Question | Owner | Blocking? |
|---|---|---|---|
| Q1 | Is `EIA_API_KEY` set in Supabase function secrets? (Code reads it; nothing uses it today.) | Engineering | **Blocks Phase 1** |
| Q2 | Do we register a free UN Comtrade subscription key? No `COMTRADE_*` secret exists, so the existing Comtrade calls are probably failing. | Engineering | **Blocks R2.4** |
| Q3 | Can Yahoo-sourced CME/ICE futures curves be republished on a commercial site, and if not, what can replace them? | Legal / owner | **Blocks Phase 3** |
| Q4 | Approve deleting the constant `fuel_security_clock_india` rows and the "EI 2026" seed rows? | Owner | Blocks R0.1/R0.3 cleanup only (hiding them is not blocked) |
| Q5 | How do we get PPAC data (monthly snapshot PDF/XLS, Indian basket page), and how stable is the format? Scraper or manual monthly upload? | Engineering | Blocks R2.2/R2.3; time-box to 2 days |
| Q6 | Which analytics tool measures returning visitors? | Owner | No |
| Q7 | Is the primary reader India-focused or global? This decides the tab order (default: Weekly Balance first, India second). | Owner | No |
| Q8 | Where do metals go: a new lab, or folded into an existing page? | Owner | No |

---

## 8. Timeline & Phasing

No hard deadlines. Each phase ships on its own.

| Phase | Scope | Estimate | Depends on |
|---|---|---|---|
| 0 Honest core | R0.1–R0.7 | 2–3 days | Q4 for deletes only |
| 1 Weekly Balance | R1.1–R1.3, backfill | ~1 week | Q1 |
| 2 India Transmission | R2.1–R2.5 | ~1 week | Q2, Q5 |
| 3 Curve & Inventory | R3.1–R3.3 | 3–4 days | Q3 |
| P1 Gas / retail | R4.1–R4.4 | 3–4 days | GIE key |

**Phase 0 ships first and alone.** The page goes live honest, even if thinner, before anything new is added.

---

## Appendix A — Source register

| Source | Data | Cadence | Licence | Auth | Status |
|---|---|---|---|---|---|
| EIA API v2 | Weekly petroleum balance, gas storage, spot prices | Weekly / daily | US public domain | `EIA_API_KEY` | Key read in code, unused |
| FRED | `DCOILBRENTEU`, `DCOILWTICO`, `DHHNGSP`, `GASREGW`, `GASDESW`, `DEXINUS`, `PNGASEUUSDM`, `PNGASJPUSDM` | Daily / weekly / monthly | Mostly public domain (check each series' notes) | `FRED_API_KEY` | Live; all eight verified to return 2026 data on 2026-10-29 |
| Yahoo Finance | CL/BZ/RB/HO/NG futures | Daily | Unclear for republication (Q3) | None | Live, CL1/CL2 only |
| PPAC (MoPNG) | Indian basket, imports, consumption, import bill | Daily / monthly | Government of India open data | None | Not integrated |
| UN Comtrade | HS 2709 India imports by partner | Monthly, 2–4 month lag | Free tier with attribution | Subscription key | Key missing (Q2) |
| GIE AGSI+ | EU gas storage | Daily | Free with attribution | API key | Not integrated |
| ISPRL | SPR site capacities | Static | Public disclosure | None | Constant, allow-listed |

## Appendix B — Files expected to change

- `supabase/functions/ingest-energy-oil/index.ts`: remove the constants and fallbacks; replace the EIA CSV scrape with API v2.
- New: `supabase/functions/ingest-india-energy/` (PPAC + Comtrade) and a pg_cron migration.
- `src/hooks/useEnergyRegime.ts`: per-metric queries and null handling.
- `src/pages/labs/EnergyCommoditiesLab.tsx`: header strip and tab structure.
- `src/features/energy/components/*`: a new `WeeklyBalance*` component, `FuelSecurityClockIndia` rebuilt as `IndiaTransmission`.
- `src/constants/metricIds.ts`: new IDs; retire the duplicate Brent.
- `.github/workflows/data-freshness-audit.yml`: the constant-restamp detector.
