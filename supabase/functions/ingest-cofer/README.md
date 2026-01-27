# IMF COFER Ingestion Function

Supabase Edge Function to ingest IMF COFER (Currency Composition of Official Foreign Exchange Reserves) data.

## Purpose

Tracks global reserve currency composition to monitor de-dollarization trends:
- USD share in global reserves
- EUR, RMB, and other currency shares
- Gold holdings as % of total reserves

## Data Source

**IMF COFER Database**: https://data.imf.org/?sk=E6A5F467-C14B-4AA8-9F6D-5A09EC4E62A4

- **Frequency**: Quarterly
- **Lag**: ~1 quarter
- **Coverage**: Global aggregate (allocated reserves only)

## Metrics Ingested

| Metric ID | Description | Unit |
|-----------|-------------|------|
| `GLOBAL_USD_SHARE_PCT` | USD as % of allocated reserves | % |
| `GLOBAL_EUR_SHARE_PCT` | EUR as % of allocated reserves | % |
| `GLOBAL_RMB_SHARE_PCT` | RMB as % of allocated reserves | % |
| `GLOBAL_OTHER_SHARE_PCT` | Other currencies % | % |
| `GLOBAL_GOLD_SHARE_PCT` | Gold as % of total reserves | % |
| `GLOBAL_GOLD_HOLDINGS_USD` | Total gold holdings | USD bn |

## Usage

### Manual Trigger

```bash
curl -X POST 'https://<project-ref>.supabase.co/functions/v1/ingest-cofer' \
  -H 'Authorization: Bearer <anon-key>' \
  -H 'Content-Type: application/json'
```

### Automated Schedule

Runs monthly via `pg_cron` (1st of each month at 02:00 UTC).

## Implementation Notes

### Current Implementation
Uses **mock data** for demonstration. In production, replace with:

1. **IMF Data API** (if available)
2. **CSV Download** from IMF COFER portal
3. **Web scraping** (last resort)

### Production Integration Steps

1. Identify IMF COFER API endpoint or CSV download URL
2. Update `fetchWithRetry` call to actual data source
3. Parse CSV/JSON response format
4. Map to metric IDs
5. Test with historical data

### Data Format

Expected quarterly data format:
```typescript
{
  quarter: '2024Q3',
  usd_share: 58.41,
  eur_share: 19.98,
  rmb_share: 2.76,
  other_share: 18.85,
  gold_share: 15.2,
  gold_usd: 1234.5
}
```

## Response Format

```json
{
  "total_attempted": 6,
  "success_count": 6,
  "error_count": 0,
  "details": [
    {
      "metric": "GLOBAL_USD_SHARE_PCT",
      "status": "success",
      "inserted": 4,
      "latest_date": "2024-09-30"
    }
  ]
}
```

## Verification

```sql
-- Check latest observations
SELECT * FROM vw_dedollarization;

-- Verify staleness
SELECT metric_id, staleness_flag, days_since_update 
FROM vw_dedollarization 
WHERE staleness_flag != 'fresh';

-- View all COFER data
SELECT metric_id, as_of_date, value 
FROM metric_observations 
WHERE metric_id LIKE 'GLOBAL_%' 
ORDER BY as_of_date DESC;
```

## Environment Variables

None required (IMF COFER data is publicly accessible).

## Error Handling

- Exponential backoff retry (3 attempts)
- Partial failure logging
- Idempotent upserts (safe to re-run)
- Skips already-current data

## Future Enhancements

- [ ] Country-level breakdowns (requires additional data sources)
- [ ] World Gold Council integration for granular gold data
- [ ] Historical backfill (10+ years)
- [ ] Alerting on significant USD share drops
