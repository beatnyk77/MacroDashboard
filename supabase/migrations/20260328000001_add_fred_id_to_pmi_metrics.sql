-- Add missing FRED IDs to PMI metrics so they can be ingested by ingest-fred

DO $$
BEGIN
    -- Update PMI_US_SERVICES with FRED series ID for Leading Index (USSLIND)
    UPDATE metrics
    SET metadata = jsonb_build_object('fred_id', 'USSLIND')
    WHERE id = 'PMI_US_SERVICES'
      AND (metadata IS NULL OR metadata ? 'fred_id' = FALSE);

    -- Update PMI_US_MFG with FRED series ID for Manufacturing Employment (MANEMP)
    -- Note: This is a proxy; may need adjustment if actual PMI source is different
    UPDATE metrics
    SET metadata = jsonb_build_object('fred_id', 'MANEMP')
    WHERE id = 'PMI_US_MFG'
      AND (metadata IS NULL OR metadata ? 'fred_id' = FALSE);

    -- Log updates
    RAISE NOTICE 'Added fred_id to PMI metrics (USSLIND, MANEMP)';
END $$;
