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
const HS_LT = "8512"; // Light Towers
const HS_DG = "8502"; // DG Sets / Generating Sets

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

// Phase 1 market ISO3 codes (fixed for the dashboard tab)
const PHASE1_ISO3 = ["ZAF", "IDN", "BRA", "CHL", "PRT"];

// GTM action text per known ISO3
const GTM_TEXT: Record<string, string> = {
  ZAF: "Find top 3 LT importers via Volza. India dominates LT here. Easiest entry.",
  IDN: "Engage Jakarta/Surabaya industrial distributors. India well-established. Use FIEO match.",
  BRA: "Lead with DG via existing Indian import channel. LT as upsell.",
  CHL: "Mining sector drives demand. India has strong LT share. Find existing importer.",
  PRT: "India has highest share — find who is buying. CE Mark needed for EU access.",
  NOR: "Proven India channel for LT. Oil & gas / construction sector. CE Mark required.",
  ESP: "Large market, low India share. Gateway to LATAM. CE Mark critical. Trade show entry.",
  AUS: "ECTA FTA advantage. Mining sector. RCM certification needed. AIMEX trade show.",
  MEX: "DG has India traction. Large market. Find established industrial importer.",
  ROU: "Mid-level India share. EU member — CE Mark needed. Construction sector growing.",
  USA: "Massive market, low India share. UL listing required. Long cycle. Phase 2 only.",
  GBR: "UKCA certification post-Brexit. Large market but limited India presence. Medium-term.",
  CZE: "EU market, CE needed. Gateway to Eastern Europe.",
  JPN: "High quality bar. Long sales cycle. Consider Japanese-origin Indian JV.",
  MYS: "ASEAN — similar dynamics to Indonesia. Piggyback on Indonesia distributor network.",
  DNK: "LT India share exists. EU market, CE Mark. Niche but quality buyer.",
  EGY: "Large infra market. Power shortage drives DG demand. EEPC trade mission recommended.",
  LTU: "India stronghold for LT. Find existing importer and offer competitive pricing.",
  PRY: "Small but accessible. LATAM gateway play.",
  SRB: "India has LT share. Smaller market. Could bundle with Romania approach.",
};

// Static fallback market data (used when DB has no rows for a country)
// Values: lt/dg in USD millions, lt_i/dg_i in percent, tier, lead product
const STATIC_FALLBACK: Record<string, {lt:number;dg:number;lt_i:number;dg_i:number;tier:string;lead:string}> = {
  ZAF: { lt:142, dg:787, lt_i:39.3, dg_i:0.9,  tier:"P1", lead:"Light Tower" },
  IDN: { lt:284, dg:680, lt_i:15.1, dg_i:3.0,  tier:"P1", lead:"Light Tower" },
  BRA: { lt:843, dg:572, lt_i:0.1,  dg_i:9.9,  tier:"P1", lead:"DG Sets" },
  CHL: { lt:62,  dg:538, lt_i:40.7, dg_i:0.2,  tier:"P1", lead:"Light Tower" },
  PRT: { lt:231, dg:68,  lt_i:52.2, dg_i:0.1,  tier:"P1", lead:"Light Tower" },
  NOR: { lt:107, dg:96,  lt_i:7.8,  dg_i:0.5,  tier:"P1", lead:"Light Tower" },
  ESP: { lt:1151,dg:364, lt_i:2.6,  dg_i:1.4,  tier:"P2", lead:"Both" },
  AUS: { lt:323, dg:483, lt_i:6.8,  dg_i:0.4,  tier:"P2", lead:"Light Tower" },
  MEX: { lt:1950,dg:403, lt_i:0.1,  dg_i:3.6,  tier:"P2", lead:"DG Sets" },
  ROU: { lt:307, dg:244, lt_i:2.1,  dg_i:1.6,  tier:"P2", lead:"Both" },
  USA: { lt:6517,dg:2762,lt_i:0,    dg_i:0.7,  tier:"P2", lead:"Both" },
  GBR: { lt:1028,dg:1856,lt_i:0,    dg_i:0.2,  tier:"P2", lead:"Both" },
  CZE: { lt:1256,dg:148, lt_i:0.3,  dg_i:1.8,  tier:"P2", lead:"DG Sets" },
  JPN: { lt:836, dg:505, lt_i:0,    dg_i:1.8,  tier:"P2", lead:"DG Sets" },
  MYS: { lt:299, dg:676, lt_i:0.6,  dg_i:0.4,  tier:"P3", lead:"DG Sets" },
  DNK: { lt:110, dg:329, lt_i:4.8,  dg_i:0,    tier:"P3", lead:"Light Tower" },
  EGY: { lt:78,  dg:359, lt_i:0,    dg_i:0.2,  tier:"P3", lead:"DG Sets" },
  LTU: { lt:46,  dg:79,  lt_i:30.8, dg_i:0,    tier:"P4", lead:"Light Tower" },
  PRY: { lt:18,  dg:30,  lt_i:2.7,  dg_i:1.0,  tier:"P3", lead:"Both" },
  SRB: { lt:129, dg:16,  lt_i:10.6, dg_i:1.0,  tier:"P4", lead:"Light Tower" },
};

// Phase 1 display order (fixed)
const PHASE1_ORDER = ["ZAF", "IDN", "BRA", "CHL", "PRT"];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Assign strategic tier from India share and market size */
function calcTier(lt_i: number, dg_i: number, total_m: number): string {
  const max_share = Math.max(lt_i, dg_i);
  if (max_share >= 20) return "P4";                        // Stronghold
  if (max_share >= 5 && total_m < 1000) return "P1";       // Proven small
  if (max_share >= 5 && total_m >= 1000) return "P1";      // Proven large
  if (total_m >= 800 && max_share < 3) return "P2";        // Untapped large
  if (max_share >= 2 && max_share < 5) return "P1";        // Moderate India share
  if (total_m >= 300) return "P2";
  return "P3";
}

/** Determine lead product from market sizes + India share */
function calcLead(lt_m: number, dg_m: number, lt_i: number, dg_i: number): string {
  if (lt_i > dg_i * 2 && lt_i > 3) return "Light Tower";
  if (dg_i > lt_i * 2 && dg_i > 3) return "DG Sets";
  if (lt_m > dg_m * 1.5) return "Light Tower";
  if (dg_m > lt_m * 1.5) return "DG Sets";
  return "Both";
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
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface MarketEntry {
  iso3: string;
  country: string;  // display label with flag
  lt: number;       // LT market USD millions
  dg: number;       // DG market USD millions
  lt_i: number;     // India LT share %
  dg_i: number;     // India DG share %
  tier: string;
  lead: string;
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

  let ltDemand: DemandRow[] = [];
  let dgDemand: DemandRow[] = [];
  let ltIndia: SupplierRow[] = [];
  let dgIndia: SupplierRow[] = [];

  try {
    const sb = createClient(supabaseUrl, supabaseKey);

    // Trade demand: import totals per country for both HS codes
    // Use prefix match to capture 4-digit and 6-digit sub-codes, then dedup to highest value per country
    const [ltDemandRes, dgDemandRes, ltIndiaRes, dgIndiaRes] = await Promise.all([
      sb.from("trade_demand_cache")
        .select("reporter_iso3,reporter_name,year,import_value_usd")
        .filter("hs_code", "ilike", `${HS_LT}%`)
        .order("year", { ascending: false }),

      sb.from("trade_demand_cache")
        .select("reporter_iso3,reporter_name,year,import_value_usd")
        .filter("hs_code", "ilike", `${HS_DG}%`)
        .order("year", { ascending: false }),

      sb.from("trade_supplier_breakdown")
        .select("reporter_iso3,year,import_value_usd,market_share_pct")
        .filter("hs_code", "ilike", `${HS_LT}%`)
        .eq("partner_iso3", "IND")
        .order("year", { ascending: false }),

      sb.from("trade_supplier_breakdown")
        .select("reporter_iso3,year,import_value_usd,market_share_pct")
        .filter("hs_code", "ilike", `${HS_DG}%`)
        .eq("partner_iso3", "IND")
        .order("year", { ascending: false }),
    ]);

    ltDemand = dedup((ltDemandRes.data ?? []) as DemandRow[]);
    dgDemand = dedup((dgDemandRes.data ?? []) as DemandRow[]);
    ltIndia  = dedup((ltIndiaRes.data  ?? []) as SupplierRow[]);
    dgIndia  = dedup((dgIndiaRes.data  ?? []) as SupplierRow[]);
  } catch (err) {
    console.error("DB fetch error:", err);
    // Fall through — static fallback will be used for all countries
  }

  // ── Build country-level maps ────────────────────────────────────────────────
  const ltDemandMap = new Map(ltDemand.map(r => [r.reporter_iso3, r]));
  const dgDemandMap = new Map(dgDemand.map(r => [r.reporter_iso3, r]));
  const ltIndiaMap  = new Map(ltIndia.map(r =>  [r.reporter_iso3, r]));
  const dgIndiaMap  = new Map(dgIndia.map(r =>  [r.reporter_iso3, r]));

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
    ...ltDemand.map(r => r.reporter_iso3),
    ...dgDemand.map(r => r.reporter_iso3),
    ...Object.keys(STATIC_FALLBACK),
  ]);
  // Remove India itself from market list
  allIso3.delete("IND");

  // Build unified market entries
  const markets: MarketEntry[] = [];
  for (const iso3 of allIso3) {
    const ltRow = ltDemandMap.get(iso3);
    const dgRow = dgDemandMap.get(iso3);
    const ltIRow = ltIndiaMap.get(iso3);
    const dgIRow = dgIndiaMap.get(iso3);

    const hasRealLt = ltRow != null;
    const hasRealDg = dgRow != null;
    const hasAnyReal = hasRealLt || hasRealDg;

    const fallback = STATIC_FALLBACK[iso3];

    // Market sizes in USD millions
    const lt_m = hasRealLt
      ? Math.round((ltRow!.import_value_usd ?? 0) / 1_000_000)
      : (fallback?.lt ?? 0);
    const dg_m = hasRealDg
      ? Math.round((dgRow!.import_value_usd ?? 0) / 1_000_000)
      : (fallback?.dg ?? 0);

    // India share %
    const lt_i = hasRealLt
      ? parseFloat(indiaShare(ltIRow, ltRow).toFixed(1))
      : (fallback?.lt_i ?? 0);
    const dg_i = hasRealDg
      ? parseFloat(indiaShare(dgIRow, dgRow).toFixed(1))
      : (fallback?.dg_i ?? 0);

    // Skip countries with zero market data and no fallback
    if (lt_m === 0 && dg_m === 0 && !fallback) continue;

    const tier = fallback?.tier ?? calcTier(lt_i, dg_i, lt_m + dg_m);
    const lead = fallback?.lead ?? calcLead(lt_m, dg_m, lt_i, dg_i);
    const countryLabel = COUNTRY_DISPLAY[iso3] ??
      (ltRow?.reporter_name ?? dgRow?.reporter_name ?? iso3);
    const gtm = GTM_TEXT[iso3] ?? `India share LT ${lt_i}% / DG ${dg_i}%. Find local importer.`;

    markets.push({ iso3, country: countryLabel, lt: lt_m, dg: dg_m, lt_i, dg_i, tier, lead, gtm, fromDb: hasAnyReal });
  }

  // Sort: Phase 1 first (in fixed order), then by tier, then by total market desc
  const tierOrder: Record<string, number> = { P1: 0, P4: 1, P2: 2, P3: 3 };
  markets.sort((a, b) => {
    const p1A = PHASE1_ORDER.indexOf(a.iso3);
    const p1B = PHASE1_ORDER.indexOf(b.iso3);
    if (p1A !== -1 && p1B === -1) return -1;
    if (p1A === -1 && p1B !== -1) return 1;
    if (p1A !== -1 && p1B !== -1) return p1A - p1B;
    const tA = tierOrder[a.tier] ?? 9;
    const tB = tierOrder[b.tier] ?? 9;
    if (tA !== tB) return tA - tB;
    return (b.lt + b.dg) - (a.lt + a.dg);
  });

  // ── TAM computation ─────────────────────────────────────────────────────────
  // Sum across all countries (use DB data where available, static fallback otherwise)
  let tamLt = 0, tamDg = 0;
  let indiaLtExports = 0, indiaDgExports = 0;

  for (const m of markets) {
    tamLt += m.lt;
    tamDg += m.dg;
    indiaLtExports += m.lt * (m.lt_i / 100);
    indiaDgExports += m.dg * (m.dg_i / 100);
  }
  const totalTam = tamLt + tamDg;
  const indiaTotal = indiaLtExports + indiaDgExports;
  const indiaShareGlobal = totalTam > 0 ? ((indiaTotal / totalTam) * 100).toFixed(1) : "2.1";
  const countryCount = markets.length;

  const tamDisplay = fmtM(totalTam);

  // ── Phase 1 data ────────────────────────────────────────────────────────────
  const phase1Markets = PHASE1_ORDER.map(iso3 => {
    const m = markets.find(x => x.iso3 === iso3);
    if (m) return m;
    // If somehow missing, create from static fallback
    const fb = STATIC_FALLBACK[iso3]!;
    return {
      iso3, country: COUNTRY_DISPLAY[iso3] ?? iso3,
      lt: fb.lt, dg: fb.dg, lt_i: fb.lt_i, dg_i: fb.dg_i,
      tier: fb.tier, lead: fb.lead,
      gtm: GTM_TEXT[iso3] ?? "",
      fromDb: false,
    } as MarketEntry;
  });

  const phase1TotalM = phase1Markets.reduce((s, m) => s + m.lt + m.dg, 0);
  const phase1Display = fmtM(phase1TotalM);

  // ── Build HTML ──────────────────────────────────────────────────────────────
  const pageTitle = `Powerlux Export Scout — HS ${hsn} ${hsnDescription}`;
  const headerSubtitle = `HS ${hsn} ${esc(hsnDescription)} &nbsp;|&nbsp; Based on 2025 UN Comtrade Data`;

  // Phase 1 table rows
  const phase1Rows = phase1Markets.map(m => {
    const barLtW = Math.min(Math.round(m.lt_i * 2), 100);  // scale for visual: 50% → full bar
    const leadCls = m.lead === "DG Sets" ? "tier-p2" : "tier-p1";
    return `<tr>
              <td><span class="country-name">${m.country}</span></td>
              <td class="mkt-size">${fmtM(m.lt + m.dg)}</td>
              <td><div class="progress-bar"><div class="progress-fill" style="width:${barLtW}%"></div></div><span style="font-size:11px;font-family:'DM Mono',monospace;margin-left:6px">${m.lt_i}%</span></td>
              <td><span class="tier-pill ${leadCls}">${m.lead}</span></td>
              <td><span class="tier-pill tier-p1">🔥 NOW</span></td>
            </tr>`;
  }).join("\n");

  // Markets JS array (server-generated, injected into script tag)
  const marketsJson = JSON.stringify(
    markets.map(m => ({
      country: m.country,
      lt: m.lt,
      dg: m.dg,
      lt_i: m.lt_i,
      dg_i: m.dg_i,
      tier: m.tier,
      lead: m.lead,
      gtm: m.gtm,
    }))
  );

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
  let googleQuery1 = `"${hsnDesc.split(" ")[0].toLowerCase()} importer [country]"`;
  let googleQuery2 = `"${hsnDesc.split(" ")[0].toLowerCase()} distributor [country] India"`;
  let googleQuery3 = `"HS ${hsn} importer [country]"`;
  let volzaProductDesc = `"${hsnDesc.split(" ")[0].toLowerCase()}" | Origin: India`;

  if (code === 8512) {
    productShort = "Light Tower Equipment";
    industry = "electrical equipment";
    endUserSectors = "construction, mining, events, infrastructure";
    productApplications = "night-time construction, mining, events — high-output mobile lighting";
    linkedInKeywords = `"light tower" OR "DG set" OR "generator" OR "portable lighting"`;
    googleQuery1 = `"light tower importer [country]"`;
    googleQuery2 = `"portable lighting distributor [country] India"`;
    googleQuery3 = `"HS 8512 importer [country]"`;
    volzaProductDesc = `"light tower" OR "lighting tower" | Origin: India`;
  } else if (code === 8502) {
    productShort = "Generating Sets / DG Sets";
    industry = "electrical equipment";
    endUserSectors = "construction, data centres, hospitals, manufacturing";
    productApplications = "10kVA to 500kVA diesel/gas generating sets for commercial and industrial use";
    linkedInKeywords = `"generator" OR "generating set" OR "DG set" OR "genset"`;
    googleQuery1 = `"generator importer [country]"`;
    googleQuery2 = `"generating set distributor [country] India"`;
    googleQuery3 = `"HS 8502 importer [country]"`;
    volzaProductDesc = `"generating set" OR "DG set" OR "genset" | Origin: India`;
  } else if (code === 8501) {
    productShort = "Electric Motors";
    industry = "electrical equipment";
    endUserSectors = "manufacturing, pumping stations, HVAC, industrial plants";
    productApplications = "AC/DC electric motors for industrial machinery, pumps, compressors";
    linkedInKeywords = `"electric motor" OR "motor importer" OR "industrial motor"`;
    googleQuery1 = `"electric motor importer [country]"`;
    googleQuery2 = `"motor distributor [country] India"`;
    googleQuery3 = `"HS 8501 importer [country]"`;
    volzaProductDesc = `"electric motor" OR "AC motor" | Origin: India`;
  } else if (code >= 8500 && code < 8600) {
    industry = "electrical equipment";
    endUserSectors = "manufacturing, construction, industrial plants";
    productApplications = "electrical and industrial applications";
    linkedInKeywords = `"${hsnDesc.split(" ")[0].toLowerCase()}" OR "electrical equipment" OR "electronics importer"`;
    googleQuery2 = `"electrical equipment distributor [country] India"`;
  } else if (code >= 8400 && code < 8500) {
    industry = "industrial machinery";
    endUserSectors = "manufacturing, construction, agriculture, processing industry";
    productApplications = "industrial and manufacturing applications";
    linkedInKeywords = `"${hsnDesc.split(" ")[0].toLowerCase()}" OR "machinery importer" OR "industrial equipment"`;
    googleQuery2 = `"machinery distributor [country] India"`;
    volzaProductDesc = `"${hsnDesc.split(" ")[0].toLowerCase()}" OR "machinery" | Origin: India`;
  } else if (code >= 2700 && code < 3000) {
    industry = "chemicals / petroleum";
    endUserSectors = "petrochemical, manufacturing, energy sector";
    productApplications = "chemical and industrial processing applications";
    linkedInKeywords = `"${hsnDesc.split(" ")[0].toLowerCase()}" OR "chemical importer" OR "chemical distributor"`;
    googleQuery2 = `"chemical distributor [country] India"`;
  } else if (code >= 3000 && code < 3100) {
    industry = "pharmaceutical";
    endUserSectors = "healthcare, hospitals, pharma distributors";
    productApplications = "pharmaceutical and healthcare applications";
    linkedInKeywords = `"${hsnDesc.split(" ")[0].toLowerCase()}" OR "pharma importer" OR "healthcare distributor"`;
    googleQuery2 = `"pharma distributor [country] India"`;
  } else if (code >= 5000 && code < 6400) {
    industry = "textile";
    endUserSectors = "garment industry, retail, fashion brands";
    productApplications = "textile and garment manufacturing";
    linkedInKeywords = `"${hsnDesc.split(" ")[0].toLowerCase()}" OR "textile importer" OR "fabric distributor"`;
    googleQuery2 = `"textile distributor [country] India"`;
  } else if (code >= 7200 && code < 7400) {
    industry = "steel / metal";
    endUserSectors = "construction, manufacturing, fabrication";
    productApplications = "construction and industrial fabrication applications";
    linkedInKeywords = `"${hsnDesc.split(" ")[0].toLowerCase()}" OR "steel importer" OR "metal distributor"`;
    googleQuery2 = `"steel distributor [country] India"`;
    volzaProductDesc = `"${hsnDesc.split(" ")[0].toLowerCase()}" OR "steel" | Origin: India`;
  } else if (code >= 8700 && code < 8800) {
    industry = "automotive";
    endUserSectors = "automotive OEMs, dealerships, repair workshops";
    productApplications = "automotive and transportation applications";
    linkedInKeywords = `"${hsnDesc.split(" ")[0].toLowerCase()}" OR "auto parts importer" OR "automotive distributor"`;
    googleQuery2 = `"auto parts distributor [country] India"`;
  }

  const isElectrical = code >= 8500 && code < 8600;
  const isMachinery = code >= 8400 && code < 8500;
  const isChemical = code >= 2700 && code < 3100;

  // Phase 1 certification notes per country — category-aware
  const certZAF = isChemical
    ? `Chemical products require SABS/NCC approval. Verify distributor holds chemical import licence. Relatively accessible via local agent.`
    : isElectrical
    ? `Electrical equipment needs NRCS Letter of Authority. HS ${hsn} may need RoHS compliance. Relatively easier to navigate via local certified agent.`
    : isMachinery
    ? `Machinery may need SABS type-approval. Navigate via local certified agent. Generally accessible for Indian exporters.`
    : `Products need SABS approval in the relevant category. Navigate via a locally certified import agent.`;

  const certIDN = isElectrical
    ? `Standar Nasional Indonesia (SNI) required for electrical equipment. Enter via distributor who holds SNI. Critical: partner must have SNI for HS ${hsn}.`
    : isChemical
    ? `Chemical products require BPOM registration. Partner with a licensed local chemical importer who holds existing approvals.`
    : isMachinery
    ? `SNI certification applies to regulated machinery categories. Local distributor typically holds this — verify before proceeding.`
    : `SNI certification may be required depending on sub-category. Confirm with local distributor before quoting.`;

  const certBRA = isElectrical
    ? `INMETRO compulsory certification for electrical equipment. Distributor typically holds this. Verify partner has INMETRO for HS ${hsn} before proceeding.`
    : isChemical
    ? `ANVISA registration required for chemicals. Complex process — partner with a licensed importer who has existing ANVISA approvals.`
    : isMachinery
    ? `INMETRO or sector-specific certification may apply. Verify with local legal counsel or established distributor.`
    : `Brazil has mandatory INMETRO or ANVISA certification depending on product. Verify applicable regime with local distributor.`;

  const certCHL = isElectrical || isMachinery
    ? `Servicio Eléctrico Certificación required for powered equipment. Mining sector adds SERNAGEOMIN compliance. Local partner usually manages both.`
    : isChemical
    ? `Chemical imports regulated by SEREMI. Partner with a licensed local chemical importer. Mining sector use adds additional SAG compliance layer.`
    : `Import regulations administered by customs authority (SII). Local distributor handles certification. Straightforward for most industrial products.`;

  const certPRT = `Portugal (EU) — CE marking mandatory for all ${isElectrical ? "electrical" : isMachinery ? "machinery" : "regulated"} equipment sold in the EU. This is the critical unlock for all of Europe (Spain, Romania, etc.). Priority investment for any serious EU market entry.`;

  const certAUS = isElectrical
    ? `Regulatory Compliance Mark (RCM) required. Australia–India ECTA FTA gives tariff advantage. Obtain via accredited testing body. Approx. 3–4 months.`
    : isMachinery
    ? `Machinery must meet Australian safety standards (AS/NZS). RCM or Safety Mark required for electrical components. ECTA FTA gives tariff advantage.`
    : isChemical
    ? `NICNAS/AICIS registration required for industrial chemicals. Partner with a registered Australian importer for Phase 1.`
    : `Australian Border Force and relevant sector regulator standards apply. Engage local compliance specialist for product-specific requirements.`;

  const certUSA = isElectrical
    ? `UL listing for electrical safety is de facto mandatory for B2B sales. Long process (6–12 months). Only pursue once Phase 1 revenue justifies the investment.`
    : isMachinery
    ? `OSHA-compliant safety documentation required. CE Mark (if already obtained for EU) accelerates USA market credibility. Long B2B sales cycle — Phase 2 only.`
    : isChemical
    ? `EPA TSCA registration required for chemical imports. Complex and expensive. Phase 2 only — once Phase 1 cash flow is established.`
    : `USA market entry requires product-specific federal or state compliance. Engage a USA-based import compliance specialist. Phase 2 only.`;

  const certPhase2Tip = isElectrical
    ? `For electrical equipment, UL (USA) takes 6–12 months and RCM (Australia) takes 3–4 months. Only pursue once Phase 1 revenue is established. CE Mark (Portugal/EU) is your highest-ROI first certification.`
    : isMachinery
    ? `Machinery exports to USA require OSHA-compliant documentation. Australia needs Safety Mark. CE Mark for EU is the broadest unlock. Bundle testing across markets to reduce per-country cost.`
    : isChemical
    ? `Chemical products require EPA (USA), REACH (EU), and country-specific chemical registration. These are long processes — engage a specialist export compliance firm before committing.`
    : `Certification requirements vary significantly by product and destination. Engage a specialist export compliance firm to map the Phase 2 certification roadmap for HS ${hsn} before investing.`;

  return {
    productShort, industry, endUserSectors, productApplications,
    linkedInKeywords, googleQuery1, googleQuery2, googleQuery3, volzaProductDesc,
    certZAF, certIDN, certBRA, certCHL, certPRT, certAUS, certUSA, certPhase2Tip,
    isElectrical, isMachinery,
  };
}

// ── HTML builder ──────────────────────────────────────────────────────────────
function buildHtml(p: {
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
}): string {
  const { pageTitle, headerSubtitle, tamDisplay, countryCount, indiaShareGlobal,
          phase1Display, phase1Rows, marketsJson, hsn, hsnDescription } = p;

  const ctx = getProductContext(hsn, hsnDescription);
  const {
    productShort, industry, endUserSectors, productApplications,
    linkedInKeywords, googleQuery1, googleQuery2, googleQuery3, volzaProductDesc,
    certZAF, certIDN, certBRA, certCHL, certPRT, certAUS, certUSA, certPhase2Tip,
  } = ctx;

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(pageTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: #0a0a0f;
    --paper: #f5f3ee;
    --accent: #d4450c;
    --accent2: #1a5276;
    --gold: #c9a84c;
    --muted: #6b6b7a;
    --border: #d8d5ce;
    --green: #1e6b45;
    --green-bg: #edf7f1;
    --amber: #8a5e00;
    --amber-bg: #fdf6e3;
    --blue-bg: #eaf1fb;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--paper);
    color: var(--ink);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    line-height: 1.6;
  }

  /* ── HEADER ── */
  .header {
    background: var(--ink);
    color: var(--paper);
    padding: 28px 40px 22px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 3px solid var(--accent);
  }
  .header-left h1 {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 1.1;
  }
  .header-left h1 span { color: var(--accent); }
  .header-left p {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #9090a0;
    margin-top: 6px;
    letter-spacing: 0.5px;
  }
  .header-right {
    text-align: right;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: #9090a0;
    line-height: 1.8;
  }
  .badge {
    display: inline-block;
    background: var(--accent);
    color: white;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 1px;
    padding: 3px 8px;
    border-radius: 2px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  /* ── NAV TABS ── */
  .nav {
    background: var(--ink);
    padding: 0 40px;
    display: flex;
    gap: 2px;
    border-bottom: 1px solid #222;
  }
  .nav-tab {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.5px;
    color: #888;
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .nav-tab:hover { color: #ccc; }
  .nav-tab.active { color: var(--paper); border-bottom-color: var(--accent); }

  /* ── MAIN LAYOUT ── */
  .main { padding: 32px 40px; max-width: 1400px; margin: 0 auto; }
  .section { display: none; }
  .section.active { display: block; }

  /* ── CARDS ── */
  .card {
    background: white;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 22px 26px;
    margin-bottom: 18px;
  }
  .card-title {
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .card-title .dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
  }

  /* ── STAT ROW ── */
  .stat-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
    margin-bottom: 24px;
  }
  .stat-box {
    background: white;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 16px 18px;
    border-top: 3px solid var(--accent);
  }
  .stat-box .val {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: var(--ink);
    line-height: 1;
  }
  .stat-box .lbl {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    margin-top: 5px;
    letter-spacing: 0.3px;
  }

  /* ── MARKET TABLE ── */
  .market-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .market-table th {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.5px;
    color: var(--muted);
    text-transform: uppercase;
    padding: 10px 14px;
    border-bottom: 2px solid var(--border);
    text-align: left;
    background: #fafaf8;
  }
  .market-table td {
    padding: 11px 14px;
    border-bottom: 1px solid #eeece8;
    vertical-align: middle;
  }
  .market-table tr:hover td { background: #f9f8f5; }
  .country-name { font-weight: 600; font-size: 13px; }
  .tier-pill {
    display: inline-block;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.5px;
    padding: 2px 7px;
    border-radius: 20px;
    font-weight: 500;
  }
  .tier-p1 { background: #d4f0e0; color: #1e6b45; }
  .tier-p2 { background: #fde8d8; color: #8a3010; }
  .tier-p3 { background: #fef9e7; color: #7f6000; }
  .tier-p4 { background: #eaf1fb; color: #1a5276; }
  .progress-bar { background: #eee; border-radius: 4px; height: 6px; width: 80px; }
  .progress-fill { height: 6px; border-radius: 4px; background: var(--accent); }
  .mkt-size { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--ink); }
  .action-btn {
    background: var(--ink);
    color: white;
    border: none;
    padding: 4px 10px;
    border-radius: 3px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    cursor: pointer;
    letter-spacing: 0.3px;
  }
  .action-btn:hover { background: var(--accent); }

  /* ── PIPELINE CRM ── */
  .pipeline-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
    margin-bottom: 24px;
  }
  .pipeline-col { min-height: 400px; }
  .pipeline-header {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    padding: 10px 14px;
    border-radius: 4px 4px 0 0;
    font-weight: 500;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ph-scout { background: #eee; color: #555; }
  .ph-contact { background: #fde8d8; color: #8a3010; }
  .ph-qualify { background: #fef9e7; color: #7f6000; }
  .ph-propose { background: #d4f0e0; color: #1e6b45; }
  .ph-close { background: #dce8f8; color: #1a5276; }
  .pipeline-body {
    background: white;
    border: 1px solid var(--border);
    border-top: none;
    border-radius: 0 0 4px 4px;
    padding: 10px;
    min-height: 360px;
  }
  .lead-card {
    background: var(--paper);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 10px 12px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: box-shadow 0.15s;
  }
  .lead-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .lead-name { font-weight: 600; font-size: 12px; }
  .lead-meta { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted); margin-top: 3px; }
  .lead-val { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--accent); font-weight: 500; margin-top: 4px; }
  .add-lead-btn {
    width: 100%;
    background: none;
    border: 1px dashed var(--border);
    border-radius: 4px;
    padding: 8px;
    color: var(--muted);
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    cursor: pointer;
    margin-top: 6px;
  }
  .add-lead-btn:hover { border-color: var(--accent); color: var(--accent); }

  /* ── OUTREACH TEMPLATES ── */
  .template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .template-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .template-header {
    padding: 14px 18px;
    background: var(--ink);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .template-header h3 { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; }
  .template-header .type-badge {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    background: var(--accent);
    padding: 2px 7px;
    border-radius: 2px;
  }
  .template-body { padding: 16px 18px; }
  .template-subject {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    margin-bottom: 8px;
    padding: 6px 10px;
    background: var(--paper);
    border-radius: 3px;
    border-left: 3px solid var(--gold);
  }
  .template-text {
    font-size: 12px;
    line-height: 1.7;
    color: #333;
    white-space: pre-line;
  }
  .template-text .placeholder {
    background: #fff3cd;
    padding: 0 3px;
    border-radius: 2px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #856404;
  }
  .copy-btn {
    margin-top: 12px;
    background: var(--ink);
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 3px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    cursor: pointer;
    letter-spacing: 0.3px;
  }
  .copy-btn:hover { background: var(--accent); }
  .copy-btn.copied { background: var(--green); }

  /* ── INTEL / RESEARCH TOOLS ── */
  .tools-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 24px; }
  .tool-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 20px;
  }
  .tool-icon { font-size: 24px; margin-bottom: 10px; }
  .tool-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; margin-bottom: 6px; }
  .tool-desc { font-size: 12px; color: var(--muted); line-height: 1.5; margin-bottom: 12px; }
  .tool-steps { font-size: 12px; }
  .tool-steps li { margin-bottom: 5px; padding-left: 16px; position: relative; color: #444; }
  .tool-steps li::before { content: '→'; position: absolute; left: 0; color: var(--accent); font-size: 11px; }
  .tool-link {
    display: inline-block;
    margin-top: 10px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--accent2);
    text-decoration: none;
    border-bottom: 1px dashed var(--accent2);
  }

  /* ── PLAYBOOK ── */
  .phase-block {
    border-left: 4px solid var(--accent);
    padding: 0 0 0 20px;
    margin-bottom: 28px;
  }
  .phase-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--accent);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .phase-title {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 800;
    margin-bottom: 14px;
  }
  .step-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .step-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 16px;
  }
  .step-num {
    font-family: 'DM Mono', monospace;
    font-size: 20px;
    font-weight: 500;
    color: var(--border);
    line-height: 1;
    margin-bottom: 8px;
  }
  .step-title { font-weight: 700; font-size: 13px; margin-bottom: 6px; }
  .step-detail { font-size: 12px; color: var(--muted); line-height: 1.5; }
  .week-row {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 16px;
    margin-bottom: 10px;
    align-items: start;
  }
  .week-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: white;
    background: var(--accent);
    padding: 4px 8px;
    border-radius: 3px;
    text-align: center;
    margin-top: 2px;
  }
  .week-tasks { font-size: 12px; color: #333; line-height: 1.6; }

  /* ── TRACKER TABLE ── */
  .tracker-controls {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
    align-items: center;
  }
  .tracker-controls input, .tracker-controls select {
    background: white;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 8px 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    color: var(--ink);
  }
  .tracker-controls input { flex: 1; }
  .add-row-btn {
    background: var(--accent);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    cursor: pointer;
    margin-left: auto;
  }
  .tracker-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .tracker-table th {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: var(--muted);
    padding: 9px 12px;
    border-bottom: 2px solid var(--border);
    background: #fafaf8;
    text-align: left;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  .tracker-table td {
    padding: 9px 12px;
    border-bottom: 1px solid #f0ede8;
    vertical-align: middle;
  }
  .tracker-table tr:hover td { background: #f9f8f5; }
  .status-dot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    margin-right: 6px;
  }
  .s-scout { background: #bbb; }
  .s-contact { background: #f4a460; }
  .s-qualify { background: #ffd700; }
  .s-propose { background: #90ee90; }
  .s-close { background: #4169e1; }
  .s-won { background: #2e8b57; }

  /* ── MODAL ── */
  .modal-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 1000;
    align-items: center;
    justify-content: center;
  }
  .modal-overlay.open { display: flex; }
  .modal {
    background: white;
    border-radius: 8px;
    padding: 28px 32px;
    width: 560px;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
  }
  .modal h2 {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 800;
    margin-bottom: 20px;
  }
  .modal-close {
    position: absolute;
    top: 16px; right: 20px;
    background: none; border: none;
    font-size: 20px; cursor: pointer;
    color: var(--muted);
  }
  .form-group { margin-bottom: 14px; }
  .form-group label {
    display: block;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.5px;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 5px;
  }
  .form-group input, .form-group select, .form-group textarea {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 9px 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
  }
  .form-group textarea { min-height: 70px; resize: vertical; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .submit-btn {
    background: var(--accent);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    width: 100%;
    margin-top: 6px;
  }

  /* ── MISC ── */
  .section-title {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 800;
    margin-bottom: 6px;
  }
  .section-sub {
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 22px;
  }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; }
  .info-row { display: flex; gap: 6px; margin-bottom: 8px; font-size: 12px; }
  .info-row strong { font-weight: 600; min-width: 110px; }
  .cert-row { display: flex; gap: 14px; margin-bottom: 10px; align-items: flex-start; }
  .cert-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
  .cert-body h4 { font-weight: 700; font-size: 13px; margin-bottom: 2px; }
  .cert-body p { font-size: 12px; color: var(--muted); line-height: 1.4; }
  .hs-code { font-family: 'DM Mono', monospace; background: var(--paper); padding: 2px 6px; border-radius: 3px; font-size: 11px; }
  hr.divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <div class="badge">Authorized Distributor</div>
    <h1>Powerlux <span>Export Scout</span></h1>
    <p>${headerSubtitle}</p>
  </div>
  <div class="header-right">
    <div>Total Addressable Market</div>
    <div style="font-size:18px;font-family:'Syne',sans-serif;font-weight:800;color:white;">${tamDisplay}</div>
    <div>Light Tower + DG Sets (${countryCount} countries)</div>
    <div style="margin-top:6px">India's current share: <span style="color:#f4a460">${indiaShareGlobal}%</span></div>
  </div>
</div>

<div class="nav">
  <div class="nav-tab active" onclick="switchTab('dashboard')">📊 Dashboard</div>
  <div class="nav-tab" onclick="switchTab('markets')">🌍 Markets</div>
  <div class="nav-tab" onclick="switchTab('pipeline')">🎯 Pipeline CRM</div>
  <div class="nav-tab" onclick="switchTab('outreach')">✉️ Outreach Templates</div>
  <div class="nav-tab" onclick="switchTab('intel')">🔍 Intel Tools</div>
  <div class="nav-tab" onclick="switchTab('playbook')">📋 90-Day Playbook</div>
  <div class="nav-tab" onclick="switchTab('certs')">🏅 Certifications</div>
</div>

<div class="main">

  <!-- ══════════════════════════════════════
       DASHBOARD
  ══════════════════════════════════════ -->
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
        <div class="val">$0</div>
        <div class="lbl" id="pipeline-val-lbl">Pipeline Value (update CRM)</div>
      </div>
      <div class="stat-box" style="border-top-color:var(--accent2)">
        <div class="val" id="lead-count">0</div>
        <div class="lbl">Leads in Pipeline</div>
      </div>
      <div class="stat-box" style="border-top-color:#888">
        <div class="val">2</div>
        <div class="lbl">HS Codes to Track</div>
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="card-title"><span class="dot"></span> Phase 1 — Immediate Beachheads</div>
        <table class="market-table">
          <thead><tr>
            <th>Country</th><th>Total Market</th><th>India Share</th><th>Lead Product</th><th>Priority</th>
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
            <strong>First Principle:</strong> Find markets where Indian suppliers are ALREADY trusted. You are not selling a new concept — you are replacing or supplementing an existing supplier.
          </div>
          <div class="info-row"><strong>Your role:</strong> Authorized Distributor for Powerlux.in</div>
          <div class="info-row"><strong>Products:</strong> <span class="hs-code">HS 8512</span> Light Towers &nbsp; <span class="hs-code">HS 8502</span> DG Sets</div>
          <div class="info-row"><strong>Channel priority:</strong> B2B Importer/Distributor first, End-buyer second</div>
          <div class="info-row"><strong>Value prop:</strong> 30–60% lower landed cost vs EU/US brands, OEM available</div>
          <div class="info-row"><strong>Lead time:</strong> 45–60 days ex-works typical</div>
          <hr class="divider">
          <div style="font-size:12px;color:var(--muted);">
            <strong style="color:var(--ink);">Two-track pipeline:</strong> Track A = distributors/importers (faster deal, recurring orders). Track B = end-customers in construction, mining, infra (larger deal, longer cycle). Run both simultaneously.
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><span class="dot" style="background:var(--accent2)"></span> 90-Day Sprint Summary</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;">
        <div style="padding:14px;background:var(--paper);border-radius:5px;">
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:1px;margin-bottom:6px;">WEEK 1–2</div>
          <div style="font-weight:700;font-size:13px;margin-bottom:6px;">Intel Gathering</div>
          <div style="font-size:12px;color:var(--muted);">Run Volza searches for all 5 Phase 1 countries. Build list of 20+ importers per country who already import HS 8502/8512 from India.</div>
        </div>
        <div style="padding:14px;background:var(--paper);border-radius:5px;">
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:1px;margin-bottom:6px;">WEEK 3–4</div>
          <div style="font-weight:700;font-size:13px;margin-bottom:6px;">First Outreach</div>
          <div style="font-size:12px;color:var(--muted);">LinkedIn + email cold outreach to 10 targets per country. Use templates in this playbook. Goal: 5 discovery calls booked.</div>
        </div>
        <div style="padding:14px;background:var(--paper);border-radius:5px;">
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:1px;margin-bottom:6px;">WEEK 5–8</div>
          <div style="font-weight:700;font-size:13px;margin-bottom:6px;">Qualify & Propose</div>
          <div style="font-size:12px;color:var(--muted);">Discovery calls, send Powerlux product decks + pricing. Identify 2–3 serious distributors per market. Request sample orders.</div>
        </div>
        <div style="padding:14px;background:var(--paper);border-radius:5px;">
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:1px;margin-bottom:6px;">WEEK 9–12</div>
          <div style="font-weight:700;font-size:13px;margin-bottom:6px;">First Orders</div>
          <div style="font-size:12px;color:var(--muted);">Convert sample orders into container loads. Attend 1 trade show (Big 5 Dubai / EXCON). First invoices issued.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       MARKETS
  ══════════════════════════════════════ -->
  <div class="section" id="sec-markets">
    <div class="section-title">Market Intelligence</div>
    <div class="section-sub">All ${countryCount} countries from Comtrade data, prioritized by path of least resistance.</div>

    <div class="tracker-controls">
      <input type="text" id="market-search" placeholder="Search country..." oninput="filterMarkets()">
      <select id="tier-filter" onchange="filterMarkets()">
        <option value="">All Tiers</option>
        <option value="P1">Phase 1 — Proven</option>
        <option value="P2">Phase 2 — Untapped Large</option>
        <option value="P3">Phase 3 — Mid</option>
        <option value="P4">Stronghold</option>
      </select>
    </div>

    <div class="card" style="padding:0;overflow:hidden;">
      <table class="market-table" id="market-table">
        <thead><tr>
          <th>#</th><th>Country</th><th>LT Market</th><th>DG Market</th><th>Total</th><th>India LT%</th><th>India DG%</th><th>Strategic Tier</th><th>Lead Product</th><th>GTM Action</th>
        </tr></thead>
        <tbody id="market-tbody"></tbody>
      </table>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       PIPELINE CRM
  ══════════════════════════════════════ -->
  <div class="section" id="sec-pipeline">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;">
      <div>
        <div class="section-title">Pipeline CRM</div>
        <div class="section-sub">Track both Channel Partners (distributors/importers) and End-Buyers.</div>
      </div>
      <button class="add-row-btn" onclick="openAddLead()">+ Add Lead</button>
    </div>

    <div class="pipeline-grid" id="pipeline-board">
      <div class="pipeline-col">
        <div class="pipeline-header ph-scout">SCOUT <span id="cnt-scout">0</span></div>
        <div class="pipeline-body" id="col-scout">
          <button class="add-lead-btn" onclick="openAddLead('Scout')">+ Add lead</button>
        </div>
      </div>
      <div class="pipeline-col">
        <div class="pipeline-header ph-contact">CONTACTED <span id="cnt-contact">0</span></div>
        <div class="pipeline-body" id="col-contact">
          <button class="add-lead-btn" onclick="openAddLead('Contacted')">+ Add lead</button>
        </div>
      </div>
      <div class="pipeline-col">
        <div class="pipeline-header ph-qualify">QUALIFYING <span id="cnt-qualify">0</span></div>
        <div class="pipeline-body" id="col-qualify">
          <button class="add-lead-btn" onclick="openAddLead('Qualifying')">+ Add lead</button>
        </div>
      </div>
      <div class="pipeline-col">
        <div class="pipeline-header ph-propose">PROPOSED <span id="cnt-propose">0</span></div>
        <div class="pipeline-body" id="col-propose">
          <button class="add-lead-btn" onclick="openAddLead('Proposed')">+ Add lead</button>
        </div>
      </div>
      <div class="pipeline-col">
        <div class="pipeline-header ph-close">CLOSED/WON <span id="cnt-close">0</span></div>
        <div class="pipeline-body" id="col-close">
          <button class="add-lead-btn" onclick="openAddLead('Closed')">+ Add lead</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><span class="dot"></span> Pipeline Details</div>
      <table class="tracker-table" id="pipeline-detail-table">
        <thead><tr>
          <th>Company</th><th>Country</th><th>Type</th><th>Product</th><th>Est. Value</th><th>Status</th><th>Contact</th><th>Next Action</th><th>Last Update</th>
        </tr></thead>
        <tbody id="pipeline-detail-body">
          <tr><td colspan="9" style="text-align:center;padding:24px;color:var(--muted);font-family:'DM Mono',monospace;font-size:11px;">No leads yet — add your first lead above</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       OUTREACH TEMPLATES
  ══════════════════════════════════════ -->
  <div class="section" id="sec-outreach">
    <div class="section-title">Outreach Templates</div>
    <div class="section-sub">Battle-tested scripts for distributors and end-buyers. Customize the highlighted fields.</div>

    <div class="template-grid">
      <div class="template-card">
        <div class="template-header">
          <h3>Distributor Cold Email — Phase 1 Markets</h3>
          <span class="type-badge">EMAIL</span>
        </div>
        <div class="template-body">
          <div class="template-subject">Subject: Indian ${esc(productShort)} supplier — exclusive territory opportunity for <span class="placeholder">[Country]</span></div>
          <div class="template-text" id="tpl-dist-email">Dear <span class="placeholder">[First Name]</span>,

I represent Powerlux (powerlux.in), one of India's leading manufacturers of ${esc(hsnDescription)} (HS ${hsn}). We are establishing our authorized distribution network across <span class="placeholder">[Region]</span> and I believe <span class="placeholder">[Company Name]</span> could be an excellent partner.

Why this is relevant to you:
→ You're already importing ${esc(industry)} from India — we can plug directly into your existing logistics and buyer relationships
→ Our pricing is 35–50% below comparable European brands with equivalent quality
→ We offer OEM/white-label options for distributors requiring branded product
→ 12-month warranty, spare parts available ex-India within 7 days

We are looking to appoint 1–2 exclusive distributors per territory. Given your presence in the <span class="placeholder">[Country]</span> market, I'd welcome a 20-minute call to explore fit.

I can share our product catalogue, pricing schedule and sample availability on request.

Warm regards,
<span class="placeholder">[Your Name]</span>
Authorized Export Representative — Powerlux India
<span class="placeholder">[Phone / LinkedIn]</span></div>
          <button class="copy-btn" onclick="copyTemplate('tpl-dist-email', this)">Copy Template</button>
        </div>
      </div>

      <div class="template-card">
        <div class="template-header">
          <h3>LinkedIn Connection Request — Importer/Distributor</h3>
          <span class="type-badge">LINKEDIN</span>
        </div>
        <div class="template-body">
          <div class="template-text" id="tpl-li-dist">Hi <span class="placeholder">[First Name]</span>, I see <span class="placeholder">[Company]</span> imports ${esc(industry)} including ${esc(productShort)}. I represent Powerlux, a leading Indian manufacturer — we're appointing exclusive distributors in <span class="placeholder">[Country]</span>. Happy to share pricing + catalogue if there's potential fit. Worth a quick connect?</div>
          <hr class="divider">
          <div class="template-subject" style="margin-top:12px;">Follow-up message (after connection)</div>
          <div class="template-text" id="tpl-li-followup">Thanks for connecting, <span class="placeholder">[First Name]</span>.

Powerlux manufactures ${esc(hsnDescription)} (HS ${hsn}) — our products are already being imported by distributors in South Africa, Indonesia, Chile and Brazil.

We're looking to appoint an exclusive partner in <span class="placeholder">[Country]</span>. Key facts: pricing 35–50% below European alternatives, OEM available, 45-day lead time.

Would a 20-minute call this week make sense?</div>
          <button class="copy-btn" onclick="copyTemplate('tpl-li-followup', this)">Copy Template</button>
        </div>
      </div>

      <div class="template-card">
        <div class="template-header">
          <h3>End-Buyer Cold Email — ${esc(endUserSectors.split(",").slice(0,2).join(" / ").replace(/\b\w/g, c => c.toUpperCase()))}</h3>
          <span class="type-badge">EMAIL</span>
        </div>
        <div class="template-body">
          <div class="template-subject">Subject: Reliable ${esc(productShort)} supply for your projects in <span class="placeholder">[Country]</span></div>
          <div class="template-text" id="tpl-buyer-email">Dear <span class="placeholder">[First Name / Procurement Manager]</span>,

I'm reaching out regarding your equipment procurement for <span class="placeholder">[project type: ${esc(endUserSectors.split(",").slice(0,3).join(" / "))}]</span> projects.

Powerlux (powerlux.in) is one of India's top manufacturers of:
• ${esc(hsnDescription)} (HS ${hsn}) — ${esc(productApplications)}

We supply projects across South Africa, Indonesia, Brazil and Chile. Our authorized representative in <span class="placeholder">[Country]</span> can provide:
✓ Competitive pricing — 30–50% savings vs European brands
✓ Local after-sales and spare parts support
✓ Flexible payment terms (LC, TT)
✓ Delivery in 45–60 days

If you have an upcoming requirement or tender, I'd welcome the chance to provide a quote. Please share your specifications and I will respond within 24 hours.

Best regards,
<span class="placeholder">[Your Name]</span>
<span class="placeholder">[Company Name]</span> | Authorized Distributor — Powerlux India</div>
          <button class="copy-btn" onclick="copyTemplate('tpl-buyer-email', this)">Copy Template</button>
        </div>
      </div>

      <div class="template-card">
        <div class="template-header">
          <h3>WhatsApp / Short Message — Trade Show / Warm Lead</h3>
          <span class="type-badge">WHATSAPP</span>
        </div>
        <div class="template-body">
          <div class="template-text" id="tpl-wa">Hi <span class="placeholder">[Name]</span>, this is <span class="placeholder">[Your Name]</span> from <span class="placeholder">[Your Firm]</span>. We met at <span class="placeholder">[Event/Reference]</span>.

I represent Powerlux India — manufacturers of ${esc(productShort)} (HS ${hsn}). We're appointing a distributor in <span class="placeholder">[Country]</span> and your firm came up as a strong fit.

Can I send you our product catalogue and pricing? Takes 2 minutes to review. If relevant, happy to jump on a quick call.</div>
          <hr class="divider">
          <div class="template-subject" style="margin-top:12px;">Follow-up if no response (Day 5)</div>
          <div class="template-text" id="tpl-wa-fu">Hi <span class="placeholder">[Name]</span>, following up on my earlier message about Powerlux ${esc(productShort)}. We have a container slot available for <span class="placeholder">[Country]</span> in the next 6 weeks. Happy to share pricing. Let me know if worth a quick chat.</div>
          <button class="copy-btn" onclick="copyTemplate('tpl-wa-fu', this)">Copy Template</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       INTEL TOOLS
  ══════════════════════════════════════ -->
  <div class="section" id="sec-intel">
    <div class="section-title">Intelligence &amp; Lead Sourcing Tools</div>
    <div class="section-sub">Exact tools, search queries, and workflows to find companies already importing HS ${hsn} (${esc(hsnDescription)}) from India.</div>

    <div class="tools-grid">
      <div class="tool-card">
        <div class="tool-icon">📦</div>
        <div class="tool-name">Volza / ImportGenius</div>
        <div class="tool-desc">Trade intelligence platforms that show actual import records — who is importing what, from where, in what volume. This is your #1 tool.</div>
        <ul class="tool-steps">
          <li>Search: HS code <strong>${hsn}</strong> + importer country = South Africa</li>
          <li>Filter: Origin country = India</li>
          <li>Export list of company names, import volumes, frequency</li>
          <li>Repeat for all Phase 1 countries (Indonesia, Brazil, Chile, Portugal)</li>
          <li>Target companies with 2+ India shipments = warm buyers</li>
        </ul>
        <a class="tool-link" href="https://www.volza.com" target="_blank">volza.com ↗</a>
      </div>

      <div class="tool-card">
        <div class="tool-icon">💼</div>
        <div class="tool-name">LinkedIn Sales Navigator</div>
        <div class="tool-desc">Find decision-makers at companies identified via trade data. Also for prospecting importers/distributors directly.</div>
        <ul class="tool-steps">
          <li>Search: "import" + "${esc(productShort.split(" ")[0].toLowerCase())}" + country in title/company</li>
          <li>Filter: company size 10–500, Industry: ${esc(industry.split("/")[0].trim().replace(/\b\w/g, c => c.toUpperCase()))}</li>
          <li>Target titles: Procurement Manager, Import Manager, MD, Director</li>
          <li>Use Boolean: ${esc(linkedInKeywords)} in keyword</li>
          <li>Save leads to CRM immediately</li>
        </ul>
        <a class="tool-link" href="https://business.linkedin.com/sales-solutions" target="_blank">linkedin.com/sales ↗</a>
      </div>

      <div class="tool-card">
        <div class="tool-icon">🏛️</div>
        <div class="tool-name">FIEO / EEPC India</div>
        <div class="tool-desc">Government export promotion councils. Free trade missions, buyer-seller meets, market intelligence reports.</div>
        <ul class="tool-steps">
          <li>Register as Powerlux's authorized rep on both portals</li>
          <li>Access buyer databases for target countries</li>
          <li>Apply for EEPC engineering fairs in South Africa, Indonesia</li>
          <li>Use FIEO's matchmaking service (free for members)</li>
          <li>Request country-specific market reports</li>
        </ul>
        <a class="tool-link" href="https://www.fieo.org" target="_blank">fieo.org ↗</a>
      </div>

      <div class="tool-card">
        <div class="tool-icon">🌐</div>
        <div class="tool-name">IndiaMART / TradeIndia</div>
        <div class="tool-desc">B2B portals where international buyers already search for Indian suppliers. Set up Powerlux listing, field inbound inquiries.</div>
        <ul class="tool-steps">
          <li>Create/verify Powerlux's supplier profile with export tag</li>
          <li>List all products with export pricing + MOQ</li>
          <li>Respond to ALL inquiries within 2 hours (ranking benefit)</li>
          <li>Filter inquiries by target country to prioritize</li>
          <li>Premium listing recommended for visibility</li>
        </ul>
        <a class="tool-link" href="https://www.indiamart.com" target="_blank">indiamart.com ↗</a>
      </div>

      <div class="tool-card">
        <div class="tool-icon">🔎</div>
        <div class="tool-name">Google Research Workflow</div>
        <div class="tool-desc">Manual but effective for finding distributors in any country without paid tools.</div>
        <ul class="tool-steps">
          <li>${esc(googleQuery1)}</li>
          <li>${esc(googleQuery2)}</li>
          <li>${esc(googleQuery3)}</li>
          <li>Check local trade directories (e.g., yellow pages equivalent)</li>
          <li>Find exhibitor lists from local ${esc(industry)} expos and trade shows</li>
        </ul>
      </div>

      <div class="tool-card">
        <div class="tool-icon">🎪</div>
        <div class="tool-name">Trade Shows — Priority List</div>
        <div class="tool-desc">The fastest way to meet 50+ qualified buyers in 3 days. Target these events for Powerlux.</div>
        <ul class="tool-steps">
          <li><strong>Big 5 Dubai</strong> — Nov, Middle East + Africa buyers</li>
          <li><strong>EXCON Bangalore</strong> — Dec, Indian infra buyers + export leads</li>
          <li><strong>Africa Mining Indaba</strong> — Feb, South Africa</li>
          <li><strong>Mining Indonesia</strong> — Sep, Jakarta</li>
          <li><strong>Feicon Batimat Brazil</strong> — Apr, São Paulo</li>
        </ul>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><span class="dot"></span> Exact Search Queries for Volza / Panjiva</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:18px;">
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:11px;font-weight:500;margin-bottom:10px;color:var(--accent);">${esc(hsnDescription.toUpperCase())} — HS ${hsn} | PHASE 1 TARGETS</div>
          <div style="font-size:12px;line-height:2;">
            <div style="font-family:'DM Mono',monospace;background:var(--paper);padding:6px 10px;border-radius:3px;margin-bottom:6px;">HS Code: ${hsn} | Origin: India | Dest: South Africa</div>
            <div style="font-family:'DM Mono',monospace;background:var(--paper);padding:6px 10px;border-radius:3px;margin-bottom:6px;">HS Code: ${hsn} | Origin: India | Dest: Indonesia</div>
            <div style="font-family:'DM Mono',monospace;background:var(--paper);padding:6px 10px;border-radius:3px;margin-bottom:6px;">HS Code: ${hsn} | Origin: India | Dest: Brazil</div>
            <div style="font-family:'DM Mono',monospace;background:var(--paper);padding:6px 10px;border-radius:3px;margin-bottom:6px;">HS Code: ${hsn} | Origin: India | Dest: Chile</div>
            <div style="font-family:'DM Mono',monospace;background:var(--paper);padding:6px 10px;border-radius:3px;">HS Code: ${hsn} | Origin: India | Dest: Portugal</div>
          </div>
        </div>
        <div>
          <div style="font-family:'DM Mono',monospace;font-size:11px;font-weight:500;margin-bottom:10px;color:var(--accent2);">${esc(hsnDescription.toUpperCase())} — KEYWORD SEARCHES</div>
          <div style="font-size:12px;line-height:2;">
            <div style="font-family:'DM Mono',monospace;background:var(--paper);padding:6px 10px;border-radius:3px;margin-bottom:6px;">HS Code: ${hsn} | Origin: India | Dest: USA</div>
            <div style="font-family:'DM Mono',monospace;background:var(--paper);padding:6px 10px;border-radius:3px;margin-bottom:6px;">HS Code: ${hsn} | Origin: India | Dest: Australia</div>
            <div style="font-family:'DM Mono',monospace;background:var(--paper);padding:6px 10px;border-radius:3px;margin-bottom:6px;">HS Code: ${hsn} | Origin: India | Dest: Germany</div>
            <div style="font-family:'DM Mono',monospace;background:var(--paper);padding:6px 10px;border-radius:3px;margin-bottom:6px;">HS Code: ${hsn} | Origin: India | Dest: UAE</div>
            <div style="font-family:'DM Mono',monospace;background:var(--paper);padding:6px 10px;border-radius:3px;">Product desc: ${esc(volzaProductDesc)}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       90-DAY PLAYBOOK
  ══════════════════════════════════════ -->
  <div class="section" id="sec-playbook">
    <div class="section-title">90-Day Export Sales Playbook</div>
    <div class="section-sub">Week-by-week execution guide. Authorized Distributor mandate assumed active.</div>

    <div class="phase-block">
      <div class="phase-label">Phase 1 &nbsp;·&nbsp; Days 1–30</div>
      <div class="phase-title">Build the Intelligence Layer</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
        <div>
          <div class="week-row">
            <div class="week-label">Week 1</div>
            <div class="week-tasks">
              <strong>Set up infrastructure:</strong> Get Powerlux authorized distributor letter on letterhead. Create export email identity. Subscribe to Volza or get trial access to Panjiva.<br>
              <strong>Run trade data pull:</strong> Extract all India→South Africa, Indonesia, Brazil, Chile, Portugal importers for HS 8512 + 8502. Target: 100+ company names.
            </div>
          </div>
          <div class="week-row" style="margin-top:12px;">
            <div class="week-label">Week 2</div>
            <div class="week-tasks">
              <strong>Qualify the list:</strong> Cross-reference companies on LinkedIn. Identify decision-maker names. Flag companies with 3+ India shipments (proven buyers).<br>
              <strong>Build ICPs:</strong> Ideal Channel Partner = importer with existing India relationships, 10–200 staff, industrial machinery focus. Ideal End-Buyer = construction contractor, rental company, mining firm.
            </div>
          </div>
        </div>
        <div>
          <div class="week-row">
            <div class="week-label">Week 3</div>
            <div class="week-tasks">
              <strong>First outreach batch:</strong> Send 10 LinkedIn requests + 10 emails per country (50 total). Use templates from this playbook. Goal: 5 positive responses.<br>
              <strong>Register on portals:</strong> Update Powerlux on IndiaMART, TradeIndia with export-specific content. Register with FIEO as authorized rep.
            </div>
          </div>
          <div class="week-row" style="margin-top:12px;">
            <div class="week-label">Week 4</div>
            <div class="week-tasks">
              <strong>Follow up all Week 3 outreach.</strong> Book first discovery calls. Prepare Powerlux capability deck (ask management for export-ready version or create one).<br>
              <strong>WhatsApp follow-ups</strong> to anyone who opened email but didn't respond (use read receipts). First CRM entries in this pipeline.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="phase-block" style="border-color:var(--gold);">
      <div class="phase-label" style="color:var(--gold);">Phase 2 &nbsp;·&nbsp; Days 31–60</div>
      <div class="phase-title">Qualify &amp; Convert Discovery Calls</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
        <div>
          <div class="week-row">
            <div class="week-label" style="background:var(--gold);">Week 5–6</div>
            <div class="week-tasks">
              <strong>Run discovery calls.</strong> Key questions to ask: (1) What brands do you currently import? (2) What's your annual volume in units/USD? (3) What are your buyer's biggest pain points with current supplier? (4) Do you do white-label?<br>
              Send product catalogue + indicative pricing after every call within 24 hours.
            </div>
          </div>
        </div>
        <div>
          <div class="week-row">
            <div class="week-label" style="background:var(--gold);">Week 7–8</div>
            <div class="week-tasks">
              <strong>Identify 2–3 serious distributors per market.</strong> Submit formal distributor application / distribution agreement framework from Powerlux.<br>
              <strong>For end-buyers:</strong> Request tender documents / BOQ. Prepare technical + commercial proposal with Powerlux specs and your distribution margin.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="phase-block" style="border-color:var(--accent2);">
      <div class="phase-label" style="color:var(--accent2);">Phase 3 &nbsp;·&nbsp; Days 61–90</div>
      <div class="phase-title">First Orders &amp; Trade Show</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
        <div>
          <div class="week-row">
            <div class="week-label" style="background:var(--accent2);">Week 9–10</div>
            <div class="week-tasks">
              <strong>Push for sample/pilot orders.</strong> Suggest 1–2 unit sample to any serious distributor. Remove friction: handle freight quote, arrange inspection if needed.<br>
              <strong>Get Letters of Intent</strong> from at least 2 partners. Even LOI without commitment has negotiating value with Powerlux management.
            </div>
          </div>
        </div>
        <div>
          <div class="week-row">
            <div class="week-label" style="background:var(--accent2);">Week 11–12</div>
            <div class="week-tasks">
              <strong>Attend Big 5 Dubai (Nov) or EXCON Bangalore (Dec)</strong> with Powerlux branding. Target: 30 business cards from relevant importers.<br>
              <strong>Report card for Day 90:</strong> 5 markets activated, 2+ LOIs, 1+ sample order in progress, 100+ leads in CRM, 3 trade show contacts per market.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><span class="dot" style="background:var(--green)"></span> Your Distributor Negotiation Checklist with Powerlux</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-size:12px;">
        <div style="padding:12px;background:var(--green-bg);border-radius:4px;">
          <strong>Must Get from Powerlux:</strong>
          <ul style="margin-top:8px;padding-left:16px;line-height:2;">
            <li>Authorized Distributor Certificate</li>
            <li>Exclusive territory per country</li>
            <li>Export price list (USD/EUR)</li>
            <li>Product datasheets in English</li>
            <li>Warranty policy document</li>
            <li>Reference customer list</li>
          </ul>
        </div>
        <div style="padding:12px;background:var(--amber-bg);border-radius:4px;">
          <strong>Your Commercial Terms:</strong>
          <ul style="margin-top:8px;padding-left:16px;line-height:2;">
            <li>Distributor margin: 15–25%</li>
            <li>Project / tender margin: 10–15%</li>
            <li>Payment: 30% advance, 70% LC</li>
            <li>Freight: CIF or FOB (negotiate)</li>
            <li>Minimum order: 1 unit for sample</li>
            <li>Lead time: 45–60 days from PO</li>
          </ul>
        </div>
        <div style="padding:12px;background:var(--blue-bg);border-radius:4px;">
          <strong>Customer Value Props:</strong>
          <ul style="margin-top:8px;padding-left:16px;line-height:2;">
            <li>30–50% cost vs EU brands</li>
            <li>OEM/white-label available</li>
            <li>Spare parts: 7-day delivery</li>
            <li>ISO / CE certifications (check)</li>
            <li>English documentation</li>
            <li>Flexible payment terms</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════
       CERTIFICATIONS
  ══════════════════════════════════════ -->
  <div class="section" id="sec-certs">
    <div class="section-title">Certifications &amp; Compliance</div>
    <div class="section-sub">What's needed to enter each market. Verify current Powerlux certifications before quoting.</div>

    <div class="two-col">
      <div class="card">
        <div class="card-title"><span class="dot"></span> Phase 1 Markets — Minimum Certification Needs for HS ${hsn}</div>
        <div class="cert-row"><div class="cert-icon">🇿🇦</div><div class="cert-body"><h4>South Africa — SABS / NRCS</h4><p>${esc(certZAF)}</p></div></div>
        <div class="cert-row"><div class="cert-icon">🇮🇩</div><div class="cert-body"><h4>Indonesia — SNI Mark</h4><p>${esc(certIDN)}</p></div></div>
        <div class="cert-row"><div class="cert-icon">🇧🇷</div><div class="cert-body"><h4>Brazil — INMETRO / ANVISA</h4><p>${esc(certBRA)}</p></div></div>
        <div class="cert-row"><div class="cert-icon">🇨🇱</div><div class="cert-body"><h4>Chile — SEC / INN / SII</h4><p>${esc(certCHL)}</p></div></div>
        <div class="cert-row"><div class="cert-icon">🇵🇹</div><div class="cert-body"><h4>Portugal (EU) — CE Mark</h4><p>${esc(certPRT)}</p></div></div>
      </div>

      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--gold)"></span> Phase 2 Markets — Certification Investment Needed</div>
        <div class="cert-row"><div class="cert-icon">🇦🇺</div><div class="cert-body"><h4>Australia — RCM / Safety Mark</h4><p>${esc(certAUS)}</p></div></div>
        <div class="cert-row"><div class="cert-icon">🇺🇸</div><div class="cert-body"><h4>USA — UL / OSHA / EPA</h4><p>${esc(certUSA)}</p></div></div>
        <div class="cert-row"><div class="cert-icon">🇨🇦</div><div class="cert-body"><h4>Canada — CSA Mark</h4><p>Canadian Standards Association certification required. Similar timeline and lab as USA certification. Bundle both to reduce per-market cost.</p></div></div>
        <div class="cert-row"><div class="cert-icon">🌍</div><div class="cert-body"><h4>All Markets — ISO 9001</h4><p>Baseline quality credibility signal for all B2B export deals. Verify Powerlux holds this. If not, flag as urgent — most serious B2B buyers will ask for it upfront.</p></div></div>
        <hr class="divider">
        <div style="font-size:12px;color:var(--muted);background:var(--amber-bg);padding:10px;border-radius:4px;">
          <strong>Tactical tip for HS ${hsn}:</strong> ${esc(certPhase2Tip)} In Phase 1 markets, let your distributor partner carry the certification risk — their existing local certifications become your market entry with zero upfront investment.
        </div>
      </div>
    </div>
  </div>

</div><!-- /main -->

<!-- ══ ADD LEAD MODAL ══ -->
<div class="modal-overlay" id="add-lead-modal">
  <div class="modal">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h2>Add Lead to Pipeline</h2>
    <div class="form-row">
      <div class="form-group">
        <label>Company Name *</label>
        <input type="text" id="f-company" placeholder="e.g. ABC Industrial Supplies">
      </div>
      <div class="form-group">
        <label>Country *</label>
        <select id="f-country">
          <option value="">Select country</option>
          <option>South Africa</option><option>Indonesia</option><option>Brazil</option>
          <option>Chile</option><option>Portugal</option><option>Spain</option>
          <option>Australia</option><option>Mexico</option><option>USA</option>
          <option>UK</option><option>Norway</option><option>Romania</option>
          <option>Other</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Lead Type *</label>
        <select id="f-type">
          <option value="Channel Partner">Channel Partner (Distributor/Importer)</option>
          <option value="End Buyer">End Buyer (Construction/Mining/Infra)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Product Interest</label>
        <select id="f-product">
          <option>Light Tower (HS 8512)</option>
          <option>DG Sets (HS 8502)</option>
          <option>Both</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Contact Name</label>
        <input type="text" id="f-contact" placeholder="First Last">
      </div>
      <div class="form-group">
        <label>Estimated Value (USD)</label>
        <input type="number" id="f-value" placeholder="e.g. 50000">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Pipeline Stage</label>
        <select id="f-stage">
          <option value="Scout">Scout</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualifying">Qualifying</option>
          <option value="Proposed">Proposed</option>
          <option value="Closed">Closed/Won</option>
        </select>
      </div>
      <div class="form-group">
        <label>Next Action</label>
        <input type="text" id="f-next" placeholder="e.g. Send catalogue by Friday">
      </div>
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea id="f-notes" placeholder="Source: Volza search / LinkedIn / referral. Key notes..."></textarea>
    </div>
    <button class="submit-btn" onclick="saveLead()">Add to Pipeline</button>
  </div>
</div>

<script>
// ── DATA — server-generated from Comtrade DB ──────────────────────────────────
const markets = ${marketsJson};

const tierMap = {P1:'✅ Phase 1 — Proven',P2:'⚠️ Phase 2 — Untapped',P3:'🟡 Phase 3 — Mid',P4:'🔵 Stronghold'};
const tierClass = {P1:'tier-p1',P2:'tier-p3',P3:'tier-p3',P4:'tier-p4'};

let leads = [];

// ── NAV ──────────────────────────────────────────────────────────────────────
function switchTab(t) {
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(n=>n.classList.remove('active'));
  document.getElementById('sec-'+t).classList.add('active');
  event.target.classList.add('active');
}

// ── MARKETS ──────────────────────────────────────────────────────────────────
function fmtM(m) {
  if (m >= 1000) return '$'+(m/1000).toFixed(1).replace(/\\.0$/,'')+'B';
  if (m >= 1)    return '$'+Math.round(m)+'M';
  return '<$1M';
}

function renderMarkets(data) {
  const tbody = document.getElementById('market-tbody');
  tbody.innerHTML = data.map((m,i)=>\`
    <tr>
      <td style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted)">\${i+1}</td>
      <td><span class="country-name">\${m.country}</span></td>
      <td class="mkt-size">\${fmtM(m.lt)}</td>
      <td class="mkt-size">\${fmtM(m.dg)}</td>
      <td class="mkt-size" style="font-weight:700;">\${fmtM(m.lt+m.dg)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px;">
          <div class="progress-bar"><div class="progress-fill" style="width:\${Math.min(m.lt_i*2,100)}%"></div></div>
          <span style="font-family:'DM Mono',monospace;font-size:11px">\${m.lt_i}%</span>
        </div>
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:6px;">
          <div class="progress-bar" style="width:60px"><div class="progress-fill" style="width:\${Math.min(m.dg_i*5,100)}%;background:var(--accent2)"></div></div>
          <span style="font-family:'DM Mono',monospace;font-size:11px">\${m.dg_i}%</span>
        </div>
      </td>
      <td><span class="tier-pill \${tierClass[m.tier]}">\${tierMap[m.tier]}</span></td>
      <td><span class="tier-pill tier-p1" style="background:#f0f0f0;color:#333">\${m.lead}</span></td>
      <td style="font-size:11px;color:var(--muted);max-width:200px;">\${m.gtm}</td>
    </tr>
  \`).join('');
}
renderMarkets(markets);

function filterMarkets() {
  const search = document.getElementById('market-search').value.toLowerCase();
  const tier = document.getElementById('tier-filter').value;
  const filtered = markets.filter(m=>{
    const matchSearch = !search || m.country.toLowerCase().includes(search);
    const matchTier = !tier || m.tier === tier;
    return matchSearch && matchTier;
  });
  renderMarkets(filtered);
}

// ── PIPELINE ─────────────────────────────────────────────────────────────────
function openAddLead(stage) {
  if(stage) document.getElementById('f-stage').value = stage;
  document.getElementById('add-lead-modal').classList.add('open');
}
function closeModal() {
  document.getElementById('add-lead-modal').classList.remove('open');
}

function saveLead() {
  const company = document.getElementById('f-company').value.trim();
  if(!company) { alert('Please enter company name'); return; }
  const lead = {
    id: Date.now(),
    company,
    country: document.getElementById('f-country').value,
    type: document.getElementById('f-type').value,
    product: document.getElementById('f-product').value,
    contact: document.getElementById('f-contact').value,
    value: parseInt(document.getElementById('f-value').value) || 0,
    stage: document.getElementById('f-stage').value || 'Scout',
    next: document.getElementById('f-next').value,
    notes: document.getElementById('f-notes').value,
    date: new Date().toLocaleDateString('en-GB')
  };
  leads.push(lead);
  closeModal();
  clearForm();
  renderPipeline();
  updateStats();
}

function clearForm() {
  ['f-company','f-contact','f-value','f-next','f-notes'].forEach(id=>document.getElementById(id).value='');
}

const stageColMap = {Scout:'col-scout',Contacted:'col-contact',Qualifying:'col-qualify',Proposed:'col-propose','Closed':'col-close'};
const stageCntMap = {Scout:'cnt-scout',Contacted:'cnt-contact',Qualifying:'cnt-qualify',Proposed:'cnt-propose','Closed':'cnt-close'};

function renderPipeline() {
  const stages = ['Scout','Contacted','Qualifying','Proposed','Closed'];
  stages.forEach(s=>{
    const col = document.getElementById(stageColMap[s]);
    const cnt = document.getElementById(stageCntMap[s]);
    const stageLeads = leads.filter(l=>l.stage===s);
    cnt.textContent = stageLeads.length;
    col.innerHTML = stageLeads.map(l=>\`
      <div class="lead-card">
        <div class="lead-name">\${l.company}</div>
        <div class="lead-meta">\${l.country} · \${l.type}</div>
        <div class="lead-meta">\${l.product}</div>
        \${l.value ? \`<div class="lead-val">$\${l.value.toLocaleString()}</div>\` : ''}
        \${l.next ? \`<div style="font-size:10px;color:var(--accent);margin-top:4px;">→ \${l.next}</div>\` : ''}
      </div>
    \`).join('')+\`<button class="add-lead-btn" onclick="openAddLead('\${s}')">+ Add lead</button>\`;
  });

  const tbody = document.getElementById('pipeline-detail-body');
  if(leads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--muted);font-family:\\'DM Mono\\',monospace;font-size:11px;">No leads yet — add your first lead above</td></tr>';
    return;
  }
  const stageColors = {Scout:'s-scout',Contacted:'s-contact',Qualifying:'s-qualify',Proposed:'s-propose',Closed:'s-close'};
  tbody.innerHTML = leads.map(l=>\`
    <tr>
      <td style="font-weight:600">\${l.company}</td>
      <td>\${l.country}</td>
      <td><span class="tier-pill \${l.type==='Channel Partner'?'tier-p1':'tier-p4'}" style="font-size:9px">\${l.type}</span></td>
      <td style="font-family:'DM Mono',monospace;font-size:11px">\${l.product}</td>
      <td class="mkt-size">\${l.value?'$'+l.value.toLocaleString():'-'}</td>
      <td><span class="status-dot \${stageColors[l.stage]}"></span>\${l.stage}</td>
      <td>\${l.contact||'-'}</td>
      <td style="font-size:11px;color:var(--accent)">\${l.next||'-'}</td>
      <td style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted)">\${l.date}</td>
    </tr>
  \`).join('');
}

function updateStats() {
  document.getElementById('lead-count').textContent = leads.length;
  const total = leads.reduce((s,l)=>s+l.value,0);
  document.getElementById('pipeline-val-lbl').textContent = \`Pipeline: $\${total.toLocaleString()}\`;
}

// ── COPY TEMPLATES ────────────────────────────────────────────────────────────
function copyTemplate(id, btn) {
  const el = document.getElementById(id);
  const text = el.innerText;
  navigator.clipboard.writeText(text).then(()=>{
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(()=>{ btn.textContent = 'Copy Template'; btn.classList.remove('copied'); }, 2000);
  });
}

// Close modal on overlay click
document.getElementById('add-lead-modal').addEventListener('click', function(e) {
  if(e.target === this) closeModal();
});
</script>
</body>
</html>`;
}
