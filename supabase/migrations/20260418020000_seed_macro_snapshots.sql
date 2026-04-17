-- Seed: India and Africa Macro Snapshots (Apr-2026 initial data)
-- This provides the baseline data so both dashboards render immediately.

-- ── India Macro Snapshot ─────────────────────────────────────────────────────
INSERT INTO public.india_macro_snapshots (
  snapshot_date,
  geopolitical_summary,
  insights_positive,
  insights_neutral,
  insights_negative,
  metrics_data
) VALUES (
  '2026-04-01',
  'The Apr''26 Macro Dashboard reflects the impact of geopolitical turmoil. Manufacturing PMI is at a 4-year low — a fallout of the West Asia War. Indian Railways saw record freight performance in FY26, with a 3.25% YoY increase. FY26 closed at +8% employment growth, the strongest in 3 years.',
  '[
    "India''s white-collar hiring saw 9% YoY rise, as FY26 closes at +8%, the strongest job growth in 3 years.",
    "Monthly gross GST collections reached record high, driven by strong domestic activity.",
    "System Liquidity continues to remain comfortable."
  ]'::jsonb,
  '[
    "Vehicle retail sales kicked off FY27 with measured momentum, following a record-high FY26."
  ]'::jsonb,
  '[
    "CPI rose marginally driven primarily by rising food prices and fuel costs amid West Asia geopolitical tensions.",
    "WPI inched higher due to crude petroleum & natural gas price rises.",
    "Manufacturing PMI fell sharply — dragged down by the impact of the West Asia war on costs and demand. Services PMI slowed to a 14-month low of 57.5."
  ]'::jsonb,
  '[
    {"name": "Naukri Job Index", "unit": "", "values": {"Nov-25": 3001, "Dec-25": 3001, "Jan-26": 2637, "Feb-26": 3233, "Mar-26": 2858, "Apr-26": null}, "status": "neutral"},
    {"name": "Vehicle Registrations", "unit": "mn units", "values": {"Nov-25": 3.33, "Dec-25": 2.04, "Jan-26": 2.75, "Feb-26": 2.42, "Mar-26": 2.70, "Apr-26": 0.89}, "status": "negative"},
    {"name": "GST Collections", "unit": "₹tn", "values": {"Nov-25": 1.82, "Dec-25": 1.77, "Jan-26": 1.96, "Feb-26": 1.84, "Mar-26": 1.92, "Apr-26": null}, "status": "positive"},
    {"name": "CPI Inflation", "unit": "%", "values": {"Nov-25": 5.48, "Dec-25": 5.22, "Jan-26": 4.31, "Feb-26": 3.61, "Mar-26": 3.34, "Apr-26": null}, "status": "neutral"},
    {"name": "WPI Inflation", "unit": "%", "values": {"Nov-25": 1.89, "Dec-25": 2.37, "Jan-26": 2.31, "Feb-26": 2.38, "Mar-26": 2.05, "Apr-26": null}, "status": "neutral"},
    {"name": "Mfg PMI", "unit": "", "values": {"Nov-25": 56.5, "Dec-25": 57.7, "Jan-26": 57.7, "Feb-26": 56.3, "Mar-26": 58.1, "Apr-26": 48.2}, "status": "negative"},
    {"name": "Services PMI", "unit": "", "values": {"Nov-25": 58.4, "Dec-25": 59.3, "Jan-26": 56.5, "Feb-26": 59.0, "Mar-26": 57.4, "Apr-26": 57.5}, "status": "neutral"},
    {"name": "Forex Reserves", "unit": "$bn", "values": {"Nov-25": 656.6, "Dec-25": 644.4, "Jan-26": 623.5, "Feb-26": 637.7, "Mar-26": 665.4, "Apr-26": 676.3}, "status": "positive"}
  ]'::jsonb
) ON CONFLICT (snapshot_date) DO NOTHING;

-- ── Africa Macro Snapshot ─────────────────────────────────────────────────────
INSERT INTO public.africa_macro_snapshots (
  snapshot_date,
  continent_summary,
  insights_positive,
  insights_neutral,
  insights_negative,
  metrics_summary
) VALUES (
  '2026-04-01',
  'The Apr''26 Africa Macro Pulse highlights a continent navigating severe fiscal stress and commodity price volatility. While Ghana''s debt restructuring provides a template for others, Zambia and Ethiopia remain in the spotlight. Oil producers like Angola and Nigeria see revenue boosts from elevated crude prices, but FX pressures persist. The trade gravity shift towards China continues to accelerate across the Sahel and East Africa.',
  '[
    "Angola''s oil revenues up 12% MoM as production stabilizes and prices remain elevated.",
    "Ghana successfully completes the second phase of its domestic debt exchange, improving fiscal outlook.",
    "Morocco''s fertilizer exports reach record levels, bolstering its current account surplus."
  ]'::jsonb,
  '[
    "Kenya''s shilling stabilizes after Eurobond buyback, but debt service remains a multi-year headwind.",
    "South Africa''s mining sector shows mixed results; coal exports down, but critical minerals (manganese, chrome) up."
  ]'::jsonb,
  '[
    "Nigeria''s inflation hits 28-year high, driven by fuel subsidy removal and FX depreciation.",
    "Egypt faces continued pressure on the EGP despite IMF expansion; external debt service ratio exceeds 40%.",
    "Zambia''s debt restructuring hits another legal bottleneck with private creditors."
  ]'::jsonb,
  '[
    {"name": "Avg Debt/GDP", "value": 68.4, "unit": "%", "trend": "up"},
    {"name": "China Trade Gravity", "value": 42.1, "unit": "%", "trend": "up"},
    {"name": "Oil Production", "value": 3.4, "unit": "mbpd", "trend": "up"},
    {"name": "Avg Inflation", "value": 14.8, "unit": "%", "trend": "up"}
  ]'::jsonb
) ON CONFLICT (snapshot_date) DO NOTHING;
