// generate-export-scout/index.ts
// Supabase Edge Function — Returns a McKinsey-quality Export Scout Playbook in JSON format.
// POST body: { "hsn": "8512", "hsn_description": "Light towers and lighting equipment" }

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface DemandRow {
  reporter_iso3: string;
  reporter_name: string | null;
  year: number;
  import_value_usd: number | null;
}

interface SupplierRow {
  reporter_iso3: string;
  year: number;
  import_value_usd: number | null;
  market_share_pct: number | null;
}

interface MarketEntry {
  country: string;
  iso3: string;
  total_market: number; // USD millions
  india_share: number; // percentage
  yoy_growth: number; // percentage
  opportunity_score: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pick latest year per (hs_code, reporter_iso3) */
function dedup<T extends { reporter_iso3: string; year: number; import_value_usd: number | null }>(
  rows: T[]
): T[] {
  const map = new Map<string, T>();
  for (const row of rows) {
    const key = row.reporter_iso3;
    const ex = map.get(key);
    if (!ex || row.year > ex.year || (row.year === ex.year && (row.import_value_usd ?? 0) > (ex.import_value_usd ?? 0))) {
      map.set(key, row);
    }
  }
  return [...map.values()];
}

/** Calculate YoY growth between two latest years */
function calculateGrowth(rows: DemandRow[], iso3: string): number {
  const reporterRows = rows.filter(r => r.reporter_iso3 === iso3).sort((a, b) => b.year - a.year);
  if (reporterRows.length < 2) return 0;
  const current = reporterRows[0].import_value_usd || 0;
  const previous = reporterRows[1].import_value_usd || 0;
  if (previous === 0) return 0;
  return parseFloat(((current - previous) / previous * 100).toFixed(1));
}

/** Compute India share % */
function getIndiaShare(supplierRow: SupplierRow | undefined, demandRow: DemandRow | undefined): number {
  if (!supplierRow) return 0;
  if (supplierRow.market_share_pct != null && supplierRow.market_share_pct > 0) {
    return Number(supplierRow.market_share_pct);
  }
  const india = supplierRow.import_value_usd ?? 0;
  const total = demandRow?.import_value_usd ?? 0;
  if (total > 0 && india > 0) return parseFloat(((india / total) * 100).toFixed(1));
  return 0;
}

/** Simple Opportunity Score (0-100) */
function computeScore(share: number, tamM: number, growth: number): number {
  let score = 50; 
  if (tamM > 1000) score += 15;
  if (tamM > 100) score += 5;
  if (growth > 10) score += 15;
  if (growth < 0) score -= 10;
  if (share < 2) score += 10; // Untapped potential
  if (share > 15) score += 5; // Established stronghold
  return Math.min(100, Math.max(0, score));
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    if (!body.hsn) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: hsn' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const hsn = String(body.hsn).trim();
    const hsnDescription = String(body.hsn_description || "Industrial Goods").trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY") ?? "";

    const sb = createClient(supabaseUrl, supabaseKey);
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openrouterKey,
    });

    // 1. Fetch Market Data
    const [demandRes, supplierRes] = await Promise.all([
      sb.from("trade_demand_cache")
        .select("reporter_iso3,reporter_name,year,import_value_usd")
        .filter("hs_code", "ilike", `${hsn}%`)
        .order("year", { ascending: false }),
      sb.from("trade_supplier_breakdown")
        .select("reporter_iso3,year,import_value_usd,market_share_pct")
        .filter("hs_code", "ilike", `${hsn}%`)
        .eq("partner_iso3", "IND")
        .order("year", { ascending: false }),
    ]);

    const allDemandRows = (demandRes.data ?? []) as DemandRow[];
    const primaryDemand = dedup(allDemandRows);
    const primaryIndia = dedup((supplierRes.data ?? []) as SupplierRow[]);

    const primaryDemandMap = new Map(primaryDemand.map(r => [r.reporter_iso3, r]));
    const primaryIndiaMap = new Map(primaryIndia.map(r => [r.reporter_iso3, r]));

    // 2. Build Market Entries
    const markets: MarketEntry[] = [];
    for (const iso3 of primaryDemandMap.keys()) {
      if (iso3 === "IND") continue;
      const d = primaryDemandMap.get(iso3)!;
      const s = primaryIndiaMap.get(iso3);
      
      const tamM = Math.round((d.import_value_usd ?? 0) / 1_000_000);
      const share = getIndiaShare(s, d);
      const growth = calculateGrowth(allDemandRows, iso3);
      const score = computeScore(share, tamM, growth);

      markets.push({
        country: d.reporter_name || iso3,
        iso3,
        total_market: tamM,
        india_share: share,
        yoy_growth: growth,
        opportunity_score: score
      });
    }

    // Sort and take top 15 for analysis
    markets.sort((a, b) => b.opportunity_score - a.opportunity_score);
    const topMarkets = markets.slice(0, 15);
    const globalTamM = markets.reduce((acc, m) => acc + m.total_market, 0);
    const indiaExportsM = markets.reduce((acc, m) => acc + (m.total_market * m.india_share / 100), 0);
    const globalIndiaShare = globalTamM > 0 ? (indiaExportsM / globalTamM * 100).toFixed(1) : "0";

    // 3. AI Synthesis
    const prompt = `
You are a principal strategy consultant at McKinsey. Generate an executive-grade Export Scout Playbook for HS Code ${hsn}: ${hsnDescription}.

Market Data Context (UN Comtrade):
- Total Addressable Market (Analyzed): $${(globalTamM / 1000).toFixed(1)}B
- India's Global Market Share: ${globalIndiaShare}%
- Top Markets Analyzed: ${JSON.stringify(topMarkets)}

Requirements:
- Headline: 1 powerful, strategic sentence.
- Summary: 3-5 lines, calm, authoritative tone.
- Key Insight: One sharp, non-obvious observation.
- Trends: 3-4 specific industry trends for this HS code.
- India vs Competitors: Short insight on how Indian suppliers stack up vs China/EU.
- Path of Least Resistance: The core strategic logic for immediate success.
- Phase 1/2 Markets: Prioritize the markets from the data.
- Certification Notes: Specific compliance needed (e.g., CE, UL, SABS, etc.)
- Timeline: A 12-week execution plan.
- Outreach: Professional templates for Cold Email, LinkedIn, and WhatsApp.

Return ONLY a JSON object with this exact structure:
{
  "executive_summary": { "headline": "string", "summary": "string", "key_insight": "string" },
  "market_intelligence": { "top_trends": ["string"], "india_vs_competitors": "string", "path_of_least_resistance": "string" },
  "strategic_recommendations": { "phase_1_markets": ["string"], "phase_2_markets": ["string"], "certification_notes": "string", "key_risks": ["string"] },
  "execution_playbook": { "timeline": [{ "week": "string", "focus": "string", "key_actions": ["string"] }], "outreach_templates": { "cold_email": "string", "linkedin": "string", "whatsapp": "string" } }
}
`;

    const aiRes = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [
        { role: "system", content: "You are a world-class export strategy consultant." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });

    const aiPlaybook = JSON.parse(aiRes.choices[0].message.content || "{}");

    // 4. Final JSON Assembly
    const reportTimestamp = new Date().getTime().toString().slice(-6);
    const finalPlaybook = {
      metadata: {
        hsn_code: hsn,
        hsn_description: hsnDescription,
        report_id: `GQ-SCOUT-${hsn}-${reportTimestamp}`,
        generated_at: new Date().toISOString(),
        data_source: "UN Comtrade + GraphiQuestor Intelligence",
        total_market: globalTamM >= 1000 ? `$${(globalTamM / 1000).toFixed(1)}B` : `$${globalTamM}M`,
        india_share: `${globalIndiaShare}%`,
        opportunity_score: Math.round(markets.reduce((acc, m) => acc + m.opportunity_score, 0) / (markets.length || 1))
      },
      executive_summary: aiPlaybook.executive_summary,
      priority_beachheads: topMarkets.map(m => ({
        country: m.country,
        flag: "", 
        total_market: m.total_market >= 1000 ? `$${(m.total_market / 1000).toFixed(1)}B` : `$${m.total_market}M`,
        india_share: m.india_share,
        yoy_growth: m.yoy_growth,
        opportunity_score: m.opportunity_score,
        lead_product: hsnDescription,
        why_now: `High growth potential in ${m.country} for Indian manufacturers.`,
        priority: m.opportunity_score > 75 ? "NOW" : m.opportunity_score > 50 ? "HIGH" : "MEDIUM",
        recommended_action: m.opportunity_score > 75 ? "Direct outreach to top 10 importers" : "Identify local distributors"
      })),
      market_intelligence: aiPlaybook.market_intelligence,
      strategic_recommendations: aiPlaybook.strategic_recommendations,
      execution_playbook: aiPlaybook.execution_playbook,
      footer: {
        generated_by: "GraphiQuestor Export Scout",
        data_sources: "UN Comtrade Intelligence",
        date: new Date().toLocaleDateString()
      }
    };

    return new Response(JSON.stringify(finalPlaybook), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Playbook generation error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
