-- ============================================================
-- Migration: Create Comtrade API response cache table
-- Date: 2026-06-05
-- Purpose: Cache Comtrade responses to eliminate repeated API calls
-- ============================================================

BEGIN;

-- Cache table for Comtrade API responses
CREATE TABLE IF NOT EXISTS comtrade_cache (
    id BIGSERIAL PRIMARY KEY,
    reporter_code TEXT NOT NULL,
    reporter_iso3 TEXT NOT NULL,
    period INTEGER NOT NULL,
    cmd_code TEXT NOT NULL,
    flow_code TEXT NOT NULL,
    partner_code TEXT NOT NULL,
    hs_code TEXT NOT NULL,
    primary_value BIGINT NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(reporter_code, period, cmd_code, flow_code, partner_code, hs_code)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comtrade_cache_reporter_period ON comtrade_cache(reporter_iso3, period);
CREATE INDEX IF NOT EXISTS idx_comtrade_cache_cached_at ON comtrade_cache(cached_at);

COMMENT ON TABLE comtrade_cache IS 'Cached responses from UN Comtrade API to avoid repeated external calls. Significantly speeds up trade data ingestion.';
COMMENT ON COLUMN comtrade_cache.reporter_iso3 IS 'ISO 3166-1 alpha-3 country code for reference (denormalized from reporter_code)';
COMMENT ON COLUMN comtrade_cache.cached_at IS 'When this record was cached from Comtrade API';

COMMIT;
