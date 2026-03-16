import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const RBI_URL = "https://www.rbi.org.in/Scripts/BS_viewMMO.aspx";

interface MoneyMarketData {
  date: string;
  call_money_vol: number;
  call_money_rate: number;
  triparty_repo_vol: number;
  triparty_repo_rate: number;
  market_repo_vol: number;
  market_repo_rate: number;
  notice_money_vol?: number;
  notice_money_rate?: number;
  term_money_vol?: number;
  term_money_rate?: number;
}

interface LiquidityData {
  date: string;
  msf_amount: number;
  sdf_amount: number;
  slf_amount: number;
  net_liquidity_today: number;
  net_liquidity_outstanding: number;
  net_liquidity_total: number;
}

Deno.serve(async (req) => {
  try {
    console.log("Fetching RBI Money Market Operations...");
    const response = await fetch(RBI_URL);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Extract Date
    let titleText = $(".tableheader:contains('Money Market Operations as on')").text();
    if (!titleText) {
      titleText = $("b:contains('Money Market Operations as on')").first().text();
    }

    console.log(`Searching for date in: "${titleText}"`);
    const dateMatch = titleText.match(/(?:as on\s+)?(\w+\s+\d+,\s+\d{4})/i);
    if (!dateMatch) throw new Error(`Could not find date in text: "${titleText}"`);

    const rawDate = new Date(dateMatch[1]);
    const isoDate = rawDate.toISOString().split("T")[0];
    console.log(`Detected Date: ${isoDate}`);

    // 2. Extract Data using a section-tracking state machine
    let currentSection = "";
    const parse = (cell: any) => {
      const val = $(cell).text().trim().replace(/,/g, "");
      return isNaN(parseFloat(val)) ? 0 : parseFloat(val);
    };

    const logs: string[] = [];

    const opsData: Partial<MoneyMarketData> = {};
    const liqData: Partial<LiquidityData> = {};

    $("tr").each((_, tr) => {
      const cells = $(tr).children();
      if (cells.length === 0) return;

      const label = $(cells[0]).text().trim();

      // Section Landmarks
      if (label.includes("A. Overnight Segment")) currentSection = "overnight";
      else if (label.includes("B. Term Segment")) currentSection = "term";
      else if (label.includes("C. Liquidity Adjustment")) currentSection = "laf";
      else if (label.includes("D. Standing Liquidity Facility")) currentSection = "slf";
      else if (label.includes("E. Net liquidity injected (Outstanding)")) currentSection = "net_outstanding";
      else if (label.includes("F. Net liquidity injected (Total)")) currentSection = "net_total";

      logs.push(`Label: "${label}" | Section: ${currentSection} | Cells: ${cells.length}`);

      if (currentSection === "overnight") {
        if (label.includes("I. Call Money")) {
          opsData.call_money_vol = parse(cells[1]);
          opsData.call_money_rate = parse(cells[2]);
        } else if (label.includes("II. Triparty Repo")) {
          opsData.triparty_repo_vol = parse(cells[1]);
          opsData.triparty_repo_rate = parse(cells[2]);
        } else if (label.includes("III. Market Repo")) {
          opsData.market_repo_vol = parse(cells[1]);
          opsData.market_repo_rate = parse(cells[2]);
        }
      } else if (currentSection === "laf") {
        if (/MSF/i.test(label) && cells.length >= 5) {
          liqData.msf_amount = parse(cells[4]);
        } else if (/SDF/i.test(label) && cells.length >= 5) {
          liqData.sdf_amount = parse(cells[4]);
        } else if (label.includes("today's operations")) {
          liqData.net_liquidity_today = parse(cells[cells.length - 2]) || parse(cells.last());
        }
      } else if (currentSection === "slf") {
        if (label.includes("Standing Liquidity Facility")) {
          liqData.slf_amount = parse(cells[cells.length - 1]);
        }
      } else if (currentSection === "net_outstanding" || label.includes("(Outstanding)")) {
        const val = parse(cells[cells.length - 1]) || parse(cells[cells.length - 2]);
        if (val) liqData.net_liquidity_outstanding = val;
      } else if (currentSection === "net_total" || label.includes("(Total)")) {
        const val = parse(cells[cells.length - 1]) || parse(cells[cells.length - 2]);
        if (val) liqData.net_liquidity_total = val;
      }
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    opsData.date = isoDate;
    liqData.date = isoDate;

    await supabase.from("rbi_money_market_ops").upsert(opsData as MoneyMarketData, { onConflict: "date" });
    await supabase.from("rbi_liquidity_ops").upsert(liqData as LiquidityData, { onConflict: "date" });

    return new Response(JSON.stringify({ success: true, date: isoDate, opsData, liqData, debug_logs: logs.slice(0, 50) }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
