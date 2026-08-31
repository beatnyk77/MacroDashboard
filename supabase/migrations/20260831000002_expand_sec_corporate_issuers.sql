-- Expand the SEC corporate transmission registry beyond the validation cohort.
-- All identifiers are canonical SEC CIKs for active public registrants.

INSERT INTO public.sec_corporate_issuers
  (cik, ticker, issuer_name, exchange, sic, sector, relevance_tags, relevance_rationale, is_active)
VALUES
  ('0001045810', 'NVDA', 'NVIDIA Corp', 'NASDAQ', '3674', 'Information Technology', ARRAY['ai_capex_impulse', 'semiconductor_supply_chain', 'china_export_controls'], 'Leading indicator for AI infrastructure investment, semiconductor bottlenecks, and export-control transmission.', true),
  ('0000002488', 'AMD', 'Advanced Micro Devices Inc', 'NASDAQ', '3674', 'Information Technology', ARRAY['ai_capex_impulse', 'semiconductor_supply_chain', 'china_export_controls'], 'Compute-cycle exposure across data-center accelerators, foundry capacity, and China-linked demand.', true),
  ('0000804328', 'QCOM', 'QUALCOMM Inc', 'NASDAQ', '3663', 'Information Technology', ARRAY['china_exposure', 'wireless_supply_chain', 'consumer_electronics'], 'China handset demand and wireless component-cycle transmission into corporate orders.', true),
  ('0000723125', 'MU', 'Micron Technology Inc', 'NASDAQ', '3674', 'Information Technology', ARRAY['memory_cycle', 'semiconductor_supply_chain', 'china_exposure'], 'Memory pricing, inventory correction, and strategic semiconductor supply-chain telemetry.', true),
  ('0001046179', 'TSM', 'Taiwan Semiconductor Manufacturing Co Ltd', 'NYSE', '3674', 'Information Technology', ARRAY['foundry_capacity', 'taiwan_strait', 'semiconductor_supply_chain'], 'Foundry utilization and advanced-node capacity as a strategic East Asian supply-chain signal.', true),
  ('0000050863', 'INTC', 'Intel Corp', 'NASDAQ', '3674', 'Information Technology', ARRAY['foundry_capex', 'semiconductor_supply_chain', 'us_industrial_policy'], 'Domestic foundry investment and semiconductor manufacturing capacity buildout.', true),
  ('0000101829', 'RTX', 'RTX Corp', 'NYSE', '3724', 'Industrials', ARRAY['defense_capex', 'aerospace_supply_chain', 'engine_backlog'], 'Defense and commercial aerospace backlog transmission through engines, systems, and supplier capacity.', true),
  ('0000936468', 'LMT', 'Lockheed Martin Corp', 'NYSE', '3721', 'Industrials', ARRAY['defense_capex', 'missile_supply_chain', 'government_demand'], 'Defense procurement and missile-system production capacity signal.', true),
  ('0001133421', 'NOC', 'Northrop Grumman Corp', 'NYSE', '3721', 'Industrials', ARRAY['defense_capex', 'space_supply_chain', 'government_demand'], 'Strategic aerospace, space, and defense program transmission.', true),
  ('0000040533', 'GD', 'General Dynamics Corp', 'NYSE', '3730', 'Industrials', ARRAY['defense_capex', 'shipbuilding', 'government_demand'], 'Shipbuilding, land systems, and defense backlog cycle indicator.', true),
  ('0000093410', 'CVX', 'Chevron Corp', 'NYSE', '2911', 'Energy', ARRAY['energy_capex', 'lng_supply_chain', 'cash_flow_volatility'], 'Upstream and LNG investment transmission through commodity cash flow and project spending.', true),
  ('0001163165', 'COP', 'ConocoPhillips', 'NYSE', '1311', 'Energy', ARRAY['energy_capex', 'upstream_cycle', 'commodity_cash_flow'], 'Pure-play upstream capital allocation and commodity-cycle transmission.', true),
  ('0000087347', 'SLB', 'SLB', 'NYSE', '1389', 'Energy', ARRAY['oilfield_capex', 'energy_supply_chain', 'global_activity'], 'Oilfield-service activity as an early read on global upstream capital spending.', true),
  ('0000045012', 'HAL', 'Halliburton Co', 'NYSE', '1389', 'Energy', ARRAY['oilfield_capex', 'energy_supply_chain', 'global_activity'], 'Drilling and completion activity signal across US shale and international energy markets.', true),
  ('0000315189', 'DE', 'Deere & Co', 'NYSE', '3523', 'Industrials', ARRAY['agricultural_capex', 'machinery_cycle', 'commodity_exposure'], 'Farm-income, machinery replacement, and agricultural capital-cycle transmission.', true),
  ('0000779152', 'HON', 'Honeywell International Inc', 'NASDAQ', '3728', 'Industrials', ARRAY['industrial_cycle', 'aerospace_supply_chain', 'automation'], 'Diversified industrial demand and aerospace/automation order-cycle telemetry.', true),
  ('0000040545', 'GE', 'GE Aerospace', 'NYSE', '3724', 'Industrials', ARRAY['aerospace_supply_chain', 'engine_backlog', 'industrial_cycle'], 'Aircraft engine backlog, delivery cadence, and supplier-capacity transmission.', true),
  ('0001090727', 'UPS', 'United Parcel Service Inc', 'NYSE', '4210', 'Industrials', ARRAY['global_trade', 'logistics_cycle', 'china_exposure'], 'Parcel volumes and pricing as a high-frequency read on goods movement and China-linked trade.', true),
  ('0001048911', 'FDX', 'FedEx Corp', 'NYSE', '4210', 'Industrials', ARRAY['global_trade', 'logistics_cycle', 'china_exposure'], 'Global freight volumes and network investment as supply-chain transmission telemetry.', true),
  ('0000104169', 'WMT', 'Walmart Inc', 'NYSE', '5331', 'Consumer Discretionary', ARRAY['consumer_demand', 'global_supply_chain', 'india_exposure'], 'Retail inventory, sourcing, and consumer demand transmission across major emerging markets.', true),
  ('0001577552', 'BABA', 'Alibaba Group Holding Ltd', 'NYSE', '7389', 'Consumer Discretionary', ARRAY['china_demand', 'china_platform_economy', 'cross_border_trade'], 'China domestic demand, platform investment, and cross-border commerce signal.', true),
  ('0001549802', 'JD', 'JD.com Inc', 'NASDAQ', '5961', 'Consumer Discretionary', ARRAY['china_demand', 'logistics_capex', 'cross_border_trade'], 'China retail demand and fulfillment-network investment telemetry.', true),
  ('0001737806', 'PDD', 'PDD Holdings Inc', 'NASDAQ', '5961', 'Consumer Discretionary', ARRAY['china_demand', 'cross_border_trade', 'consumer_stress'], 'China consumption breadth and lower-end consumer demand signal.', true),
  ('0001736541', 'NIO', 'NIO Inc', 'NYSE', '3711', 'Consumer Discretionary', ARRAY['china_ev_cycle', 'battery_supply_chain', 'china_demand'], 'China EV demand, battery supply chain, and capital-intensive manufacturing stress.', true),
  ('0001067491', 'INFY', 'Infosys Ltd', 'NYSE', '7372', 'Information Technology', ARRAY['india_it_services', 'india_demand', 'global_capex'], 'India IT-services export demand and global enterprise technology-spending transmission.', true),
  ('0001135361', 'WIT', 'Wipro Ltd', 'NYSE', '7372', 'Information Technology', ARRAY['india_it_services', 'india_demand', 'global_capex'], 'India technology-services order cycle and global corporate technology budgets.', true),
  ('0001146184', 'HDB', 'HDFC Bank Ltd', 'NYSE', '6029', 'Financials', ARRAY['india_credit_cycle', 'india_consumption', 'emerging_market_finance'], 'India private-credit and consumption transmission through a major listed bank.', true),
  ('0001290109', 'IBN', 'ICICI Bank Ltd', 'NYSE', '6029', 'Financials', ARRAY['india_credit_cycle', 'india_investment', 'emerging_market_finance'], 'India credit growth and investment-cycle transmission through a major listed bank.', true),
  ('0000019617', 'JPM', 'JPMorgan Chase & Co', 'NYSE', '6021', 'Financials', ARRAY['credit_cycle', 'debt_refinancing', 'global_liquidity'], 'Corporate credit availability and refinancing conditions across the global dollar system.', true),
  ('0000886982', 'GS', 'Goldman Sachs Group Inc', 'NYSE', '6211', 'Financials', ARRAY['capital_markets', 'debt_refinancing', 'global_liquidity'], 'Capital-markets underwriting and corporate refinancing transmission signal.', true)
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
