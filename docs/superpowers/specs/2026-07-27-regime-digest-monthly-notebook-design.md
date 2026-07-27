# Regime Digest → Monthly Regime Notebook

**Date:** 2026-07-27  
**Status:** Approved for implementation planning  
**Product:** GraphiQuestor (`graphiquestor.com`)  
**URLs:** `/regime-digest/`, `/regime-digest/YYYY/MM/`  
**Approach:** Monthly Regime Notebook (hybrid desk brief + reference scoreboard)

---

## 1. Problem

Regime Digest is positioned as monthly institutional synthesis but currently fails as both product and content:

| Issue | Evidence |
|--------|----------|
| Thin content | Archive ~141 words; editions marketed as ~1 min read |
| Broken / impossible metrics | e.g. CPI YoY 332%, fiscal stress millions of percent |
| LLM dependency | July 2026: “Metrics template (LLM fallback)” |
| No analysis job | Snapshots without reliable MoM, regime framing, or “so what” |
| SEO/AEO weakness | Site-wide meta description; dual H1s on editions |
| Role confusion | Daily Macro Brief already covers overnight; Digest does not own the month |

Users need a **reference point** and **help in analysis**, not a thin auto-essay.

---

## 2. Goals and non-goals

### Goals (priority order)

1. **Analysis utility (primary)** — Mid-month return visits; usable frozen scoreboard and regime context without the live terminal.
2. **SEO / AEO** — Unique, extractable edition pages that can rank and be cited.
3. **Newsletter growth (secondary)** — Existing subscribe CTA; do not block v1 on email redesign.

### Product decisions (locked)

| Decision | Choice |
|----------|--------|
| Shape | **Hybrid**: desk brief on top, permanent scoreboard/history below |
| Production | **Fully automated** from existing terminal telemetry; **no LLM narrative** |
| Integrations | **No new external data vendors**; reuse GraphiQuestor series only |
| Cadence | Publish on the **1st** (or first business day) for the **prior calendar month** |

### Non-goals (v1)

- New data APIs / vendors
- LLM-generated narrative
- Interactive month-compare explorer
- CSV/PDF export
- New email provider or redesign
- Paywall / personalization
- Human editorial CMS
- Scoreboard sort/filter UI

---

## 3. Product definition

**Regime Digest** is a monthly, fully automated **edition** that is:

1. **Desk brief** (top): what changed, what it means, what to watch  
2. **Reference notebook** (bottom): MoM scoreboard + regime history reopened mid-month  

**Not** a replacement for Daily Macro Brief (day grain). Digest = month-close synthesis.

---

## 4. Page structure

### 4.1 Edition page (`/regime-digest/YYYY/MM/`)

Single scroll, sections in order:

| ID | Section | Purpose |
|----|---------|---------|
| H | **Header** | Single H1 `{Month} {Year} Macro Regime Digest`; published, as-of, edition # |
| A | **Regime strip** | Label, confidence, days-in-regime; optional composite score freeze; sticky on desktop |
| B | **Desk brief** | B1 thesis · B2 biggest movers · B3 positioning map · B4 next-month watchlist |
| C | **Reference scoreboard** | Sections with Metric \| Level \| Prior \| Δ \| Δ% \| As-of \| Status |
| D | **Regime history** | Last 12 month-end regime labels |
| E | **This month’s daily briefs** | Links to `/macro-brief/*` in that month |
| F | **Data quality + footer** | Stale/withheld counts, sources, subscribe, related links |

### 4.2 Archive (`/regime-digest/`)

- Hero + one-line value prop + subscribe  
- **Featured latest** edition (regime badge + thesis line + CTA)  
- Year grid with regime badge + thesis snippet  
- Missing months listed explicitly (never silent)

### 4.3 Remove from current UX

- Dual H1s (“July 2026 Regime” + “MACRO REGIME DIGEST”)  
- LLM fallback / “Invalid Date” copy  
- Generic site-wide meta description on editions  
- Decorative sparklines that add no series context  
- Shipping numbers that fail integrity validation  

---

## 5. Data model

Frozen snapshot only — edition pages render from stored payload, not live recompute at request time (except explicit backfill job).

```
RegimeDigestEdition {
  year, month, editionNumber
  publishedAt, asOf
  regime: {
    label,              // prefer glossary 4-regime if scorable; else Risk On/Off
    confidence,
    daysInRegime,
    compositeScore?     // from Daily Regime Signal freeze
  }
  thesis: string[]      // 3–5 rule-template sentences
  movers: { up: MetricMove[], down: MetricMove[] }
  watchlist: WatchItem[]
  positioning: string[] // static map by regime
  board: ScoreboardSection[]
  history: { year, month, regime }[]
  briefLinks: { date, url, title }[]
  quality: {
    staleCount,
    failedMetrics[],
    overall: "ok" | "partial" | "blocked"
  }
}

MetricRow {
  id, name, section
  level, priorLevel, delta, deltaPct
  unit, asOf, sourceFamily
  status: "ok" | "stale" | "missing" | "failed_validation"
  glossaryPath?
}

MetricMove { id, name, deltaPct, level, section }

WatchItem {
  type: "event" | "level"
  date?, label, why
}
```

### 5.1 Metric universe (v1)

Reuse series already in GraphiQuestor telemetry only. If not in store → omit.

| Section | Examples |
|---------|----------|
| Liquidity | Global net liquidity; RRP/TGA if present |
| Rates / USD | US 10Y, DXY |
| Vol | VIX |
| Metals / fiscal anchors | Gold, Debt/Gold, M2/Gold, SPX/Gold |
| De-dollarization | USD reserve share, gold share if tracked |
| Energy | Brent, SPR |
| US | CPI YoY (validated), debt stock if available |
| India | GDP YoY, CPI, USD/INR; fiscal stress only if formula fixed |
| China | GDP YoY |

### 5.2 MoM rules

1. **Month-end level** = last valid observation with `asOf` ≤ last calendar day of month (or last trading day for market series — match existing terminal convention).  
2. **Prior level** = same for previous month.  
3. **Δ** = level − prior; **Δ%** = Δ / prior; if prior missing or zero → show “—”.  
4. **Stale**: series-specific age thresholds (e.g. daily &gt; 7d; monthly official &gt; 45d) → `stale`; still show last known with badge; **exclude from movers**.  
5. **Movers**: rank by |Δ%| among `status: ok` only; top 5 up / top 5 down.

### 5.3 Validation gates

Plausible range + unit checks before any number is shown. Examples:

| Metric | Fail if (illustrative bands — tune to real history) |
|--------|------------------------------------------------------|
| CPI YoY % | outside e.g. −5% … 25% |
| VIX | outside 5 … 100 |
| DXY | outside 70 … 130 |
| Ratios | non-finite; negative where impossible |
| Percentages | double-scaled / wrong unit |

- `failed_validation` → withhold level; show integrity message; never invent.  
- Thesis templates only use `status: ok` metrics.  
- **Partial publish:** if regime computable and ≥50% core board OK → publish with quality banner.  
- **Block publish:** if regime cannot be computed or &lt;50% core board OK → do not replace Latest; alert ops.

### 5.4 Rules thesis (no LLM)

Fixed templates filled from computed flags, max 5 lines. Examples:

- Liquidity: “Global net liquidity expanded/contracted MoM (±X%).”  
- Dollar: “DXY rose/fell MoM to L …”  
- Regime: “Month-end regime: {label} (confidence C%; N days in regime).”  
- India/China lines only if data OK.

**Positioning:** static bullets keyed by regime (aligned with glossary framework). Label as **framework implications**, not personalized advice.

### 5.5 Next-month watchlist

Internal only:

1. Event dates already stored for daily brief / calendar.  
2. Else **level watches** derived from MoM moves and known thresholds.  
3. Cap 5–8 items. Never invent event dates.

### 5.6 Automation schedule

| Step | When |
|------|------|
| Freeze month-end observations | 1st after nightly ingest |
| Validate + MoM + movers + regime | same job |
| Build thesis + full payload | same job |
| Persist edition + cache invalidation | same job |
| Email (existing list) | optional; **same payload** as web |

Backfill: re-run job for historical months (e.g. Feb 2026–present) after validation is solid.

### 5.7 Product relationships

| Product | Role |
|---------|------|
| Daily Macro Brief | Day grain; Digest links the month’s set |
| Daily Regime Signal | Source for score/components; Digest freezes month-end |
| Glossary / Labs | Drill-down from scoreboard rows |
| Live Terminal | Live data; Digest is frozen reference |

**Regime taxonomy:** freeze one system for Digest (prefer glossary four-regime if scorable; else month-end Risk On/Off). Document mapping once in implementation.

---

## 6. UI / UX

### 6.1 Visual system

- Terminal dark surfaces; tabular numerals for all levels / Δ / %  
- Green / red / amber for expand / contract / stale — **always with icon or text**, never color alone  
- SVG icons only (no emoji status)  
- Motion subtle (150–250ms); respect `prefers-reduced-motion`  
- Dense scoreboard; more open desk brief  

### 6.2 Components

| Component | Behavior |
|-----------|----------|
| EditionHeader | One H1; meta row; breadcrumb Home → Regime Digest → Month Year |
| RegimeStrip | Sticky desktop; in-flow mobile |
| DeskBrief | Thesis, movers (two columns desktop), positioning card, watchlist |
| Scoreboard | Desktop table; mobile stacked cards; section jump nav ≥1024; hide empty sections |
| RegimeHistory | 12-month timeline; pattern + label; click → edition if exists; SR text summary |
| BriefIndex | List of in-month daily briefs; hide if none |
| QualityFooter | Counts, source families, integrity note when partial |
| Archive | Featured latest + grid cards with regime badge |

### 6.3 Accessibility

- Touch targets ≥44px  
- Critical values not hover-only  
- Table headers associated; timeline has accessible summary  
- Visible focus rings on dark UI  
- Core text/tables readable with JS disabled (SSR or static HTML)

### 6.4 Charts (v1)

- Regime history timeline only  
- No decorative sparklines  
- Line small-multiples deferred until history queries are clean  

### 6.5 SEO / AEO

| Element | Spec |
|---------|------|
| Title | `{Month} {Year} Macro Regime Digest: {Regime Label} \| GraphiQuestor` |
| Meta | Unique ~150 chars: regime + one thesis fact + key MoM (e.g. liquidity or DXY) |
| H1 | Single |
| JSON-LD | `Article` or `NewsArticle` with `datePublished`, `dateModified`, org author |
| Canonical | Live 200 URL, trailing slash, consistent case |

### 6.6 Responsive

| Breakpoint | Behavior |
|------------|----------|
| &lt;768 | Cards for scoreboard; stacked movers; strip in flow |
| ≥768 | Full table; 2-col movers |
| ≥1024 | Sticky strip; scoreboard jump nav |

---

## 7. Edge cases

| Case | Behavior |
|------|----------|
| Validation fail | Withhold; no movers inclusion |
| Stale but valid range | Show + Stale; exclude from movers |
| Missing series | Omit or Missing; never invent |
| Partial core | Banner + publish if rules allow |
| Blocked | Keep prior Latest; ops alert |
| No prior month | Prior/Δ% “—” |
| No event calendar | Level watches only |
| Taxonomy mismatch | One frozen taxonomy + documented map |
| Reopen old edition | Frozen snapshot only |
| No daily briefs | Hide BriefIndex |
| Email failure | Web still live |
| Re-publish same month | Upsert by (year, month); bump `dateModified` if changed |

---

## 8. Acceptance criteria

### Trust

1. No edition displays impossible range-fail numbers (e.g. CPI 332%).  
2. Every visible number has as-of and status.  
3. No LLM fallback copy, Invalid Date, or dual H1.

### Hybrid job

4. Desk brief includes thesis (3–5), movers, positioning, next-month watch.  
5. Scoreboard includes level, prior, Δ, Δ% for all OK metrics in defined sections.  
6. Regime strip shows label + confidence (and days-in-regime when computable).  
7. 12-month history when enough closed months exist.

### Automation

8. Publish job builds full payload without LLM.  
9. Backfill can regenerate historical months after rules ship.  
10. Core content available without client-only data fetch for numbers.

### Analysis utility

11. User answers in &lt;2 minutes: regime, biggest MoM moves, what to watch.  
12. Mid-month scoreboard usable as frozen reference without live terminal.

### SEO

13. Unique title + meta per edition.  
14. Single H1; Article JSON-LD; correct canonical.

### Growth

15. Subscribe CTA on archive + edition footer (existing flow).

---

## 9. Implementation order (planning input)

1. Validation + snapshot model (trust foundation)  
2. Scoreboard + MoM + movers  
3. Regime strip + history  
4. Rules thesis + positioning + watchlist  
5. Archive + SEO  
6. Backfill historical editions  
7. Confirm existing subscribe wiring  

Existing code touchpoints (for planners):

- `src/pages/RegimeDigestPage.tsx`  
- `src/pages/RegimeDigestArchivePage.tsx`  
- `src/features/regime-digest/`  
- `supabase/functions/generate-monthly-regime-digest/`  
- Related: daily regime signal, macro-brief links, metrics catalog  

---

## 10. Success metrics (90 days)

| Priority | Signal |
|----------|--------|
| A | Return visits to edition URLs; time on page; qualitative “used as reference” |
| C | Indexation of unique editions; rich results eligibility; brand/query impressions for regime + month |
| B | Subscribe conversions from digest paths (secondary) |

---

## 11. Design approval record

| Section | Status |
|---------|--------|
| §1 Product definition & page structure | Approved |
| §2 Data model & automation | Approved |
| §3 UI/UX | Approved |
| §4 Edge cases, acceptance, scope | Approved |

**Chosen approach:** Monthly Regime Notebook (Approach 2).  
**Production:** Fully automated, no LLM.  
**Success ranking:** Analysis utility &gt; SEO/AEO &gt; Newsletter growth.
