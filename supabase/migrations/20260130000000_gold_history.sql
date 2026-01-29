-- Migration: Gold Historical returns and Events (1900-present)

-- 1. Ensure the GOLD_MONTHLY_RETURN metric exists
INSERT INTO metrics (id, name, description, source_id, native_frequency, display_frequency, tier, category, expected_interval_days)
SELECT 
    'GOLD_MONTHLY_RETURN', 
    'Gold Monthly Return (%)', 
    'Month-over-month percentage return of Gold price', 
    (SELECT id FROM data_sources WHERE name = 'Yahoo Finance' LIMIT 1),
    'monthly', 
    'monthly', 
    'core', 
    'valuation', 
    32
ON CONFLICT (id) DO UPDATE SET 
    description = EXCLUDED.description,
    native_frequency = EXCLUDED.native_frequency;

-- 2. Create the Historical Gold Shocks table
CREATE TABLE IF NOT EXISTS gold_historical_shocks (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    event_month DATE NOT NULL,
    event_name TEXT NOT NULL,
    description TEXT,
    macro_regime TEXT,
    event_impact_score INTEGER DEFAULT 3, -- 1 to 5
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_gold_event UNIQUE (event_month, event_name)
);

-- 3. Create a view for the correlation chart
CREATE OR REPLACE VIEW vw_gold_returns_events AS
WITH returns AS (
    SELECT 
        as_of_date as month_date,
        value as return_pct
    FROM metric_observations
    WHERE metric_id = 'GOLD_MONTHLY_RETURN'
),
shocks AS (
    SELECT 
        event_month,
        event_name,
        description,
        macro_regime
    FROM gold_historical_shocks
),
prices AS (
    SELECT 
        as_of_date as month_date,
        value as price
    FROM metric_observations
    WHERE metric_id = 'GOLD_PRICE_USD'
)
SELECT 
    r.month_date,
    r.return_pct,
    p.price as gold_price,
    s.event_name,
    s.description as event_description,
    s.macro_regime
FROM returns r
LEFT JOIN shocks s ON date_trunc('month', r.month_date) = date_trunc('month', s.event_month)
LEFT JOIN prices p ON r.month_date = p.month_date
ORDER BY r.month_date ASC;

-- 4. Initial seed for historical shocks (Institutional Grade)
INSERT INTO gold_historical_shocks (event_month, event_name, description, macro_regime)
VALUES 
    ('1913-12-01', 'Federal Reserve Act', 'Establishment of the US Federal Reserve, centralizing US monetary policy.', 'Monetary Creation'),
    ('1914-07-01', 'WWI Start', 'Outbreak of WWI leads to suspension of the gold standard in many nations.', 'War / Crisis'),
    ('1929-10-01', 'Stock Market Crash', 'Black Tuesday marks the beginning of the Great Depression.', 'Deflationary Crash'),
    ('1933-04-01', 'EO 6102 - Gold Confiscation', 'Roosevelt forbids the hoarding of gold coin, bullion, and certificates.', 'Policy Intervention'),
    ('1934-01-01', 'Gold Reserve Act', 'US revalues gold from $20.67 to $35.00 per ounce.', 'Devaluation'),
    ('1944-07-01', 'Bretton Woods Agreement', 'Gold-linked USD becomes the global reserve currency.', 'Monetary Reset'),
    ('1971-08-15', 'Nixon Shock', 'US ends direct convertibility of the USD to gold, ending the Bretton Woods system.', 'Systemic Shift'),
    ('1973-10-01', 'Oil Crisis', 'OPEC oil embargo leads to stagflation and gold surge.', 'Stagflation'),
    ('1979-01-01', 'Iranian Revolution', 'Oil supply shocks and geopolitical instability drive gold to then-record highs.', 'Geopolitical / Inflation'),
    ('1980-01-01', 'Volcker Shock', 'Fed Chair Volcker raises rates to 20% to kill inflation, gold peaks and crashes.', 'Monetary Tightening'),
    ('1987-10-01', 'Black Monday', 'Largest one-day percentage drop in stock market history.', 'Market Panic'),
    ('1999-05-01', 'Browns Bottom', 'UK sells half its gold reserves at historic lows; European central banks limit sales.', 'Sentiment Low'),
    ('2001-09-01', '9/11 Attacks', 'Geopolitical terror shock leads to long-term safe haven demand.', 'Geopolitical Crisis'),
    ('2008-09-01', 'GFC / Lehman Collapse', 'Global Financial Crisis triggers massive monetary expansion (QE).', 'Credit Crisis'),
    ('2011-09-01', 'Eurozone Debt Crisis', 'Concerns over sovereign defaults drive gold to $1,900 peak.', 'Sovereign Debt'),
    ('2013-05-01', 'Taper Tantrum', 'Fed signals reduction in QE, causing real rates to rise and gold to sell off.', 'Policy Shift'),
    ('2020-03-01', 'COVID-19 Pandemic', 'Global lockdowns and unprecedented fiscal/monetary stimulus.', 'Deflationary Shock -> Reflation'),
    ('2022-02-01', 'Russia-Ukraine War', 'Weaponization of reserves and surge in inflation.', 'Geopolitical / Deglobalization')
ON CONFLICT (event_month, event_name) DO NOTHING;
