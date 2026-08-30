-- Seed curated SEC corporate issuers for macro transmission telemetry
-- CIKs are canonical 10-digit zero-padded identifiers matching SEC EDGAR API requirements

INSERT INTO public.sec_corporate_issuers (cik, ticker, issuer_name, exchange, sic, sector, relevance_tags, relevance_rationale, is_active)
VALUES
  (
    '0000320193',
    'AAPL',
    'Apple Inc.',
    'NASDAQ',
    '3571',
    'Information Technology',
    ARRAY['cash_rich', 'global_supply_chain', 'consumer_electronics', 'working_capital'],
    'Benchmark for high-margin corporate cash runway, working capital cycle, and massive commercial paper/bond liquidity management.',
    true
  ),
  (
    '0000789019',
    'MSFT',
    'Microsoft Corp',
    'NASDAQ',
    '7372',
    'Information Technology',
    ARRAY['ai_capex_impulse', 'cloud_infrastructure', 'hyperscaler', 'debt_refinancing'],
    'Primary barometer for hyperscaler cloud & AI infrastructure capex impulse and long-term corporate bond issuance.',
    true
  ),
  (
    '0001018724',
    'AMZN',
    'Amazon.com Inc.',
    'NASDAQ',
    '5961',
    'Consumer Discretionary',
    ARRAY['logistics_capex', 'hyperscaler', 'working_capital', 'inventory_cycle'],
    'Transmission indicator for consumer retail demand velocity, global fulfillment capex, and working capital inventory drag.',
    true
  ),
  (
    '0000018230',
    'CAT',
    'Caterpillar Inc.',
    'NYSE',
    '3531',
    'Industrials',
    ARRAY['global_capex_barometer', 'construction_demand', 'mining_transmission', 'machinery'],
    'Global bellwether for physical machinery capex impulse, dealer inventory destocking, and cyclical industrial fixed investment.',
    true
  ),
  (
    '0000034088',
    'XOM',
    'Exxon Mobil Corp',
    'NYSE',
    '2911',
    'Energy',
    ARRAY['energy_capex', 'refining_margins', 'cash_flow_volatility', 'shareholder_yield'],
    'Core benchmark for energy sector upstream/downstream capital expenditures and commodity revenue recycling into buybacks/dividends.',
    true
  ),
  (
    '0000037996',
    'F',
    'Ford Motor Co',
    'NYSE',
    '3711',
    'Consumer Discretionary',
    ARRAY['auto_debt_wall', 'consumer_credit', 'fleet_capex', 'union_labor_cost'],
    'Key indicator for consumer vehicle financing stress, capital-intensive manufacturing debt maturities, and EV transition capex drag.',
    true
  ),
  (
    '0000012927',
    'BA',
    'Boeing Co',
    'NYSE',
    '3721',
    'Industrials',
    ARRAY['aerospace_supply_chain', 'liquidity_runway', 'defense_capex', 'debt_burden'],
    'Crucial proxy for aerospace manufacturing delivery cycles, free cash flow burn rate, and heavy corporate refinancing requirements.',
    true
  )
ON CONFLICT (cik) DO UPDATE SET
  ticker = EXCLUDED.ticker,
  issuer_name = EXCLUDED.issuer_name,
  exchange = EXCLUDED.exchange,
  sic = EXCLUDED.sic,
  sector = EXCLUDED.sector,
  relevance_tags = EXCLUDED.relevance_tags,
  relevance_rationale = EXCLUDED.relevance_rationale,
  is_active = true,
  updated_at = now();
