#!/usr/bin/env python3
"""
CFTC Commitments of Traders (COT) Ingestion Engine for GraphiQuestor
====================================================================
Downloads official CFTC Financial & Disaggregated Futures weekly reports,
calculates net speculative positions, and upserts into Supabase `metric_observations`.

Hardening Rules:
- Never generates synthetic or fallback placeholder data
- Strictly requires SUPABASE_SERVICE_ROLE_KEY (no anon-key fallback for write)
- Stores metadata: provider, source_url, observed_at, retrieved_at, fallback
- Normalizes all dates to UTC calendar dates (YYYY-MM-DD)
"""

import argparse
import csv
import io
import json
import os
import sys
import urllib.request
import zipfile
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

# ── CFTC Report Sources & Contract Matchers ────────────────────────────────────

CFTC_FINANCIAL_FUTURES_URL = "https://www.cftc.gov/files/dea/history/fin_fut_txt_2026.zip"
CFTC_COMMODITY_FUTURES_URL = "https://www.cftc.gov/files/dea/history/fut_disagg_txt_2026.zip"
CFTC_SOURCE_URL = "https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm"

CONTRACT_TARGETS = [
    {
        "metric_id": "COT_UST_10Y_NET_SPEC",
        "name": "10Y Treasury Speculator Net Position",
        "market_name_keywords": ["10-YEAR U.S. TREASURY NOTES", "10 YEAR U.S. TREASURY NOTES"],
        "cftc_contract_code": "043602",
        "report_type": "financial",
        "unit": "contracts",
    },
    {
        "metric_id": "COT_GOLD_NET_SPEC",
        "name": "Gold COMEX Speculator Net Position",
        "market_name_keywords": ["GOLD - COMMODITY EXCHANGE INC."],
        "cftc_contract_code": "088691",
        "report_type": "disaggregated",
        "unit": "contracts",
    },
    {
        "metric_id": "COT_OIL_WTI_NET_SPEC",
        "name": "WTI Crude Speculator Net Position",
        "market_name_keywords": ["CRUDE OIL, LIGHT SWEET - NEW YORK MERCANTILE EXCHANGE"],
        "cftc_contract_code": "067651",
        "report_type": "disaggregated",
        "unit": "contracts",
    },
    {
        "metric_id": "COT_DXY_NET_SPEC",
        "name": "US Dollar Index Net Spec Position",
        "market_name_keywords": ["U.S. DOLLAR INDEX - ICE FUTURES U.S."],
        "cftc_contract_code": "098662",
        "report_type": "financial",
        "unit": "contracts",
    },
    {
        "metric_id": "COT_SP500_NET_SPEC",
        "name": "E-Mini S&P 500 Net Spec Position",
        "market_name_keywords": ["E-MINI S&P 500 - CHICAGO MERCANTILE EXCHANGE", "E-MINI S&P 500 STOCK INDEX"],
        "cftc_contract_code": "13874A",
        "report_type": "financial",
        "unit": "contracts",
    },
]

# ── CFTC Fetchers ─────────────────────────────────────────────────────────────

def download_cftc_zip_csv(url: str) -> Optional[List[Dict[str, str]]]:
    """Download and extract an official CFTC zip file containing a CSV/TXT report."""
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
            }
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            zip_bytes = resp.read()
        
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            txt_filenames = [f for f in z.namelist() if f.endswith(".txt") or f.endswith(".csv")]
            if not txt_filenames:
                return None
            
            with z.open(txt_filenames[0]) as f:
                content = f.read().decode("latin1")
                reader = csv.DictReader(io.StringIO(content))
                rows = [dict(r) for r in reader]
                return rows
    except Exception as e:
        print(f"Warning: Failed downloading/parsing {url}: {e}", file=sys.stderr)
        return None

def parse_financial_record(row: Dict[str, str]) -> Optional[Tuple[str, str, float]]:
    """
    Parse Financial Futures format (Traders in Financial Futures).
    Speculator net = Leveraged Money Long - Leveraged Money Short (or Non-Commercial Long - Short).
    """
    market = row.get("Market_and_Exchange_Names", "").strip()
    date_str = row.get("Report_Date_as_YYYY-MM-DD", "").strip()
    if not date_str and "As_of_Date_in_Form_YYYY-MM-DD" in row:
        date_str = row["As_of_Date_in_Form_YYYY-MM-DD"].strip()
    
    lev_long = float(row.get("Lev_Money_Positions_Long_All", 0) or row.get("NonComm_Positions_Long_All", 0) or 0)
    lev_short = float(row.get("Lev_Money_Positions_Short_All", 0) or row.get("NonComm_Positions_Short_All", 0) or 0)
    net_spec = lev_long - lev_short
    
    return market, date_str, net_spec

def parse_disaggregated_record(row: Dict[str, str]) -> Optional[Tuple[str, str, float]]:
    """
    Parse Disaggregated Commodities format.
    Speculator net = Managed Money Long - Managed Money Short.
    """
    market = row.get("Market_and_Exchange_Names", "").strip()
    date_str = row.get("Report_Date_as_YYYY-MM-DD", "").strip()
    if not date_str and "As_of_Date_in_Form_YYYY-MM-DD" in row:
        date_str = row["As_of_Date_in_Form_YYYY-MM-DD"].strip()
    
    m_long = float(row.get("M_Money_Positions_Long_All", 0) or row.get("NonComm_Positions_Long_All", 0) or 0)
    m_short = float(row.get("M_Money_Positions_Short_All", 0) or row.get("NonComm_Positions_Short_All", 0) or 0)
    net_spec = m_long - m_short
    
    return market, date_str, net_spec

# ── Supabase Batch Upsert ─────────────────────────────────────────────────────

def upsert_to_supabase(
    supabase_url: str,
    service_key: str,
    rows: List[Dict[str, Any]],
    batch_size: int = 100
) -> int:
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
        except Exception as e:
            print(f"Error upserting batch to Supabase: {e}", file=sys.stderr)
            raise e
            
    return total_upserted

# ── Main Entrypoint ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="CFTC COT Positioning Ingestion")
    parser.add_argument("--dry-run", action="store_true", help="Print summary without writing to database")
    args = parser.parse_args()

    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not args.dry_run:
        if not supabase_url or not service_key:
            print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for database writes.", file=sys.stderr)
            print("Anon keys are strictly prohibited for ingestion.", file=sys.stderr)
            sys.exit(1)

    print("🚀 Fetching official CFTC Commitments of Traders reports...")
    
    fin_rows = download_cftc_zip_csv(CFTC_FINANCIAL_FUTURES_URL) or []
    disagg_rows = download_cftc_zip_csv(CFTC_COMMODITY_FUTURES_URL) or []
    
    if not fin_rows and not disagg_rows:
        print("ERROR: Could not download or parse CFTC reports from official source.", file=sys.stderr)
        if not args.dry_run:
            sys.exit(1)

    total_observations = []
    failed_targets = []
    now_iso = datetime.now(timezone.utc).isoformat()

    for target in CONTRACT_TARGETS:
        m_id = target["metric_id"]
        rep_type = target["report_type"]
        src_rows = fin_rows if rep_type == "financial" else disagg_rows
        
        extracted_points = []
        for r in src_rows:
            parsed = parse_financial_record(r) if rep_type == "financial" else parse_disaggregated_record(r)
            if not parsed:
                continue
            market, date_str, net_val = parsed
            
            if any(kw in market.upper() for kw in target["market_name_keywords"]):
                if date_str:
                    extracted_points.append((date_str, net_val))

        if not extracted_points:
            print(f"  ✗ {m_id:<22} -> No matching rows in CFTC report (skipping, zero synthetic fallback)")
            failed_targets.append(m_id)
            continue

        tag = f"live_api:cftc:{rep_type}"
        extracted_points = sorted(extracted_points, key=lambda x: x[0])
        latest_val = extracted_points[-1][1]
        latest_date = extracted_points[-1][0]

        print(f"  ✓ {m_id:<22} -> {len(extracted_points):>2} weeks | Latest: {latest_val:+,.0f} contracts ({latest_date}) via {tag}")

        for date_str, net_val in extracted_points:
            total_observations.append({
                "metric_id": m_id,
                "as_of_date": date_str,
                "value": round(net_val, 2),
                "last_updated_at": now_iso,
                "source_ref": tag,
                "is_provisional": False,
                "provenance": "api_live",
                "metadata": {
                    "provider": "cftc",
                    "report_type": rep_type,
                    "contract_code": target["cftc_contract_code"],
                    "source_url": CFTC_SOURCE_URL,
                    "observed_at": date_str,
                    "retrieved_at": now_iso,
                    "fallback": False,
                },
            })

    print(f"\n📊 Total valid COT observation records: {len(total_observations)}")

    if args.dry_run:
        print("[DRY RUN] Finished without writing to database.")
        return

    if not total_observations:
        print("ERROR: No valid COT observations parsed. Aborting without inserting.", file=sys.stderr)
        sys.exit(1)

    print("💾 Upserting COT observations into Supabase `metric_observations`...")
    upserted = upsert_to_supabase(supabase_url, service_key, total_observations)
    print(f"✅ Successfully upserted {upserted} rows into Supabase Postgres.")


if __name__ == "__main__":
    main()
