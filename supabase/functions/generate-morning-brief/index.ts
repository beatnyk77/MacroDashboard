import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { serveIngest } from '../_shared/handler.ts';

/**
 * Morning Macro Brief v2 — Signal Pack → Narrative → Store
 *
 * Metric IDs aligned to live metric_observations (METRIC_IDS registry).
 * Paid/reliable models preferred; dense deterministic pack always published
 * even when LLM fails (no thin empty shells).
 */

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
const AIMLAPI_KEY = Deno.env.get('AIMLAPI_KEY');

/** Canonical metric IDs that actually exist in production observations. */
const FOCUS_AREA_CONFIGS: Record<string, { label: string; metric_ids: string[] }> = {
  india: {
    label: 'India Macro',
    metric_ids: [
      'IN_CPI_YOY', 'IN_GDP_GROWTH_YOY', 'IN_FX_RESERVES_USD_BN',
      'IN_GSEC_10Y', 'IN_RBI_REPO', 'IN_INR_USD', 'IN_MFG_PMI',
    ],
  },
  us_macro: {
    label: 'US Macro',
    metric_ids: [
      'US_CPI_YOY', 'US_DEBT_GDP', 'US_DEBT_USD_TN', 'FED_FUNDS_RATE',
      'DXY_INDEX', 'VIX_INDEX', 'RRP_BALANCE_BN', 'TGA_BALANCE_BN',
      'FED_BALANCE_SHEET', 'US_10Y_YIELD', 'DGS10',
    ],
  },
  gold_dedollarization: {
    label: 'Gold & De-Dollarization',
    metric_ids: [
      'GOLD_PRICE_USD', 'RATIO_DEBT_GOLD', 'BIS_GLOBAL_LIQUIDITY_USD_BN',
    ],
  },
  china: {
    label: 'China Macro',
    metric_ids: [
      'CN_GDP_GROWTH_YOY', 'CN_CPI_YOY', 'CN_M2_GROWTH',
      'CN_ICEBERG_RATIO', 'CN_LGFV_STRESS_INDEX', 'CN_MONETIZATION_PRESSURE',
    ],
  },
  energy: {
    label: 'Energy & Commodities',
    metric_ids: [
      'WTI_CRUDE_PRICE', 'BRENT_CRUDE_PRICE', 'COPPER_PRICE_USD',
    ],
  },
  sovereign_debt: {
    label: 'Sovereign Debt',
    metric_ids: [
      'US_DEBT_USD_TN', 'US_DEBT_GDP', 'US_TOTAL_MARKETABLE_DEBT_TN',
      'US_DEBT_MATURING_1Y_TN', 'US_DEBT_MATURING_1Y_PCT',
    ],
  },
};

const DEFAULT_FOCUS_COMBOS: string[][] = [
  ['india', 'us_macro', 'gold_dedollarization'],
  ['india', 'us_macro', 'sovereign_debt'],
  ['india', 'energy', 'gold_dedollarization'],
];

/** Core board always loaded for cross-asset section. */
const CORE_BOARD_IDS = [
  'GOLD_PRICE_USD', 'BRENT_CRUDE_PRICE', 'WTI_CRUDE_PRICE',
  'DXY_INDEX', 'VIX_INDEX', 'BIS_GLOBAL_LIQUIDITY_USD_BN',
  'US_CPI_YOY', 'US_DEBT_USD_TN', 'FED_FUNDS_RATE',
  'RATIO_DEBT_GOLD', 'RRP_BALANCE_BN',
];

interface ObservationPoint {
  metric_id: string;
  value: number | string;
  as_of_date: string;
}

interface LatestMetricPoint {
  metric_id: string;
  value: number;
  prev_value: number;
  week_value: number | null;
  label: string;
  unit: string;
  as_of_date: string;
  delta_1d_pct: number;
  delta_1w_pct: number | null;
}

function marketDateISO(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function humanLabel(id: string, map: Map<string, { name: string; unit: string }>): string {
  return map.get(id)?.name ?? id.replace(/_/g, ' ');
}

function unitOf(id: string, map: Map<string, { name: string; unit: string }>): string {
  return map.get(id)?.unit ?? '';
}

function pctDelta(curr: number, prev: number): number {
  if (!prev || !Number.isFinite(prev) || !Number.isFinite(curr)) return 0;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function fmtVal(v: number, unit: string): string {
  if (!Number.isFinite(v)) return 'n/a';
  const u = (unit || '').toLowerCase();
  if (u.includes('%') || u.includes('pct') || u.includes('yoy')) return `${v.toFixed(2)}%`;
  if (Math.abs(v) >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 1 });
  if (Math.abs(v) >= 100) return v.toFixed(1);
  return v.toFixed(2);
}

function buildSignalPack(
  latestMetrics: LatestMetricPoint[],
  focusIds: string[],
  auctions: Array<{ term: string; bid_to_cover: number; auction_date: string; demand_strength_score: number }>,
  headlines: Array<{ title: string; source?: string }>,
  events: Array<{ title: string; event_date: string }>,
  regime: { label: string; score: number },
) {
  const byId = new Map(latestMetrics.map((m) => [m.metric_id, m]));

  const movers = [...latestMetrics]
    .filter((m) => Math.abs(m.delta_1d_pct) >= 0.15 || (m.delta_1w_pct != null && Math.abs(m.delta_1w_pct) >= 0.5))
    .sort((a, b) => Math.abs(b.delta_1d_pct) - Math.abs(a.delta_1d_pct))
    .slice(0, 10);

  const focusMetrics = focusIds
    .map((id) => byId.get(id))
    .filter((m): m is LatestMetricPoint => !!m);

  const pick = (id: string) => byId.get(id);
  const gold = pick('GOLD_PRICE_USD');
  const brent = pick('BRENT_CRUDE_PRICE') ?? pick('WTI_CRUDE_PRICE');
  const dxy = pick('DXY_INDEX');
  const vix = pick('VIX_INDEX');
  const liq = pick('BIS_GLOBAL_LIQUIDITY_USD_BN');
  const debt = pick('US_DEBT_USD_TN');

  const cross_asset = {
    rates: debt ? `US debt $${fmtVal(debt.value, debt.unit)}T as-of ${debt.as_of_date}` : 'US rates/debt n/a',
    fx: dxy ? `DXY ${fmtVal(dxy.value, '')} (${dxy.delta_1d_pct >= 0 ? '+' : ''}${dxy.delta_1d_pct.toFixed(2)}% d/d, ${dxy.as_of_date})` : 'DXY n/a',
    equity_vol: vix ? `VIX ${fmtVal(vix.value, '')} (${vix.as_of_date})` : 'VIX n/a',
    gold: gold ? `Gold $${fmtVal(gold.value, gold.unit)} (${gold.delta_1d_pct >= 0 ? '+' : ''}${gold.delta_1d_pct.toFixed(2)}% d/d, ${gold.as_of_date})` : 'Gold n/a',
    oil: brent ? `Crude $${fmtVal(brent.value, brent.unit)} (${brent.delta_1d_pct >= 0 ? '+' : ''}${brent.delta_1d_pct.toFixed(2)}% d/d, ${brent.as_of_date})` : 'Oil n/a',
    liquidity: liq ? `Global liq ${fmtVal(liq.value, 'bn')} bn (${liq.as_of_date})` : 'Liquidity n/a',
  };

  const auctionLines = auctions.slice(0, 5).map(
    (a) => `${a.term} BTC ${a.bid_to_cover.toFixed(2)}x score ${a.demand_strength_score.toFixed(2)} (${a.auction_date})`,
  );

  const stale = latestMetrics.filter((m) => {
    const age = (Date.now() - new Date(m.as_of_date).getTime()) / 86400000;
    return age > 14;
  }).map((m) => m.metric_id);

  return {
    regime,
    movers,
    focusMetrics,
    cross_asset,
    auctionLines,
    headlines: headlines.slice(0, 5).map((h) => h.title),
    events: events.slice(0, 5),
    data_quality: {
      fresh_count: latestMetrics.length - stale.length,
      total: latestMetrics.length,
      stale_metrics: stale.slice(0, 12),
    },
  };
}

function denseTemplateFromPack(pack: ReturnType<typeof buildSignalPack>, focusLabels: string) {
  const what_changed = pack.movers.slice(0, 6).map((m) => {
    const dir = m.delta_1d_pct >= 0 ? '↑' : '↓';
    return `${m.label} ${dir} ${fmtVal(m.value, m.unit)} (${m.delta_1d_pct >= 0 ? '+' : ''}${m.delta_1d_pct.toFixed(2)}% d/d, as-of ${m.as_of_date}) — ${m.delta_1d_pct >= 0 ? 'higher print' : 'softer print'} vs prior session`;
  });

  if (pack.auctionLines[0]) {
    what_changed.push(`Treasury auction: ${pack.auctionLines[0]}`);
  }
  if (what_changed.length === 0) {
    what_changed.push(
      `Regime ${pack.regime.label} at ${pack.regime.score}/100 — board stable; limited high-frequency moves overnight`,
    );
  }

  const focus_observations = pack.focusMetrics.slice(0, 5).map(
    (m) => `${m.label}: ${fmtVal(m.value, m.unit)} as-of ${m.as_of_date} (${m.delta_1d_pct >= 0 ? '+' : ''}${m.delta_1d_pct.toFixed(2)}% d/d)`,
  );
  while (focus_observations.length < 3) {
    focus_observations.push(`Monitoring ${focusLabels} — awaiting higher-frequency prints`);
  }

  const watch_today = pack.events.slice(0, 3).map(
    (e) => `${e.title} (${e.event_date})`,
  );
  if (watch_today.length === 0) {
    watch_today.push(
      'US session open — watch DXY, 10Y, and equity vol path',
      'Energy complex — confirm WTI/Brent as_of advances on trading days',
      'Treasury calendar — next bill/note auction bid-to-cover vs prior',
    );
  }

  const thesis =
    `${pack.regime.label} regime (${pack.regime.score}/100): ` +
    `${pack.cross_asset.gold}; ${pack.cross_asset.oil}; ${pack.cross_asset.fx}.`;

  return {
    thesis,
    what_changed,
    regime_status:
      `Regime ${pack.regime.label} at score ${pack.regime.score}/100. ` +
      `Cross-asset: ${pack.cross_asset.gold}; ${pack.cross_asset.oil}; ${pack.cross_asset.fx}; ${pack.cross_asset.equity_vol}. ` +
      `Liquidity: ${pack.cross_asset.liquidity}. Positioning should respect dated telemetry — stale metrics are flagged in data_quality.`,
    focus_observations,
    watch_today,
    cross_asset: pack.cross_asset,
    risks: [
      pack.data_quality.stale_metrics.length
        ? `Data quality: ${pack.data_quality.stale_metrics.length} metrics >14d old`
        : 'Telemetry freshness acceptable for daily board',
      pack.auctionLines[0] ? `Auction path: ${pack.auctionLines[0]}` : 'No recent benchmark auction in pack',
    ],
    data_quality: pack.data_quality,
  };
}

serveIngest('generate-morning-brief', async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const today = marketDateISO();
    const insertErrors: string[] = [];

    const etWeekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
    }).format(new Date());
    if (etWeekday === 'Sat' || etWeekday === 'Sun') {
      return {
        ok: true,
        message: `Weekend skip (${etWeekday} ET) — weekday deep briefs only`,
        counts: { upserted: 0, skipped: 1, errors: 0 },
      };
    }

    // Regime
    const { data: regimeData } = await supabase
      .from('metric_observations')
      .select('metric_id, value, as_of_date')
      .in('metric_id', ['regime_label', 'regime_score', 'regime_confidence'])
      .order('as_of_date', { ascending: false })
      .limit(6);

    const typedRegime = (regimeData ?? []) as ObservationPoint[];
    let label = typedRegime.find((r) => r.metric_id === 'regime_label')?.value;
    let score = typedRegime.find((r) => r.metric_id === 'regime_score')?.value;

    if (!label || !score) {
      const { data: signalData } = await supabase
        .from('daily_signal')
        .select('regime, score')
        .order('signal_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (signalData) {
        label = label ?? (signalData as any).regime;
        score = score ?? (signalData as any).score;
      }
    }

    const regime = {
      label: String(label ?? 'Neutral'),
      score: Math.round(Number(score ?? 55)),
    };

    // Observations — 30d for week-ago deltas
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateLimit = thirtyDaysAgo.toISOString().split('T')[0];

    const allFocusIds = [
      ...new Set([
        ...CORE_BOARD_IDS,
        ...Object.values(FOCUS_AREA_CONFIGS).flatMap((c) => c.metric_ids),
      ]),
    ];

    const { data: observations } = await supabase
      .from('metric_observations')
      .select('metric_id, value, as_of_date')
      .in('metric_id', allFocusIds)
      .gte('as_of_date', dateLimit)
      .order('as_of_date', { ascending: false })
      .limit(5000);

    const { data: metricsInfo } = await supabase
      .from('metrics')
      .select('id, name, unit')
      .in('id', allFocusIds);

    const metricsMap = new Map<string, { name: string; unit: string }>();
    for (const m of metricsInfo ?? []) {
      metricsMap.set((m as any).id, {
        name: (m as any).name ?? (m as any).id,
        unit: (m as any).unit ?? '',
      });
    }

    const metricGroups: Record<string, { value: number; as_of_date: string }[]> = {};
    for (const obs of (observations ?? []) as ObservationPoint[]) {
      if (!metricGroups[obs.metric_id]) metricGroups[obs.metric_id] = [];
      metricGroups[obs.metric_id].push({
        value: Number(obs.value),
        as_of_date: String(obs.as_of_date),
      });
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const latestMetrics: LatestMetricPoint[] = Object.entries(metricGroups).map(([metric_id, history]) => {
      history.sort((a, b) => b.as_of_date.localeCompare(a.as_of_date));
      const latest = history[0];
      const prev = history[1] ?? latest;
      const weekPoint = history.find((h) => h.as_of_date <= weekAgoStr) ?? null;
      const d1 = pctDelta(latest.value, prev.value);
      const d7 = weekPoint ? pctDelta(latest.value, weekPoint.value) : null;
      return {
        metric_id,
        value: latest.value,
        prev_value: prev.value,
        week_value: weekPoint?.value ?? null,
        label: humanLabel(metric_id, metricsMap),
        unit: unitOf(metric_id, metricsMap),
        as_of_date: latest.as_of_date,
        delta_1d_pct: d1,
        delta_1w_pct: d7,
      };
    });

    // Auctions
    const { data: auctionRows } = await supabase
      .from('us_treasury_auctions')
      .select('term, bid_to_cover, auction_date, demand_strength_score')
      .order('auction_date', { ascending: false })
      .limit(20);

    // Headlines (best-effort)
    let headlines: Array<{ title: string }> = [];
    try {
      const { data: hl } = await supabase
        .from('macro_news_headlines')
        .select('title')
        .order('published_at', { ascending: false })
        .limit(8);
      headlines = (hl ?? []) as Array<{ title: string }>;
    } catch {
      try {
        const { data: hl2 } = await supabase
          .from('news_headlines')
          .select('title')
          .order('created_at', { ascending: false })
          .limit(8);
        headlines = (hl2 ?? []) as Array<{ title: string }>;
      } catch { /* optional tables */ }
    }

    // Events (best-effort)
    let events: Array<{ title: string; event_date: string }> = [];
    try {
      const { data: ev } = await supabase
        .from('macro_events')
        .select('title, event_date')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(8);
      events = (ev ?? []) as Array<{ title: string; event_date: string }>;
    } catch { /* optional */ }

    let briefsWritten = 0;

    for (const focusCombo of DEFAULT_FOCUS_COMBOS) {
      const sortedCombo = [...focusCombo].sort();
      const focusKey = sortedCombo.join(',');

      const { data: existing, error: existingErr } = await supabase
        .from('daily_macro_briefs')
        .select('id')
        .eq('brief_date', today)
        .contains('focus_areas', focusCombo)
        .maybeSingle();

      if (existingErr) {
        insertErrors.push(`existing_check_error[${focusKey}]: ${JSON.stringify(existingErr)}`);
      }
      if (existing) {
        insertErrors.push(`skipped[${focusKey}]: already exists`);
        continue;
      }

      const focusMetricIds = focusCombo.flatMap(
        (area) => FOCUS_AREA_CONFIGS[area]?.metric_ids ?? [],
      );
      const focusLabels = focusCombo
        .map((area) => FOCUS_AREA_CONFIGS[area]?.label ?? area)
        .join(', ');

      const pack = buildSignalPack(
        latestMetrics,
        focusMetricIds,
        (auctionRows ?? []) as any[],
        headlines,
        events,
        regime,
      );

      const packSummary = {
        regime: pack.regime,
        cross_asset: pack.cross_asset,
        movers: pack.movers.slice(0, 8).map((m) => ({
          label: m.label,
          value: m.value,
          unit: m.unit,
          as_of: m.as_of_date,
          d1_pct: Number(m.delta_1d_pct.toFixed(3)),
          d7_pct: m.delta_1w_pct != null ? Number(m.delta_1w_pct.toFixed(3)) : null,
        })),
        focus: pack.focusMetrics.map((m) => ({
          label: m.label,
          value: m.value,
          unit: m.unit,
          as_of: m.as_of_date,
          d1_pct: Number(m.delta_1d_pct.toFixed(3)),
        })),
        auctions: pack.auctionLines,
        headlines: pack.headlines,
        events: pack.events,
        data_quality: pack.data_quality,
      };

      let content = denseTemplateFromPack(pack, focusLabels);
      let tokensUsed = 0;
      let modelUsed = 'signal-pack-template-v2';

      const prompt = `You are GraphiQuestor's macro intelligence engine for institutional analysts.

Produce a Morning Macro Brief for ${today} (America/New_York session).
Focus areas: ${focusLabels}

Signal pack (JSON — treat as ground truth; never invent numbers):
${JSON.stringify(packSummary, null, 2)}

Return ONLY valid JSON (no markdown fences):
{
  "thesis": "1 sentence regime thesis with at least one hard number and date",
  "what_changed": ["4-6 bullets: METRIC moved ↑/↓ — institutional interpretation. Include value, % change, as_of date"],
  "regime_status": "3-5 sentences on regime, cross-asset confirmation/divergence, and positioning implication",
  "focus_observations": ["4 observations specific to focus areas with numbers and as_of"],
  "watch_today": ["3 specific monitors with times in ET when known"],
  "risks": ["2-3 concrete risks"]
}

Rules:
- Senior sovereign-wealth tone. No hedging fluff. No retail language.
- Every bullet must cite a number from the pack or say data missing.
- Do not invent auctions, prints, or dates not in the pack.
- Prefer multi-horizon context (d/d and 1w) when pack provides it.`;

      // Provider chain: paid-quality first when keys exist
      type Provider = { name: string; url: string; key: string; model: string; max_tokens: number };
      const providers: Provider[] = [];

      if (OPENROUTER_API_KEY) {
        providers.push(
          {
            name: 'OpenRouter',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            key: OPENROUTER_API_KEY,
            model: 'openai/gpt-4o-mini',
            max_tokens: 1600,
          },
          {
            name: 'OpenRouter',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            key: OPENROUTER_API_KEY,
            model: 'google/gemini-2.0-flash-001',
            max_tokens: 1600,
          },
          {
            name: 'OpenRouter',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            key: OPENROUTER_API_KEY,
            model: 'meta-llama/llama-3.3-70b-instruct',
            max_tokens: 1400,
          },
          {
            name: 'OpenRouter',
            url: 'https://openrouter.ai/api/v1/chat/completions',
            key: OPENROUTER_API_KEY,
            model: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
            max_tokens: 1200,
          },
        );
      }
      if (AIMLAPI_KEY) {
        providers.unshift({
          name: 'AIMLAPI',
          url: 'https://api.aimlapi.com/v1/chat/completions',
          key: AIMLAPI_KEY,
          model: 'gpt-4o-mini',
          max_tokens: 1600,
        });
      }

      for (const provider of providers) {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider.key}`,
          };
          if (provider.name === 'OpenRouter') {
            headers['HTTP-Referer'] = 'https://graphiquestor.com';
            headers['X-Title'] = 'GraphiQuestor Morning Brief';
          }

          const response = await fetch(provider.url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model: provider.model,
              max_tokens: provider.max_tokens,
              temperature: 0.35,
              messages: [{ role: 'user', content: prompt }],
            }),
          });

          if (!response.ok) {
            console.warn(`[brief] ${provider.name}/${provider.model} HTTP ${response.status}`);
            continue;
          }

          const result = await response.json();
          tokensUsed = result.usage?.total_tokens ?? 0;
          const rawText = result.choices?.[0]?.message?.content ?? '';
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) continue;
          const parsed = JSON.parse(jsonMatch[0]);
          if (
            parsed.what_changed &&
            parsed.regime_status &&
            parsed.focus_observations &&
            parsed.watch_today
          ) {
            content = {
              ...content,
              thesis: parsed.thesis ?? content.thesis,
              what_changed: parsed.what_changed,
              regime_status: parsed.regime_status,
              focus_observations: parsed.focus_observations,
              watch_today: parsed.watch_today,
              risks: parsed.risks ?? content.risks,
              cross_asset: content.cross_asset,
              data_quality: content.data_quality,
            };
            modelUsed = result.model ?? provider.model;
            console.log(`[brief] LLM success via ${provider.name}/${modelUsed}`);
            break;
          }
        } catch (e) {
          console.warn(`[brief] provider fail ${provider.model}:`, (e as Error).message);
        }
      }

      // Quality floor: if LLM returned thin bullets, merge pack movers in
      if (!Array.isArray(content.what_changed) || content.what_changed.length < 3) {
        content = denseTemplateFromPack(pack, focusLabels);
        modelUsed = `${modelUsed}+pack-boost`;
      }

      const insertPayload = {
        brief_date: today,
        focus_areas: sortedCombo,
        content,
        regime_score: regime.score,
        regime_label: regime.label,
        model_used: modelUsed,
        tokens_used: tokensUsed,
      };

      const { error: insertErr } = await supabase
        .from('daily_macro_briefs')
        .insert(insertPayload);

      if (insertErr) {
        const errStr = `insert_error[${focusKey}]: code=${insertErr.code} msg=${insertErr.message}`;
        console.error(errStr);
        insertErrors.push(errStr);
      } else {
        briefsWritten++;
        console.log(`Brief saved for ${today} [${focusKey}] model=${modelUsed}`);
      }
    }

    const skipped = insertErrors.filter((e) => e.startsWith('skipped[')).length;
    const hardErrors = insertErrors.filter((e) => !e.startsWith('skipped[')).length;

    if (briefsWritten === 0 && hardErrors > 0) {
      return {
        ok: false,
        error: `No briefs written for ${today}. errors=${hardErrors} detail=${insertErrors.slice(0, 5).join(' | ')}`,
        counts: { upserted: 0, skipped, errors: hardErrors },
        meta: { brief_date: today, insertErrors },
      };
    }

    if (briefsWritten === 0 && skipped === 0) {
      return {
        ok: false,
        error: `No briefs written for ${today} and nothing was skipped`,
        counts: { upserted: 0, skipped: 0, errors: hardErrors },
        meta: { brief_date: today, insertErrors },
      };
    }

    return {
      ok: true,
      counts: { upserted: briefsWritten, skipped, errors: hardErrors },
      meta: {
        brief_date: today,
        version: 'signal-pack-v2',
        insertErrors: insertErrors.length ? insertErrors : undefined,
      },
    };
  } catch (err) {
    console.error('Brief generation error:', err);
    return { ok: false, error: String(err) };
  }
});
