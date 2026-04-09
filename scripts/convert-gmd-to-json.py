#!/usr/bin/env python3
"""Convert Global-Macro-Database Stata .dta → per-country JSON snapshot.

Reads: Global-Macro-Database/data/final/data_final.dta
Writes: public/data/gmd/40-countries-latest.json

This script extracts 12 macro fundamentals for the top 40 SEO target countries.
Data source: Global-Macro-Database (https://github.com/beatnyk77/Global-Macro-Database)
"""
import pandas as pd
import json
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
# Path layout:
#   /Users/kartikaysharma/Desktop/Projects/
#     ├── Global-Macro-Database/    ← GMD repo
#     └── Vibecode /Macro/MacroDashboard/  ← this project
PROJECT_ROOT = Path(__file__).resolve().parent.parent  # .../MacroDashboard
# MacroDashboard → Macro → Vibecode  → Projects (3 ups)
GMD_DTA = PROJECT_ROOT.parent.parent.parent / "Global-Macro-Database" / "data" / "final" / "data_final.dta"
OUTPUT = PROJECT_ROOT / "public" / "data" / "gmd" / "40-countries-latest.json"

# ISO2 -> ISO3 mapping for target 40 countries
ISO2_TO_ISO3 = {
    'US': 'USA', 'GB': 'GBR', 'DE': 'DEU', 'FR': 'FRA', 'IT': 'ITA', 'JP': 'JPN',
    'CA': 'CAN', 'AU': 'AUS', 'BR': 'BRA', 'AR': 'ARG', 'MX': 'MEX', 'CN': 'CHN',
    'IN': 'IND', 'KR': 'KOR', 'ID': 'IDN', 'SA': 'SAU', 'TR': 'TUR', 'RU': 'RUS',
    'ZA': 'ZAF', 'SG': 'SGP', 'CH': 'CHE', 'TH': 'THA', 'MY': 'MYS', 'AE': 'ARE',
    'QA': 'QAT', 'IL': 'ISR', 'CL': 'CHL', 'NL': 'NLD', 'ES': 'ESP', 'VN': 'VNM',
    'PH': 'PHL', 'EG': 'EGY', 'NG': 'NGA', 'KW': 'KWT', 'NO': 'NOR', 'SE': 'SWE',
    'PL': 'POL', 'GR': 'GRC', 'IE': 'IRL'
}
TARGET_ISO3 = set(ISO2_TO_ISO3.values())

# Use 2024 as the snapshot year (latest full-year actuals across most countries)
SNAPSHOT_YEAR = 2024

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
def s(v, scale=1, digits=2, default=None):
    """Safely round a numeric value after scaling. Returns None if NaN."""
    if pd.isna(v):
        return default
    try:
        return float(round(float(v) * scale, digits))
    except (TypeError, ValueError):
        return default

# ---------------------------------------------------------------------------
# Load GMD data
# ---------------------------------------------------------------------------
print(f"📖 Reading {GMD_DTA} …")
if not GMD_DTA.exists():
    print(f"❌ File not found: {GMD_DTA}")
    print("   Clone first: git clone https://github.com/beatnyk77/Global-Macro-Database.git")
    exit(1)

df = pd.read_stata(GMD_DTA, convert_categoricals=False)
print(f"   Columns: {len(df.columns)} cols, Shape: {df.shape}")

# Keep only target countries
df_target = df[df['ISO3'].isin(TARGET_ISO3)].copy()
print(f"   Target countries in dataset: {df_target['ISO3'].nunique()} / {len(TARGET_ISO3)}")

# Ensure numeric types
numeric_cols = ['nGDP', 'rGDP', 'rGDP_USD', 'rGDP_pc', 'pop', 'USDfx', 'infl', 'unemp',
                'cbrate', 'CA_GDP', 'exports_GDP', 'imports_GDP', 'govdebt_GDP', 'govdef_GDP',
                'govexp_GDP', 'govrev_GDP', 'govtax_GDP']
for col in numeric_cols:
    if col in df_target.columns:
        df_target[col] = pd.to_numeric(df_target[col], errors='coerce')

# ---------------------------------------------------------------------------
# Per-country extraction
# ---------------------------------------------------------------------------
result = {}
for iso2, iso3 in ISO2_TO_ISO3.items():
    sub = df_target[df_target['ISO3'] == iso3]
    if sub.empty:
        print(f"  ⚠️  {iso2}: no records in dataset")
        continue

    # Filter to actual/historical years up to SNAPSHOT_YEAR
    sub_hist = sub[sub['year'] <= SNAPSHOT_YEAR].sort_values('year', ascending=False)
    if sub_hist.empty:
        sub_hist = sub.sort_values('year', ascending=False)

    latest = sub_hist.iloc[0]
    latest_year = int(latest['year'])

    # Find previous year row for rGDP growth calc
    prev = sub_hist[sub_hist['year'] == latest_year - 1]
    prev_row = prev.iloc[0] if not prev.empty else None

    metrics = {}

    # ---- Direct metrics (rounded) ----
    metrics['population_mn']            = s(latest['pop'], 1, 2)
    metrics['cpi_yoy_pct']              = s(latest['infl'], 1, 2)
    metrics['unemployment_pct']         = s(latest['unemp'], 1, 2)
    metrics['central_bank_rate_pct']    = s(latest['cbrate'], 1, 2)
    metrics['ca_gdp_pct']               = s(latest['CA_GDP'], 1, 2)
    metrics['exports_gdp_pct']          = s(latest['exports_GDP'], 1, 2)
    metrics['imports_gdp_pct']          = s(latest['imports_GDP'], 1, 2)
    metrics['gov_debt_gdp_pct']         = s(latest.get('govdebt_GDP'), 1, 2)
    metrics['budget_deficit_gdp_pct']   = s(latest.get('govdef_GDP'), 1, 2)

    # ---- Derived: GDP (nominal USD billions) ----
    nGDP = latest['nGDP']
    USDfx = latest['USDfx']
    if pd.notna(nGDP):
        if pd.isna(USDfx) or USDfx == 0:
            USDfx = 1.0  # base currency assumption
        gdp_usd_millions = nGDP / USDfx
        metrics['gdp_usd_bn'] = float(round(gdp_usd_millions / 1000, 2))

    # ---- Derived: GDP per capita (USD) ----
    pop = latest['pop']
    if pd.notna(pop) and pop > 0:
        # Prefer real GDP USD (rGDP_USD) if available
        if pd.notna(latest.get('rGDP_USD')):
            per_cap = latest['rGDP_USD'] / pop
            metrics['gdp_per_capita_usd'] = float(round(per_cap, 0))
        elif 'gdp_usd_bn' in metrics:
            # Convert billions -> per capita: (gdp_usd_bn * 1e9) / (pop * 1e6) = gdp_usd_bn * 1000 / pop
            per_cap = metrics['gdp_usd_bn'] * 1000 / pop
            metrics['gdp_per_capita_usd'] = float(round(per_cap, 0))

    # ---- Derived: Real GDP growth YoY % ----
    if prev_row is not None and pd.notna(latest['rGDP']) and pd.notna(prev_row['rGDP']) and prev_row['rGDP'] != 0:
        growth = (latest['rGDP'] / prev_row['rGDP'] - 1) * 100
        metrics['gdp_yoy_pct'] = float(round(growth, 2))

    # Filter out None values
    metrics = {k: v for k, v in metrics.items() if v is not None}
    if metrics:
        result[iso2] = metrics
        print(f"  ✅ {iso2} ({latest_year}): {len(metrics)}/{12} metrics | keys: {sorted(metrics.keys())}")
    else:
        print(f"  ❌ {iso2}: zero metrics")

# ---------------------------------------------------------------------------
# Write output
# ---------------------------------------------------------------------------
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
output_obj = {
    "source": "Global-Macro-Database",
    "source_url": "https://github.com/beatnyk77/Global-Macro-Database",
    "snapshot_year": SNAPSHOT_YEAR,
    "retrieved_at": pd.Timestamp.now().isoformat(),
    "countries": result
}
OUTPUT.write_text(json.dumps(output_obj, indent=2))
print(f"\n✅ Wrote {len(result)} countries → {OUTPUT}")
print(f"   File size: {OUTPUT.stat().st_size/1024:.1f} KB")

# Sample sanity check
if 'US' in result:
    us = result['US']
    print(f"\nUS sample:")
    for k, v in sorted(us.items()):
        print(f"  {k}: {v}")
