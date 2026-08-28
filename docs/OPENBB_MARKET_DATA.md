# Market Data Ingestion via GitHub Actions & OpenBB

This integration provides continuous, zero-cost cross-asset market telemetry for GraphiQuestor.

## Overview

- **Engine**: Python ingestion script (`scripts/ingest_openbb_market_data.py`) with multi-provider fallback (OpenBB / yfinance / direct feeds).
- **Execution Platform**: Scheduled GitHub Actions runner (`.github/workflows/ingest-market-data.yml`).
- **Schedule**: Weekdays at 21:30 UTC (post-US cash close).
- **Target Table**: `public.metric_observations` in Supabase Postgres.
- **Provenance**: Tagged with `source_ref: "live_api:openbb:<provider>"` and `is_provisional: false`.

---

## Market Basket Coverage

| Metric ID | Asset Name | Benchmark Symbol | Unit |
| :--- | :--- | :--- | :--- |
| `DXY_INDEX` | US Dollar Index | `DX-Y.NYB` (alt: `UUP`) | index |
| `GOLD_PRICE_USD` | Gold Continuous Futures | `GC=F` (alt: `GLD`) | USD/oz |
| `OIL_BRENT_PRICE_USD`| Brent Crude Oil Futures | `BZ=F` (alt: `BNO`) | USD/bbl |
| `VIX_INDEX` | CBOE Volatility Index | `^VIX` (alt: `VIXY`) | index |
| `UST_10Y_YIELD` | US 10-Year Treasury Yield | `^TNX` (alt: `IEF`) | % |
| `BITCOIN_PRICE_USD` | Bitcoin USD | `BTC-USD` (alt: `BITO`) | USD |
| `SPX_INDEX` | S&P 500 Index | `^GSPC` (alt: `SPY`) | index |
| `USD_INR_RATE` | USD/INR Exchange Rate | `INR=X` | INR |
| `USD_CNY_RATE` | USD/CNY Exchange Rate | `CNY=X` | CNY |
| `USD_BRL_RATE` | USD/BRL Exchange Rate | `BRL=X` | BRL |
| `USD_MXN_RATE` | USD/MXN Exchange Rate | `MXN=X` | MXN |

---

## Local Usage

### Dry-Run (No Database Write)
```bash
python3 scripts/ingest_openbb_market_data.py --dry-run --days 30
```

### Ingest Single Metric
```bash
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-key" \
python3 scripts/ingest_openbb_market_data.py --metric DXY_INDEX --days 60
```

### Full Local Ingestion
```bash
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-key" \
python3 scripts/ingest_openbb_market_data.py --days 90
```

---

## GitHub Secrets Configuration

The GitHub Actions workflow automatically reads the repository secrets:
- `SUPABASE_URL` or `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_DB_PASSWORD` or `VITE_SUPABASE_ANON_KEY`

---

## On-Demand Execution

You can trigger a manual ingestion run at any time via the GitHub Actions UI:
1. Navigate to **Actions** → **Ingest Market Data (OpenBB & Global Feeds)**.
2. Click **Run workflow**.
3. (Optional) Specify lookback days, a specific metric ID, or enable dry-run.
