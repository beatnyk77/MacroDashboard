/**
 * Build-time terminal snapshot for E4 SEO.
 * Writes public/data/terminal-snapshot.json with latest key metric values
 * so prerendered homepage HTML contains real numbers (not "Loading module").
 *
 * Uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY when present.
 * Without env: writes an explicit unavailable snapshot (never fabricates).
 */
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PUBLIC = join(__dirname, '../public/data/terminal-snapshot.json');
const OUT_SRC = join(__dirname, '../src/data/terminal-snapshot.json');

/**
 * Single source of truth for per-metric display scaling, shared with
 * src/utils/formatNumber.ts so the build-time snapshot and the client
 * render can never disagree. Add new metrics to src/data/metric-scales.json,
 * not here.
 */
const METRIC_SCALES = JSON.parse(
  readFileSync(join(__dirname, '../src/data/metric-scales.json'), 'utf8')
);

/** Metric IDs that commonly power the homepage hero / liquidity strip */
const SNAPSHOT_METRICS = [
  'FED_BALANCE_SHEET',
  'RRP_BALANCE_BN',
  'TGA_BALANCE_BN',
  'GOLD_PRICE_USD',
  'DXY_INDEX',
  'UST_10Y_YIELD',
  'VIX_INDEX',
  'BRENT_CRUDE_PRICE',
  'RATIO_M2_GOLD',
  'RATIO_DEBT_GOLD',
];

const LABELS = {
  FED_BALANCE_SHEET: 'Fed Balance Sheet',
  RRP_BALANCE_BN: 'ON RRP',
  TGA_BALANCE_BN: 'TGA',
  GOLD_PRICE_USD: 'Gold',
  DXY_INDEX: 'DXY',
  UST_10Y_YIELD: 'UST 10Y',
  VIX_INDEX: 'VIX',
  BRENT_CRUDE_PRICE: 'Brent',
  RATIO_M2_GOLD: 'M2/Gold',
  RATIO_DEBT_GOLD: 'Debt/Gold',
};

function emptySnapshot(reason) {
  return {
    generatedAt: new Date().toISOString(),
    source: 'build-time',
    available: false,
    reason,
    metrics: [],
  };
}

async function fetchLatest(url, key) {
  const filter = SNAPSHOT_METRICS.map(encodeURIComponent).join(',');
  // Prefer vw_latest_metrics if present
  const endpoint = `${url.replace(/\/$/, '')}/rest/v1/vw_latest_metrics?metric_id=in.(${filter})&select=metric_id,value,as_of_date,staleness_flag,unit`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    // fallback: latest from metric_observations via RPC-less distinct is hard; try raw table
    const obs = await fetch(
      `${url.replace(/\/$/, '')}/rest/v1/metric_observations?metric_id=in.(${filter})&select=metric_id,value,as_of_date&order=as_of_date.desc&limit=200`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
      }
    );
    if (!obs.ok) throw new Error(`Supabase ${res.status} / obs ${obs.status}`);
    const rows = await obs.json();
    const seen = new Set();
    const latest = [];
    for (const r of rows) {
      if (seen.has(r.metric_id)) continue;
      seen.add(r.metric_id);
      latest.push(r);
    }
    return latest;
  }
  return res.json();
}

function formatValue(metricId, value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? '—');
  if (metricId.includes('GOLD') && n > 100) return `$${Math.round(n).toLocaleString()}`;
  const scale = METRIC_SCALES[metricId];
  if (scale) {
    const scaled = n / scale.divisor;
    const [min, max] = scale.sanityRange;
    if (scaled < min || scaled > max) {
      console.warn(
        `Terminal snapshot: ${metricId} resolved to ${scaled.toFixed(2)}${scale.suffix}, outside plausible range [${min}, ${max}]${scale.suffix}. Raw value: ${n}.`
      );
    }
    return `${scaled.toFixed(2)}${scale.suffix}`;
  }
  if (metricId.includes('YIELD') || metricId === 'VIX_INDEX' || metricId === 'DXY_INDEX') return n.toFixed(2);
  if (metricId.includes('RATIO')) return n.toFixed(2);
  if (metricId.includes('BRENT') || metricId.includes('WTI')) return `$${n.toFixed(1)}`;
  return n.toFixed(2);
}

function writeSnap(snap) {
  const body = JSON.stringify(snap, null, 2);
  mkdirSync(dirname(OUT_PUBLIC), { recursive: true });
  mkdirSync(dirname(OUT_SRC), { recursive: true });
  writeFileSync(OUT_PUBLIC, body);
  writeFileSync(OUT_SRC, body);
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('placeholder')) {
    const snap = emptySnapshot('Supabase env not set at build time — UI hydrates live client-side');
    writeSnap(snap);
    console.log(`Terminal snapshot: unavailable (${snap.reason})`);
    return;
  }

  try {
    const rows = await fetchLatest(url, key);
    const metrics = (rows ?? [])
      .filter((r) => r && r.metric_id != null && r.value != null)
      .map((r) => ({
        metricId: r.metric_id,
        label: LABELS[r.metric_id] || r.metric_id,
        value: Number(r.value),
        display: formatValue(r.metric_id, r.value),
        asOf: r.as_of_date || null,
        staleness: r.staleness_flag || null,
        unit: r.unit || null,
      }));

    // stable order
    metrics.sort(
      (a, b) => SNAPSHOT_METRICS.indexOf(a.metricId) - SNAPSHOT_METRICS.indexOf(b.metricId)
    );

    const snap = {
      generatedAt: new Date().toISOString(),
      source: 'vw_latest_metrics',
      available: metrics.length > 0,
      reason: metrics.length ? null : 'No rows returned for snapshot metric set',
      metrics,
    };
    writeSnap(snap);
    console.log(`Terminal snapshot: ${metrics.length} metrics written`);
  } catch (err) {
    const snap = emptySnapshot(`Fetch failed: ${err?.message || err}`);
    writeSnap(snap);
    console.warn(`Terminal snapshot: fetch failed — wrote unavailable. ${err?.message || err}`);
  }
}

main();
