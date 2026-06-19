import type { ServerConfig } from '../config.js';
import { getSupabase } from '../lib/supabase.js';
import { formatNumber, todayIso } from '../lib/format.js';

interface ComponentScores {
  liquidity?: number;
  rates?: number;
  dollar?: number;
  vol?: number;
  metals?: number;
}

export async function getRegimeCurrent(config: ServerConfig) {
  const supabase = getSupabase(config);
  const { data, error } = await supabase.from('vw_latest_daily_signal').select('*').limit(1).maybeSingle();

  if (error) throw new Error(`get_regime_current failed: ${error.message}`);
  if (!data) {
    return null;
  }

  let regimeLabel = 'Neutral';
  if (data.regime === 'RISK_ON') regimeLabel = 'Expansion';
  else if (data.regime === 'RISK_OFF') regimeLabel = 'Tightening';

  const components = (data.component_scores ?? {}) as ComponentScores;
  const today = todayIso();
  const isStale = data.signal_date !== today;

  return {
    regime_label: regimeLabel,
    regime_raw: data.regime,
    regime_score: formatNumber(Number(data.score), 1) ?? 0,
    confidence_interval: formatNumber(Number(data.confidence_pct) / 100, 2) ?? 0,
    score_delta: formatNumber(Number(data.score_delta), 1),
    signal_components: {
      volatility: components.vol ?? null,
      rates: components.rates ?? null,
      dollar: components.dollar ?? null,
      metals: components.metals ?? null,
      liquidity: components.liquidity ?? null,
    },
    key_driver: data.key_driver ?? null,
    watch_item: data.watch_item ?? null,
    as_of: data.computed_at ?? data.signal_date,
    signal_date: data.signal_date,
    is_stale: isStale,
    methodology_url: '/methods/regime-scoring',
  };
}