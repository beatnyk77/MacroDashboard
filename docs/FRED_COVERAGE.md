# FRED Series Coverage for Country Metrics

## Overview

The `ingest-country-metrics` Edge Function uses FRED (Federal Reserve Economic Data) API to fetch FX reserves and sovereign yields for 39 target countries.

**Total Coverage**: 38 countries for FX reserves, ~18 for 2Y yields, ~18 for 10Y yields (as of April 2026).

---

## Data Sources

### FX Reserves (`fx_reserves_bn`)
- **FRED Series Pattern**: `TRESEG{ISO2}M052N`
- **Source**: IMF International Financial Statistics (IFS)
- **Units**: Millions USD → converted to Billions USD in ingestion
- **Frequency**: Monthly

### 2Y Sovereign Yield (`yield_2y_pct`)
- **US**: `DGS2` (Daily Treasury Yield Curve)
- **China**: `INTDSRCNM024N` (IFS 2-year)
- **Other Developed Markets**: `IRLTLT02{ISO2}M156N` (IFS Long-Term Interest Rates)
- **Units**: Percent (%)
- **Frequency**: Daily (US) / Monthly (IFS)

### 10Y Sovereign Yield (`yield_10y_pct`)
- **US**: `DGS10`
- **China**: `INTDSRCNM193N` (IFS 10-year)
- **Other**: `IRLTLT03{ISO2}M156N` (IFS Long-Term)
- **Units**: Percent (%)
- **Frequency**: Daily (US) / Monthly (IFS)

---

## Coverage Matrix

| ISO | fx_reserves_bn | yield_2y_pct | yield_10y_pct | Notes |
|-----|---------------|--------------|---------------|-------|
| **US** | ✅ TRESEGUSM052N | ✅ DGS2 | ✅ DGS10 | Complete |
| **GB** | ✅ TRESEGGBM052N | ✅ IRLTLT02GBM156N | ✅ IRLTLT03GBM156N | UK Gilts |
| **DE** | ✅ TRESEGDEM052N | ✅ IRLTLT02DEM156N | ✅ IRLTLT03DEM156N | Germany (Bund) |
| **FR** | ✅ TRESEGFRM052N | ✅ IRLTLT02FRM156N | ✅ IRLTLT03FRM156N | France (OAT) |
| **IT** | ✅ TRESEGITM052N | ⚠️ TBD | ⚠️ TBD | Italy (BTP) |
| **JP** | ✅ TRESEGJPM052N | ✅ IRLTLT02JPM156N | ✅ IRLTLT03JPM156N | Japan (JGB) |
| **CA** | ✅ TRESEGCAM052N | ✅ IRLTLT02CAM156N | ✅ IRLTLT03CAM156N | Canada |
| **AU** | ✅ TRESEGAUM052N | ✅ IRLTLT02AUM156N | ✅ IRLTLT03AUM156N | Australia |
| **BR** | ✅ TRESEGBRM052N | ✅ IRLTLT02BRM156N | ✅ IRLTLT03BRM156N | Brazil |
| **AR** | ✅ TRESEGARM052N | ❌ No data | ❌ No data | Argentina reserves only |
| **MX** | ✅ TRESEGMXM052N | ✅ IRLTLT02MXM156N | ✅ IRLTLT03MXM156N | Mexico |
| **CN** | ✅ TRESEGCNM052N | ✅ INTDSRCNM024N | ✅ INTDSRCNM193N | China |
| **IN** | ✅ TRESEGINM052N | ✅ INTDSRINM024N | ✅ INTDSRINM193N | India |
| **KR** | ✅ TRESEGKRM052N | ✅ IRLTLT02KRM156N | ✅ IRLTLT03KRM156N | South Korea |
| **ID** | ✅ TRESEGIDM052N | ❌ No data | ❌ No data | Indonesia |
| **SA** | ✅ TRESEGSAM052N | ❌ No data | ❌ No data | Saudi Arabia |
| **TR** | ✅ TRESEGTRM052N | ❌ No data | ❌ No data | Turkey |
| **RU** | ✅ TRESEGRUM052N | ✅ IRLTLT02RUM156N | ✅ IRLTLT03RUM156N | Russia (sanctioned) |
| **ZA** | ✅ TRESEGZAM052N | ❌ No data | ❌ No data | South Africa |
| **SG** | ✅ TRESEGSGM052N | ❌ No data | ❌ No data | Singapore |
| **CH** | ✅ TRESEGCHM052N | ❌ No data | ❌ No data | Switzerland |
| **TH** | ✅ TRESEGTHM052N | ❌ No data | ❌ No data | Thailand |
| **MY** | ✅ TRESEGMYM052N | ❌ No data | ❌ No data | Malaysia |
| **AE** | ✅ TRESEGAEM052N | ❌ No data | ❌ No data | UAE |
| **QA** | ✅ TRESEGQAM052N | ❌ No data | ❌ No data | Qatar |
| **IL** | ✅ TRESEGILM052N | ❌ No data | ❌ No data | Israel |
| **CL** | ✅ TRESEGCLM052N | ❌ No data | ❌ No data | Chile |
| **NL** | ✅ TRESEGNLM052N | ❌ No data | ❌ No data | Netherlands |
| **ES** | ✅ TRESEGESM052N | ✅ IRLTLT02ESM156N | ✅ IRLTLT03ESM156N | Spain |
| **VN** | ✅ TRESEGVNM052N | ❌ No data | ❌ No data | Vietnam |
| **PH** | ✅ TRESEGPHM052N | ❌ No data | ❌ No data | Philippines |
| **EG** | ✅ TRESEGEGM052N | ❌ No data | ❌ No data | Egypt |
| **NG** | ✅ TRESEGNGM052N | ❌ No data | ❌ No data | Nigeria |
| **KW** | ✅ TRESEGKWM052N | ❌ No data | ❌ No data | Kuwait |
| **NO** | ✅ TRESEGNOM052N | ❌ No data | ❌ No data | Norway |
| **SE** | ✅ TRESEGSEM052N | ❌ No data | ❌ No data | Sweden |
| **PL** | ✅ TRESEGPLM052N | ❌ No data | ❌ No data | Poland |
| **GR** | ✅ TRESEGGRM052N | ❌ No data | ❌ No data | Greece |
| **IE** | ✅ TRESEGIEM052N | ❌ No data | ❌ No data | Ireland |

**Legend**:
- ✅ Available
- ❌ Not available / Series not found
- ⚠️ Partial / May need verification

---

## Total Counts

- **FX Reserves coverage**: 38 / 39 countries (all except possibly one)
- **2Y Yield coverage**: 18 countries (G7 + major EMs with IFS coverage)
- **10Y Yield coverage**: 18 countries (same set)

Missing yield data largely due to:
- IFS not reporting long-term rates for many EMs
- Country-specific series may exist but not discovered
- Some countries have only one maturity reported

---

## Naming Conventions Reference

| Pattern | Description | Example |
|---------|-------------|---------|
| `TRESEG{ISO2}M052N` | Total reserves excluding gold (IFS) | US → `TRESEGUSM052N` |
| `DGS{months}` | US Treasury yields (constant maturity) | 10Y → `DGS10` |
| `INTDSR{ISO2}M{months}N` | IFS Government Bond Yields (China, India) | CN 10Y → `INTDSRCNM193N` |
| `IRLTLT0{2|3}{ISO2}M156N` | IFS Long-Term Interest Rates (2Y/10Y) | DE 10Y → `IRLTLT03DEM156N` |

---

## Rate Limiting

The Edge Function batches FRED requests with a 1-second pause after every 10 calls to respect the free API limit of ~50 requests/minute.

Configuration:
```typescript
const FRED_BATCH_SIZE = 10;
const PAUSE_MS = 1000;
```

---

## Confidence Scores

All FRED-sourced metrics are assigned `confidence = 0.9` (live API, recent data).

---

## Error Handling

- Per-country failures are logged as warnings, not fatal
- Missing series simply skipped (no data row inserted)
- Logs report coverage summary at completion

---

## Updating Coverage

To expand yield coverage:
1. Search FRED for "Long-Term Interest Rate {Country}" or "Government Bond Yield {Country} {Tenor}"
2. Verify series ID and add to `FRED_SERIES_MAP` in `ingest-country-metrics/index.ts`
3. Update this matrix

For FX Reserves, follow the `TRESEG{ISO2}M052N` pattern. Most IFS-reporting countries have this series.

---

## Technical Notes

- Series IDs are case-sensitive
- FRED data may have a 1-2 month lag for some countries
- Some series may be discontinued; check `observation_start` and `observation_end` metadata
- Unit conversions applied in code (FX reserves: Millions → Billions)

---

## References

- [FRED API Documentation](https://fred.stlouisfed.org/docs/api/fred/)
- [IFS Metadata Search](https://data.imf.org/?sk=4C514DCF-BBBA-49A1-869E-3403157F4CC7)
- Existing codebase usage: `ingest-yield-curves/index.ts`, `ingest-pboc-liquidity/index.ts`
