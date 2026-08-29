# Market Data Ingestion via GitHub Actions & OpenBB

This integration provides continuous, zero-cost cross-asset market telemetry for GraphiQuestor.

## Overview

- **Engine**: Python ingestion script (`scripts/ingest_openbb_market_data.py`) with multi-provider fallback (OpenBB / yfinance / direct feeds).
- **Execution Platform**: Scheduled GitHub Actions runner (`.github/workflows/ingest-market-data.yml`).
- **Schedule**: Weekdays at 21:30 UTC (post-US cash close).
- **Target Table**: `public.metric_observations` in Supabase Postgres.
- **Provenance**: Tagged with `source_ref` such as `live_api:openbb:yfinance`, `live_api:yfinance`, or `live_api:direct:yahoo`, plus `is_provisional: false`.

---

## Market Basket Coverage

| Metric ID | Asset Name | Benchmark Symbol | Unit |
| :--- | :--- | :--- | :--- |
| `DXY_INDEX` | US Dollar Index | `DX-Y.NYB` | index |
| `GOLD_PRICE_USD` | Gold Continuous Futures | `GC=F` | USD/oz |
| `OIL_BRENT_PRICE_USD`| Brent Crude Oil Futures | `BZ=F` | USD/bbl |
| `VIX_INDEX` | CBOE Volatility Index | `^VIX` | index |
| `UST_10Y_YIELD` | US 10-Year Treasury Yield | `^TNX` | % |
| `BITCOIN_PRICE_USD` | Bitcoin USD | `BTC-USD` | USD |
| `SPX_INDEX` | S&P 500 Index | `^GSPC` | index |
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

### Supabase CLI Import
```bash
python3 scripts/ingest_openbb_market_data.py --days 420 --sql-file /private/tmp/graphiquestor_market_upsert.sql
supabase db query --linked --file /private/tmp/graphiquestor_market_upsert.sql
```

### Ingest Single Metric
```bash
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-key" \
SUPABASE_PROJECT_REF="debdriyzfcwvgrhzzzre" \
python3 scripts/ingest_openbb_market_data.py --metric DXY_INDEX --days 420
```

### Full Local Ingestion
```bash
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-key" \
SUPABASE_PROJECT_REF="debdriyzfcwvgrhzzzre" \
python3 scripts/ingest_openbb_market_data.py --days 420
```

---

## GitHub Secrets Configuration

The GitHub Actions workflow automatically reads the repository secrets:
- `SUPABASE_URL` or `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_KEY`

The workflow sets `SUPABASE_PROJECT_REF=debdriyzfcwvgrhzzzre` and refuses writes when the configured URL points at a different Supabase project.

---

## On-Demand Execution

You can trigger a manual ingestion run at any time via the GitHub Actions UI:
1. Navigate to **Actions** → **Ingest Market Data (OpenBB & Global Feeds)**.
2. Click **Run workflow**.
3. (Optional) Specify lookback days, a specific metric ID, or enable dry-run.
