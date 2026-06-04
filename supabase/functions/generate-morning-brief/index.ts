/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DailyChange {
  metric_label: string;
  prev_value: number;
  curr_value: number;
  pct_delta: number;
  direction: "UP" | "DOWN" | "FLAT";
  interpretation: string;
  significance: "HIGH" | "MEDIUM";
}

interface DailySignal {
  regime: string;
  score: number;
  key_driver: string;
  watch_item: string;
  signal_date: string;
}

interface BriefContent {
  what_changed: string[];
  regime_status: string;
  focus_observations: string[];
  watch_today: string[];
}

const DEFAULT_FOCUS_AREAS = ["us", "india", "gold"];
const DEFAULT_FOCUS_LABEL = "US Macro, India, and Gold/De-Dollarization";

function buildFallbackBrief(changes: DailyChange[], signal: DailySignal): BriefContent {
  const what_changed = changes
    .filter((c) => c.significance === "HIGH")
    .slice(0, 5)
    .map((c) => {
      const dir = c.direction === "UP" ? "+" : c.direction === "DOWN" ? "-" : "±";
      const pct = Math.abs(c.pct_delta).toFixed(2);
      return `◆ ${c.metric_label} ${dir}${pct}% — ${c.interpretation || "Monitoring for follow-through."}`;
    });

  if (what_changed.length === 0) {
    what_changed.push("◆ No significant metric movements detected overnight — regime steady.");
  }

  return {
    what_changed,
    regime_status:
      `Macro regime classified as ${signal.regime} (score: ${signal.score}). ` +
      `Key driver: ${signal.key_driver}. Watch: ${signal.watch_item}.`,
    focus_observations: [
      "◆ US: Monitoring Fed balance sheet dynamics and Treasury issuance pace.",
      "◆ India: RBI liquidity stance and current account trajectory remain the primary risk vectors.",
      "◆ Gold: Central bank buying data and real yield spreads driving near-term price discovery.",
    ],
    watch_today: [
      "◆ Check US economic calendar for CPI, PCE, or Fed speaker events today.",
      "◆ Monitor EUR/USD and EM FX for dollar-stress divergence at Asia open.",
    ],
  };
}

async function callOpenRouter(
  apiKey: string,
  changes: DailyChange[],
  signal: DailySignal,
  focusLabel: string
): Promise<{ content: BriefContent; model_used: string; tokens_used: number } | null> {
  const changesText = changes
    .slice(0, 8)
    .map((c) => {
      const dir = c.direction === "UP" ? "▲" : c.direction === "DOWN" ? "▼" : "—";
      const pct = Math.abs(c.pct_delta).toFixed(2);
      return `${c.metric_label}: ${dir}${pct}% (${c.significance}) — ${c.interpretation || "No interpretation available."}`;
    })
    .join("\n");

  const prompt = `You are GraphiQuestor's macro intelligence system. Generate a concise morning macro brief for an institutional analyst focused on ${focusLabel}.

Current regime: ${signal.regime} (Score: ${signal.score}/100)
Key driver: ${signal.key_driver}
Watch item: ${signal.watch_item}

Metrics that moved significantly overnight:
${changesText || "No significant movements detected overnight — regime steady."}

Generate exactly:
1. 3-5 "What Changed" bullets (format: "◆ [Metric] [+/-][value] → [one-line interpretation]")
2. Regime status paragraph (2 sentences, no hedging)
3. 3 focus-area specific observations (format: "◆ [Area]: [observation]")
4. 2-3 "Watch Today" items

Style: institutional, terse, no hedging language, no filler. Write like a senior macro strategist, not a retail newsletter.

Return ONLY valid JSON:
{
  "what_changed": ["string"],
  "regime_status": "string",
  "focus_observations": ["string", "string", "string"],
  "watch_today": ["string", "string"]
}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(25_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://graphiquestor.com",
        "X-Title": "GraphiQuestor Morning Brief",
      },
      body: JSON.stringify({
        model: "nvidia/llama-3.1-nemotron-70b-instruct:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 700,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error("[generate-morning-brief] OpenRouter HTTP error:", response.status);
      return null;
    }

    const result = await response.json();
    const raw: string = result.choices?.[0]?.message?.content ?? "";
    const tokens_used: number = result.usage?.total_tokens ?? 0;
    const model_used: string = result.model ?? "nvidia/llama-3.1-nemotron-70b-instruct:free";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[generate-morning-brief] No JSON in response:", raw.slice(0, 200));
      return null;
    }

    const content = JSON.parse(jsonMatch[0]) as BriefContent;
    if (
      !Array.isArray(content.what_changed) ||
      typeof content.regime_status !== "string" ||
      !Array.isArray(content.focus_observations) ||
      !Array.isArray(content.watch_today)
    ) {
      throw new Error("Invalid content shape from LLM");
    }

    return { content, model_used, tokens_used };
  } catch (err) {
    console.error("[generate-morning-brief] OpenRouter call failed:", err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startMs = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY") ?? "";
    const briefDate = new Date().toISOString().slice(0, 10);

    // 1. Fetch overnight changes (may be empty — that's fine)
    const { data: changesData } = await supabase
      .from("daily_changes")
      .select("metric_label, prev_value, curr_value, pct_delta, direction, interpretation, significance")
      .eq("signal_date", briefDate)
      .order("significance", { ascending: false })
      .limit(10);

    const changes: DailyChange[] = (changesData ?? []) as DailyChange[];

    // 2. Fetch current regime signal
    const { data: signalData } = await supabase
      .from("vw_latest_daily_signal")
      .select("regime, score, key_driver, watch_item, signal_date")
      .single();

    const signal: DailySignal = signalData ?? {
      regime: "Neutral Persistence",
      score: 50,
      key_driver: "Liquidity neutral",
      watch_item: "Fed balance sheet",
      signal_date: briefDate,
    };

    // 3. Generate brief content (AI or fallback)
    let content: BriefContent;
    let model_used = "fallback-template";
    let tokens_used = 0;

    if (openRouterKey) {
      const aiResult = await callOpenRouter(openRouterKey, changes, signal, DEFAULT_FOCUS_LABEL);
      if (aiResult) {
        content = aiResult.content;
        model_used = aiResult.model_used;
        tokens_used = aiResult.tokens_used;
      } else {
        content = buildFallbackBrief(changes, signal);
      }
    } else {
      content = buildFallbackBrief(changes, signal);
    }

    // 4. Upsert to daily_macro_briefs
    const { error: upsertErr } = await supabase
      .from("daily_macro_briefs")
      .upsert(
        {
          brief_date: briefDate,
          focus_areas: [...DEFAULT_FOCUS_AREAS].sort(),
          content,
          regime_score: signal.score,
          regime_label: signal.regime,
          generated_at: new Date().toISOString(),
          model_used,
          tokens_used,
        },
        { onConflict: "brief_date,focus_areas" }
      );

    if (upsertErr) throw upsertErr;

    const durationMs = Date.now() - startMs;
    console.log(`[generate-morning-brief] Done in ${durationMs}ms. model=${model_used} tokens=${tokens_used}`);

    return new Response(
      JSON.stringify({ success: true, briefDate, model_used, tokens_used, durationMs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[generate-morning-brief] Fatal:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
