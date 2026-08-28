#!/usr/bin/env python3
"""
OpenBB Market Data Ingestion Engine for GraphiQuestor
====================================================
Fetches cross-asset daily market data (DXY, Gold, Brent, VIX, Yields, EM FX, BTC)
and batch upserts observations into Supabase Postgres `metric_observations`.

Supports:
- Multi-provider fallback (OpenBB SDK, yfinance, direct REST)
- Configurable lookback window
- Dry-run mode for local validation
- Structured provenance tagging (source_ref: live_api:openbb:<provider>)
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
import urllib.request
import urllib.parse
import urllib.error

# ── Metric definitions & Provider Symbol Map ───────────────────────────────────

MARKET_BASKET = [
    {
        "metric_id": "DXY_INDEX",
        "name": "US Dollar Index",
        "symbol": "DX-Y.NYB",
        "fallback_symbols": ["UUP"],
        "unit": "index",
    },
    {
        "metric_id": "GOLD_PRICE_USD",
        "name": "Gold Continuous Futures",
        "symbol": "GC=F",
        "fallback_symbols": ["GLD"],
        "unit": "USD/oz",
    },
    {
        "metric_id": "OIL_BRENT_PRICE_USD",
        "name": "Brent Crude Oil Futures",
        "symbol": "BZ=F",
        "fallback_symbols": ["BNO"],
        "unit": "USD/bbl",
    },
    {
        "metric_id": "VIX_INDEX",
        "name": "CBOE Volatility Index",
        "symbol": "^VIX",
        "fallback_symbols": ["VIXY"],
        "unit": "index",
    },
    {
        "metric_id": "UST_10Y_YIELD",
        "name": "US 10-Year Treasury Yield",
        "symbol": "^TNX",
        "fallback_symbols": ["IEF"],
        "unit": "%",
    },
    {
        "metric_id": "BITCOIN_PRICE_USD",
        "name": "Bitcoin USD",
        "symbol": "BTC-USD",
        "fallback_symbols": ["BITO"],
        "unit": "USD",
    },
    {
        "metric_id": "SPX_INDEX",
        "name": "S&P 500 Index",
        "symbol": "^GSPC",
        "fallback_symbols": ["SPY"],
        "unit": "index",
    },
    {
        "metric_id": "USD_INR_RATE",
        "name": "USD/INR Exchange Rate",
        "symbol": "INR=X",
        "fallback_symbols": [],
        "unit": "INR",
    },
    {
        "metric_id": "USD_CNY_RATE",
        "name": "USD/CNY Exchange Rate",
        "symbol": "CNY=X",
        "fallback_symbols": [],
        "unit": "CNY",
    },
    {
        "metric_id": "USD_BRL_RATE",
        "name": "USD/BRL Exchange Rate",
        "symbol": "BRL=X",
        "fallback_symbols": [],
        "unit": "BRL",
    },
    {
        "metric_id": "USD_MXN_RATE",
        "name": "USD/MXN Exchange Rate",
        "symbol": "MXN=X",
        "fallback_symbols": [],
        "unit": "MXN",
    },
]

# ── Data Fetching Providers ───────────────────────────────────────────────────

def fetch_with_openbb(symbol: str, start_date: str) -> Optional[List[Tuple[str, float]]]:
    """Attempt fetching historical daily series using OpenBB SDK."""
    try:
        from openbb import obb  # type: ignore
        res = obb.equity.price.historical(symbol=symbol, start_date=start_date, provider="yfinance")
        df = res.to_df()
        if df.empty or "close" not in df.columns:
            return None
        
        points = []
        for index, row in df.iterrows():
            date_str = str(index)[:10]
            val = float(row["close"])
            if val > 0:
                points.append((date_str, val))
        return sorted(points, key=lambda x: x[0])
    except Exception:
        return None

def fetch_with_yfinance(symbol: str, start_date: str) -> Optional[List[Tuple[str, float]]]:
    """Attempt fetching historical daily series using yfinance library."""
    try:
        import yfinance as yf  # type: ignore
        ticker = yf.Ticker(symbol)
        df = ticker.history(start=start_date, auto_adjust=False)
        if df.empty or "Close" not in df.columns:
            return None
        
        points = []
        for index, row in df.iterrows():
            date_str = index.strftime("%Y-%m-%d")
            val = float(row["Close"])
            if val > 0:
                points.append((date_str, val))
        return sorted(points, key=lambda x: x[0])
    except Exception:
        return None

def fetch_with_direct_query(symbol: str, start_date: str) -> Optional[List[Tuple[str, float]]]:
    """Fallback using direct HTTP query to Yahoo Finance chart API with custom headers."""
    try:
        dt_start = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        period1 = int(dt_start.timestamp())
        period2 = int(datetime.now(timezone.utc).timestamp())
        
        encoded_sym = urllib.parse.quote(symbol)
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{encoded_sym}?interval=1d&period1={period1}&period2={period2}"
        
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)"
            }
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        result = data.get("chart", {}).get("result", [])
        if not result:
            return None
        
        timestamps = result[0].get("timestamp", [])
        quotes = result[0].get("indicators", {}).get("quote", [{}])[0].get("close", [])
        
        points = []
        for ts, close in zip(timestamps, quotes):
            if close is not None and close > 0:
                d_str = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
                points.append((d_str, float(close)))
        
        return sorted(points, key=lambda x: x[0])
    except Exception:
        return None

def fetch_series(symbol: str, start_date: str) -> Tuple[Optional[List[Tuple[str, float]]], str]:
    """Tries OpenBB -> yfinance -> Direct HTTP in order of preference."""
    # 1. OpenBB
    points = fetch_with_openbb(symbol, start_date)
    if points:
        return points, "openbb:yfinance"
    
    # 2. yfinance library
    points = fetch_with_yfinance(symbol, start_date)
    if points:
        return points, "yfinance"
    
    # 3. Direct HTTP
    points = fetch_with_direct_query(symbol, start_date)
    if points:
        return points, "direct:yahoo"
    
    return None, "failed"

# ── Supabase Database Upsert ──────────────────────────────────────────────────

def upsert_to_supabase(
    supabase_url: str,
    service_key: str,
    rows: List[Dict[str, Any]],
    batch_size: int = 100
) -> int:
    """Upsert observations into Supabase Postgres via PostgREST endpoint."""
    clean_url = supabase_url.rstrip("/")
    endpoint = f"{clean_url}/rest/v1/metric_observations?on_conflict=metric_id,as_of_date"
    
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    
    total_upserted = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        data = json.dumps(batch).encode("utf-8")
        req = urllib.request.Request(endpoint, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                if resp.status in (200, 201, 204):
                    total_upserted += len(batch)
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8")
            print(f"Error upserting batch {i//batch_size + 1}: {e.code} {e.reason} - {err_msg}", file=sys.stderr)
            raise e
        except Exception as e:
            print(f"Connection error during batch upsert: {e}", file=sys.stderr)
            raise e
            
    return total_upserted

# ── Main Entrypoint ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="GraphiQuestor Market Data Ingestion via OpenBB")
    parser.add_argument("--days", type=int, default=60, help="Lookback window in days (default: 60)")
    parser.add_argument("--dry-run", action="store_true", help="Fetch data and print summary without writing to database")
    parser.add_argument("--metric", type=str, help="Ingest only a specific metric_id")
    args = parser.parse_args()

    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    service_key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("SUPABASE_KEY")
        or os.environ.get("VITE_SUPABASE_ANON_KEY")
    )

    if not args.dry_run:
        if not supabase_url or not service_key:
            print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_URL / ANON_KEY) must be set.", file=sys.stderr)
            sys.exit(1)

    start_date = (datetime.now(timezone.utc) - timedelta(days=args.days)).strftime("%Y-%m-%d")
    now_iso = datetime.now(timezone.utc).isoformat()
    
    target_basket = MARKET_BASKET
    if args.metric:
        target_basket = [m for m in MARKET_BASKET if m["metric_id"] == args.metric]
        if not target_basket:
            print(f"Unknown metric_id: {args.metric}", file=sys.stderr)
            sys.exit(1)

    print(f"🚀 Ingesting {len(target_basket)} market metrics (lookback: {args.days} days, start_date: {start_date})...")
    
    total_observations = []
    summary_results = []

    for item in target_basket:
        m_id = item["metric_id"]
        sym = item["symbol"]
        points, provider_tag = fetch_series(sym, start_date)
        
        # Fallback to secondary ticker if primary had no data
        if not points and item.get("fallback_symbols"):
            for alt_sym in item["fallback_symbols"]:
                points, provider_tag = fetch_series(alt_sym, start_date)
                if points:
                    provider_tag += f":fallback({alt_sym})"
                    break
        
        if points:
            latest_val = points[-1][1]
            latest_date = points[-1][0]
            print(f"  ✓ {m_id:<22} [{sym:<9}] -> {len(points):>3} rows | Latest: {latest_val:,.2f} ({latest_date}) via {provider_tag}")
            
            source_ref = f"live_api:openbb:{provider_tag}"
            for date_str, val in points:
                total_observations.append({
                    "metric_id": m_id,
                    "as_of_date": date_str,
                    "value": round(val, 6),
                    "last_updated_at": now_iso,
                    "source_ref": source_ref,
                    "is_provisional": False,
                    "provenance": "api_live",
                })
            summary_results.append({
                "metric_id": m_id,
                "status": "success",
                "rows": len(points),
                "latest": latest_val,
                "date": latest_date,
                "provider": provider_tag
            })
        else:
            print(f"  ✗ {m_id:<22} [{sym:<9}] -> FAILED across all providers")
            summary_results.append({
                "metric_id": m_id,
                "status": "failed",
                "rows": 0,
                "latest": None,
                "date": None,
                "provider": "none"
            })

    print(f"\n📊 Total observation rows collected: {len(total_observations)}")

    if args.dry_run:
        print("\n[DRY RUN] Skipped database upsert.")
        return

    if not total_observations:
        print("ERROR: No observations collected. Aborting.", file=sys.stderr)
        sys.exit(1)

    print("💾 Upserting rows into Supabase `metric_observations`...")
    upserted = upsert_to_supabase(supabase_url, service_key, total_observations)
    print(f"✅ Successfully upserted {upserted} rows into Supabase Postgres.")


if __name__ == "__main__":
    main()
