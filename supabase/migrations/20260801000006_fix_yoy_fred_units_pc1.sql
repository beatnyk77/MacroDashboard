-- Task 1 mapped CPIAUCSL / CPILFESL / CES0500000003 as YoY percent metrics,
-- but those FRED series are levels (index / $/hour). Without units=pc1 the
-- pipeline writes raw index values (~330) as if they were YoY inflation %.
-- US_CPI_YOY already has fred_units=pc1 from Task 9; mirror that for the
-- three percent-unit siblings recovered in Task 1.
UPDATE public.metrics
SET metadata = metadata || jsonb_build_object('fred_units', 'pc1')
WHERE id IN (
    'INFLATION_HEADLINE_YOY',
    'INFLATION_CORE_YOY',
    'LABOR_WAGE_GROWTH_YOY'
);
