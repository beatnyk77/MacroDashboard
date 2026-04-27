CREATE OR REPLACE VIEW view_india_china_comparison AS
SELECT 
    COALESCE(i.hs_code, c.hs_code) as hs_code,
    null as hs_description,
    COALESCE(i.year, c.year) as year,
    i.export_value_usd as india_export_usd,
    i.qty_value as india_qty,
    c.export_value_usd as china_export_usd,
    c.qty_value as china_qty
FROM 
    (SELECT * FROM trade_demand_cache WHERE reporter_iso3 = 'IND') i
FULL OUTER JOIN 
    (SELECT * FROM trade_demand_cache WHERE reporter_iso3 = 'CHN') c
ON i.hs_code = c.hs_code AND i.year = c.year;
