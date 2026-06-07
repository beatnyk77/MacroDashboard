export interface MacroBrief {
  id: string;
  brief_date: string;
  focus_areas: string[];
  content: {
    what_changed: string[];
    regime_status: string;
    focus_observations: string[];
    watch_today: string[];
  };
  regime_score: number | null;
  regime_label: string | null;
  generated_at: string;
}

export type FocusArea = 
  | 'us_macro'
  | 'india'
  | 'china'
  | 'africa'
  | 'energy'
  | 'sovereign_debt'
  | 'gold_dedollarization'
  | 'trade_flows';

export const FOCUS_AREA_LABELS: Record<FocusArea, string> = {
  us_macro:              '🇺🇸 US Macro',
  india:                 '🇮🇳 India',
  china:                 '🇨🇳 China',
  africa:                '🌍 Africa',
  energy:                '⚡ Energy',
  sovereign_debt:        '🏦 Sovereign Debt',
  gold_dedollarization:  '💛 Gold & De-Dollarization',
  trade_flows:           '🔄 Trade Flows',
};
