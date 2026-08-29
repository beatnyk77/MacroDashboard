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

CFTC_FINANCIAL_FUTURES_URL_TEMPLATES = [
    "https://www.cftc.gov/files/dea/history/fut_fin_txt_{year}.zip",
    "https://www.cftc.gov/files/dea/history/fin_fut_txt_{year}.zip",
]
CFTC_COMMODITY_FUTURES_URL_TEMPLATES = [
    "https://www.cftc.gov/files/dea/history/fut_disagg_txt_{year}.zip",
    "https://www.cftc.gov/files/dea/history/fut_disagg_txt_hist_{year}.zip",
]
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

def cftc_archive_years(year_count: int) -> List[int]:
    current_year = datetime.now(timezone.utc).year
    safe_count = max(1, year_count)
    return list(range(current_year - safe_count + 1, current_year + 1))

def download_cftc_archives(url_templates: List[str], years: List[int]) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    for year in years:
        year_rows: List[Dict[str, str]] = []
        for url_template in url_templates:
            year_rows = download_cftc_zip_csv(url_template.format(year=year)) or []
            if year_rows:
                break
        rows.extend(year_rows)
    return rows

def parse_number(row: Dict[str, str], *fields: str) -> float:
    for field in fields:
        raw = row.get(field)
        if raw is None:
            continue
        value = raw.strip().replace(",", "")
        if not value:
            continue
        try:
            return float(value)
        except ValueError:
            continue
    return 0.0

def row_contract_code(row: Dict[str, str]) -> str:
    for field in (
        "CFTC_Contract_Market_Code",
        "CFTC Contract Market Code",
        "CFTC_Market_Code",
        "CFTC_Mkt_Code",
    ):
        code = row.get(field)
        if code:
            return code.strip().upper()
    return ""

def parse_financial_record(row: Dict[str, str]) -> Optional[Tuple[str, str, float]]:
    """
    Parse Financial Futures format (Traders in Financial Futures).
    Speculator net = Leveraged Money Long - Leveraged Money Short (or Non-Commercial Long - Short).
    """
    market = row.get("Market_and_Exchange_Names", "").strip()
    date_str = row.get("Report_Date_as_YYYY-MM-DD", "").strip()
    if not date_str and "As_of_Date_in_Form_YYYY-MM-DD" in row:
        date_str = row["As_of_Date_in_Form_YYYY-MM-DD"].strip()
    
    lev_long = parse_number(row, "Lev_Money_Positions_Long_All", "NonComm_Positions_Long_All")
    lev_short = parse_number(row, "Lev_Money_Positions_Short_All", "NonComm_Positions_Short_All")
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
    
    m_long = parse_number(row, "M_Money_Positions_Long_All", "NonComm_Positions_Long_All")
    m_short = parse_number(row, "M_Money_Positions_Short_All", "NonComm_Positions_Short_All")
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

def sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"

def write_observations_sql(rows: List[Dict[str, Any]], output_path: str) -> None:
    columns = [
        "metric_id",
        "as_of_date",
        "value",
        "last_updated_at",
        "source_ref",
        "is_provisional",
        "provenance",
        "metadata",
    ]
    values = []
    for row in rows:
        values.append(
            "("
            + ", ".join(
                [
                    sql_literal(row["metric_id"]),
                    sql_literal(row["as_of_date"]),
                    sql_literal(row["value"]),
                    sql_literal(row["last_updated_at"]),
                    sql_literal(row["source_ref"]),
                    sql_literal(row["is_provisional"]),
                    sql_literal(row["provenance"]),
                    sql_literal(json.dumps(row["metadata"], separators=(",", ":"))) + "::jsonb",
                ]
            )
            + ")"
        )

    statement = f"""
INSERT INTO public.metric_observations ({", ".join(columns)})
VALUES
{",\n".join(values)}
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
  value = EXCLUDED.value,
  last_updated_at = EXCLUDED.last_updated_at,
  source_ref = EXCLUDED.source_ref,
  is_provisional = EXCLUDED.is_provisional,
  provenance = EXCLUDED.provenance,
  metadata = EXCLUDED.metadata;
"""

    with open(output_path, "w", encoding="utf-8") as handle:
        handle.write(statement)

# ── Main Entrypoint ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="CFTC COT Positioning Ingestion")
    parser.add_argument("--dry-run", action="store_true", help="Print summary without writing to database")
    parser.add_argument("--years", type=int, default=3, help="Number of annual CFTC archives to fetch (default: 3)")
    parser.add_argument("--sql-file", type=str, help="Write an idempotent SQL upsert file instead of using PostgREST")
    args = parser.parse_args()

    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    expected_project_ref = os.environ.get("SUPABASE_PROJECT_REF")

    if not args.dry_run and not args.sql_file:
        if not supabase_url or not service_key:
            print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for database writes.", file=sys.stderr)
            print("Anon keys are strictly prohibited for ingestion.", file=sys.stderr)
            sys.exit(1)
        if expected_project_ref and expected_project_ref not in supabase_url:
            print("ERROR: SUPABASE_URL does not match SUPABASE_PROJECT_REF.", file=sys.stderr)
            sys.exit(1)

    archive_years = cftc_archive_years(args.years)
    print(f"Fetching official CFTC Commitments of Traders reports for years: {', '.join(str(y) for y in archive_years)}")
    
    fin_rows = download_cftc_archives(CFTC_FINANCIAL_FUTURES_URL_TEMPLATES, archive_years)
    disagg_rows = download_cftc_archives(CFTC_COMMODITY_FUTURES_URL_TEMPLATES, archive_years)
    
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
            
            contract_code = row_contract_code(r)
            code_matches = contract_code == str(target["cftc_contract_code"]).upper()
            name_matches = not contract_code and any(kw in market.upper() for kw in target["market_name_keywords"])
            if code_matches or name_matches:
                if date_str:
                    extracted_points.append((date_str, net_val))

        if not extracted_points:
            print(f"  FAIL {m_id:<22} -> no matching rows in official CFTC archives")
            failed_targets.append(m_id)
            continue

        tag = f"live_api:cftc:{rep_type}"
        extracted_points = sorted(extracted_points, key=lambda x: x[0])
        latest_val = extracted_points[-1][1]
        latest_date = extracted_points[-1][0]

        print(f"  OK {m_id:<22} -> {len(extracted_points):>2} weeks | Latest: {latest_val:+,.0f} contracts ({latest_date}) via {tag}")

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
                        "archive_years": archive_years,
                        "source_url": CFTC_SOURCE_URL,
                    "observed_at": date_str,
                    "retrieved_at": now_iso,
                    "fallback": False,
                },
            })

    print(f"\nTotal valid COT observation records: {len(total_observations)}")

    if args.dry_run:
        if not total_observations:
            print("ERROR: No valid COT observations parsed in dry-run.", file=sys.stderr)
            sys.exit(1)
        print("[DRY RUN] Finished without writing to database.")
        return

    if not total_observations:
        print("ERROR: No valid COT observations parsed. Aborting without inserting.", file=sys.stderr)
        sys.exit(1)

    if args.sql_file:
        write_observations_sql(total_observations, args.sql_file)
        print(f"Wrote SQL upsert file: {args.sql_file}")
        return

    print("Upserting COT observations into Supabase `metric_observations`...")
    upserted = upsert_to_supabase(supabase_url, service_key, total_observations)
    print(f"Successfully upserted {upserted} rows into Supabase Postgres.")


if __name__ == "__main__":
    main()
