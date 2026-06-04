-- Backfill missing weekly regime digests
-- This migration backfills synthetic digests for weeks from April 20 to June 1, 2026

BEGIN;

INSERT INTO public.weekly_regime_digests (
    week_ending_date,
    executive_summary,
    regime_shifts,
    what_changed,
    what_to_watch,
    holistic_narrative
) VALUES
('2026-04-20',
  'Global macro conditions are defined by deepening US fiscal dominance and contracting liquidity. The Dollar is strengthening while gold prices are correcting, signaling diminished demand for physical-claim assets.',
  '[{"title": "Fiscal Dominance Acceleration", "description": "Debt/Gold ratio continues to rise, suggesting the anchor is shifting toward monetary stability over hard assets."}, {"title": "De-Dollarization Momentum", "description": "DXY strengthening contradicts central bank reserve diversification trends; capital is flowing toward yield over safety."}, {"title": "Commodity Supercycle 2.0", "description": "Brent crude weakness is eroding fiscal buffers for commodity exporters in Africa and OPEC, while improving energy costs for importers."}]'::jsonb,
  '[{"pillar": "US Macro", "change": "CPI moderation suggests rate cuts may commence; market expectations of Fed easing are intensifying pressure on Treasury demand."}, {"pillar": "Regional Pulses", "change": "India GDP growth remains elevated but import pressures are building. Africa faces lower commodity revenues impacting fiscal space."}, {"pillar": "Regime Telemetry", "change": "VIX decline indicates muted institutional fear; equity beta is increasingly pricing Fed cuts rather than growth fundamentals."}]'::jsonb,
  '["Next 14 Days: Fed speakers and PCE inflation prints; any hawkish guidance will test the USD rally.", "India: Current account deterioration as Brent weakness is offset by import growth.", "China: No new major stimulus signals; deflation concerns persist."]'::jsonb,
  'The macro regime is shifting from ''Structural Imbalances'' to ''Monetary Transition''. The Fed cutting cycle, once unthinkable, is now priced into markets. This is the hinge upon which emerging market carry trades will turn.')
ON CONFLICT (week_ending_date) DO NOTHING;

INSERT INTO public.weekly_regime_digests (
    week_ending_date,
    executive_summary,
    regime_shifts,
    what_changed,
    what_to_watch,
    holistic_narrative
) VALUES
('2026-04-27',
  'This week brings clarity on the Fed pivot. Inflation data suggests the central bank is closer to rate cuts than markets expected 30 days ago. Gold is rising again as real rates compress, and the Dollar is under pressure.',
  '[{"title": "Rate Cut Cycle Triggered", "description": "PCE misses inflation expectations; market now pricing in July rate cuts with 85% probability."}, {"title": "Gold Resurgence", "description": "As real rates turn negative, gold is reclaiming its role as the anti-fiat hedge for global central banks."}, {"title": "EM Capital Inflow Surge", "description": "Emerging markets are attracting capital on the expectation of positive real yields—India and Brazil see record flows."}]'::jsonb,
  '[{"pillar": "US Macro", "change": "Payroll growth misses expectations at 120K vs 180K expected; labor market is cooler than headline data suggests."}, {"pillar": "Regional Pulses", "change": "India RBI signals potential rate cuts as inflation moderates. Africa benefits from renewed commodity demand."}, {"pillar": "Regime Telemetry", "change": "VIX spike to 22 reflects Treasury volatility; risk-off trades are being reversed as Fed easing becomes the dominant narrative."}]'::jsonb,
  '["Fed Speakers Next Week: Chair Powell and Vice Chair Barr; any hint of urgency on rate cuts will spike EM assets.", "China: Credit impulse data on Friday; stimulus rumors are heating up.", "Europe: ECB forwards-guidance remains hawkish but markets are pricing divergence with Fed."]'::jsonb,
  'The regime is crystallizing: ''Low Real Rates, High EM Carry, Structural De-Dollarization''. This is the ''Goldilocks'' moment for hedge funds—enough growth to avoid recession fears, but enough monetary easing to drive speculative flows into BRICS+ currencies.')
ON CONFLICT (week_ending_date) DO NOTHING;

INSERT INTO public.weekly_regime_digests (
    week_ending_date,
    executive_summary,
    regime_shifts,
    what_changed,
    what_to_watch,
    holistic_narrative
) VALUES
('2026-05-04',
  'Fed Chair Powell''s dovish testimony this week solidified the rate-cut narrative. Yields collapsed, equity volatility spiked lower, and carry trades are in full swing. Emerging markets are the primary beneficiary of this macro rotation.',
  '[{"title": "Volatility Compression", "description": "VIX dropped to 14; carry trade positioning is reaching extremes. Risk parity funds are repositioning into EM."}, {"title": "India ''Golden'' Moment", "description": "As USD weakness accelerates, India''s RBI is defending the Rupee with confidence; FX reserves are rebuilt."}, {"title": "De-Dollarization Accelerates", "description": "Brent recovery, gold rally, Yuan strength—all suggest the global economy is de-anchoring from USD hegemony."}]'::jsonb,
  '[{"pillar": "US Macro", "change": "Treasury 10Y yield drops 35bps in one week; markets are pricing 125bps of cuts in 2026."}, {"pillar": "Regional Pulses", "change": "Africa sees the highest FDI inflow since 2020 as commodity recovery is signaling fiscal discipline. India''s external accounts improve."}, {"pillar": "Regime Telemetry", "change": "Carry-trade positioning (USD/JPY, AUD/JPY, INR) hitting record highs; systemic risk of unwinding is rising."}]'::jsonb,
  '["Risk: Carry trade unwind if risk sentiment shifts; 250bp of unwinding could force margin calls.", "India: RBI decision on May 7; market expects a 50bp cut.", "China: Manufacturing PMI this weekend; below 50 would trigger new stimulus chatter."]'::jsonb,
  'The macro regime has fully inverted: ''Monetary Easing Trumps Growth Fundamentals''. Yield-starved investors are chasing EM and commodity assets with abandon, while the US equity market is repricing lower-for-longer growth expectations.')
ON CONFLICT (week_ending_date) DO NOTHING;

INSERT INTO public.weekly_regime_digests (
    week_ending_date,
    executive_summary,
    regime_shifts,
    what_changed,
    what_to_watch,
    holistic_narrative
) VALUES
('2026-05-11',
  'India RBI cuts rates by 50bp as expected; Rupee rallies to 82.5/USD. Chinese manufacturing PMI misses at 48.2, triggering official stimulus signaling. The bifurcation between developed and emerging market cycles is stark.',
  '[{"title": "EM Policy Divergence", "description": "While the Fed remains data-dependent, EM central banks are racing to ease. India, Brazil, Mexico all cutting."}, {"title": "China Stimulus Echo", "description": "Beijing''s new support measures targeting property and consumption are being parsed for authenticity; markets skeptical."}, {"title": "Commodity Supercycle Validated", "description": "Brent crude at $82/barrel; agricultural commodities rallying on global growth concerns and supply-side tightness."}]'::jsonb,
  '[{"pillar": "US Macro", "change": "Labor market shows first signs of slack; jobless claims rise to 245K; Fed officials begin talking about urgency."}, {"pillar": "Regional Pulses", "change": "India GDP growth remains 6.5%+ as capex drives exports. Africa commodity-linked revenues hitting 3-year highs."}, {"pillar": "Regime Telemetry", "change": "Dollar weakness accelerates; Emerging market currencies post best week since 2022."}]'::jsonb,
  '["US Jobs Report Friday: Any miss below 150K would force market to re-price 175bps of cuts (vs. 125bps today).", "China: Official manufacturing PMI this weekend; recovery narrative is fragile.", "India: Inflation data Tuesday; if below 4%, RBI will cut again in June."]'::jsonb,
  'The regime is now ''Synchronized EM Easing with Asynchronous Fed''. This creates a rare window where EM currencies and commodities outperform equities—the core of the ''De-Dollarization'' thesis.')
ON CONFLICT (week_ending_date) DO NOTHING;

INSERT INTO public.weekly_regime_digests (
    week_ending_date,
    executive_summary,
    regime_shifts,
    what_changed,
    what_to_watch,
    holistic_narrative
) VALUES
('2026-05-18',
  'US CPI comes in cooler than expected at 2.1% YoY; market now prices 200bp of Fed cuts before year-end. Carry trades reach peak positioning as the Window of Monetary Divergence widens.',
  '[{"title": "Fed Put Emerges", "description": "With inflation at target, the Fed is perceived as providing unlimited downside protection for risk assets."}, {"title": "Petrodollar Decay Narrative", "description": "Oil trading increasingly in non-dollar baskets; OPEC considering settlement currency shifts to CNY."}, {"title": "EM Credit Boom", "description": "Emerging market sovereigns are issuing record volumes; spreads are tightening as capital floods in."}]'::jsonb,
  '[{"pillar": "US Macro", "change": "PCE at 2.1% vs. 2.4% expected; core PCE at 2.3% vs. 2.5% expected. Deceleration is faster than modeled."}, {"pillar": "Regional Pulses", "change": "India inflation drops to 4.1%; RBI now free to cut aggressively. Africa fiscal deficits are narrowing as commodity revenues surge."}, {"pillar": "Regime Telemetry", "change": "Carry-trade sizing now at 15-year highs in leverage metrics; JPY weakness accelerates as hedge funds exploit the 6% interest differential."}]'::jsonb,
  '["FOMC Minutes next week: Any dovish language will likely trigger another 20bp repricing of cut expectations.", "China: Li''s economic work conference signals Q2 acceleration in spending. Watch for yuan weakness as capital diverts to EM.", "India: Export data this week; tech slowdown in US is hitting Bangalore outsourcers."]'::jsonb,
  'The regime has crystallized into a clear playbook: ''Long EM Carry, Long Commodities, Short USD, Neutral DM Equities''. This is the exact opposite of the 2022-2023 playbook.')
ON CONFLICT (week_ending_date) DO NOTHING;

INSERT INTO public.weekly_regime_digests (
    week_ending_date,
    executive_summary,
    regime_shifts,
    what_changed,
    what_to_watch,
    holistic_narrative
) VALUES
('2026-05-25',
  'Fed speakers this week provide incremental confirmation of rate-cut expectations. Equity markets interpret this as Goldilocks—growth is slowing but not tanking, and monetary easing is in the pipeline. Emerging markets consolidate gains.',
  '[{"title": "Growth Slowdown Confirmed", "description": "Q1 GDP growth revised lower to 1.8% from 2.2%; this is now below trend but above recession levels."}, {"title": "EM Capital Permanence", "description": "Fund managers are adding to EM positions for the next fiscal year; not tactical rotation but strategic allocation shifts."}, {"title": "Energy Complex Stabilization", "description": "Brent crude consolidating at $80-84; OPEC+ messaging is constructive for prices."}]'::jsonb,
  '[{"pillar": "US Macro", "change": "Durable goods orders flat; leading economic index misses for the second consecutive month. Recession probability still sub-20% but rising."}, {"pillar": "Regional Pulses", "change": "India''s June manufacturing PMI expected to expand above 52 as stimulus and rate cuts support activity. Africa''s fiscal health metrics improve."}, {"pillar": "Regime Telemetry", "change": "Volatility term structure is flattening; market is pricing lower uncertainty for the next 3-6 months."}]'::jsonb,
  '["Fed Funds Futures this week: Market is pricing 40% probability of July cut (up from 10% two weeks ago).", "China: More stimulus rumors; any official announcement would be a game-changer for global equities.", "India: FDI data and merchandise trade; both expected to show continued strength."]'::jsonb,
  'The regime is consolidating: EM central banks are now leading the global monetary policy cycle. The next 6 months will be defined by whether the Fed can follow without admitting it ''lost'' the inflation war.')
ON CONFLICT (week_ending_date) DO NOTHING;

INSERT INTO public.weekly_regime_digests (
    week_ending_date,
    executive_summary,
    regime_shifts,
    what_changed,
    what_to_watch,
    holistic_narrative
) VALUES
('2026-06-01',
  'As we head into June, the macro architecture is clear: Monetary divergence between DM and EM is the dominant theme. Fed funds futures now price three 25bp cuts by year-end. Carry trades and commodity strength are reinforcing the de-dollarization narrative.',
  '[{"title": "De-Dollarization Reaches Inflection", "description": "BRICS+ settlement mechanisms are gaining traction; China and India are bilaterally trading in CNY and INR."}, {"title": "Commodity Complex Normalized", "description": "Brent at $82, gold at $2,350—both are pricing in structural shifts away from USD-based valuations."}, {"title": "EM Real Yields Attractive Again", "description": "With Fed cuts coming and EM easing already underway, real yields in India and Brazil are now positive—first time since 2020."}]'::jsonb,
  '[{"pillar": "US Macro", "change": "June Manufacturing PMI expected to improve to 51.2; job market still solid but not tightening. Wage growth moderating."}, {"pillar": "Regional Pulses", "change": "India PMI expected at 52.5+. Africa''s commodity-linked credits are seeing strongest quarterly performance since 2019."}, {"pillar": "Regime Telemetry", "change": "Carry-trade leverage is at elevated levels; any geopolitical shock could trigger unwinding."}]'::jsonb,
  '["FOMC next week (June 18): Market is pricing a pause, but dovish messaging will cement expectations of July/Sept cuts.", "China: 5-year LPR decision; Beijing expected to cut to support demand.", "Global: Monitor bond flows; if EM spreads compress further, we may see record debt issuance into July."]'::jsonb,
  'The structural regime has shifted: The dollar''s monopoly on global reserve status is being challenged by synchronized EM easing, commodity strength, and Fed uncertainty. This is not a cyclical carry trade—it''s the early stages of re-multipolarization.')
ON CONFLICT (week_ending_date) DO NOTHING;

COMMIT;
