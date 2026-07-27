/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
/**
 * generate-monthly-regime-digest
 *
 * Default path is rules-only (no LLM). Builds a structured Monthly Regime Notebook
 * via pure helpers in `_shared/regime-digest/notebook.ts`, freezes month-end regime
 * from `daily_signal`, and upserts `monthly_regime_digests`.
 *
 * Optional: body.use_llm === true re-enables the legacy OpenRouter/AIMLAPI narrative
 * path (non-critical; failure falls back to notebook rules output).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { runWithRetry } from '../_shared/job-runner.ts';
import { serveIngest, IngestResult } from '../_shared/handler.ts';
import {
  DIGEST_METRICS,
  buildNotebookPayload,
  subjectFromPayload,
  plainTextFromPayload,
  htmlFromPayload,
  metricsSnapshotFromBoard,
  lastDayOfMonth,
  isRegimeLabel,
  type RawMetricPoint,
  type NotebookRegime,
  type RegimeLabel,
  type NotebookPayload,
} from '../_shared/regime-digest/notebook.ts';

// ─── Date helpers ────────────────────────────────────────────────────────────

function currentYearMonthUTC(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** List YYYY-MM from start (inclusive) through end (inclusive). */
function monthRange(fromYm: string, toYm: string): string[] {
  const out: string[] = [];
  const [fy, fm] = fromYm.split('-').map(Number);
  const [ty, tm] = toYm.split('-').map(Number);
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    if (out.length > 36) break;
  }
  return out;
}

/** First calendar day of (year_month − nMonths), as YYYY-MM-DD. */
function monthsBeforeStart(ym: string, nMonths: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 - nMonths, 1));
  return d.toISOString().slice(0, 10);
}

/**
 * As-of clock for validation: wall clock for current month, day-after month-end
 * for historical editions so catch-up does not mass-stale frozen data.
 */
function resolveNow(yearMonth: string): Date {
  const end = lastDayOfMonth(yearMonth);
  const freeze = new Date(`${end}T23:59:59.999Z`);
  const wall = new Date();
  if (yearMonth < currentYearMonthUTC(wall)) {
    return new Date(freeze.getTime() + 24 * 60 * 60 * 1000);
  }
  return wall;
}

// ─── Data loaders ────────────────────────────────────────────────────────────

async function fetchMetricPoints(
  supabase: SupabaseClient,
  yearMonth: string,
): Promise<RawMetricPoint[]> {
  const metricIds = DIGEST_METRICS.map((m) => m.id);
  const fromDate = monthsBeforeStart(yearMonth, 24);

  const { data, error } = await supabase
    .from('metric_observations')
    .select('metric_id, value, as_of_date')
    .in('metric_id', metricIds)
    .gte('as_of_date', fromDate)
    .order('as_of_date', { ascending: false });

  if (error) {
    console.warn(`[monthly-digest] metric_observations query error: ${error.message}`);
    return [];
  }

  const points: RawMetricPoint[] = [];
  for (const row of data ?? []) {
    const v = Number((row as any).value);
    const asOf = String((row as any).as_of_date ?? '');
    const id = String((row as any).metric_id ?? '');
    if (!id || !asOf || !Number.isFinite(v)) continue;
    points.push({ id, value: v, asOf });
  }
  return points;
}

/**
 * Freeze regime at month-end from daily_signal.
 * daysInRegime = consecutive prior rows (desc by signal_date) sharing the same label.
 */
async function freezeRegime(
  supabase: SupabaseClient,
  yearMonth: string,
): Promise<NotebookRegime> {
  const lastDay = lastDayOfMonth(yearMonth);
  const lookback = monthsBeforeStart(yearMonth, 6);

  const { data, error } = await supabase
    .from('daily_signal')
    .select('signal_date, regime, score, confidence_pct')
    .lte('signal_date', lastDay)
    .gte('signal_date', lookback)
    .order('signal_date', { ascending: false })
    .limit(200);

  if (error) {
    console.warn(`[monthly-digest] daily_signal query error: ${error.message}`);
  }

  const rows = (data ?? []) as Array<{
    signal_date: string;
    regime: string;
    score: number | null;
    confidence_pct: number | null;
  }>;

  if (rows.length === 0) {
    return {
      label: 'NEUTRAL',
      confidence: null,
      daysInRegime: null,
      compositeScore: null,
      regimeSource: 'default',
    };
  }

  const head = rows[0];
  const label: RegimeLabel = isRegimeLabel(head.regime) ? head.regime : 'NEUTRAL';

  let daysInRegime = 0;
  for (const row of rows) {
    if (row.regime === label) daysInRegime += 1;
    else break;
  }

  const conf = head.confidence_pct != null && Number.isFinite(Number(head.confidence_pct))
    ? Number(head.confidence_pct)
    : null;
  const score = head.score != null && Number.isFinite(Number(head.score))
    ? Number(head.score)
    : null;

  return {
    label,
    confidence: conf,
    daysInRegime,
    compositeScore: score,
    regimeSource: 'frozen',
  };
}

async function fetchHistory(
  supabase: SupabaseClient,
  yearMonth: string,
): Promise<{ yearMonth: string; regime: RegimeLabel }[]> {
  const { data, error } = await supabase
    .from('monthly_regime_digests')
    .select('year_month, notebook_payload')
    .lt('year_month', yearMonth)
    .order('year_month', { ascending: false })
    .limit(12);

  if (error) {
    console.warn(`[monthly-digest] history query error: ${error.message}`);
    return [];
  }

  const out: { yearMonth: string; regime: RegimeLabel }[] = [];
  for (const row of data ?? []) {
    const ym = String((row as any).year_month ?? '');
    const payload = (row as any).notebook_payload;
    const label = payload?.regime?.label;
    if (ym && isRegimeLabel(label)) {
      out.push({ yearMonth: ym, regime: label });
    }
  }
  // chronological for consumers
  return out.reverse();
}

async function fetchBriefLinks(
  supabase: SupabaseClient,
  yearMonth: string,
): Promise<{ date: string; url: string; title: string }[]> {
  const lastDay = lastDayOfMonth(yearMonth);
  const { data, error } = await supabase
    .from('daily_macro_briefs')
    .select('brief_date, regime_label')
    .gte('brief_date', `${yearMonth}-01`)
    .lte('brief_date', lastDay)
    .order('brief_date', { ascending: true });

  if (error) {
    console.warn(`[monthly-digest] daily_macro_briefs query error: ${error.message}`);
    return [];
  }

  // Dedupe by date (keep first)
  const seen = new Set<string>();
  const links: { date: string; url: string; title: string }[] = [];
  for (const row of data ?? []) {
    const date = String((row as any).brief_date ?? '');
    if (!date || seen.has(date)) continue;
    seen.add(date);
    const regime = (row as any).regime_label;
    const title = regime
      ? `Morning Brief ${date} · ${regime}`
      : `Morning Brief ${date}`;
    links.push({ date, url: `/macro-brief/${date}/`, title });
  }
  return links;
}

async function countEditions(
  supabase: SupabaseClient,
  yearMonth: string,
): Promise<number | null> {
  const { count, error } = await supabase
    .from('monthly_regime_digests')
    .select('year_month', { count: 'exact', head: true })
    .lte('year_month', yearMonth);

  if (error) {
    console.warn(`[monthly-digest] edition count error: ${error.message}`);
    return null;
  }
  // +1 if this month is not yet stored (new edition)
  const { data: existing } = await supabase
    .from('monthly_regime_digests')
    .select('year_month')
    .eq('year_month', yearMonth)
    .maybeSingle();

  const base = count ?? 0;
  if (existing) return base;
  return base + 1;
}

async function existingQuality(
  supabase: SupabaseClient,
  yearMonth: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('monthly_regime_digests')
    .select('notebook_payload')
    .eq('year_month', yearMonth)
    .maybeSingle();
  const overall = (data as any)?.notebook_payload?.quality?.overall;
  return typeof overall === 'string' ? overall : null;
}

// ─── Optional LLM (gated) ────────────────────────────────────────────────────

function extractJSON(raw: string): unknown {
  try {
    return JSON.parse(raw.trim());
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch { /* fall through */ }
    }
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch { /* fall through */ }
    }
    throw new Error('Could not extract valid JSON from AI response');
  }
}

/**
 * Optional narrative overlay. Never required for success.
 * Returns null on any failure.
 */
async function tryLlmNarrative(
  yearMonth: string,
  payload: NotebookPayload,
): Promise<{ subject_line: string; html_content: string; plain_text: string } | null> {
  const openrouterKey = Deno.env.get('OPENROUTER_API_KEY') ?? '';
  const aimlapiKey = Deno.env.get('AIMLAPI_KEY') ?? '';
  if (!openrouterKey && !aimlapiKey) {
    console.warn('[monthly-digest] use_llm requested but no provider keys configured');
    return null;
  }

  const systemPrompt = `You are an elite macro strategist for GraphiQuestor.
Given a structured Monthly Regime Notebook JSON, produce a polished institutional narrative.

Return a JSON object with this exact schema (no markdown, pure JSON):
{
  "subject_line": "A compelling 5-8 word subject line summarizing the monthly regime",
  "html_content": "Full report as clean semantic HTML. Use <h2>/<h3>/<p>/<ul>/<li>/<strong>. No <html>/<body>.",
  "plain_text": "Full report as plain text without HTML"
}`;

  const userPrompt = `Notebook payload for ${yearMonth}:
${JSON.stringify({
    yearMonth: payload.yearMonth,
    regime: payload.regime,
    thesis: payload.thesis,
    movers: payload.movers,
    positioning: payload.positioning,
    quality: payload.quality,
    board: payload.board.map((r) => ({
      id: r.id,
      name: r.name,
      level: r.level,
      deltaPct: r.deltaPct,
      status: r.status,
      asOf: r.asOf,
    })),
  }, null, 2)}

Generate the Monthly Regime Digest narrative. Return only the JSON object.`;

  interface Provider {
    name: string;
    url: string;
    key: string;
    model: string;
    supportsJsonMode: boolean;
  }

  const providers: Provider[] = [];
  if (openrouterKey) {
    providers.push({
      name: 'OpenRouter',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: openrouterKey,
      model: 'deepseek/deepseek-r1:free',
      supportsJsonMode: false,
    });
    providers.push({
      name: 'OpenRouter',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: openrouterKey,
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      supportsJsonMode: false,
    });
  }
  if (aimlapiKey) {
    providers.push({
      name: 'AIMLAPI',
      url: 'https://api.aimlapi.com/v1/chat/completions',
      key: aimlapiKey,
      model: 'gpt-4o-mini',
      supportsJsonMode: true,
    });
  }

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      console.log(`[monthly-digest] LLM attempt ${i + 1}/${providers.length}: ${provider.name}/${provider.model}`);
      const headers: Record<string, string> = {
        Authorization: `Bearer ${provider.key}`,
        'Content-Type': 'application/json',
      };
      if (provider.name === 'OpenRouter') {
        headers['HTTP-Referer'] = 'https://graphiquestor.com';
        headers['X-Title'] = 'GraphiQuestor Monthly Regime Digest';
      }
      const requestBody: Record<string, unknown> = {
        model: provider.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 4096,
      };
      if (provider.supportsJsonMode) {
        requestBody.response_format = { type: 'json_object' };
      }
      const response = await fetch(provider.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`${provider.name} ${response.status}: ${errBody.substring(0, 200)}`);
      }
      const completion = await response.json();
      if (completion.error) {
        throw new Error(`${provider.name}: ${completion.error.message || JSON.stringify(completion.error)}`);
      }
      const rawContent = completion.choices?.[0]?.message?.content ?? '';
      const parsed = extractJSON(rawContent) as any;
      if (!parsed?.subject_line || !parsed?.html_content || !parsed?.plain_text) {
        throw new Error('Incomplete LLM JSON');
      }
      console.log(`[monthly-digest] LLM success via ${provider.name}`);
      return {
        subject_line: String(parsed.subject_line),
        html_content: String(parsed.html_content),
        plain_text: String(parsed.plain_text),
      };
    } catch (err: any) {
      console.warn(`[monthly-digest] LLM attempt failed: ${err.message}`);
    }
  }
  return null;
}

// ─── Core generator ──────────────────────────────────────────────────────────

export interface GenerateResult {
  ok: boolean;
  error?: string;
  year_month?: string;
  rows_inserted?: number;
  metadata?: Record<string, unknown>;
}

async function doGenerateDigest(
  supabaseClient: SupabaseClient,
  targetYearMonth?: string,
  useLlm = false,
): Promise<GenerateResult> {
  const year_month = targetYearMonth || currentYearMonthUTC();
  console.log(`[monthly-digest] Generating notebook for ${year_month} (rules-only default; use_llm=${useLlm})...`);

  const now = resolveNow(year_month);

  const [points, regime, history, briefLinks, editionNumber] = await Promise.all([
    fetchMetricPoints(supabaseClient, year_month),
    freezeRegime(supabaseClient, year_month),
    fetchHistory(supabaseClient, year_month),
    fetchBriefLinks(supabaseClient, year_month),
    countEditions(supabaseClient, year_month),
  ]);

  const payload = buildNotebookPayload({
    yearMonth: year_month,
    now,
    points,
    regime,
    history,
    briefLinks,
    editionNumber,
  });

  if (payload.quality.overall === 'blocked') {
    const prior = await existingQuality(supabaseClient, year_month);
    if (prior === 'ok' || prior === 'partial') {
      console.warn(
        `[monthly-digest] blocked quality for ${year_month}; preserving existing ${prior} row`,
      );
    } else {
      console.warn(`[monthly-digest] blocked quality for ${year_month}; no upsert`);
    }
    return {
      ok: false,
      error: 'blocked quality',
      year_month,
      metadata: { quality: payload.quality, preserved_existing: prior },
    };
  }

  let subject_line = subjectFromPayload(payload);
  let html_content = htmlFromPayload(payload);
  let plain_text = plainTextFromPayload(payload);
  let llmUsed = false;

  if (useLlm) {
    const narrative = await tryLlmNarrative(year_month, payload);
    if (narrative) {
      subject_line = narrative.subject_line;
      html_content = narrative.html_content;
      plain_text = narrative.plain_text;
      llmUsed = true;
    }
  }

  const metrics_snapshot = metricsSnapshotFromBoard(payload.board);

  const { error: dbError } = await supabaseClient.from('monthly_regime_digests').upsert(
    {
      year_month,
      subject_line,
      html_content,
      plain_text,
      metrics_snapshot,
      notebook_payload: payload,
      generated_at: new Date().toISOString(),
    },
    { onConflict: 'year_month' },
  );

  if (dbError) throw dbError;

  return {
    ok: true,
    year_month,
    rows_inserted: 1,
    metadata: {
      engine: 'rules',
      quality: payload.quality.overall,
      regime: payload.regime.label,
      llm_used: llmUsed,
      metric_points: points.length,
      brief_links: briefLinks.length,
    },
  };
}

// ─── HTTP entry ──────────────────────────────────────────────────────────────

serveIngest('generate-monthly-regime-digest', async (req: Request): Promise<IngestResult> => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  let targetYearMonth: string | undefined;
  let catchUp = false;
  let useLlm = false;
  let force = false;
  try {
    const body = await req.json();
    targetYearMonth = body.year_month;
    catchUp = body.catch_up === true || body.catchUp === true;
    useLlm = body.use_llm === true || body.useLlm === true;
    force = body.force === true;
  } catch (_e) {
    // body optional
  }

  try {
    const url = new URL(req.url);
    if (url.searchParams.get('catch_up') === '1' || url.searchParams.get('catch_up') === 'true') {
      catchUp = true;
    }
    if (!targetYearMonth && url.searchParams.get('year_month')) {
      targetYearMonth = url.searchParams.get('year_month') ?? undefined;
    }
    if (url.searchParams.get('use_llm') === '1' || url.searchParams.get('use_llm') === 'true') {
      useLlm = true;
    }
    if (url.searchParams.get('force') === '1' || url.searchParams.get('force') === 'true') {
      force = true;
    }
  } catch { /* ignore */ }

  // Catch-up: fill missing months (or force-rebuild all) from first archive edition through current UTC month.
  if (catchUp && !targetYearMonth) {
    const nowYm = currentYearMonthUTC();
    const { data: existing } = await supabaseClient
      .from('monthly_regime_digests')
      .select('year_month')
      .order('year_month', { ascending: true });

    const have = new Set((existing ?? []).map((r: { year_month: string }) => r.year_month));
    // First archive edition for notebook_v1 catch-up / force rebuild.
    const start = '2026-02';
    const window = monthRange(start, nowYm);
    // force=true regenerates every month in window (rebuild notebook_payload even if row exists).
    const needed = force ? window : window.filter((ym) => !have.has(ym));

    let upserted = 0;
    const generated: string[] = [];
    const errors: string[] = [];

    for (const ym of needed) {
      try {
        const result = await runWithRetry(
          `generate-monthly-regime-digest:${ym}`,
          () => doGenerateDigest(supabaseClient, ym, useLlm),
          { timeoutMs: 10 * 60 * 1000, maxRetries: 1 },
        );
        if (!result.ok) {
          errors.push(`${ym}: ${result.error}`);
          continue;
        }
        const v = result.value;
        if (v && v.ok === false) {
          errors.push(`${ym}: ${v.error ?? 'blocked quality'}`);
          continue;
        }
        upserted += 1;
        generated.push(ym);
      } catch (e: any) {
        errors.push(`${ym}: ${e.message}`);
      }
    }

    // Ensure current month exists (retry if missing and not yet generated).
    // force already walks full window including nowYm, so skip double-run.
    if (!force && !have.has(nowYm) && !generated.includes(nowYm)) {
      const result = await runWithRetry(
        'generate-monthly-regime-digest:current',
        () => doGenerateDigest(supabaseClient, nowYm, useLlm),
        { timeoutMs: 10 * 60 * 1000, maxRetries: 1 },
      );
      if (result.ok && result.value?.ok !== false) {
        upserted += 1;
        generated.push(nowYm);
      } else {
        const err = result.error ?? result.value?.error;
        if (err) errors.push(`${nowYm}: ${err}`);
      }
    }

    if (upserted === 0 && errors.length > 0) {
      return {
        ok: false,
        error: `Catch-up produced 0 digests. ${errors.slice(0, 5).join(' | ')}`,
        counts: { upserted: 0, errors: errors.length },
        meta: { mode: 'catch_up', force, start, needed, errors },
      };
    }

    return {
      ok: true,
      counts: { upserted, skipped: needed.length - upserted, errors: errors.length },
      meta: {
        mode: 'catch_up',
        force,
        start,
        generated,
        needed,
        errors: errors.length ? errors : undefined,
      },
    };
  }

  const result = await runWithRetry(
    'generate-monthly-regime-digest',
    () => doGenerateDigest(supabaseClient, targetYearMonth, useLlm),
    { timeoutMs: 10 * 60 * 1000, maxRetries: 1 },
  );

  if (!result.ok) {
    throw new Error(`Digest generation failed: ${result.error}`);
  }

  const _v = result.value!;
  if (_v && typeof _v.ok === 'boolean') {
    if (!_v.ok) {
      return {
        ok: false,
        error: _v.error ?? 'blocked quality',
        meta: _v.metadata ?? { year_month: _v.year_month },
      };
    }
    return {
      ok: true,
      counts: { upserted: _v.rows_inserted ?? 1 },
      meta: _v.metadata ?? { year_month: _v.year_month },
    };
  }

  return {
    ok: true,
    counts: { upserted: 1 },
    meta: { year_month: targetYearMonth },
  };
});
