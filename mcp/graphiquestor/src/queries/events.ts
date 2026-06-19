import type { ServerConfig } from '../config.js';
import { getSupabase } from '../lib/supabase.js';
import { addDaysIso, todayIso } from '../lib/format.js';

export interface EventsParams {
  from?: string;
  to?: string;
  type?: string;
}

function inferEventType(name: string, country: string): string {
  const n = name.toUpperCase();
  if (n.includes('FOMC') || n.includes('FED')) return 'FOMC';
  if (n.includes('RBI') || n.includes('MPC')) return 'RBI_MPC';
  if (n.includes('G20')) return 'G20';
  if (n.includes('CPI') || n.includes('GDP') || n.includes('PMI') || n.includes('RETAIL')) return 'DATA_RELEASE';
  if (country === 'US') return 'DATA_RELEASE';
  return 'MACRO_EVENT';
}

export async function getMacroEvents(config: ServerConfig, params: EventsParams) {
  const from = params.from ?? todayIso();
  const to = params.to ?? addDaysIso(30);
  const supabase = getSupabase(config);

  const { data, error } = await supabase
    .from('vw_upcoming_events')
    .select('*')
    .gte('event_date', from)
    .lte('event_date', to)
    .order('event_date', { ascending: true });

  if (error) throw new Error(`get_macro_events failed: ${error.message}`);

  let events = (data ?? []).map((e) => {
    const type = inferEventType(e.event_name ?? '', e.country ?? '');
    return {
      id: e.id ?? `${type}_${e.event_date}`,
      type,
      title: e.event_name,
      date: e.event_date,
      country: e.country,
      impact: (e.impact_level ?? 'medium').toLowerCase(),
      consensus: e.forecast,
      prior: e.previous,
      actual: e.actual,
      surprise: e.surprise,
      source_url: e.source_url,
    };
  });

  if (params.type) {
    const filter = params.type.toUpperCase();
    events = events.filter((e) => e.type === filter);
  }

  return {
    events,
    total: events.length,
    from,
    to,
  };
}