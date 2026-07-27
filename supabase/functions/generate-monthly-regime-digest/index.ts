/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { runWithRetry } from "../_shared/job-runner.ts";
import { serveIngest, IngestResult } from '../_shared/handler.ts';


function extractJSON(raw: string): unknown {
    try {
        return JSON.parse(raw.trim());
    } catch {
        const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced) {
            try { return JSON.parse(fenced[1].trim()); } catch { /* fall through */ }
        }
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start !== -1 && end > start) {
            try { return JSON.parse(raw.slice(start, end + 1)); } catch { /* fall through */ }
        }
        throw new Error("Could not extract valid JSON from AI response");
    }
}

async function fetchLatestMetric(supabase: SupabaseClient, metricId: string) {
    const { data } = await supabase
        .from("metric_observations")
        .select("value, as_of_date")
        .eq("metric_id", metricId)
        .order("as_of_date", { ascending: false })
        .limit(2);
    return data || [];
}

async function fetchRegionalPulse(supabase: SupabaseClient, table: string) {
    const { data } = await supabase
        .from(table)
        .select("*")
        .order("snapshot_date", { ascending: false })
        .limit(1);
    return data?.[0] || null;
}

async function doGenerateDigest(supabaseClient: SupabaseClient, targetYearMonth?: string) {
    const now = new Date();
    const year_month = targetYearMonth || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    console.log(`Generating Monthly Regime Digest for ${year_month}...`);

    const [
        liq, vix, dxy, gold, brent,
        debtGold, usCpi, inGdp, inCpi, cnGdp,
        africaPulse, indiaPulse, chinaPulse
    ] = await Promise.all([
        fetchLatestMetric(supabaseClient, "BIS_GLOBAL_LIQUIDITY_USD_BN"),
        fetchLatestMetric(supabaseClient, "VIX_INDEX"),
        fetchLatestMetric(supabaseClient, "DXY_INDEX"),
        fetchLatestMetric(supabaseClient, "GOLD_PRICE_USD"),
        fetchLatestMetric(supabaseClient, "BRENT_CRUDE_PRICE"),
        fetchLatestMetric(supabaseClient, "RATIO_DEBT_GOLD"),
        fetchLatestMetric(supabaseClient, "US_CPI_YOY"),
        fetchLatestMetric(supabaseClient, "IN_GDP_GROWTH_YOY"),
        fetchLatestMetric(supabaseClient, "IN_CPI_YOY"),
        fetchLatestMetric(supabaseClient, "CN_GDP_GROWTH_YOY"),
        fetchRegionalPulse(supabaseClient, "africa_macro_snapshots"),
        fetchRegionalPulse(supabaseClient, "india_macro_snapshots"),
        fetchRegionalPulse(supabaseClient, "china_macro_pulse")
    ]);

    const macroContext = {
        us: {
            cpi_yoy: usCpi[0]?.value,
            dxy: dxy[0]?.value,
            dxy_prev: dxy[1]?.value,
            debt_gold_ratio: debtGold[0]?.value,
            vix: vix[0]?.value,
            global_liquidity_usd_bn: liq[0]?.value,
            global_liquidity_prev: liq[1]?.value,
        },
        india: {
            gdp_yoy: inGdp[0]?.value,
            cpi_yoy: inCpi[0]?.value,
            pulse_summary: indiaPulse?.holistic_summary
        },
        china: {
            gdp_yoy: cnGdp[0]?.value,
            pulse_summary: chinaPulse?.growth_momentum
        },
        africa: {
            pulse_summary: africaPulse?.continent_summary
        },
        commodities: {
            gold_usd: gold[0]?.value,
            gold_prev: gold[1]?.value,
            brent_crude: brent[0]?.value,
            brent_prev: brent[1]?.value,
        }
    };

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY") ?? "";
    const aimlapiKey = Deno.env.get("AIMLAPI_KEY") ?? "";

    if (!openrouterKey && !aimlapiKey) {
        throw new Error("Neither OPENROUTER_API_KEY nor AIMLAPI_KEY configured in edge function secrets");
    }

    const systemPrompt = `You are an elite macro strategist and institutional writer for GraphiQuestor.
Transform the macro telemetry data into a single, cohesive, high-value institutional Monthly Regime Digest.

Sections to cover (weave these together into a holistic narrative):
- US Macro Pulse
- China Macro Pulse
- India Macro Pulse
- Africa Macro Pulse
- Energy & Commodities
- Sovereign Stress, De-Dollarization & Gold

Core Requirements:
- Holistic Narrative: Show interconnections (e.g., US fiscal dominance -> de-dollarization -> capital flows to India/Africa -> commodity implications).
- Regime Focus: Clearly state the prevailing macro regime and any shifts during the past month.
- Tone: Elite institutional (Luke Gromen / Bridgewater style). Calm, precise, authoritative. No marketing language.

Report Structure:
1. Executive Summary: High-level regime view for the month.
2. Key Regime Shifts: Across all pillars, showing reinforcement or offsets.
3. What Changed vs Last Month + Historical Context.
4. Forward Outlook: High-Conviction Risks & Opportunities.

Return a JSON object with this exact schema (no markdown, no code fences, pure JSON):
{
  "subject_line": "A compelling 5-8 word subject line summarizing the monthly regime",
  "html_content": "The full report as clean semantic HTML. Use <h2> for major sections, <h3> for sub-points, <p> for paragraphs, <ul>/<li> for lists, <strong> for key terms. Do NOT wrap in markdown code blocks or add <html>/<body> tags.",
  "plain_text": "The full report as plain text without any HTML tags"
}`;

    const userPrompt = `Macro telemetry for ${year_month}:
${JSON.stringify(macroContext, null, 2)}

Generate the Monthly Regime Digest. Return only the JSON object, no markdown fences.`;

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
            name: "OpenRouter",
            url: "https://openrouter.ai/api/v1/chat/completions",
            key: openrouterKey,
            model: "deepseek/deepseek-r1:free",
            supportsJsonMode: false,
        });
        providers.push({
            name: "OpenRouter",
            url: "https://openrouter.ai/api/v1/chat/completions",
            key: openrouterKey,
            model: "meta-llama/llama-3.3-70b-instruct:free",
            supportsJsonMode: false,
        });
        providers.push({
            name: "OpenRouter",
            url: "https://openrouter.ai/api/v1/chat/completions",
            key: openrouterKey,
            model: "google/gemma-3-27b-it:free",
            supportsJsonMode: false,
        });
    }

    if (aimlapiKey) {
        providers.push({
            name: "AIMLAPI",
            url: "https://api.aimlapi.com/v1/chat/completions",
            key: aimlapiKey,
            model: "gpt-4o-mini",
            supportsJsonMode: true,
        });
        providers.push({
            name: "AIMLAPI",
            url: "https://api.aimlapi.com/v1/chat/completions",
            key: aimlapiKey,
            model: "gpt-4o",
            supportsJsonMode: true,
        });
    }

    const errorsList: string[] = [];
    let parsedResult: any = null;

    for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];
        const attemptNum = i + 1;
        try {
            console.log(`[monthly-digest] Attempt ${attemptNum}/${providers.length}: ${provider.name} / ${provider.model}`);

            const headers: Record<string, string> = {
                "Authorization": `Bearer ${provider.key}`,
                "Content-Type": "application/json",
            };
            if (provider.name === "OpenRouter") {
                headers["HTTP-Referer"] = "https://graphiquestor.com";
                headers["X-Title"] = "GraphiQuestor Monthly Regime Digest";
            }

            const requestBody: any = {
                model: provider.model,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: userPrompt + (attemptNum > 1
                            ? "\n\nIMPORTANT: Output ONLY valid JSON. No markdown, no code fences, no explanation text."
                            : "")
                    }
                ],
                temperature: 0.4,
                max_tokens: 4096,
            };

            if (provider.supportsJsonMode) {
                requestBody.response_format = { type: "json_object" };
            }

            const response = await fetch(provider.url, {
                method: "POST",
                headers,
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`${provider.name} API error ${response.status}: ${errBody.substring(0, 300)}`);
            }

            const completion = await response.json();
            if (completion.error) {
                throw new Error(`${provider.name} error: ${completion.error.message || JSON.stringify(completion.error)}`);
            }

            const rawContent = completion.choices?.[0]?.message?.content ?? "";
            parsedResult = extractJSON(rawContent) as any;

            if (!parsedResult.subject_line || !parsedResult.html_content || !parsedResult.plain_text) {
                throw new Error(`Incomplete JSON from ${provider.name}: missing required fields`);
            }

            console.log(`[monthly-digest] Success via ${provider.name} (${provider.model})`);
            break;
        } catch (err: any) {
            console.warn(`[monthly-digest] Attempt ${attemptNum} failed: ${err.message}`);
            errorsList.push(`Attempt ${attemptNum} (${provider.name}/${provider.model}): ${err.message}`);
            if (i < providers.length - 1) {
                await new Promise(r => setTimeout(r, (i + 1) * 2000));
            }
        }
    }

    let usedTemplate = false;
    if (!parsedResult) {
        // Never leave a month blank — publish deterministic metrics digest when LLMs fail.
        console.warn(`[monthly-digest] All LLM providers failed; using template. ${errorsList.join(" | ")}`);
        parsedResult = buildTemplateDigest(year_month, macroContext);
        usedTemplate = true;
    }

    const { error: dbError } = await supabaseClient
        .from("monthly_regime_digests")
        .upsert({
            year_month,
            subject_line: parsedResult.subject_line,
            html_content: parsedResult.html_content,
            plain_text: parsedResult.plain_text,
            metrics_snapshot: macroContext,
        }, { onConflict: "year_month" });

    if (dbError) throw dbError;

    return {
        digest: parsedResult,
        year_month,
        rows_inserted: 1,
        metadata: { used_template: usedTemplate, llm_errors: errorsList.length ? errorsList : undefined },
    };
}

function fmtNum(v: unknown, digits = 2): string {
    if (v == null || v === '') return 'n/a';
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(digits) : String(v);
}

function buildTemplateDigest(year_month: string, ctx: any) {
    const us = ctx.us ?? {};
    const india = ctx.india ?? {};
    const china = ctx.china ?? {};
    const commodities = ctx.commodities ?? {};

    const subject_line = `Regime Snapshot ${year_month}: Liquidity & Prices`;
    const lines = [
        `Monthly Regime Digest — ${year_month} (metrics template)`,
        ``,
        `US Macro: CPI YoY ${fmtNum(us.cpi_yoy)}%; DXY ${fmtNum(us.dxy)}; VIX ${fmtNum(us.vix)}; Global liquidity ${fmtNum(us.global_liquidity_usd_bn, 0)} bn; Debt/Gold ${fmtNum(us.debt_gold_ratio)}.`,
        `India: GDP YoY ${fmtNum(india.gdp_yoy)}%; CPI YoY ${fmtNum(india.cpi_yoy)}%.`,
        `China: GDP YoY ${fmtNum(china.gdp_yoy)}%.`,
        `Commodities: Gold $${fmtNum(commodities.gold_usd)}; Brent $${fmtNum(commodities.brent_crude)}.`,
        ``,
        `Narrative generation via LLM was unavailable this cycle. Figures above are live telemetry as of generation time. Re-run generate-monthly-regime-digest once provider keys recover to replace with full narrative.`,
    ];
    const plain_text = lines.join('\n');
    const html_content = [
        `<h2>Monthly Regime Digest — ${year_month}</h2>`,
        `<p><em>Metrics template (LLM fallback). Source: GraphiQuestor telemetry.</em></p>`,
        `<h3>US Macro Pulse</h3>`,
        `<ul>`,
        `<li>CPI YoY: <strong>${fmtNum(us.cpi_yoy)}%</strong></li>`,
        `<li>DXY: <strong>${fmtNum(us.dxy)}</strong> (prev ${fmtNum(us.dxy_prev)})</li>`,
        `<li>VIX: <strong>${fmtNum(us.vix)}</strong></li>`,
        `<li>Global liquidity (USD bn): <strong>${fmtNum(us.global_liquidity_usd_bn, 0)}</strong></li>`,
        `<li>Debt / Gold ratio: <strong>${fmtNum(us.debt_gold_ratio)}</strong></li>`,
        `</ul>`,
        `<h3>India Macro Pulse</h3>`,
        `<ul><li>GDP YoY: <strong>${fmtNum(india.gdp_yoy)}%</strong></li><li>CPI YoY: <strong>${fmtNum(india.cpi_yoy)}%</strong></li></ul>`,
        `<h3>China Macro Pulse</h3>`,
        `<ul><li>GDP YoY: <strong>${fmtNum(china.gdp_yoy)}%</strong></li></ul>`,
        `<h3>Energy &amp; Commodities</h3>`,
        `<ul><li>Gold: <strong>$${fmtNum(commodities.gold_usd)}</strong></li><li>Brent: <strong>$${fmtNum(commodities.brent_crude)}</strong></li></ul>`,
        `<p>Full institutional narrative will replace this template when LLM providers succeed. Data integrity takes priority over silence.</p>`,
    ].join('\n');

    return { subject_line, html_content, plain_text };
}

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

serveIngest('generate-monthly-regime-digest', async (req: Request): Promise<IngestResult> => {
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    let targetYearMonth: string | undefined;
    let catchUp = false;
    try {
        const body = await req.json();
        targetYearMonth = body.year_month;
        catchUp = body.catch_up === true || body.catchUp === true;
    } catch (_e) {
        // body optional — also allow ?catch_up=1
    }

    try {
        const url = new URL(req.url);
        if (url.searchParams.get('catch_up') === '1' || url.searchParams.get('catch_up') === 'true') {
            catchUp = true;
        }
        if (!targetYearMonth && url.searchParams.get('year_month')) {
            targetYearMonth = url.searchParams.get('year_month') ?? undefined;
        }
    } catch { /* ignore */ }

    // Catch-up: ensure every month from earliest missing through current exists.
    // Default catch-up window starts April 2026 (last known good) if table empty of recent rows.
    if (catchUp && !targetYearMonth) {
        const nowYm = currentYearMonthUTC();
        const { data: existing } = await supabaseClient
            .from('monthly_regime_digests')
            .select('year_month')
            .order('year_month', { ascending: true });

        const have = new Set((existing ?? []).map((r: { year_month: string }) => r.year_month));
        const start = '2026-04';
        const needed = monthRange(start, nowYm).filter((ym) => !have.has(ym));

        let upserted = 0;
        const generated: string[] = [];
        const errors: string[] = [];

        for (const ym of needed) {
            try {
                const result = await runWithRetry(
                    `generate-monthly-regime-digest:${ym}`,
                    () => doGenerateDigest(supabaseClient, ym),
                    { timeoutMs: 10 * 60 * 1000, maxRetries: 1 },
                );
                if (!result.ok) {
                    errors.push(`${ym}: ${result.error}`);
                    continue;
                }
                upserted += 1;
                generated.push(ym);
            } catch (e: any) {
                errors.push(`${ym}: ${e.message}`);
            }
        }

        // Always ensure current month exists even if already present (refresh optional — skip if present)
        if (!have.has(nowYm) && !generated.includes(nowYm)) {
            const result = await runWithRetry(
                'generate-monthly-regime-digest:current',
                () => doGenerateDigest(supabaseClient, nowYm),
                { timeoutMs: 10 * 60 * 1000, maxRetries: 1 },
            );
            if (result.ok) {
                upserted += 1;
                generated.push(nowYm);
            } else if (result.error) {
                errors.push(`${nowYm}: ${result.error}`);
            }
        }

        if (upserted === 0 && errors.length > 0) {
            return {
                ok: false,
                error: `Catch-up produced 0 digests. ${errors.slice(0, 5).join(' | ')}`,
                counts: { upserted: 0, errors: errors.length },
                meta: { mode: 'catch_up', needed, errors },
            };
        }

        return {
            ok: true,
            counts: { upserted, skipped: needed.length - upserted, errors: errors.length },
            meta: { mode: 'catch_up', generated, needed, errors: errors.length ? errors : undefined },
        };
    }

    const result = await runWithRetry(
        'generate-monthly-regime-digest',
        () => doGenerateDigest(supabaseClient, targetYearMonth),
        { timeoutMs: 10 * 60 * 1000, maxRetries: 1 },
    );

    if (!result.ok) {
        throw new Error(`Digest generation failed: ${result.error}`);
    }

    const _v = result.value!;
    if (_v && typeof _v.ok === 'boolean') return _v as IngestResult;
    return {
        ok: true,
        counts: { upserted: _v?.rows_inserted ?? 1 },
        meta: _v?.metadata ?? { year_month: _v?.year_month },
    };
});
