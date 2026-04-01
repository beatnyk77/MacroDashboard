-- =====================================================
-- Migration: Create CUSIP ticker cache table
-- Created: 2026-04-01
-- Purpose: Cache CUSIP to ticker/company/sector mappings to reduce Alpha Vantage API calls during 13F ingestion
-- =====================================================

CREATE TABLE IF NOT EXISTS cusip_ticker_cache (
    cusip TEXT PRIMARY KEY,
    ticker TEXT,
    company_name TEXT,
    sector TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index to prune old unused entries (optional maintenance)
CREATE INDEX IF NOT EXISTS idx_cusip_ticker_cache_last_used ON cusip_ticker_cache(last_used_at);

COMMENT ON TABLE cusip_ticker_cache IS 'Cache for CUSIP to ticker/company/sector mappings to reduce Alpha Vantage API calls';
COMMENT ON COLUMN cusip_ticker_cache.cusip IS 'CUSIP identifier (primary key)';
COMMENT ON COLUMN cusip_ticker_cache.ticker IS 'Corresponding stock ticker symbol (may be null if not found)';
COMMENT ON COLUMN cusip_ticker_cache.company_name IS 'Company name from Alpha Vantage or SEC';
COMMENT ON COLUMN cusip_ticker_cache.sector IS 'Sector classification (GICS or similar)';
COMMENT ON COLUMN cusip_ticker_cache.fetched_at IS 'When this mapping was first fetched from Alpha Vantage';
COMMENT ON COLUMN cusip_ticker_cache.last_used_at IS 'Last time this mapping was used in ingestion (for cache pruning)';
