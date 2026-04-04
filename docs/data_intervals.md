# GraphiQuestor Data Update Intervals

This document outlines the update frequencies for all data points in GraphiQuestor – Macro Observatory. All metrics are updated via automated ingestion functions at the intervals specified below.

## Daily Updates (Updated via Cron Every Day @ 00:00 UTC)

### Gold & Precious Metals
- **Gold Price (USD/oz)** - LBMA AM fix
- **Silver Price (USD/oz)** - LBMA fix
- **Gold/Silver Ratio** - Calculated
- **Precious Metals Divergence** - COMEX vs Shanghai (Gold: GC=F vs 1AU.SHF, Silver: SI=F vs SAG.SHF)

### Market Pulse
- **S&P 500** - Close price
- **VIX** - Volatility Index
- **10Y Treasury Yield** - US Bond Market
- **DXY** - US Dollar Index

### Fed Data
- **Fed Balance Sheet** - Total Assets (FRED: WALCL)
- **TGA Balance** - Treasury General Account (FRED: WTREGEN)
-**Reverse Repo** - O/N RRP (FRED: RRPONTSYD)

## Weekly Updates (Updated Every Monday @ 01:00 UTC)

### Liquidity Metrics
- **Global Net Liquidity** - Aggregated from Fed, ECB, PBoC, BoJ balance sheets minus TGA minus Reverse Repo
- **Net Private Sector Supply** - Calculated from balance sheet flows
- **Offshore Dollar Stress** - Cross-currency basis swaps and LIBOR-OIS spread

## Monthly Updates (Updated 1st of Month @ 02:00 UTC)

### US Macro
- **US CPI (YoY %)** - FRED: CPIAUCSL YoY calculation (NOT raw index)
- **US Policy Rate** - Federal Funds Effective Rate (FRED: FEDFUNDS)
- **US Debt** - Total Public Debt (US Treasury FiscalData API)
- **M2 Money Supply** - FRED: M2SL

### China Macro Pulse
- **CN_GDP_GROWTH_YOY** - Quarterly, shown monthly for context
- **CN_CPI_YOY** - Monthly inflation
- **CN_PPI_YOY** - Producer Price Index
- **CN_FAI_YOY** - Fixed Asset Investment
- **CN_IP_YOY** - Industrial Production
- **CN_RETAIL_SALES_YOY** - Retail sales growth
- **CN_CREDIT_IMPULSE** - Credit growth indicator
- **CN_POLICY_RATE** - PBoC 1Y MLF rate

### India Macro Pulse
- **IN_GDP_GROWTH_YOY** - Quarterly, shown monthly for context
- **IN_CPI_YOY** - Monthly inflation
- **IN_POLICY_RATE** - RBI Repo Rate
- **UPI Autopay Failure Rate** - Parsed from NPCI monthly PDFs

### Foreign Treasury Holders
- **TIC Foreign Holders Data** - US Treasury International Capital (TIC) System, monthly release

## Quarterly Updates (Updated 1st Day of Quarter @ 03:00 UTC)

### Major Economies Overview
- **GDP (Nominal & PPP)** - IMF WEO or national accounts (US, CN, IN, JP, EU, RU)
- **GDP Growth (Real YoY)** - BEA / NBS / Eurostat releases
- **GFCF (% GDP)** - Gross Fixed Capital Formation (Investment metric)
- **Dependency Ratio** - Demographic stress indicators

### BRICS+ Tracker
- **BRICS GDP Aggregates** - Combined nominal and PPP estimates
- **Gold Reserves** - Central bank holdings (World Gold Council quarterly)
- **FX Reserves** - IMF IFS quarterly data

### Sovereign Health Indicators
- **Refinancing Risk Cliff** - Government debt maturity schedules (OECD, national treasuries)
- **Debt Service Ratios** - IMF Fiscal Monitor quarterly

## Annual Updates (Updated Jan 1st @ 04:00 UTC)

### Structural Metrics
- **Demographic Data** - World Bank / OECD (dependency ratios, working-age population)
- **Institutional Quality Indices** - Updated once per year or as released

---

## Staleness Logic

Each metric has an `expected_interval_days` defined in the `metrics` table:

- **Fresh**: Data updated within expected interval
- **Lagged**: Data 1-2x past expected interval (still actionable)
- **Very Lagged**: Data >2x past expected interval (use with extreme caution)
- **Intentional**: Quarterly or annual metrics shown for structural context

---

## Cron Jobs Summary

GraphiQuestor uses Supabase `pg_cron` for automated data ingestion:

| Cron Job                      | Schedule              | Function Invoked                  |
|-------------------------------|-----------------------|-----------------------------------|
| Daily Precious & Market Data  | 00:00 UTC Daily       | `ingest-precious-divergence`      |
| Daily Fed Data                | 00:15 UTC Daily       | `ingest-fed-data`                 |
| Weekly Liquidity              | 01:00 UTC Mon         | `ingest-global-liquidity`         |
| Daily US Macro                | 03:00 UTC Daily       | `ingest-us-macro`                 |
| Monthly China Macro           | 02:30 UTC 1st         | `ingest-china-macro`              |
| Monthly India Macro           | 03:00 UTC 1st         | `ingest-india-macro`              |
| Monthly TIC Foreign Holders   | 03:30 UTC 1st         | `ingest-tic-foreign-holders`      |
| Quarterly Major Economies     | 04:00 UTC 1st of Qtr  | `ingest-major-economies`          |
| Quarterly BRICS               | 04:30 UTC 1st of Qtr  | `ingest-brics-tracker`            |

---

## Data Philosophy

GraphiQuestor is **not a real-time intraday trading terminal**. It is an **institutional macro observatory** designed for:
- Regime identification
- Structural trend analysis
- Thesis development
- Research workflows

All data is open-source compiled, validated, and presented with full transparency via:
- Staleness badges
- Methodology tooltips
- Source attribution
- Historical z-scores and percentiles

**For live intraday data, use Bloomberg/Refinitiv. For macro context anchored through gold & liquidity, use GraphiQuestor.**
