-- Wire FRED series IDs for invoicing FX metrics (ingest-fred + currency-wars pickup)

UPDATE metrics
SET
    metadata = COALESCE(metadata, '{}'::jsonb) || '{"fred_id": "DEXCHUS"}'::jsonb,
    updated_at = '2000-01-01'::timestamptz
WHERE id = 'USD_CNY_RATE'
  AND (metadata->>'fred_id' IS DISTINCT FROM 'DEXCHUS');

UPDATE metrics
SET
    metadata = COALESCE(metadata, '{}'::jsonb) || '{"fred_id": "EXINUS"}'::jsonb
WHERE id = 'USD_INR_RATE'
  AND (metadata->>'fred_id' IS DISTINCT FROM 'EXINUS');