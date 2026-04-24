# Trade Intelligence Module: HS Code Global Demand Mapper

## Brainstorm & Feasibility Analysis for GraphiQuestor Integration

---

## Executive Vision: What You're Building

**Product Concept:** "Find Your Next Export Market in 30 Seconds"

**Core Value Proposition:**

- Enter any HS code → See global demand heat map
- Identify top importers → Understand competition
- Layer macro context → Time market entry
- **Unique Advantage:** Only platform combining trade flows + macro conditions

**Target Users:**

- Export managers seeking new markets
- Trade consultants advising clients
- Import/export companies expanding product lines
- Government trade promotion agencies
- Private equity analyzing market entry

---

## Strategic Positioning: Why This is GENIUS

### 1. Complements Your Existing Macro Terminal

**Current GraphiQuestor:**

- Tracks macro: liquidity, sovereign stress, FX, inflation
- Answers: "Is this economy healthy?"

**Trade Intelligence Addition:**

- Tracks trade flows: imports, suppliers, concentration
- Answers: "Where should I sell my product?"

**Combined Power:**

```
Scenario: Indian textile exporter considering Vietnam

GraphiQuestor Macro:
✓ Vietnam GDP growing 6%
✓ Currency stable (VND)
✓ FX reserves rising
✓ Low inflation

Trade Intelligence:
✓ Vietnam textile imports: $12B/year, +15% YoY
✓ Top suppliers: China (60%), Bangladesh (15%)
✓ HHI: 0.42 (moderate concentration - room for new entrants)
✓ Seasonal peak: Oct-Dec

Combined Insight:
→ "Vietnam is a high-opportunity market for textiles. 
   Macro stable, demand growing, market not over-concentrated. 
   Target entry: Q3 for Q4 seasonal peak."
```

**This is a MOAT.** Nobody else connects macro + trade intelligence.

### 2. Differentiated from Competitors

**Existing Trade Platforms:**

| Platform                  | Coverage              | Macro Integration      | UI/UX         | Price    |
| ------------------------- | --------------------- | ---------------------- | ------------- | -------- |
| **TradeMap (ITC)**        | Global, comprehensive | None                   | Clunky, 1990s | Free     |
| **Panjiva**               | Global, detailed      | None                   | Good          | $$$$     |
| **ImportGenius**          | US-only               | None                   | Decent        | $$$      |
| **ComtradeGo**            | Global, official      | None                   | Basic         | Free     |
| **GraphiQuestor + Trade** | **Global**            | **Full macro overlay** | **Modern**    | **Free** |

**Your competitive advantage:**

1. **Macro integration** - Nobody does this
2. **Real-time macro data** - Trade platforms use stale data
3. **Modern UX** - React vs 1990s tables
4. **Free** - Democratizes trade intelligence

### 3. Natural User Journey

**Current User:** "I track macro conditions globally" (GraphiQuestor user)

**Natural Extension:** "I want to export to countries with good macro" → **Needs
trade intelligence**

**Opposite User:** "I want to find export markets" (new user type)

**Natural Extension:** "Which markets are economically stable?" → **Needs macro
intelligence**

**You capture both user types in one platform.**

---

## Technical Feasibility: Can You Build This?

### Assets You Already Have

✅ **Supabase edge functions** (84 functions) ✅ **COMTRADE API key** (already
integrated) ✅ **React frontend** (can add trade module) ✅ **Data
infrastructure** (proven with macro data) ✅ **Chart libraries** (reusable for
trade viz)

### What You Need to Add

**Data Sources:**

1. **Primary: UN Comtrade API** (you have key)
   - Coverage: 200+ countries
   - Granularity: 6-digit HS code
   - History: 20+ years
   - Update: Annual (with lag)
   - Cost: Free

2. **Supplementary: National Customs APIs**
   - Brazil: ComexStat API
   - EU: Eurostat Comext API
   - USA: Census Bureau API
   - India: DGCI&S
   - Cost: Free (mostly)

3. **Enhancement: World Bank / IMF**
   - GDP, population (for per-capita calcs)
   - Already have this for macro module

**Technical Complexity:**

| Component                   | Difficulty  | Estimated Effort |
| --------------------------- | ----------- | ---------------- |
| Comtrade API integration    | Low         | 8-12 hours       |
| HS code search/autocomplete | Medium      | 12-16 hours      |
| Demand ranking algorithm    | Medium      | 8-12 hours       |
| Competition analysis        | Medium      | 12-16 hours      |
| Macro overlay integration   | Low         | 8-12 hours       |
| UI/UX for trade module      | Medium-High | 40-60 hours      |
| **Total**                   |             | **88-128 hours** |

**Feasibility: HIGH** - You can build MVP in 2-3 weeks full-time.

---

## Product Design: Modular Architecture

### Module Structure

```
/trade                          → Trade intelligence home
/trade/hs/{code}               → HS code overview
/trade/hs/{code}/demand        → Global demand ranking
/trade/hs/{code}/market/{iso}  → Specific market deep-dive
/trade/hs/{code}/suppliers     → Competition landscape
```

### User Flow

**Step 1: HS Code Entry**

```
┌─────────────────────────────────────────┐
│  What do you export?                    │
│  ┌─────────────────────────────────┐   │
│  │ Enter HS Code or Product Name   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Example: 620342 (Men's cotton trousers)│
└─────────────────────────────────────────┘
```

**Step 2: Global Demand Heatmap**

```
World Map (Choropleth)
- Color intensity = Import value
- Size = Growth rate
- Tooltip: Country, $value, YoY growth

Table below map:
Rank | Country    | Import Value | YoY Growth | Volatility | Macro Score
1    | USA        | $8.5B        | +5%        | Low        | 8/10
2    | Germany    | $3.2B        | +12%       | Low        | 9/10
3    | UK         | $2.1B        | -2%        | Medium     | 7/10
...
```

**Step 3: Market Deep-Dive** (User clicks USA)

```
USA - Men's Cotton Trousers (HS 620342)

━━━ DEMAND OVERVIEW ━━━
Import Value: $8.5B (2025)
5-Year CAGR: +4.2%
Monthly Seasonality: Peak Aug-Oct (back-to-school)

[Line chart: 10-year import trend]

━━━ COMPETITION ━━━
Top Suppliers to USA:
1. China      - $4.2B (49.4%) - Declining (-3% YoY)
2. Vietnam    - $1.8B (21.2%) - Growing (+15% YoY)
3. Bangladesh - $1.2B (14.1%) - Growing (+8% YoY)
4. India      - $0.9B (10.6%) - Stable (+2% YoY)

HHI: 0.35 (Moderate concentration - opportunity for new entrants)

[Stacked area chart: Supplier share over time]

━━━ MACRO CONTEXT ━━━
USA Economic Health: 8/10
• GDP Growth: +2.1%
• Consumer Confidence: Strong
• Import Tariffs: Standard MFN
• Currency: USD stable
• Trade Policy: No recent barriers

[Link to full USA macro dashboard]

━━━ OPPORTUNITY SCORE ━━━
Overall: 82/100 (High Opportunity)
✓ Large market ($8.5B)
✓ Stable growth (+4% CAGR)
✓ Declining China share (opportunity)
✓ Strong macro fundamentals
⚠ Seasonal (plan inventory for Q3)

[Button: Download Market Report PDF]
[Button: Set Alert for Changes]
```

**Step 4: Supplier Competition View**

```
Who are you competing against?

For USA market (HS 620342):

China (49% market share)
• Strength: Price, scale, infrastructure
• Weakness: Rising labor costs, trade tensions
• Trend: Declining share (-3% YoY)

Vietnam (21% market share)
• Strength: Low cost, trade agreements
• Weakness: Smaller capacity vs China
• Trend: Fast growth (+15% YoY)

Your opportunity:
Position as: Mid-tier quality, better than Bangladesh, cheaper than domestic
Target segment: Retailers seeking China+1 sourcing
Entry timing: Q2 2026 for Q4 seasonal peak
```

---

## Data Architecture

### Core Data Models

**1. HS Code Master Table**

```sql
CREATE TABLE hs_codes (
  code VARCHAR(6) PRIMARY KEY,
  description TEXT,
  section VARCHAR(2),
  chapter VARCHAR(2),
  heading VARCHAR(4),
  level INT  -- 2, 4, or 6 digit
);

-- Example:
-- '620342', 'Men's or boys' trousers, breeches, of cotton, not knitted', 
-- '62', '6203', '620342', 6
```

**2. Trade Flows Table**

```sql
CREATE TABLE trade_flows (
  id BIGSERIAL PRIMARY KEY,
  reporter_iso3 VARCHAR(3),  -- Importing country
  partner_iso3 VARCHAR(3),   -- Exporting country
  hs_code VARCHAR(6),
  year INT,
  month INT,  -- NULL for annual data
  trade_value_usd BIGINT,
  quantity BIGINT,
  quantity_unit VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flows_hs ON trade_flows(hs_code);
CREATE INDEX idx_flows_reporter ON trade_flows(reporter_iso3);
CREATE INDEX idx_flows_year ON trade_flows(year);
```

**3. Market Metrics (Pre-computed)**

```sql
CREATE TABLE market_metrics (
  reporter_iso3 VARCHAR(3),
  hs_code VARCHAR(6),
  year INT,
  total_imports BIGINT,
  yoy_growth DECIMAL(5,2),
  supplier_count INT,
  hhi DECIMAL(5,4),  -- Herfindahl-Hirschman Index
  top_supplier_iso3 VARCHAR(3),
  top_supplier_share DECIMAL(5,2),
  PRIMARY KEY (reporter_iso3, hs_code, year)
);
```

**4. Opportunity Scores (Computed)**

```sql
CREATE TABLE opportunity_scores (
  reporter_iso3 VARCHAR(3),
  hs_code VARCHAR(6),
  computed_at TIMESTAMPTZ,
  
  -- Components
  market_size_score INT,      -- 0-100
  growth_score INT,           -- 0-100
  competition_score INT,      -- 0-100 (lower HHI = higher score)
  macro_score INT,            -- 0-100 (from your macro module)
  volatility_score INT,       -- 0-100 (lower vol = higher score)
  
  -- Overall
  overall_score INT,          -- Weighted average
  
  PRIMARY KEY (reporter_iso3, hs_code)
);
```

### Data Pipeline

**Edge Function: `fetch-comtrade-data`**

```javascript
// Triggered: Daily or on-demand
// Purpose: Fetch trade data for specific HS code

export async function fetchComtradeData(hsCode, year) {
  const url =
    `https://comtradeapi.un.org/data/v1/get/C/A/${year}/ALL/${hsCode}`;

  const response = await fetch(url, {
    headers: {
      "Ocp-Apim-Subscription-Key": COMTRADE_API_KEY,
    },
  });

  const data = await response.json();

  // Transform and insert into trade_flows table
  await supabase.from("trade_flows").insert(
    data.data.map((row) => ({
      reporter_iso3: row.reporterISO,
      partner_iso3: row.partnerISO,
      hs_code: row.cmdCode,
      year: row.refYear,
      trade_value_usd: row.primaryValue,
      quantity: row.qty,
      quantity_unit: row.qtyUnitCode,
    })),
  );
}
```

**Edge Function: `compute-opportunity-scores`**

```javascript
// Triggered: After data refresh
// Purpose: Calculate opportunity scores for all markets

export async function computeOpportunityScores(hsCode) {
  // Get all reporter countries for this HS code
  const markets = await getMarketsForHS(hsCode);

  for (const market of markets) {
    // 1. Market size score (log scale)
    const sizeScore = calculateSizeScore(market.totalImports);

    // 2. Growth score (5-year CAGR)
    const growthScore = calculateGrowthScore(market.cagr5y);

    // 3. Competition score (inverse HHI)
    const competitionScore = calculateCompetitionScore(market.hhi);

    // 4. Macro score (from your existing macro module)
    const macroScore = await getMacroScore(market.iso3);

    // 5. Volatility score (inverse of import volatility)
    const volatilityScore = calculateVolatilityScore(market.stddev);

    // Weighted average
    const overallScore = sizeScore * 0.25 +
      growthScore * 0.25 +
      competitionScore * 0.20 +
      macroScore * 0.20 +
      volatilityScore * 0.10;

    await supabase.from("opportunity_scores").upsert({
      reporter_iso3: market.iso3,
      hs_code: hsCode,
      market_size_score: sizeScore,
      growth_score: growthScore,
      competition_score: competitionScore,
      macro_score: macroScore,
      volatility_score: volatilityScore,
      overall_score: Math.round(overallScore),
      computed_at: new Date(),
    });
  }
}
```

---

## Macro Integration: The Secret Sauce

### How to Connect Trade + Macro

**For each importing country, pull from your existing macro module:**

```javascript
async function getMacroScore(countryISO) {
  // These metrics already exist in your GraphiQuestor macro system

  const macroData = await supabase
    .from("country_metrics")
    .select("*")
    .eq("iso3", countryISO)
    .single();

  // Weighted scoring
  const gdpScore = scoreGDP(macroData.gdp_growth); // 30%
  const fxScore = scoreFX(macroData.fx_volatility); // 20%
  const inflationScore = scoreInflation(macroData.cpi_yoy); // 20%
  const liquidityScore = scoreLiquidity(macroData.m2_growth); // 15%
  const debtScore = scoreDebt(macroData.debt_gdp_ratio); // 15%

  const macroScore = gdpScore * 0.30 +
    fxScore * 0.20 +
    inflationScore * 0.20 +
    liquidityScore * 0.15 +
    debtScore * 0.15;

  return Math.round(macroScore);
}
```

**Example Scoring Logic:**

```javascript
function scoreGDP(gdpGrowth) {
  // Convert GDP growth to 0-100 scale
  // 0% growth = 50 points (neutral)
  // 5%+ growth = 100 points (excellent)
  // -5% growth = 0 points (poor)

  if (gdpGrowth >= 5) return 100;
  if (gdpGrowth <= -5) return 0;

  return 50 + (gdpGrowth * 10);
}

function scoreFX(fxVolatility) {
  // Lower volatility = higher score
  // 0-2% volatility = 100 points
  // 10%+ volatility = 0 points

  if (fxVolatility <= 2) return 100;
  if (fxVolatility >= 10) return 0;

  return Math.max(0, 100 - (fxVolatility * 10));
}
```

### UI: Macro Overlay on Trade Data

**Visual Design:**

```
Vietnam - Textile Imports (HS 6204)

┌─────────────────────────────────────────────────┐
│ DEMAND: $12.3B (+15% YoY)                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━ 92/100                 │
│                                                 │
│ MACRO HEALTH: 85/100 ✓ Favorable               │
│ ┌───────────────────────────────────────────┐   │
│ │ GDP Growth:       +6.2%  ████████ 82      │   │
│ │ FX Stability:     Low vol ████████ 90     │   │
│ │ Inflation:        3.1%    ███████░ 75     │   │
│ │ Liquidity:        Strong  █████████ 88    │   │
│ │ Sovereign Stress: Low     ████████ 85     │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ [View Full Macro Dashboard →]                   │
└─────────────────────────────────────────────────┘
```

---

## Killer Features (Differentiation)

### 1. Smart Market Ranker

**Beyond simple import volume sorting:**

```javascript
// Rank markets by composite opportunity score
const rankedMarkets = await supabase
  .from('opportunity_scores')
  .select('*, countries(name)')
  .eq('hs_code', hsCode)
  .order('overall_score', { ascending: false })
  .limit(50);

// Display with intuitive tags
{
  country: 'Vietnam',
  score: 88,
  tags: [
    '🔥 Fast Growth (+15% YoY)',
    '💰 Large Market ($12B)',
    '📈 Strong Macro (85/100)',
    '🎯 Low Competition (HHI: 0.32)'
  ],
  insight: 'Prime market for entry. Demand rising, China losing share.'
}
```

### 2. Supplier Shift Detector

**Alert when market share is changing:**

```javascript
// Detect when dominant supplier is losing share
const supplierShifts = await detectSupplierShifts(country, hsCode);

// Example output:
{
  market: 'USA',
  hsCode: '620342',
  shift: {
    incumbent: 'China',
    incumbentShare: 49.4,  // Down from 58% in 2020
    trend: -8.6,           // Percentage points lost
    opportunity: 'High',
    message: 'China losing 8.6pp share over 5 years. Market opening for alternatives.'
  }
}
```

### 3. Seasonality Insights

**Monthly import patterns:**

```javascript
// Calculate seasonal index for each month
const seasonality = await calculateSeasonality(country, hsCode);

// Display:
{
  peak: 'October',
  peakMultiplier: 1.45,  // 45% above average
  trough: 'February',
  troughMultiplier: 0.68,
  advice: 'Target Q2 production for Q4 peak demand'
}
```

### 4. Macro-Trade Correlation

**Show how macro affects trade:**

```javascript
// Example: Vietnam textile imports vs VND/USD
const correlation = analyzeCorrelation({
  imports: vietnamTextileImports,  // Monthly
  fxRate: vndUsdRate              // Monthly
});

// Display:
{
  correlation: -0.72,
  insight: 'When VND weakens, imports fall (price-sensitive market)',
  actionable: 'Current VND strength favors import demand'
}
```

### 5. Entry Timing Optimizer

**When should you enter this market?**

```javascript
function calculateEntryTiming(marketData, macroData) {
  const factors = {
    demandCycle: getDemandCyclePhase(marketData.monthlyData),
    macroCycle: getMacroCyclePhase(macroData),
    seasonality: getSeasonalWindow(marketData.seasonalIndex),
    competition: getCompetitiveWindow(marketData.supplierTrends),
  };

  return {
    recommendation: "Q2 2026",
    reason: [
      "Demand cycle entering expansion",
      "Macro favorable (GDP accelerating)",
      "Seasonal prep for Q4 peak",
      "China share declining (window open)",
    ],
    confidence: "High",
  };
}
```

---

## UI/UX Design Principles

### 1. Speed First

**Goal: "Find your market in 30 seconds"**

```
Landing page:
┌─────────────────────────────────────────┐
│  Find Your Next Export Market           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Enter HS Code: [        ]       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Or browse popular categories:         │
│  • Textiles • Electronics • Machinery   │
└─────────────────────────────────────────┘

[3 seconds later]

Results for HS 620342:
Top 5 Markets (by Opportunity Score)
1. 🇺🇸 USA        - 88/100 - $8.5B market
2. 🇩🇪 Germany    - 85/100 - $3.2B market
3. 🇬🇧 UK         - 78/100 - $2.1B market
4. 🇯🇵 Japan      - 76/100 - $1.8B market
5. 🇫🇷 France     - 74/100 - $1.5B market

[Click any country for deep-dive]
```

### 2. Visual > Tables

**Trade platforms are table-heavy. You can be visual.**

**Instead of:**

```
Country    | Import Value | YoY Growth
USA        | $8.5B        | +5%
Germany    | $3.2B        | +12%
```

**Do:**

```
[World map heatmap showing import intensity]
[Bubble chart: X=market size, Y=growth, size=opportunity score]
[Supplier share: Animated stacked area chart over time]
```

### 3. Actionable Insights > Raw Data

**Every screen should answer: "What should I do?"**

Bad:

```
Vietnam imports: $12.3B
YoY growth: +15%
HHI: 0.32
```

Good:

```
✓ High Opportunity: Vietnam

Why:
• Large, fast-growing market ($12B, +15%/year)
• Low supplier concentration (room for new entrants)
• China losing share (-5pp) - timing is right
• Macro favorable (GDP +6%, stable FX)

Next Steps:
1. Contact Vietnamese distributors (Q2 2026)
2. Prep inventory for Q4 seasonal peak
3. Position as "China alternative" (mid-tier quality)

[Button: Download Market Entry Report]
[Button: Set Alert for Changes]
```

---

## Monetization Strategy

### Free Tier (Discovery)

**What's free:**

- HS code lookup
- Top 10 markets by import value
- Basic supplier competition view
- Macro scores visible

**Goal:** Hook users, show value, build trust.

### Premium Tier ($99-299/month)

**What's premium:**

- Full market rankings (all countries)
- Historical trends (10+ years)
- Monthly seasonality data
- Supplier shift alerts
- Entry timing recommendations
- PDF report exports
- API access (for integration)

**Target:** Export managers, trade consultants, SMEs

### Enterprise Tier ($999+/month)

**What's enterprise:**

- Multiple users
- Custom HS code tracking
- Automated alerts (email/Slack)
- Priority data updates
- White-label option
- Dedicated support

**Target:** Trade promotion agencies, consulting firms, large exporters

### API Tier (Usage-based)

**What's included:**

- Programmatic access to all data
- Webhook alerts
- Bulk queries

**Pricing:** $0.01-0.10 per API call (depending on tier)

**Target:** Software companies, data aggregators

---

## Launch Strategy

### Phase 1: MVP (Month 1-2)

**Build:**

- HS code search
- Top 20 markets ranker
- Basic supplier competition view
- Macro overlay (using existing data)

**Features:**

- 2-digit and 4-digit HS codes only (simpler)
- Annual data (no monthly yet)
- Top 50 countries only
- No alerts/exports

**Goal:** Validate demand, gather feedback

**Distribution:**

- Soft launch to GraphiQuestor users
- Reddit post on r/ImportExport, r/Entrepreneur
- LinkedIn post in trade groups

### Phase 2: Full Feature (Month 3-4)

**Add:**

- 6-digit HS code support
- Monthly/seasonal data
- Supplier shift detection
- Entry timing optimizer
- PDF exports

**Goal:** Reach feature parity with paid platforms

### Phase 3: Monetization (Month 5-6)

**Launch:**

- Freemium model
- Premium tier ($99/mo)
- API tier

**Marketing:**

- HackerNews: "I built a free trade intelligence platform"
- Product Hunt launch
- Outreach to trade consultants
- Partner with trade promotion agencies

### Phase 4: Scale (Month 7-12)

**Expand:**

- Subnational data (ComexStat, Eurostat)
- Tariff data integration
- Buyer directory (who imports what)
- Supplier directory
- Marketplace features (connect exporters/importers)

---

## Data Sources: Detailed Breakdown

### Primary: UN Comtrade

**Coverage:**

- 200+ reporting countries
- 5,000+ HS codes (6-digit)
- 1962-present

**API Limits:**

- Free tier: 100 requests/hour
- Premium tier: 10,000 requests/hour (contact them)

**Your strategy:**

- Cache aggressively (trade data changes annually)
- Pre-fetch top 500 HS codes
- On-demand fetch for long-tail codes

### Enhancement: WTO Tariff Data

**Source:** WTO Tariff Download Facility

- Tariff rates by HS code, by country
- MFN (Most Favored Nation) rates
- Preferential rates (FTAs)

**Use case:** "Vietnam imports at 5% MFN tariff vs 0% under CPTPP. If you're in
CPTPP country, you have cost advantage."

---

## Technical Challenges & Solutions

### Challenge 1: Comtrade API Rate Limits

**Problem:** 100 requests/hour free tier

**Solutions:**

1. **Aggressive caching**
   - Cache all queries for 30 days (annual data doesn't change)
   - Pre-fetch top 500 HS codes

2. **Batch requests**
   - Request multiple years in one call
   - Request all partners at once

3. **Priority queue**
   - Common HS codes = cached, instant
   - Rare codes = queued, notify user when ready

4. **Upgrade to premium**
   - $500/year for 10K requests/hour
   - Worth it if you get traction

### Challenge 2: Data Freshness

**Problem:** Comtrade has 12-18 month lag

**Solutions:**

1. **Show data age clearly**
   - "Latest data: 2024 (updated Jan 2026)"

2. **Use national sources for recent data**
   - ComexStat (Brazil): 1-month lag
   - Eurostat: 2-month lag
   - Use these to extrapolate Comtrade

3. **Predictive models**
   - Forecast 2025/2026 based on trends
   - Show as "Estimated (based on 2023-2024 trend)"

### Challenge 3: HS Code Complexity

**Problem:** 5,000+ codes, nested hierarchy, confusing names

**Solutions:**

1. **Smart search**
   - Type "cotton shirts" → suggest HS 620520, 620530, 610510
   - Fuzzy matching on descriptions

2. **Visual browse**
   - Chapter → Heading → Subheading drill-down
   - Show popular codes first

3. **AI suggestions**
   - "Describe your product" → GPT suggests HS codes
   - Confirm with user

---

## Integration with Existing GraphiQuestor

### Navigation

**Add to main nav:**

```
GraphiQuestor
├── Dashboard (existing)
├── Intel (existing)
│   ├── India
│   └── China
├── Labs (existing)
├── Glossary (existing)
└── Trade Intelligence (NEW)
    ├── HS Code Search
    ├── Market Explorer
    └── Supplier Analysis
```

### Cross-Linking

**From Macro → Trade:**

```
You're viewing: Vietnam Macro Dashboard

Related Trade Data:
• Vietnam is a major importer of textiles (+$12B/year)
• Electronics imports growing 18% YoY
• Top opportunity HS codes: 6204, 8517, 8473

[Explore Vietnam Trade Opportunities →]
```

**From Trade → Macro:**

```
You're viewing: Vietnam - Textile Imports (HS 6204)

Macro Context:
• GDP: +6.2% (strong)
• FX: Stable
• Inflation: 3.1% (moderate)

[View Full Vietnam Macro Dashboard →]
```

### Shared Data Infrastructure

**Reuse existing:**

- Country metadata (ISO codes, names, flags)
- FX rates
- GDP data
- Population data
- Macro scores

**New tables:**

- trade_flows
- opportunity_scores
- supplier_metrics

---

## Competitive Moat Analysis

### What Competitors Can't Easily Copy

**1. Macro Integration**

- Requires building entire macro data system (you have it)
- Requires real-time data pipelines (you have it)
- Requires domain expertise (you have it)

**2. Modern UX**

- Requires React expertise (you have it)
- Requires design skill (your terminal proves this)
- Incumbents locked into legacy tech

**3. Free Tier**

- Your marginal cost is ~$0 (Supabase free tier)
- Comtrade API is free
- Can afford to give away core features

**4. Speed of Iteration**

- You're solo dev (ship fast)
- Incumbents have bureaucracy
- You can experiment, pivot quickly

### Sustainable Advantages

1. **Data + Insights = Moat**
   - Raw trade data is free
   - Your algorithms + macro layer = proprietary

2. **Community**
   - Free tier builds user base
   - User feedback improves product
   - Network effects (users share markets)

3. **Content**
   - Blog posts on trade trends
   - Market reports
   - SEO moat

---

## Go/No-Go Decision Framework

### GO if:

✅ You can commit 100-150 hours over 2-3 months ✅ You're excited about trade
intelligence space ✅ You see synergy with macro module ✅ You want to explore
B2B SaaS monetization ✅ You have ideas for unique features (macro overlay,
etc.)

### NO-GO if:

❌ You want to focus 100% on macro terminal ❌ You don't have 100-150 hours
available ❌ Trade intelligence feels like distraction ❌ You'd rather ship
"Overnight" macro feature ❌ You're unsure about B2B market

---
**Why GO:**
1. **Strategic fit** - Natural extension of macro terminal
2. **Competitive moat** - Nobody else connects macro + trade
3. **Monetization** - Clear path to revenue (B2B SaaS)
4. **Feasible** - You have 90% of infrastructure already
5. **Differentiated** - Your macro overlay is unique


**Specific Recommendation:**

**Month 1: MVP (60 hours)**
- HS code search
- Top 20 markets (by import value + your macro score)
- Basic supplier view
- Simple UI (no fancy charts yet)

**Validate:**
- Post on r/ImportExport, r/Entrepreneur
- Get 10 users to try it
- Ask: "Would you pay $50/mo for this?"

**If YES → Month 2: Full build**
- Add all features (seasonality, alerts, exports)
- Launch freemium
- Market aggressively

**If NO → Kill it, focus on core macro**
---

## Next Steps (If You Decide to GO)

### This Week

1. **Validate Comtrade API access**
   - Test your key
   - Fetch sample data for one HS code
   - Verify rate limits

2. **Design database schema**
   - hs_codes, trade_flows, opportunity_scores tables
   - Write migration scripts

3. **Sketch UI wireframes**
   - HS code search page
   - Market ranking page
   - Market deep-dive page

### Week 2

4. **Build core edge function**
   - fetch-comtrade-data
   - Transform and store in Supabase

5. **Build opportunity scorer**
   - Market size, growth, competition algorithms
   - Integrate with your macro scores

6. **Build basic UI**
   - React components for search, ranking, viz

### Week 3-4

7. **Polish and test**
   - Handle edge cases
   - Error handling
   - Loading states

8. **Soft launch**
   - Share with 10 beta users
   - Gather feedback
   - Iterate

### Month 2

9. **Scale or kill**
   - If traction: Build full feature set, monetize
   - If no traction: Archive, focus on macro

---

## Final Thoughts

**This is a genuinely good idea.**

The trade intelligence market is underserved, incumbents are weak on UX, and
your macro overlay is a real competitive advantage.

**But:**

- It's a significant time investment (100-150 hours)
- It could distract from your core macro terminal
- B2B SaaS is a different beast than consumer product

**My gut:**

- Build MVP (60 hours)
- Validate demand (1-2 weeks)
- Then decide

**If demand is strong:** This could be a $100K+ ARR business within 12 months
(300 customers at $30/mo = $108K ARR).

**If demand is weak:** You'll have learned a lot, and you can repurpose the HS
code search as a feature in the main terminal ("Find export opportunities for
your macro view").

**Either way, it's a relatively low-risk experiment with high upside.**

---

## Questions for You

Before you commit, answer these:

1. **Time availability:** Can you carve out 60 hours over next 4 weeks for MVP?

2. **Passion:** Does trade intelligence excite you as much as macro?

3. **Customer access:** Do you know any exporters/importers who'd beta test?

4. **Monetization priority:** Is $100K ARR in Year 1 important, or is user
   growth more important?

5. **Focus:** Would this distract from shipping "Overnight" macro feature?

**Let me know your answers and I can help with:**

- Database schema design
- Edge function architecture
- UI wireframes
- Launch strategy
- Or... help you decide to NOT do this and focus on core macro instead
