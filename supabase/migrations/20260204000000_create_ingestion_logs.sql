CREATE TABLE IF NOT EXISTS ingestion_logs (
    id BIGSERIAL PRIMARY KEY,
    function_name TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_time TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed')),
    error_message TEXT,
    rows_inserted INTEGER DEFAULT 0,
    rows_updated INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_logs_function_time 
ON ingestion_logs(function_name, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_ingestion_logs_status 
ON ingestion_logs(status) WHERE status = 'failed';

-- Create view for latest ingestion status
CREATE OR REPLACE VIEW vw_latest_ingestions AS
SELECT DISTINCT ON (function_name)
    function_name,
    start_time,
    end_time,
    status,
    error_message,
    rows_inserted,
    rows_updated,
    EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds,
    created_at
FROM ingestion_logs
ORDER BY function_name, start_time DESC;

COMMENT ON TABLE ingestion_logs IS 'Centralized logging for all data ingestion Edge Functions';
COMMENT ON VIEW vw_latest_ingestions IS 'Latest ingestion status per function for monitoring dashboard';
