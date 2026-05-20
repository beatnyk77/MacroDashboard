// generate-export-scout/index.ts
// Supabase Edge Function — Returns an executive Export Scout Playbook in JSON format.
// POST body: { "hsn": "8512", "hsn_description": "Light towers and lighting equipment" }

import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  india_share: number;  // percentage
  yoy_growth: number;   // percentage
  opportunity_score: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function aggregateAndDedup<T extends { reporter_iso3: string; year: number; import_value_usd: number | null }>(
  rows: T[]
): T[] {
  const aggMap = new Map<string, T>();
  for (const row of rows) {
    const key = `${row.reporter_iso3}-${row.year}`;
    const ex = aggMap.get(key);
    if (!ex) {
      aggMap.set(key, { ...row });
    } else {
      ex.import_value_usd = (ex.import_value_usd || 0) + (row.import_value_usd || 0);
    }
  }
  const finalMap = new Map<string, T>();
  for (const row of aggMap.values()) {
    const key = row.reporter_iso3;
    const ex = finalMap.get(key);
    if (!ex || row.year > ex.year) {
      finalMap.set(key, row);
    }
  }
  return [...finalMap.values()];
}

function calculateGrowth(rows: DemandRow[], iso3: string): number {
  const reporterRows = rows
    .filter(r => r.reporter_iso3 === iso3)
    .sort((a, b) => b.year - a.year);
  if (reporterRows.length < 2) return 0;
  const current = reporterRows[0].import_value_usd || 0;
  const previous = reporterRows[1].import_value_usd || 0;
  if (previous === 0) return 0;
  return parseFloat(((current - previous) / previous * 100).toFixed(1));
}

function getIndiaShare(supplierRow: SupplierRow | undefined, demandRow: DemandRow | undefined): number {
  if (!supplierRow) return 0;
  const india = supplierRow.import_value_usd ?? 0;
  const total = demandRow?.import_value_usd ?? 0;
  if (total > 0 && india > 0) return parseFloat(((india / total) * 100).toFixed(1));
  return 0;
}

function computeScore(share: number, tamM: number, growth: number): number {
  let score = 50;
  if (tamM > 1000) score += 15;
  if (tamM > 100) score += 5;
  if (growth > 10) score += 15;
  if (growth < 0) score -= 10;
  if (share < 2) score += 10;
  if (share > 15) score += 5;
  return Math.min(100, Math.max(0, score));
}

/** Extract JSON from a response that may contain markdown fences */
function extractJSON(raw: string): unknown {
  // Try direct parse first
  try {
    return JSON.parse(raw.trim());
  } catch {
    // Strip markdown code fences
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try { return JSON.parse(fenced[1].trim()); } catch { /* fall through */ }
    }
    // Try to find the outermost { ... }
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try { return JSON.parse(raw.slice(start, end + 1)); } catch { /* fall through */ }
    }
    throw new Error("Could not extract valid JSON from AI response");
  }
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
        JSON.stringify({ error: "Missing required parameter: hsn" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const hsn = String(body.hsn).trim();
    const hsnDescription = String(body.hsn_description || "Industrial Goods").trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY") ?? "";

    if (!openrouterKey) {
      return new Response(
        JSON.stringify({ error: "OPENROUTER_API_KEY not configured in edge function secrets" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const sb = createClient(supabaseUrl, supabaseKey);

    // ── 1. Fetch Market Data ────────────────────────────────────────────────
    const [demandRes, supplierRes] = await Promise.all([
      sb.from("trade_demand_cache")
        .select("reporter_iso3,reporter_name,year,import_value_usd")
        .eq("hs_code", hsn)
        .order("year", { ascending: false }),
      sb.from("trade_supplier_breakdown")
        .select("reporter_iso3,year,import_value_usd,market_share_pct")
        .eq("hs_code", hsn)
        .eq("partner_iso3", "IND")
        .order("year", { ascending: false }),
    ]);

    const allDemandRows = (demandRes.data ?? []) as DemandRow[];
    const primaryDemand = aggregateAndDedup(allDemandRows);
    const primaryIndia = aggregateAndDedup((supplierRes.data ?? []) as SupplierRow[]);

    const primaryDemandMap = new Map(primaryDemand.map(r => [r.reporter_iso3, r]));
    const primaryIndiaMap = new Map(primaryIndia.map(r => [r.reporter_iso3, r]));

    // ── 2. Build Market Entries ─────────────────────────────────────────────
    const markets: MarketEntry[] = [];
    for (const iso3 of primaryDemandMap.keys()) {
      if (iso3 === "IND") continue;
      const d = primaryDemandMap.get(iso3)!;
      const s = primaryIndiaMap.get(iso3);

      const tamM = Math.round((d.import_value_usd ?? 0) / 1_000_000);
      if (tamM <= 0) continue; // Allow small markets >0M

      const share = getIndiaShare(s, d);
      const growth = calculateGrowth(allDemandRows, iso3);
      const score = computeScore(share, tamM, growth);

      markets.push({ country: d.reporter_name || iso3, iso3, total_market: tamM, india_share: share, yoy_growth: growth, opportunity_score: score });
    }

    markets.sort((a, b) => b.opportunity_score - a.opportunity_score);
    const topMarkets = markets.slice(0, 12);
    const globalTamM = markets.reduce((acc, m) => acc + m.total_market, 0);
    const indiaExportsM = markets.reduce((acc, m) => acc + (m.total_market * m.india_share / 100), 0);
    const globalIndiaShare = globalTamM > 0 ? (indiaExportsM / globalTamM * 100).toFixed(1) : "0";
    const avgOpportunityScore = Math.round(markets.reduce((acc, m) => acc + m.opportunity_score, 0) / (markets.length || 1));

    const mode = body.mode || 'full';

    // If mode is 'data', skip AI synthesis
    let aiPlaybook: Record<string, unknown> = {};
    if (mode === 'ai' || mode === 'full') {
      const marketSummary = topMarkets.slice(0, 8).map(m =>
        `${m.country}: TAM=$${m.total_market >= 1000 ? (m.total_market/1000).toFixed(1)+'B' : m.total_market+'M'}, India Share=${m.india_share}%, YoY=${m.yoy_growth > 0 ? '+' : ''}${m.yoy_growth}%, Score=${m.opportunity_score}`
      ).join('\n');

      const systemPrompt = `You are a principal strategy consultant specializing in global trade and export market entry. You produce concise, data-driven, institutional-quality analysis. You always respond with pure valid JSON only — no markdown fences, no preamble, no explanation.`;

      const userPrompt = `Generate an Export Scout Playbook for HS Code ${hsn}: "${hsnDescription}".

MARKET DATA (UN Comtrade):
- Total Addressable Market: $${globalTamM >= 1000 ? (globalTamM/1000).toFixed(1)+'B' : globalTamM+'M'}
- India's Global Share: ${globalIndiaShare}%
- Opportunity Score: ${avgOpportunityScore}/100
- Top Markets:
${marketSummary}

Respond ONLY with this exact JSON structure (no markdown, no extra text):
{
  "executive_summary": {
    "headline": "One sharp strategic sentence specific to HS ${hsn}",
    "summary": "3-4 sentences on the export opportunity, data-grounded",
    "key_insight": "One non-obvious observation about India's position in this market"
  },
  "market_intelligence": {
    "top_trends": ["trend 1 specific to HS ${hsn}", "trend 2", "trend 3", "trend 4"],
    "india_vs_competitors": "2-3 sentences on India vs China, EU, Vietnam for this HS code",
    "path_of_least_resistance": "The clearest route to first $1M in exports for this HS code"
  },
  "strategic_recommendations": {
    "phase_1_markets": ["Country1", "Country2", "Country3"],
    "phase_2_markets": ["Country4", "Country5"],
    "certification_notes": "Specific certifications required (CE, UL, SABS, BIS, etc.)",
    "key_risks": ["risk 1", "risk 2", "risk 3"]
  },
  "execution_playbook": {
    "timeline": [
      { "week": "Week 1-2", "focus": "Market Validation", "key_actions": ["action 1", "action 2", "action 3"] },
      { "week": "Week 3-6", "focus": "Buyer Outreach", "key_actions": ["action 1", "action 2", "action 3"] },
      { "week": "Week 7-10", "focus": "Pilot Shipment", "key_actions": ["action 1", "action 2", "action 3"] },
      { "week": "Week 11-12", "focus": "Scale & Expand", "key_actions": ["action 1", "action 2", "action 3"] }
    ],
    "outreach_templates": {
      "cold_email": "Subject: [India Manufacturer] HS ${hsn} Supply Inquiry\\n\\nDear [Buyer Name],\\n\\n[3-4 line professional cold email body specific to HS ${hsn}]\\n\\nBest regards,\\n[Name]",
      "linkedin": "[2-3 line LinkedIn message specific to HS ${hsn} buyers]",
      "whatsapp": "[2-line WhatsApp intro message for HS ${hsn} trade inquiry]"
    }
  }
}`;

      const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://graphiquestor.com",
          "X-Title": "GraphiQuestor Export Scout",
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-super-120b-a12b:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 3000,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`OpenRouter API error ${aiResponse.status}: ${errText}`);
      }

      const aiData = await aiResponse.json();
      const rawContent = aiData.choices?.[0]?.message?.content ?? "{}";
      aiPlaybook = extractJSON(rawContent) as Record<string, unknown>;
    }

    // ── 4. Final JSON Assembly ──────────────────────────────────────────────
    const reportTimestamp = new Date().getTime().toString().slice(-6);

    const finalPlaybook = {
      metadata: {
        hsn_code: hsn,
        hsn_description: hsnDescription,
        report_id: `GQ-${hsn}-${reportTimestamp}`,
        generated_at: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        data_source: "UN Comtrade · GraphiQuestor Intelligence",
        total_market: globalTamM >= 1000
          ? `$${(globalTamM / 1000).toFixed(1)}B`
          : `$${globalTamM}M`,
        india_share: `${globalIndiaShare}%`,
        opportunity_score: avgOpportunityScore,
        markets_analyzed: markets.length,
      },
      executive_summary: aiPlaybook.executive_summary ?? {
        headline: `Strategic export opportunity in HS ${hsn}: ${hsnDescription}`,
        summary: `India holds a ${globalIndiaShare}% share of the $${globalTamM >= 1000 ? (globalTamM/1000).toFixed(1)+'B' : globalTamM+'M'} global market for ${hsnDescription}. ${topMarkets.length} priority markets have been identified with high demand velocity.`,
        key_insight: "Untapped demand in emerging markets presents a significant first-mover opportunity for certified Indian manufacturers.",
      },
      priority_beachheads: topMarkets.map(m => ({
        country: m.country,
        total_market: m.total_market >= 1000
          ? `$${(m.total_market / 1000).toFixed(1)}B`
          : `$${m.total_market}M`,
        india_share: m.india_share,
        yoy_growth: m.yoy_growth,
        opportunity_score: m.opportunity_score,
        priority: m.opportunity_score > 75 ? "NOW" : m.opportunity_score > 50 ? "HIGH" : "MEDIUM",
        recommended_action: m.opportunity_score > 75
          ? "Direct importer outreach"
          : m.india_share < 1
          ? "First-mover entry strategy"
          : "Distributor partnership",
      })),
      market_intelligence: aiPlaybook.market_intelligence ?? {
        top_trends: [`Growing demand for ${hsnDescription} in Asia-Pacific`, "Diversification away from China suppliers", "Quality certification becoming a differentiator"],
        india_vs_competitors: "Indian manufacturers are competitively priced vs. Chinese counterparts with improving quality perception.",
        path_of_least_resistance: `Focus on ${topMarkets[0]?.country ?? "emerging markets"} where India already has an established presence.`,
      },
      strategic_recommendations: aiPlaybook.strategic_recommendations ?? {
        phase_1_markets: topMarkets.slice(0, 3).map(m => m.country),
        phase_2_markets: topMarkets.slice(3, 6).map(m => m.country),
        certification_notes: "CE marking (Europe), BIS certification (domestic), country-specific compliance.",
        key_risks: ["Currency volatility", "Logistics and freight cost escalation", "Local regulatory compliance"],
      },
      execution_playbook: aiPlaybook.execution_playbook ?? {
        timeline: [
          { week: "Week 1-2", focus: "Market Validation", key_actions: ["Identify top 20 importers in priority markets", "Verify HS code tariff schedules", "Map existing distributor networks"] },
          { week: "Week 3-6", focus: "Buyer Outreach", key_actions: ["Send targeted cold emails", "LinkedIn outreach to procurement heads", "Attend trade directory listings"] },
          { week: "Week 7-10", focus: "Pilot Shipment", key_actions: ["Negotiate first order terms", "Arrange quality inspection", "Coordinate with freight forwarder"] },
          { week: "Week 11-12", focus: "Scale & Repeat", key_actions: ["Assess pilot results", "Expand to Phase 2 markets", "Build distributor relationships"] },
        ],
        outreach_templates: {
          cold_email: `Subject: Indian Manufacturer of HS ${hsn} — Seeking Import Partnership\n\nDear [Buyer Name],\n\nWe are a certified Indian manufacturer of ${hsnDescription} (HS ${hsn}) with competitive pricing and international quality standards.\n\nWe noted strong import demand in your market and would like to explore a supply partnership. Can we schedule a brief call this week?\n\nBest regards,\n[Your Name] | [Company]`,
          linkedin: `Hi [Name], I represent an Indian manufacturer of ${hsnDescription} (HS ${hsn}). Seeing strong demand in your market — we're actively seeking distribution partners. Open to a quick conversation?`,
          whatsapp: `Hello, I'm from [Company], Indian manufacturer of ${hsnDescription} (HS ${hsn}). We offer competitive pricing & certified quality. Can we connect for export inquiry?`,
        },
      },
      footer: {
        generated_by: "GraphiQuestor Export Scout",
        data_sources: "UN Comtrade Intelligence",
        date: new Date().toISOString(),
      },
    };

    return new Response(JSON.stringify(finalPlaybook), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Playbook generation error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
