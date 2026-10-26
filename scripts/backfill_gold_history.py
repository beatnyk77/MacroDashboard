#!/usr/bin/env python3
"""
Gold Price History Backfill for GraphiQuestor
=============================================
Fills months missing from `GOLD_PRICE_USD` (and the derived `RATIO_M2_GOLD`) with the
World Bank Commodity Price Data ("Pink Sheet") monthly gold price — London afternoon
fixing, average of daily rates, USD per troy ounce. Licensed CC BY 4.0.

The stored series has no observations from Jul 1969 to Apr 1983; this closes that gap.

Hardening Rules:
- Validates the source against stored months on both sides of the window before writing;
  aborts if the median absolute difference exceeds --max-median-diff-pct
- Inserts only months with no stored observation (resolution=ignore-duplicates); never
  overwrites existing rows
- RATIO_M2_GOLD rows are written only if the stored ratio is confirmed to equal
  US_M2 / gold on overlapping months
- Strictly requires SUPABASE_SERVICE_ROLE_KEY for writes (reads work with the anon key)
- Records source URL, license, retrieval time, and validation statistics in metadata
"""

import argparse
import io
import json
import os
import re
import statistics
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Dict, List, Optional

COMMODITY_PAGE = "https://www.worldbank.org/en/research/commodity-markets"
# The workbook URL carries a hash that changes on each monthly release; this is the
# Oct 2026 release, used only if discovery from COMMODITY_PAGE fails.
FALLBACK_XLSX_URL = (
    "https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/"
    "related/CMO-Historical-Data-Monthly.xlsx"
)
LICENSE = "CC BY 4.0 (https://datacatalog.worldbank.org/public-licenses#cc-by)"
GOLD_HEADER = "Gold"
UNIT_HEADER = "($/troy oz)"
USER_AGENT = "GraphiQuestor-backfill/1.0 (+https://graphiquestor.com)"


def http_get(url: str, headers: Optional[Dict[str, str]] = None, timeout: int = 60) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def discover_xlsx_url() -> str:
    try:
        html = http_get(COMMODITY_PAGE).decode("utf-8", "ignore")
        match = re.search(r'https://thedocs\.worldbank\.org/[^"\']+CMO-Historical-Data-Monthly\.xlsx', html)
        if match:
            return match.group(0)
        print("WARN: monthly workbook link not found on commodity page; using fallback URL.", file=sys.stderr)
    except Exception as e:  # noqa: BLE001 — discovery is best-effort
        print(f"WARN: could not read commodity page ({e}); using fallback URL.", file=sys.stderr)
    return FALLBACK_XLSX_URL


def load_world_bank_gold(xlsx_bytes: bytes) -> Dict[str, float]:
    """Return {YYYY-MM-01: USD/oz} from the 'Monthly Prices' sheet."""
    import openpyxl  # type: ignore

    wb = openpyxl.load_workbook(io.BytesIO(xlsx_bytes), read_only=True, data_only=True)
    ws = wb["Monthly Prices"]
    rows = list(ws.iter_rows(values_only=True))
    gold_col = None
    for i, row in enumerate(rows[:10]):
        for j, cell in enumerate(row):
            if cell == GOLD_HEADER and i + 1 < len(rows) and rows[i + 1][j] == UNIT_HEADER:
                gold_col = j
                break
        if gold_col is not None:
            break
    if gold_col is None:
        raise RuntimeError("Gold ($/troy oz) column not found in World Bank workbook — layout changed?")

    gold: Dict[str, float] = {}
    for row in rows:
        key, value = row[0], row[gold_col]
        if isinstance(key, str) and re.fullmatch(r"\d{4}M\d{2}", key) and isinstance(value, (int, float)):
            gold[f"{key[:4]}-{key[5:7]}-01"] = float(value)
    if len(gold) < 600:
        raise RuntimeError(f"Only {len(gold)} monthly gold prices parsed — refusing to continue.")
    return gold


def fetch_series(base_url: str, key: str, metric_id: str) -> List[Dict]:
    out: List[Dict] = []
    endpoint = (
        f"{base_url.rstrip('/')}/rest/v1/metric_observations"
        f"?metric_id=eq.{metric_id}&select=as_of_date,value&order=as_of_date.asc"
    )
    for start in range(0, 100_000, 1000):
        page = json.loads(
            http_get(endpoint, {"apikey": key, "Authorization": f"Bearer {key}", "Range": f"{start}-{start + 999}"})
        )
        out.extend(page)
        if len(page) < 1000:
            break
    return out


def monthly_means(rows: List[Dict]) -> Dict[str, float]:
    by_month: Dict[str, List[float]] = {}
    for r in rows:
        by_month.setdefault(r["as_of_date"][:7] + "-01", []).append(float(r["value"]))
    return {m: statistics.mean(v) for m, v in by_month.items()}


def median_abs_diff_pct(a: Dict[str, float], b: Dict[str, float], months: List[str]) -> Optional[float]:
    diffs = [abs(a[m] / b[m] - 1) * 100 for m in months if m in a and m in b and b[m]]
    return statistics.median(diffs) if diffs else None


def upsert_insert_only(base_url: str, service_key: str, rows: List[Dict], batch_size: int = 100) -> int:
    endpoint = f"{base_url.rstrip('/')}/rest/v1/metric_observations?on_conflict=metric_id,as_of_date"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        # Never overwrite an existing observation.
        "Prefer": "resolution=ignore-duplicates,return=minimal",
        "User-Agent": USER_AGENT,
    }
    written = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        req = urllib.request.Request(endpoint, data=json.dumps(batch).encode(), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                if resp.status in (200, 201, 204):
                    written += len(batch)
        except urllib.error.HTTPError as e:
            print(f"Error writing batch {i // batch_size + 1}: {e.code} {e.reason} - {e.read().decode()}", file=sys.stderr)
            raise
    return written


def main() -> None:
    parser = argparse.ArgumentParser(description="Backfill missing gold price months from the World Bank Pink Sheet")
    parser.add_argument("--from-month", default="1960-01", help="First month eligible for backfill (YYYY-MM)")
    parser.add_argument("--to-month", default="1989-12", help="Last month eligible for backfill (YYYY-MM)")
    parser.add_argument("--max-median-diff-pct", type=float, default=1.5, help="Abort if source and stored data differ by more")
    parser.add_argument("--xlsx-url", help="Override the World Bank workbook URL")
    parser.add_argument("--dry-run", action="store_true", help="Validate and report without writing")
    args = parser.parse_args()

    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    read_key = service_key or os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    expected_ref = os.environ.get("SUPABASE_PROJECT_REF")
    if not supabase_url or not read_key:
        sys.exit("ERROR: SUPABASE_URL and a Supabase key are required.")
    if not args.dry_run:
        if not service_key:
            sys.exit("ERROR: SUPABASE_SERVICE_ROLE_KEY is required for database writes.")
        if expected_ref and expected_ref not in supabase_url:
            sys.exit("ERROR: SUPABASE_URL does not match SUPABASE_PROJECT_REF.")

    lo, hi = f"{args.from_month}-01", f"{args.to_month}-01"
    xlsx_url = args.xlsx_url or discover_xlsx_url()
    retrieved_at = datetime.now(timezone.utc).isoformat()
    print(f"Source: {xlsx_url}")
    wb_gold = load_world_bank_gold(http_get(xlsx_url, timeout=120))
    print(f"World Bank monthly gold: {len(wb_gold)} months, {min(wb_gold)[:7]} to {max(wb_gold)[:7]}")

    stored_gold = monthly_means(fetch_series(supabase_url, read_key, "GOLD_PRICE_USD"))
    missing = [m for m in sorted(wb_gold) if lo <= m <= hi and m not in stored_gold]
    if not missing:
        print("No missing gold months in the window — nothing to do.")
        return
    print(f"Missing gold months in window: {len(missing)} ({missing[0][:7]} to {missing[-1][:7]})")

    # Validate on stored months adjacent to the gap (5 years each side) and overall.
    before = [m for m in stored_gold if m < missing[0] and m >= f"{int(missing[0][:4]) - 5}{missing[0][4:]}"]
    after = [m for m in stored_gold if m > missing[-1] and m <= f"{int(missing[-1][:4]) + 5}{missing[-1][4:]}"]
    checks = {"before_gap": before, "after_gap": after}
    stats = {}
    for name, months in checks.items():
        diff = median_abs_diff_pct(wb_gold, stored_gold, months)
        stats[name] = {"months": len([m for m in months if m in wb_gold]), "median_abs_diff_pct": None if diff is None else round(diff, 3)}
        print(f"  Validation {name}: {stats[name]['months']} months, median |diff| {diff if diff is None else round(diff, 3)}%")
        if diff is None or diff > args.max_median_diff_pct:
            sys.exit(f"ERROR: validation {name} failed (median |diff| {diff}%) — source does not match stored series.")

    gold_rows = [
        {
            "metric_id": "GOLD_PRICE_USD",
            "as_of_date": m,
            "value": round(wb_gold[m], 6),
            "last_updated_at": retrieved_at,
            "source_ref": "world_bank:cmo_pink_sheet",
            "is_provisional": False,
            "provenance": "verified_historical",
            "metadata": {
                "provider": "World Bank Commodity Price Data (Pink Sheet)",
                "source_url": xlsx_url,
                "license": LICENSE,
                "definition": "London afternoon fixing, monthly average of daily rates, USD per troy ounce",
                "observed_at": m,
                "retrieved_at": retrieved_at,
                "frequency": "monthly",
                "validation": stats,
            },
        }
        for m in missing
    ]

    # RATIO_M2_GOLD = US_M2 ($B) / gold ($/oz) — confirm on stored overlap before deriving.
    ratio_rows: List[Dict] = []
    m2 = monthly_means(fetch_series(supabase_url, read_key, "US_M2"))
    stored_ratio = monthly_means(fetch_series(supabase_url, read_key, "RATIO_M2_GOLD"))
    implied = {m: m2[m] / stored_gold[m] for m in stored_ratio if m in m2 and m in stored_gold and stored_gold[m]}
    ratio_diff = median_abs_diff_pct(stored_ratio, implied, sorted(implied))
    print(f"  RATIO_M2_GOLD formula check: {len(implied)} months, median |diff| vs US_M2/gold {ratio_diff if ratio_diff is None else round(ratio_diff, 4)}%")
    if ratio_diff is not None and ratio_diff <= 0.5:
        for m in missing:
            if m in m2 and m not in stored_ratio:
                ratio_rows.append({
                    "metric_id": "RATIO_M2_GOLD",
                    "as_of_date": m,
                    "value": round(m2[m] / wb_gold[m], 10),
                    "last_updated_at": retrieved_at,
                    "source_ref": "derived:US_M2/GOLD_PRICE_USD",
                    "is_provisional": False,
                    "provenance": "verified_historical",
                    "metadata": {
                        "formula": "US_M2 / GOLD_PRICE_USD",
                        "inputs": {"US_M2": m2[m], "GOLD_PRICE_USD": wb_gold[m]},
                        "gold_source": "World Bank Commodity Price Data (Pink Sheet)",
                        "observed_at": m,
                        "retrieved_at": retrieved_at,
                        "formula_check_median_abs_diff_pct": round(ratio_diff, 4),
                    },
                })
    else:
        print("WARN: stored RATIO_M2_GOLD does not match US_M2/gold — skipping ratio backfill.", file=sys.stderr)

    for m in [missing[0], missing[len(missing) // 2], missing[-1]]:
        print(f"  sample {m[:7]}: gold {wb_gold[m]:,.2f}")
    print(f"Prepared {len(gold_rows)} GOLD_PRICE_USD rows and {len(ratio_rows)} RATIO_M2_GOLD rows.")

    if args.dry_run:
        print("[DRY RUN] Validation passed; nothing written.")
        return

    written = upsert_insert_only(supabase_url, service_key, gold_rows + ratio_rows)
    print(f"Inserted {written} rows into metric_observations (existing rows untouched).")


if __name__ == "__main__":
    main()
