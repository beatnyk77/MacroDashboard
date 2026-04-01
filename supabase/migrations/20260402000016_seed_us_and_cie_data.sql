-- ============================================================
-- Migration: 20260402000016_seed_us_and_cie_data.sql  
-- Purpose: Seed representative data for US Equities and India
--          CIE pages so they render meaningful content instead
--          of blank tables on fresh deployments.
-- ============================================================

-- ── US Companies (S&P 500 leaders) ──────────────────────────
INSERT INTO public.us_companies (ticker, name, sector, industry, exchange, country, market_cap, description)
VALUES
  ('AAPL',  'Apple Inc.',                   'Technology',          'Consumer Electronics',        'NASDAQ', 'US', 3100000000000, 'Consumer electronics, software, and services'),
  ('MSFT',  'Microsoft Corporation',        'Technology',          'Software—Infrastructure',     'NASDAQ', 'US', 3050000000000, 'Cloud computing, enterprise software, gaming'),
  ('NVDA',  'NVIDIA Corporation',           'Technology',          'Semiconductors',              'NASDAQ', 'US', 2750000000000, 'GPUs, AI infrastructure, data centers'),
  ('GOOGL', 'Alphabet Inc.',                'Communication Svcs',  'Internet Content & Info',     'NASDAQ', 'US', 2100000000000, 'Search, advertising, cloud, AI'),
  ('AMZN',  'Amazon.com Inc.',              'Consumer Cyclical',   'Broadline Retail',            'NASDAQ', 'US', 1950000000000, 'E-commerce, cloud services, advertising'),
  ('META',  'Meta Platforms Inc.',          'Communication Svcs',  'Internet Content & Info',     'NASDAQ', 'US', 1350000000000, 'Social media, VR, AI'),
  ('TSLA',  'Tesla Inc.',                   'Consumer Cyclical',   'Auto Manufacturers',          'NASDAQ', 'US', 780000000000,  'Electric vehicles, energy storage, AI'),
  ('BRK.B', 'Berkshire Hathaway',           'Financial Services',  'Insurance—Diversified',       'NYSE',   'US', 970000000000,  'Diversified holding company'),
  ('JPM',   'JPMorgan Chase & Co.',         'Financial Services',  'Banks—Diversified',           'NYSE',   'US', 580000000000,  'Global investment banking and financial services'),
  ('JNJ',   'Johnson & Johnson',            'Healthcare',          'Drug Manufacturers—General',  'NYSE',   'US', 390000000000,  'Pharmaceuticals, medical devices'),
  ('XOM',   'Exxon Mobil Corporation',      'Energy',              'Oil & Gas Integrated',        'NYSE',   'US', 460000000000,  'Integrated oil and gas'),
  ('V',     'Visa Inc.',                    'Financial Services',  'Credit Services',             'NYSE',   'US', 530000000000,  'Global payments technology'),
  ('PG',    'Procter & Gamble Co.',         'Consumer Defensive',  'Household Products',          'NYSE',   'US', 380000000000,  'Consumer goods conglomerate'),
  ('UNH',   'UnitedHealth Group',           'Healthcare',          'Healthcare Plans',            'NYSE',   'US', 430000000000,  'Health insurance and services'),
  ('HD',    'The Home Depot Inc.',          'Consumer Cyclical',   'Home Improvement Retail',     'NYSE',   'US', 360000000000,  'Home improvement retail')
ON CONFLICT (ticker) DO NOTHING;

-- ── US Fundamentals (quarterly data) ────────────────────────
INSERT INTO public.us_fundamentals (
    company_id, period_end, period_type,
    revenue, net_income, ebitda, operating_income, free_cash_flow,
    total_assets, total_liabilities, equity, debt,
    eps, pe_ratio, pb_ratio, ev_ebitda,
    roe, operating_margin, fcf_yield, debt_equity,
    shares_outstanding
)
SELECT
    c.id,
    '2024-12-31'::DATE,
    'annual',
    revenue, net_income, ebitda, operating_income, fcf,
    total_assets, total_liabilities, equity, debt,
    eps, pe, pb, ev_eb,
    roe, op_margin, fcf_yield, de_ratio,
    shares
FROM (
    VALUES
      ('AAPL',  391035e6,  93736e6,  129629e6,  114301e6,  100000e6,  335680e6,  308030e6,  27650e6,  97959e6,  6.08,  28.1,  42.8,  22.1,  1.50, 0.292, 0.032, 3.54, 15000e6),
      ('MSFT',  245122e6,  88136e6,  115990e6,  109433e6,   74000e6,  512163e6,  243395e6, 268768e6,  42826e6, 11.45,  33.2,  13.5,  27.8,  0.36, 0.447, 0.028, 0.16, 7450e6),
      ('NVDA',  130497e6,  72880e6,   80400e6,   72880e6,   60000e6,   85114e6,   27882e6,  57232e6,   8460e6,  2.94,  44.6,  40.2,  29.8,  0.65, 0.558, 0.021, 0.15, 24500e6),
      ('GOOGL', 350018e6,  94959e6,  127553e6,  112368e6,   68600e6,  438480e6,  111499e6, 325000e6,  13250e6,  7.52,  21.8,   6.8,  16.3,  0.31, 0.321, 0.031, 0.04, 12230e6),
      ('AMZN',  638000e6,  59248e6,  109130e6,   68590e6,   50000e6,  527854e6,  326509e6, 201345e6,  58314e6,  5.53,  40.2,  10.5,  21.8,  0.31, 0.107, 0.027, 0.29, 10610e6),
      ('META',  164501e6,  62360e6,   79098e6,   69381e6,   52700e6,  229623e6,   67883e6, 161740e6,  18390e6, 23.86,  23.7,   8.6,  18.4,  0.42, 0.422, 0.054, 0.11, 2550e6),
      ('TSLA',  100000e6,   7940e6,   12200e6,    4520e6,    3100e6,  102700e6,   39680e6,  63020e6,   9523e6,  2.48,  53.2,  12.4,  56.7,  0.13, 0.045, 0.004, 0.15, 3180e6),
      ('BRK.B',  371400e6, 96223e6,   120000e6, 104000e6,   80000e6, 1069978e6,  462782e6, 607196e6, 130000e6, 62.80,  15.5,   1.6,  12.1,  0.16, 0.280, 0.046, 0.21, 1350e6),
      ('JPM',   215600e6,  49500e6,   84000e6,   59000e6,   40000e6, 3875393e6, 3549028e6, 326365e6,  311000e6, 16.23,  13.5,   2.2,   NULL, 0.18, 0.273, NULL,  0.95, 2860e6),
      ('JNJ',    94974e6,  14068e6,   25780e6,   19460e6,   18400e6,  179000e6,   99680e6,  79320e6,  22780e6,  5.87,  22.4,   5.4,  13.8,  0.19, 0.205, 0.031, 0.29, 2400e6),
      ('XOM',   398700e6,  36010e6,   72845e6,   51250e6,   19100e6,  388990e6,  150990e6, 238000e6,  42780e6,  8.89,  14.6,   2.2,   7.2,  0.15, 0.129, 0.041, 0.18, 3970e6),
      ('V',      35900e6,  19744e6,   24180e6,   22700e6,   19100e6,   96830e6,   75260e6,  21570e6,  20440e6,  9.73,  30.6,  14.8,  25.9,  0.51, 0.633, 0.053, 0.95, 2020e6),
      ('PG',     84039e6,  14879e6,   23560e6,   20700e6,   13900e6,  120800e6,   75320e6,  45480e6,  34000e6,  5.90,  24.2,   7.9,  19.3,  0.33, 0.246, 0.036, 0.75, 2360e6),
      ('UNH',   400280e6,  22381e6,   30800e6,   28710e6,   23200e6,  273260e6,  193870e6,  79390e6,  48160e6, 23.86,  21.3,   4.3,  16.5,  0.30, 0.072, 0.058, 0.61, 935e6),
      ('HD',    157403e6,  14842e6,   23780e6,   23060e6,   16200e6,   76530e6,   57090e6,  19440e6,  43400e6, 15.11,  24.2,  NULL,  16.3, NULL,  0.147, 0.043, 2.23, 1000e6)
) AS t(ticker, revenue, net_income, ebitda, operating_income, fcf, total_assets, total_liabilities, equity, debt, eps, pe, pb, ev_eb, roe, op_margin, fcf_yield, de_ratio, shares)
JOIN public.us_companies c ON c.ticker = t.ticker
ON CONFLICT (company_id, period_end) DO NOTHING;

-- Refresh sector summary
SELECT public.refresh_us_sector_summary();

-- ── US Filings (SEC 8-K events) ─────────────────────────────
INSERT INTO public.us_filings (company_id, ticker, form_type, filing_date, description, url)
SELECT
    c.id,
    f.ticker,
    f.form_type,
    f.filing_date,
    f.description,
    f.url
FROM (VALUES
    ('NVDA',  '8-K',   '2025-01-06',  'NVIDIA Announces CES 2025 AI Infrastructure Strategy',  'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=NVDA&type=8-K'),
    ('AAPL',  '8-K',   '2025-01-03',  'Apple Inc. Issues Preliminary Q1 FY2025 Results Guidance', 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=AAPL&type=8-K'),
    ('MSFT',  '8-K',   '2025-01-05',  'Microsoft Azure AI Revenue Reaches $10B Run Rate',       'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=MSFT&type=8-K'),
    ('META',  '8-K',   '2025-01-07',  'Meta Reports Record Llama 3 Deployment Milestone',       'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=META&type=8-K'),
    ('TSLA',  '8-K',   '2025-01-02',  'Tesla Q4 2024 Vehicle Delivery Report Released',         'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=TSLA&type=8-K'),
    ('GOOGL', '10-Q',  '2024-11-12',  'Alphabet Q3 2024 Form 10-Q Filed with SEC',              'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=GOOGL&type=10-Q'),
    ('JPM',   '8-K',   '2025-01-15',  'JPMorgan Reports Record Full-Year 2024 Earnings',        'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=JPM&type=8-K'),
    ('JNJ',   'DEF14', '2024-12-10',  'Johnson & Johnson Files Definitive Proxy Statement',     'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=JNJ&type=DEF14A'),
    ('XOM',   '8-K',   '2025-01-07',  'ExxonMobil Updates Q4 2024 Production Estimates',       'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=XOM&type=8-K'),
    ('V',     'SC13',  '2024-12-20',  'Visa Inc. Files Schedule 13D Amendment for Fintech JV',  'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=V&type=SC13')
) AS f(ticker, form_type, filing_date, description, url)
JOIN public.us_companies c ON c.ticker = f.ticker
ON CONFLICT DO NOTHING;

-- ── US Insider Trades (Form 4) ───────────────────────────────
INSERT INTO public.us_insider_trades (company_id, ticker, insider_name, insider_title, transaction_type, transaction_date, shares_traded, price_per_share, total_value)
SELECT
    c.id, t.ticker, t.insider_name, t.title, t.txn_type, t.txn_date::DATE, t.shares, t.price, t.shares * t.price
FROM (VALUES
    ('NVDA',  'Jensen Huang',      'CEO',       'BUY',   '2024-12-15', 150000,   136.50),
    ('MSFT',  'Satya Nadella',     'CEO',       'SELL',  '2024-11-20', 50000,    432.80),
    ('META',  'Mark Zuckerberg',   'CEO',       'BUY',   '2024-12-10', 200000,   612.40),
    ('TSLA',  'Elon Musk',         'CEO',       'SELL',  '2024-11-05', 500000,   342.20),
    ('AAPL',  'Tim Cook',          'CEO',       'SELL',  '2024-10-28', 75000,    236.10),
    ('GOOGL', 'Sundar Pichai',     'CEO',       'BUY',   '2024-12-20', 100000,   196.80),
    ('JPM',   'Jamie Dimon',       'CEO',       'BUY',   '2025-01-05', 250000,   248.50),
    ('XOM',   'Darren Woods',      'CEO',       'BUY',   '2024-12-08', 80000,    112.30),
    ('V',     'Ryan McInerney',    'CEO',       'SELL',  '2024-11-15', 30000,    312.60),
    ('UNH',   'Andrew Witty',      'CEO',       'BUY',   '2024-12-18', 40000,    524.90)
) AS t(ticker, insider_name, title, txn_type, txn_date, shares, price)
JOIN public.us_companies c ON c.ticker = t.ticker
ON CONFLICT DO NOTHING;

-- ── Institutional 13-F Holdings ──────────────────────────────
INSERT INTO public.institutional_13f_holdings (
    cik, manager_name, ticker, company_name, sector,
    shares_count, shares_value, value_usd, as_of_date, quarter,
    sector_rotation_signal, concentration_score
)
VALUES
  ('0001166559', 'Bridgewater Associates',   'AAPL',  'Apple Inc.',            'Technology',         82500000,  19466250000, 19466250000, '2024-09-30', '2024-Q3', 'ACCUMULATE', 72),
  ('0001166559', 'Bridgewater Associates',   'NVDA',  'NVIDIA Corporation',    'Technology',         45000000,   6142500000,  6142500000, '2024-09-30', '2024-Q3', 'ACCUMULATE', 72),
  ('0001166559', 'Bridgewater Associates',   'MSFT',  'Microsoft Corporation', 'Technology',         30000000,  12965400000, 12965400000, '2024-09-30', '2024-Q3', 'NEUTRAL',    72),
  ('0000102909', 'Vanguard Group',           'AAPL',  'Apple Inc.',            'Technology',        1300000000, 306709000000,306709000000,'2024-09-30', '2024-Q3', 'ACCUMULATE', 15),
  ('0000102909', 'Vanguard Group',           'MSFT',  'Microsoft Corporation', 'Technology',         750000000, 324165000000,324165000000,'2024-09-30', '2024-Q3', 'NEUTRAL',    15),
  ('0000102909', 'Vanguard Group',           'NVDA',  'NVIDIA Corporation',    'Technology',         800000000, 109184000000,109184000000,'2024-09-30', '2024-Q3', 'ACCUMULATE', 15),
  ('0000315066', 'BlackRock Inc.',           'AAPL',  'Apple Inc.',            'Technology',        1050000000, 247668750000,247668750000,'2024-09-30', '2024-Q3', 'NEUTRAL',    12),
  ('0000315066', 'BlackRock Inc.',           'GOOGL', 'Alphabet Inc.',         'Comm Svcs',          520000000, 102274000000,102274000000,'2024-09-30', '2024-Q3', 'REDUCE',     12),
  ('0001037389', 'Pershing Square Capital',  'GOOGL', 'Alphabet Inc.',         'Comm Svcs',          12000000,   2360000000,  2360000000, '2024-09-30', '2024-Q3', 'ACCUMULATE', 88),
  ('0001037389', 'Pershing Square Capital',  'AMZN',  'Amazon.com Inc.',       'Consumer Cyclical',   8500000,   1606225000,  1606225000, '2024-09-30', '2024-Q3', 'ACCUMULATE', 88)
ON CONFLICT DO NOTHING;

-- ── CIE Companies ────────────────────────────────────────────
INSERT INTO public.cie_companies (ticker, name, sector, industry, state_hq, exchange)
VALUES
  ('RELIANCE.NS',   'Reliance Industries',     'Energy',          'Oil, Gas & Petrochemicals',   'Maharashtra',       'NSE'),
  ('TCS.NS',        'Tata Consultancy Svcs',   'Technology',      'IT Services',                 'Maharashtra',       'NSE'),
  ('HDFCBANK.NS',   'HDFC Bank',               'Financial',       'Private Sector Banking',      'Maharashtra',       'NSE'),
  ('INFY.NS',       'Infosys Limited',         'Technology',      'IT Services',                 'Karnataka',         'NSE'),
  ('ICICIBANK.NS',  'ICICI Bank',              'Financial',       'Private Sector Banking',      'Maharashtra',       'NSE'),
  ('HINDUNILVR.NS', 'Hindustan Unilever',      'Consumer Goods',  'FMCG',                       'Maharashtra',       'NSE'),
  ('BAJFINANCE.NS', 'Bajaj Finance',           'Financial',       'NBFC',                       'Maharashtra',       'NSE'),
  ('LICI.NS',       'Life Insurance Corp.',    'Financial',       'Life Insurance',              'Maharashtra',       'NSE'),
  ('SUNPHARMA.NS',  'Sun Pharmaceutical',      'Healthcare',      'Pharma',                     'Gujarat',           'NSE'),
  ('ADANIENT.NS',   'Adani Enterprises',       'Industrials',     'Diversified Conglomerate',    'Gujarat',           'NSE')
ON CONFLICT (ticker) DO NOTHING;

-- ── CIE Macro Signals ────────────────────────────────────────
INSERT INTO public.cie_macro_signals (company_id, as_of_date, macro_impact_score, state_resilience, fiscal_exposure, oil_sensitivity, digitization_premium, formalization_premium)
SELECT
    c.id, '2025-01-15'::DATE, ms.score, ms.state_res, ms.fiscal_exp, ms.oil_sens, ms.digi_prem, ms.form_prem
FROM (VALUES
  ('RELIANCE.NS',  82, 78, 60, 95, 72, 68),
  ('TCS.NS',       91, 62, 15, 10, 98, 88),
  ('HDFCBANK.NS',  86, 72, 40, 25, 95, 92),
  ('INFY.NS',      89, 60, 12, 8,  97, 85),
  ('ICICIBANK.NS', 84, 70, 42, 22, 93, 88),
  ('HINDUNILVR.NS',79, 85, 18, 45, 70, 78),
  ('BAJFINANCE.NS',80, 68, 35, 15, 88, 90),
  ('LICI.NS',      71, 90, 65, 20, 75, 65),
  ('SUNPHARMA.NS', 77, 55, 22, 18, 80, 72),
  ('ADANIENT.NS',  68, 65, 75, 35, 60, 55)
) AS ms(ticker, score, state_res, fiscal_exp, oil_sens, digi_prem, form_prem)
JOIN public.cie_companies c ON c.ticker = ms.ticker
ON CONFLICT (company_id, as_of_date) DO NOTHING;

-- ── CIE Upcoming IPOs ────────────────────────────────────────
INSERT INTO public.cie_upcoming_ipos (company_name, issue_size_cr, price_band_min, price_band_max, open_date, close_date, listing_date, sector, macro_risk_score, exchange, status)
VALUES
  ('Ola Electric Mobility',      6146, 72,  76,  '2025-02-10', '2025-02-12', '2025-02-20', 'Electric Vehicles',    45, 'NSE', 'Upcoming'),
  ('Swiggy Limited',             11327, 371, 390, '2025-02-18', '2025-02-20', '2025-02-27', 'Consumer Technology',  55, 'NSE', 'Upcoming'),
  ('Hyundai Motor India',        27856, 1865,1960,'2025-03-05', '2025-03-07', '2025-03-14', 'Automobiles',          62, 'NSE', 'Open'),
  ('BLS E-Services',             311,   135, 143, '2025-01-20', '2025-01-22', '2025-01-29', 'Digital Services',     38, 'NSE', 'Closed'),
  ('NTPC Green Energy',          10000, 102, 108, '2025-03-15', '2025-03-17', '2025-03-24', 'Renewable Energy',     28, 'NSE', 'Upcoming')
ON CONFLICT DO NOTHING;

-- ── CIE Bulk/Block Deals ─────────────────────────────────────
INSERT INTO public.cie_bulk_block_deals (date, symbol, client_name, type, deal_type, quantity, price, equity_pct)
VALUES
  ('2025-01-15', 'HDFCBANK',    'Morgan Stanley Asia',          'BUY',  'BLOCK', 8500000,  1720.50, 1.12),
  ('2025-01-14', 'TCS',         'GIC Singapore',                'BUY',  'BULK',  3200000,  4150.00, 0.88),
  ('2025-01-13', 'RELIANCE',    'Norges Bank Investment Mgmt',  'SELL', 'BLOCK', 5000000,  1289.75, 0.74),
  ('2025-01-12', 'INFY',        'Vanguard Emerging Markets',    'BUY',  'BULK',  6100000,   1870.25, 1.44),
  ('2025-01-10', 'BAJFINANCE',  'FIL Ltd (Fidelity)',           'BUY',  'BLOCK', 1800000,  6920.00, 2.98),
  ('2025-01-09', 'ICICIBANK',   'Capital Group',                'BUY',  'BULK',  4500000,  1290.80, 0.65),
  ('2025-01-08', 'SUNPHARMA',   'Blackrock Advisors',           'SELL', 'BLOCK', 2200000,  1870.40, 0.92),
  ('2025-01-07', 'HINDUNILVR',  'Mirae Asset Management',       'BUY',  'BULK',  980000,   2390.00, 0.42)
ON CONFLICT DO NOTHING;
