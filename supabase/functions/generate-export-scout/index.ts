// generate-export-scout/index.ts
// Supabase Edge Function — returns a self-contained Export Scout HTML playbook.
// POST body: { "hsn": "8512", "hsn_description": "Light towers and lighting equipment" }
// Returns: text/html — the full interactive playbook, header and market data dynamic.

import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Constants ─────────────────────────────────────────────────────────────────

// ISO3 → display label (flag + name)
const COUNTRY_DISPLAY: Record<string, string> = {
  ZAF: "🇿🇦 South Africa", IDN: "🇮🇩 Indonesia", BRA: "🇧🇷 Brazil",
  CHL: "🇨🇱 Chile", PRT: "🇵🇹 Portugal", NOR: "🇳🇴 Norway",
  ESP: "🇪🇸 Spain", AUS: "🇦🇺 Australia", MEX: "🇲🇽 Mexico",
  ROU: "🇷🇴 Romania", USA: "🇺🇸 USA", GBR: "🇬🇧 UK",
  CZE: "🇨🇿 Czechia", JPN: "🇯🇵 Japan", MYS: "🇲🇾 Malaysia",
  DNK: "🇩🇰 Denmark", EGY: "🇪🇬 Egypt", LTU: "🇱🇹 Lithuania",
  PRY: "🇵🇾 Paraguay", SRB: "🇷🇸 Serbia", DEU: "🇩🇪 Germany",
  FRA: "🇫🇷 France", NLD: "🇳🇱 Netherlands", SGP: "🇸🇬 Singapore",
  THA: "🇹🇭 Thailand", KEN: "🇰🇪 Kenya", NGA: "🇳🇬 Nigeria",
  ARE: "🇦🇪 UAE", SAU: "🇸🇦 Saudi Arabia", PAK: "🇵🇰 Pakistan",
  BGD: "🇧🇩 Bangladesh", PHL: "🇵🇭 Philippines", VNM: "🇻🇳 Vietnam",
  COL: "🇨🇴 Colombia", PER: "🇵🇪 Peru", ARG: "🇦🇷 Argentina",
  TZA: "🇹🇿 Tanzania", ETH: "🇪🇹 Ethiopia", GHA: "🇬🇭 Ghana",
};

// Phase 1 market ISO3 codes
const PHASE1_ISO3 = ["ZAF", "IDN", "BRA", "CHL", "PRT"];

/** Assign strategic tier from India share and market size */
function calcTier(indiaShare: number, total_m: number): string {
  if (indiaShare >= 20) return "P4";                        // Stronghold
  if (indiaShare >= 5 && total_m < 1000) return "P1";       // Proven small
  if (indiaShare >= 5 && total_m >= 1000) return "P1";      // Proven large
  if (total_m >= 800 && indiaShare < 3) return "P2";        // Untapped large
  if (indiaShare >= 2 && indiaShare < 5) return "P1";        // Moderate India share
  if (total_m >= 300) return "P2";
  return "P3";
}

/** Determine lead/focus product status */
function calcStatus(share: number): string {
  if (share >= 15) return "Stronghold";
  if (share >= 5) return "High Growth";
  if (share >= 1) return "Emerging";
  return "Market Opportunity";
}

/** Pick latest year per (hs_code, reporter_iso3), preferring higher import_value when tie */
function dedup<T extends { reporter_iso3: string; year: number; import_value_usd: number | null }>(
  rows: T[]
): T[] {
  const map = new Map<string, T>();
  for (const row of rows) {
    const key = row.reporter_iso3;
    const ex = map.get(key);
    if (
      !ex ||
      row.year > ex.year ||
      (row.year === ex.year && (row.import_value_usd ?? 0) > (ex.import_value_usd ?? 0))
    ) {
      map.set(key, row);
    }
  }
  return [...map.values()];
}

/** Format USD millions with sensible precision */
function fmtM(m: number): string {
  if (m >= 1000) return `$${(m / 1000).toFixed(1).replace(/\.0$/, "")}B`;
  if (m >= 1)    return `$${Math.round(m)}M`;
  return `<$1M`;
}

/** Escape HTML special characters */
function esc(s: string): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface MarketEntry {
  iso3: string;
  country: string;      // display label with flag
  primaryVal: number;   // Main HSN market USD millions
  companionVal: number; // Companion HSN market USD millions
  primaryShare: number; // India main share %
  companionShare: number; // India companion share %
  tier: string;
  status: string;
  gtm: string;
  fromDb: boolean;
}

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

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse body
  let hsn = "8512";
  let hsnDescription = "Light Tower Equipment";
  try {
    const body = await req.json();
    if (body.hsn) hsn = String(body.hsn).trim();
    if (body.hsn_description) hsnDescription = String(body.hsn_description).trim();
  } catch { /* use defaults */ }

  // ── Query Supabase ──────────────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  let primaryDemand: DemandRow[] = [];
  let companionDemand: DemandRow[] = [];
  let primaryIndia: SupplierRow[] = [];
  let companionIndia: SupplierRow[] = [];

  // Dual product logic remains for 8512/8502 relationship
  const HS_DG = "8502";
  const isDualProduct = hsn.startsWith("8512");

  try {
    const sb = createClient(supabaseUrl, supabaseKey);

    const queries = [
      sb.from("trade_demand_cache")
        .select("reporter_iso3,reporter_name,year,import_value_usd")
        .filter("hs_code", "ilike", `${hsn}%`)
        .order("year", { ascending: false }),

      sb.from("trade_supplier_breakdown")
        .select("reporter_iso3,year,import_value_usd,market_share_pct")
        .filter("hs_code", "ilike", `${hsn}%`)
        .eq("partner_iso3", "IND")
        .order("year", { ascending: false }),
    ];

    if (isDualProduct) {
      queries.push(
        sb.from("trade_demand_cache")
          .select("reporter_iso3,reporter_name,year,import_value_usd")
          .filter("hs_code", "ilike", `${HS_DG}%`)
          .order("year", { ascending: false }),
        sb.from("trade_supplier_breakdown")
          .select("reporter_iso3,year,import_value_usd,market_share_pct")
          .filter("hs_code", "ilike", `${HS_DG}%`)
          .eq("partner_iso3", "IND")
          .order("year", { ascending: false }),
      );
    }

    const results = await Promise.all(queries);

    primaryDemand = dedup((results[0].data ?? []) as DemandRow[]);
    primaryIndia  = dedup((results[1].data ?? []) as SupplierRow[]);
    
    if (isDualProduct && results[2] && results[3]) {
      companionDemand = dedup((results[2].data ?? []) as DemandRow[]);
      companionIndia  = dedup((results[3].data ?? []) as SupplierRow[]);
    }
  } catch (err) {
    console.error("DB fetch error:", err);
  }

  // ── Build country-level maps ────────────────────────────────────────────────
  const primaryDemandMap = new Map(primaryDemand.map(r => [r.reporter_iso3, r]));
  const companionDemandMap = new Map(companionDemand.map(r => [r.reporter_iso3, r]));
  const primaryIndiaMap  = new Map(primaryIndia.map(r =>  [r.reporter_iso3, r]));
  const companionIndiaMap  = new Map(companionIndia.map(r =>  [r.reporter_iso3, r]));

  /** Compute India share % from supplier breakdown row, falling back to value ratio */
  function indiaShare(
    supplierRow: SupplierRow | undefined,
    demandRow: DemandRow | undefined
  ): number {
    if (!supplierRow) return 0;
    if (supplierRow.market_share_pct != null && supplierRow.market_share_pct > 0) {
      return Number(supplierRow.market_share_pct);
    }
    // Compute from raw values
    const india = supplierRow.import_value_usd ?? 0;
    const total = demandRow?.import_value_usd ?? 0;
    if (total > 0 && india > 0) return Math.min((india / total) * 100, 100);
    return 0;
  }

  // Collect all ISO3 codes we have demand data for
  const allIso3 = new Set([
    ...primaryDemand.map(r => r.reporter_iso3),
    ...companionDemand.map(r => r.reporter_iso3),
    ...PHASE1_ISO3,
  ]);
  // Remove India itself from market list
  allIso3.delete("IND");

  // Build unified market entries
  const markets: MarketEntry[] = [];
  for (const iso3 of allIso3) {
    const pRow = primaryDemandMap.get(iso3);
    const cRow = companionDemandMap.get(iso3);
    const pIRow = primaryIndiaMap.get(iso3);
    const cIRow = companionIndiaMap.get(iso3);

    const hasRealPrimary = pRow != null;
    const hasRealCompanion = cRow != null;
    const hasAnyReal = hasRealPrimary || hasRealCompanion;

    // Market sizes in USD millions
    const pVal = hasRealPrimary
      ? Math.round((pRow!.import_value_usd ?? 0) / 1_000_000)
      : 0;
    const cVal = hasRealCompanion
      ? Math.round((cRow!.import_value_usd ?? 0) / 1_000_000)
      : 0;

    // India share %
    const pShare = hasRealPrimary
      ? parseFloat(indiaShare(pIRow, pRow).toFixed(1))
      : 0;
    const cShare = hasRealCompanion
      ? parseFloat(indiaShare(cIRow, cRow).toFixed(1))
      : 0;

    // Skip countries with zero market data unless in Phase 1
    if (pVal === 0 && cVal === 0 && !PHASE1_ISO3.includes(iso3)) continue;

    const tier = calcTier(pShare, pVal + cVal);
    const status = calcStatus(pShare);
    const countryLabel = COUNTRY_DISPLAY[iso3] ??
      (pRow?.reporter_name ?? cRow?.reporter_name ?? iso3);
    const gtm = `India share ${pShare}%. Target existing ${pShare > 5 ? "buyers" : "importers"} for HS ${hsn}.`;

    markets.push({ iso3, country: countryLabel, primaryVal: pVal, companionVal: cVal, primaryShare: pShare, companionShare: cShare, tier, status, gtm, fromDb: hasAnyReal });
  }

  // Sort: Phase 1 first (in fixed order), then by tier, then by total market desc
  const tierOrder: Record<string, number> = { P1: 0, P4: 1, P2: 2, P3: 3 };
  markets.sort((a, b) => {
    const p1A = PHASE1_ISO3.indexOf(a.iso3);
    const p1B = PHASE1_ISO3.indexOf(b.iso3);
    if (p1A !== -1 && p1B === -1) return -1;
    if (p1A === -1 && p1B !== -1) return 1;
    if (p1A !== -1 && p1B !== -1) return p1A - p1B;
    const tA = tierOrder[a.tier] ?? 9;
    const tB = tierOrder[b.tier] ?? 9;
    if (tA !== tB) return tA - tB;
    return (b.primaryVal + b.companionVal) - (a.primaryVal + a.companionVal);
  });

  // ── TAM computation ─────────────────────────────────────────────────────────
  let tamPrimary = 0, tamCompanion = 0;
  let indiaPrimaryExports = 0, indiaCompanionExports = 0;

  for (const m of markets) {
    tamPrimary += m.primaryVal;
    tamCompanion += m.companionVal;
    indiaPrimaryExports += m.primaryVal * (m.primaryShare / 100);
    indiaCompanionExports += m.companionVal * (m.companionShare / 100);
  }
  const totalTam = tamPrimary + tamCompanion;
  const indiaTotal = indiaPrimaryExports + indiaCompanionExports;
  const indiaShareGlobal = totalTam > 0 ? ((indiaTotal / totalTam) * 100).toFixed(1) : "0";
  const countryCount = markets.length;

  const tamDisplay = fmtM(totalTam);

  // ── Phase 1 data ────────────────────────────────────────────────────────────
  const phase1Markets = PHASE1_ISO3.map(iso3 => {
    const m = markets.find(x => x.iso3 === iso3);
    if (m) return m;
    return {
      iso3, country: COUNTRY_DISPLAY[iso3] ?? iso3,
      primaryVal: 0, companionVal: 0, primaryShare: 0, companionShare: 0,
      tier: "P1", status: "Emerging",
      gtm: "", fromDb: false,
    } as MarketEntry;
  });

  const phase1TotalM = phase1Markets.reduce((s, m) => s + m.primaryVal + m.companionVal, 0);
  const phase1Display = phase1TotalM > 0 ? fmtM(phase1TotalM) : "$0M";

  // ── Build HTML ──────────────────────────────────────────────────────────────
  const pageTitle = `GraphiQuestor Export Scout — HS ${hsn} ${hsnDescription}`;
  const headerSubtitle = `HS ${hsn} ${esc(hsnDescription)} &nbsp;|&nbsp; Based on UN Comtrade Intelligence`;

  // Phase 1 table rows
  const phase1Rows = phase1Markets.map(m => {
    const barW = Math.min(Math.round(m.primaryShare * 2), 100);
    return `<tr>
              <td><span class="country-name">${m.country}</span></td>
              <td class="mkt-size">${fmtM(m.primaryVal + m.companionVal)}</td>
              <td><div class="progress-bar"><div class="progress-fill" style="width:${barW}%"></div></div><span style="font-size:11px;font-family:'DM Mono',monospace;margin-left:6px">${m.primaryShare}%</span></td>
              <td><span class="tier-pill tier-p1">${m.status}</span></td>
              <td><span class="tier-pill tier-p1">🔥 NOW</span></td>
            </tr>`;
  }).join("\n");

  // Markets JS array
  const marketsJson = JSON.stringify(
    markets.map(m => ({
      country: m.country,
      pVal: m.primaryVal,
      cVal: m.companionVal,
      pShare: m.primaryShare,
      cShare: m.companionShare,
      tier: m.tier,
      status: m.status,
      gtm: m.gtm,
    }))
  );

  const ctx = getProductContext(hsn, hsnDescription);

  const html = buildHtml({
    pageTitle,
    headerSubtitle,
    tamDisplay,
    countryCount,
    indiaShareGlobal,
    phase1Display,
    phase1Rows,
    marketsJson,
    hsn,
    hsnDescription,
    isDualProduct,
    ...ctx,
  });

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
});

// ── Product context helper ────────────────────────────────────────────────────
function getProductContext(hsn: string, hsnDesc: string) {
  const code = parseInt(hsn.substring(0, 4)) || 0;

  let productShort = hsnDesc;
  let industry = "industrial";
  let endUserSectors = "construction, manufacturing, infrastructure";
  let productApplications = "industrial and commercial applications";
  let linkedInKeywords = `"${hsnDesc.split(" ")[0].toLowerCase()}" OR "industrial equipment" OR "import manager"`;
  const googleQuery1 = `"${hsnDesc.split(" ")[0].toLowerCase()} importer [country]"`;
  const googleQuery2 = `"${hsnDesc.split(" ")[0].toLowerCase()} distributor [country] India"`;
  const googleQuery3 = `"HS ${hsn} importer [country]"`;
  const volzaProductDesc = `"${hsnDesc.split(" ")[0].toLowerCase()}" | Origin: India`;
  
  const savingsPct = "30–50%";
  const leadTime = "45–60 days";
  let shows = [
    { name: "Big 5 Global", city: "Dubai", month: "Dec", desc: "Construction & Infrastructure" },
    { name: "Hannover Messe", city: "Germany", month: "Apr", desc: "Industrial & Manufacturing" },
    { name: "Canton Fair", city: "China", month: "Oct", desc: "Multi-sector B2B" },
  ];

  if (code === 8512 || code === 8502 || code === 8501) {
    productShort = code === 8512 ? "Light Tower Equipment" : code === 8502 ? "Generating Sets" : "Electric Motors";
    industry = "electrical equipment";
    endUserSectors = "construction, mining, events, data centres";
    productApplications = "emergency power, site lighting, industrial drive systems";
    linkedInKeywords = `"generator" OR "genset" OR "light tower" OR "motor importer"`;
    shows = [
      { name: "Middle East Energy", city: "Dubai", month: "Mar", desc: "Critical for Power/Electrical" },
      { name: "Mining Indaba", city: "South Africa", month: "Feb", desc: "End-buyer focus" },
      { name: "Big 5", city: "Dubai", month: "Dec", desc: "Construction sector" },
    ];
  } else if (code >= 8400 && code < 8500) {
    industry = "industrial machinery";
    endUserSectors = "manufacturing, processing, agriculture";
    linkedInKeywords = `"machinery importer" OR "industrial equipment"`;
    shows = [
      { name: "Bauma", city: "Munich/Global", month: "Apr", desc: "Construction Machinery" },
      { name: "Agritechnica", city: "Germany", month: "Nov", desc: "Agricultural Machinery" },
    ];
  } else if (code >= 3000 && code < 3100) {
    industry = "pharmaceutical";
    endUserSectors = "healthcare, hospitals, pharma distributors";
    linkedInKeywords = `"pharma importer" OR "medical distributor"`;
    shows = [
      { name: "CPhI Worldwide", city: "EU/Global", month: "Oct", desc: "Pharma Ingredients" },
      { name: "Arab Health", city: "Dubai", month: "Jan", desc: "Medical Equipment" },
    ];
  }

  const isElectrical = code >= 8500 && code < 8600;
  const isMachinery = code >= 8400 && code < 8500;
  const isChemical = code >= 2700 && code < 3100;

  // Phase 1 certification notes
  const certZAF = isChemical ? "SABS/NCC chemical approval." : isElectrical ? "NRCS LOA required." : "SABS type-approval.";
  const certIDN = "SNI certification mandatory for most categories.";
  const certBRA = "INMETRO or ANVISA depending on product category.";
  const certCHL = "SEC or SEREMI depending on electrical/chemical nature.";
  const certPRT = "CE Marking is mandatory for all EU entries.";
  const certAUS = "RCM or Safety Mark; ECTA FTA tariff advantage.";
  const certUSA = "UL/OSHA/EPA compliance; long B2B cycle.";
  const certPhase2Tip = "Phase 2 certifications (UL/RCM) are expensive investments. Use Phase 1 revenue to fund these.";

  return {
    productShort, industry, endUserSectors, productApplications,
    linkedInKeywords, googleQuery1, googleQuery2, googleQuery3, volzaProductDesc,
    certZAF, certIDN, certBRA, certCHL, certPRT, certAUS, certUSA, certPhase2Tip,
    isElectrical, isMachinery, savingsPct, leadTime, shows,
  };
}

interface HtmlProps {
  pageTitle: string;
  headerSubtitle: string;
  tamDisplay: string;
  countryCount: number;
  indiaShareGlobal: string;
  phase1Display: string;
  phase1Rows: string;
  marketsJson: string;
  hsn: string;
  hsnDescription: string;
  isDualProduct: boolean;
  productShort: string;
  industry: string;
  endUserSectors: string;
  productApplications: string;
  linkedInKeywords: string;
  googleQuery1: string;
  googleQuery2: string;
  googleQuery3: string;
  volzaProductDesc: string;
  certZAF: string;
  certIDN: string;
  certBRA: string;
  certCHL: string;
  certPRT: string;
  certAUS: string;
  certUSA: string;
  certPhase2Tip: string;
  isElectrical: boolean;
  isMachinery: boolean;
  savingsPct: string;
  leadTime: string;
  shows: Array<{ name: string; city: string; month: string; desc: string }>;
}

// ── HTML builder ──────────────────────────────────────────────────────────────
function buildHtml(p: HtmlProps): string {
  const { 
    pageTitle, headerSubtitle, tamDisplay, countryCount, indiaShareGlobal,
    phase1Display, phase1Rows, marketsJson, hsn, hsnDescription, _isDualProduct = p.isDualProduct,
    productShort, industry, endUserSectors, _productApplications = p.productApplications,
    linkedInKeywords, googleQuery1, _googleQuery2 = p.googleQuery2, _googleQuery3 = p.googleQuery3, _volzaProductDesc = p.volzaProductDesc,
    certZAF, certIDN, certBRA, _certCHL = p.certCHL, _certPRT = p.certPRT, certAUS, certUSA, certPhase2Tip,
    _isElectrical = p.isElectrical, _isMachinery = p.isMachinery, savingsPct, leadTime, shows
  } = p;

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(pageTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --accent: #2563eb;
    --accent2: #7c3aed;
    --gold: #f59e0b;
    --green: #10b981;
    --red: #ef4444;
    --ink: #0f172a;
    --paper: #f8fafc;
    --muted: #64748b;
    --border: #e2e8f0;
    --green-bg: #ecfdf5;
    --blue-bg: #eff6ff;
    --amber-bg: #fffbeb;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', sans-serif;
    color: var(--ink);
    background: #f1f5f9;
    line-height: 1.5;
  }
  .header {
    background: var(--ink);
    color: white;
    padding: 40px 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header h1 { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
  .header h1 span { color: var(--accent); }
  .header p { color: var(--muted); margin-top: 4px; font-size: 14px; }
  .badge { background: var(--accent); color: white; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; display: inline-block; }
  
  .nav { background: white; border-bottom: 1px solid var(--border); padding: 0 60px; display: flex; sticky: top; top: 0; z-index: 100; }
  .nav-tab { padding: 16px 20px; font-size: 13px; font-weight: 600; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; }
  .nav-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .nav-tab:hover { color: var(--ink); }

  .main { padding: 40px 60px; max-width: 1400px; margin: 0 auto; }
  .section { display: none; }
  .section.active { display: block; }
  
  .card { background: white; border-radius: 12px; border: 1px solid var(--border); padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .card-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); display: inline-block; }

  .stat-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; margin-bottom: 24px; }
  .stat-box { background: white; padding: 20px; border-radius: 12px; border: 1px solid var(--border); border-top: 4px solid var(--accent); }
  .stat-box .val { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
  .stat-box .lbl { font-size: 11px; color: var(--muted); text-transform: uppercase; font-weight: 600; margin-top: 2px; }

  .market-table { width: 100%; border-collapse: collapse; }
  .market-table th { text-align: left; font-size: 11px; text-transform: uppercase; color: var(--muted); padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .market-table td { padding: 14px 16px; border-bottom: 1px solid var(--border); font-size: 13px; }
  .country-name { font-weight: 600; }
  .mkt-size { font-family: 'DM Mono', monospace; font-size: 12px; }
  .tier-pill { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .tier-p1 { background: var(--green-bg); color: var(--green); }
  .tier-p2 { background: var(--blue-bg); color: var(--accent); }
  .tier-p4 { background: #fef2f2; color: var(--red); }
  
  .progress-bar { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; width: 60px; display: inline-block; vertical-align: middle; }
  .progress-fill { height: 100%; background: var(--accent); border-radius: 3px; }

  .template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .template-card { background: white; border-radius: 8px; border: 1px solid var(--border); display: flex; flex-direction: column; }
  .template-header { padding: 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .template-header h3 { font-size: 14px; font-weight: 700; }
  .type-badge { background: #f1f5f9; color: var(--muted); padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; }
  .template-body { padding: 16px; flex: 1; }
  .template-subject { font-size: 12px; font-weight: 700; color: var(--muted); margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed var(--border); }
  .template-text { font-size: 13px; color: #334155; white-space: pre-wrap; line-height: 1.6; }
  .placeholder { color: var(--accent); font-weight: 600; background: var(--blue-bg); padding: 0 2px; }
  .copy-btn { margin-top: 16px; padding: 8px; background: var(--ink); color: white; border: none; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; width: 100%; }

  .tools-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 24px; }
  .tool-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid var(--border); }
  .tool-icon { font-size: 24px; margin-bottom: 12px; }
  .tool-name { font-weight: 700; font-size: 15px; margin-bottom: 6px; }
  .tool-desc { font-size: 12px; color: var(--muted); margin-bottom: 14px; line-height: 1.4; }
  .tool-steps { list-style: none; font-size: 12px; color: #334155; }
  .tool-steps li { margin-bottom: 8px; padding-left: 18px; position: relative; }
  .tool-steps li::before { content: '→'; position: absolute; left: 0; color: var(--accent); }
  .tool-link { font-size: 11px; font-weight: 700; color: var(--accent); text-decoration: none; display: inline-block; margin-top: 10px; }

  .phase-block { border-left: 4px solid var(--accent); background: white; padding: 24px; border-radius: 0 12px 12px 0; margin-bottom: 24px; border: 1px solid var(--border); border-left-width: 4px; }
  .phase-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--accent); margin-bottom: 4px; }
  .phase-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; margin-bottom: 20px; }
  .week-row { display: flex; gap: 20px; }
  .week-label { flex-shrink: 0; width: 80px; height: 24px; background: var(--accent); color: white; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; border-radius: 12px; margin-top: 4px; }
  .week-tasks { font-size: 13px; line-height: 1.6; }
  .week-tasks strong { color: var(--ink); }

  .footer { margin-top: 60px; padding: 40px 0; border-top: 1px solid var(--border); color: var(--muted); font-size: 11px; text-align: center; }
  
  .section-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; margin-bottom: 6px; }
  .section-sub { font-size: 12px; color: var(--muted); margin-bottom: 22px; }
  .info-row { display: flex; gap: 6px; margin-bottom: 8px; font-size: 12px; }
  .info-row strong { font-weight: 600; min-width: 110px; }
  .hs-code { font-family: 'DM Mono', monospace; background: var(--paper); padding: 2px 6px; border-radius: 3px; font-size: 11px; }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="badge">Export Intelligence Platform</div>
    <h1>GraphiQuestor <span>Export Scout</span></h1>
    <p>${headerSubtitle}</p>
  </div>
  <div class="header-right" style="text-align:right;">
    <div style="font-size:12px;color:var(--muted);margin-bottom:4px;">Total Market Potential</div>
    <div style="font-size:24px;font-family:'Syne',sans-serif;font-weight:800;color:white;">${tamDisplay}</div>
    <div style="font-size:11px;color:var(--accent);margin-top:4px;">India's Global Share: ${indiaShareGlobal}%</div>
  </div>
</div>

<div class="nav">
  <div class="nav-tab active" onclick="switchTab('dashboard', this)">📊 Dashboard</div>
  <div class="nav-tab" onclick="switchTab('markets', this)">🌍 Markets</div>
  <div class="nav-tab" onclick="switchTab('outreach', this)">✉️ Outreach Templates</div>
  <div class="nav-tab" onclick="switchTab('intel', this)">🔍 Intel Tools</div>
  <div class="nav-tab" onclick="switchTab('playbook', this)">📋 90-Day Playbook</div>
  <div class="nav-tab" onclick="switchTab('certs', this)">🏅 Certifications</div>
</div>

<div class="main">

  <div class="section active" id="sec-dashboard">
    <div class="stat-row">
      <div class="stat-box">
        <div class="val">5</div>
        <div class="lbl">Phase 1 Target Markets</div>
      </div>
      <div class="stat-box" style="border-top-color:var(--green)">
        <div class="val">${phase1Display}</div>
        <div class="lbl">Phase 1 Combined Market</div>
      </div>
      <div class="stat-box" style="border-top-color:var(--gold)">
        <div class="val">${countryCount}</div>
        <div class="lbl">Total Countries Analyzed</div>
      </div>
      <div class="stat-box" style="border-top-color:var(--accent2)">
        <div class="val">1</div>
        <div class="lbl">HS Code Tracked</div>
      </div>
      <div class="stat-box" style="border-top-color:#888">
        <div class="val">90 Days</div>
        <div class="lbl">Strategy Horizon</div>
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="card-title"><span class="dot"></span> Phase 1 — Priority Export Beachheads</div>
        <table class="market-table">
          <thead><tr>
            <th>Country</th><th>Total Market</th><th>India Share</th><th>Product Status</th><th>Priority</th>
          </tr></thead>
          <tbody>
            ${phase1Rows}
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--gold)"></span> The Core Logic — Path of Least Resistance</div>
        <div style="font-size:13px;line-height:1.8;color:#333;">
          <div style="background:var(--green-bg);border-left:3px solid var(--green);padding:10px 14px;border-radius:3px;margin-bottom:12px;font-size:12px;">
            <strong>First Principle:</strong> Identify markets where Indian ${esc(industry)} suppliers are ALREADY trusted. You are not selling a new concept — you are replacing or supplementing an existing supplier with a better ROI proposition.
          </div>
          <div class="info-row"><strong>Platform:</strong> GraphiQuestor Export Scout</div>
          <div class="info-row"><strong>Product:</strong> <span class="hs-code">HS ${hsn}</span> ${esc(hsnDescription)}</div>
          <div class="info-row"><strong>Value prop:</strong> ${esc(savingsPct)} lower landed cost vs EU/US brands</div>
          <div class="info-row"><strong>Est. Lead time:</strong> ${esc(leadTime)} typical</div>
          <hr style="border:none;border-top:1px solid var(--border);margin:15px 0;">
          <div style="font-size:12px;color:var(--muted);">
            <strong>Strategy:</strong> Focus on distributors who already buy from India. They have the logistics, the trust, and the customers — we just need to provide a better alternative or complementary product range.
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="section" id="sec-markets">
    <div class="section-title">Market Intelligence</div>
    <div class="section-sub">Prioritized list of global markets for HS ${hsn}.</div>
    <div class="card" style="padding:0;overflow:hidden;">
      <table class="market-table" id="market-table">
        <thead><tr>
          <th>Country</th><th>Total Market</th><th>India Share %</th><th>Strategic Tier</th><th>GTM Action</th>
        </tr></thead>
        <tbody id="market-tbody"></tbody>
      </table>
    </div>
  </div>

  <div class="section" id="sec-outreach">
    <div class="section-title">Outreach Templates</div>
    <div class="section-sub">Battle-tested scripts for ${esc(productShort)} export outreach.</div>
    <div class="template-grid">
      <div class="template-card">
        <div class="template-header"><h3>B2B Distributor Outreach</h3><span class="type-badge">EMAIL</span></div>
        <div class="template-body">
          <div class="template-subject">Subject: Indian ${esc(productShort)} supply opportunity for <span class="placeholder">[Country]</span></div>
          <div class="template-text" id="tpl-dist">Dear <span class="placeholder">[First Name]</span>,

I represent GraphiQuestor (graphiquestor.com). We are facilitating export partnerships for ${esc(hsnDescription)} (HS ${hsn}) and I believe <span class="placeholder">[Company Name]</span> would be an excellent partner for Indian supply.

Key Benefits:
→ Pricing ${esc(savingsPct)} below comparable European brands
→ Local after-sales support via our network
→ Flexible payment terms & ${esc(leadTime)} lead time

Would you be open to a 15-minute call to discuss?</div>
          <button class="copy-btn" onclick="copyTemplate('tpl-dist', this)">Copy Template</button>
        </div>
      </div>
      <div class="template-card">
        <div class="template-header"><h3>End-Buyer Prospecting</h3><span class="type-badge">LINKEDIN</span></div>
        <div class="template-body">
          <div class="template-text" id="tpl-li">Hi <span class="placeholder">[First Name]</span>, I see <span class="placeholder">[Company]</span> is active in ${esc(endUserSectors)}. I represent GraphiQuestor — we help firms source ${esc(productShort)} (HS ${hsn}) from high-quality Indian manufacturers with ${esc(savingsPct)} cost savings. Happy to share a catalogue?</div>
          <button class="copy-btn" onclick="copyTemplate('tpl-li', this)">Copy Template</button>
        </div>
      </div>
    </div>
  </div>

  <div class="section" id="sec-intel">
    <div class="section-title">Intelligence Tools</div>
    <div class="tools-grid">
      <div class="tool-card">
        <div class="tool-icon">📦</div>
        <div class="tool-name">Trade Data (Volza/Panjiva)</div>
        <div class="tool-desc">Search for HS ${hsn} + Origin: India. Find companies already buying from India.</div>
      </div>
      <div class="tool-card">
        <div class="tool-icon">💼</div>
        <div class="tool-name">LinkedIn Navigator</div>
        <div class="tool-desc">Search: ${esc(linkedInKeywords)}. Filter by Decision Makers in ${esc(industry)}.</div>
      </div>
      <div class="tool-card">
        <div class="tool-icon">🔎</div>
        <div class="tool-name">Google Search</div>
        <div class="tool-desc">Query: ${esc(googleQuery1)} India.</div>
      </div>
    </div>
  </div>

  <div class="section" id="sec-playbook">
    <div class="section-title">90-Day Execution Playbook</div>
    <div class="phase-block">
      <div class="phase-label">Month 1: Setup & Intel</div>
      <div class="phase-title">Intelligence & Outreach Prep</div>
      <div class="week-tasks">
        • Week 1: Extract leads from Volza for HS ${hsn} in Phase 1 markets.<br>
        • Week 2: Qualify leads on LinkedIn & identify Procurement Managers.<br>
        • Week 3-4: Launch first batch of outreach (50 targets).
      </div>
    </div>
    <div class="card">
      <div class="card-title">Priority Trade Shows</div>
      <ul style="list-style:none; font-size:13px;">
        ${shows.map((s: { name: string; city: string; month: string; desc: string }) => `<li style="margin-bottom:10px;"><strong>${s.name}</strong> (${s.city}, ${s.month}) — ${s.desc}</li>`).join('')}
      </ul>
    </div>
  </div>

  <div class="section" id="sec-certs">
    <div class="section-title">Compliance Roadmap</div>
    <div class="card">
      <div style="font-size:13px; line-height:1.8;">
        • <strong>Phase 1 Markets:</strong> ${esc(certZAF)} / ${esc(certIDN)} / ${esc(certBRA)}<br>
        • <strong>Phase 2 Expansion:</strong> ${esc(certUSA)} / ${esc(certAUS)}<br>
        • <strong>Critical Tip:</strong> ${esc(certPhase2Tip)}
      </div>
    </div>
  </div>

  <div class="footer">
    Generated by <strong>GraphiQuestor Export Scout</strong> • Data sourced from UN Comtrade & Private Intel • ${new Date().toLocaleDateString()}
  </div>

</div>

<script>
  const markets = ${marketsJson};
  
  function switchTab(id, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('sec-' + id).classList.add('active');
    if (el) el.classList.add('active');
    if (id === 'markets') renderMarkets();
  }

  function renderMarkets() {
    const tbody = document.getElementById('market-tbody');
    tbody.innerHTML = markets.map(m => \`
      <tr>
        <td><span class="country-name">\${m.country}</span></td>
        <td class="mkt-size">\${\(m.pVal + m.cVal).toLocaleString()}M</td>
        <td>\${m.pShare}%</td>
        <td><span class="tier-pill tier-p1">\${m.tier}</span></td>
        <td>\${m.status}</td>
        <td style="font-size:11px; color:var(--muted);">\${m.gtm}</td>
      </tr>
    \`).join('');
  }

  function copyTemplate(id, btn) {
    const text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text);
    const oldText = btn.innerText;
    btn.innerText = 'Copied!';
    setTimeout(() => btn.innerText = oldText, 2000);
  }

  // Init
  renderMarkets();
</script>

</body>
</html>`;
}
