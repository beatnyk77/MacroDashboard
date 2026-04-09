import { createClient } from '@supabase/supabase-js';
import { runIngestion } from '../_shared/logging.ts'
import pdf from "npm:pdf-parse@1.1.1";
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
  msf_rate?: number;
  sdf_rate?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const supabase = createClient(supabaseUrl, supabaseKey);

  return runIngestion(supabase, 'ingest-rbi-money-market', async (ctx) => {
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
    const parse = (cell: any) => {
      const val = $(cell).text().trim().replace(/,/g, "");
      return isNaN(parseFloat(val)) ? 0 : parseFloat(val);
    };

    const logs: string[] = [];
    let currentSection = "";
    let lafSubSection: "today" | "outstanding" | null = null;
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
      else if (currentSection === "laf") {
        // Determine LAF subsection
        if (label.includes("I. Today's Operations")) lafSubSection = "today";
        else if (label.includes("II. Outstanding Operations")) lafSubSection = "outstanding";
      } else {
        // Reset lafSubSection when leaving LAF
        if (currentSection !== "laf") lafSubSection = null;
      }

      logs.push(`Label: "${label}" | Section: ${currentSection}${currentSection==='laf'?`(${lafSubSection})`:''} | Cells: ${cells.length}`);

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
        } else if (label.includes("IV. Repo in Corporate Bond")) {
          opsData.notice_money_vol = parse(cells[1]);
          opsData.notice_money_rate = parse(cells[2]);
        }
      } else if (currentSection === "term") {
        if (label.includes("I. Notice Money")) {
          opsData.notice_money_vol = parse(cells[1]);
          opsData.notice_money_rate = parse(cells[2]);
        } else if (label.includes("II. Term Money")) {
          opsData.term_money_vol = parse(cells[1]);
          opsData.term_money_rate = parse(cells[2]);
        }
      } else if (currentSection === "laf" && lafSubSection === "today") {
        if (/MSF/i.test(label) && cells.length >= 5) {
          liqData.msf_amount = parse(cells[4]);
          if (cells.length >= 6) liqData.msf_rate = parse(cells[5]);
        } else if (/SDF/i.test(label) && cells.length >= 5) {
          liqData.sdf_amount = parse(cells[4]);
          if (cells.length >= 6) liqData.sdf_rate = parse(cells[5]);
        } else if (label.includes("today's operations")) {
          liqData.net_liquidity_today = parse(cells[cells.length - 2]) || parse(cells[cells.length - 1]);
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

    // Log some of the extracted HTML data for debugging
    console.log('HTML extracted liqData:', JSON.stringify(liqData));
    console.log('HTML extracted opsData (before PDF):', JSON.stringify(opsData));

    // 3. Extract detailed overnight segment data from linked PDF to get non-zero volumes/rates
    try {
      const pdfLink = $('a[id^="APDF_"]').attr('href');
      if (pdfLink) {
        const pdfUrl = pdfLink.startsWith('http') ? pdfLink : `https://www.rbi.org.in${pdfLink}`;
        console.log(`Fetching PDF for detailed segment data: ${pdfUrl}`);
        const pdfResp = await fetch(pdfUrl);
        if (pdfResp.ok) {
          const pdfBuffer = await pdfResp.arrayBuffer();
          const pdfData = await pdf(pdfBuffer);
          const text = pdfData.text;

          const patterns = [
            { label: 'I. Call Money', vol: 'call_money_vol', rate: 'call_money_rate' },
            { label: 'II. Triparty Repo', vol: 'triparty_repo_vol', rate: 'triparty_repo_rate' },
            { label: 'III. Market Repo', vol: 'market_repo_vol', rate: 'market_repo_rate' }
          ];

          for (const p of patterns) {
            // Allow flexible whitespace and punctuation
            const escaped = p.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
            const regex = new RegExp(`${escaped}[^0-9]*?([\\d,]+(?:\\.[0-9]+)?)[^0-9]*?([0-9]+(?:\\.[0-9]+)?)`);
            const match = text.match(regex);
            if (match) {
              const vol = parseFloat(match[1].replace(/,/g, ''));
              const rate = parseFloat(match[2]);
              // Only assign if we got non-zero plausible values
              if (vol > 0 || rate > 0) {
                (opsData as any)[p.vol] = vol;
                (opsData as any)[p.rate] = rate;
                console.log(`PDF extracted ${p.label}: vol=${vol}, rate=${rate}`);
              } else {
                console.log(`PDF found ${p.label} but values non-positive: vol=${vol}, rate=${rate}`);
              }
            } else {
              console.warn(`PDF: Could not find ${p.label}`);
            }
          }
        } else {
          console.warn(`Failed to fetch PDF, status: ${pdfResp.status}`);
        }
      } else {
        console.warn('No PDF link found on the page');
      }
    } catch (pdfErr: any) {
      console.error('PDF extraction failed:', pdfErr.message);
      // Continue: we'll still upsert data from HTML (which may have zeros)
    }

    // Finalize dates
    opsData.date = isoDate;
    liqData.date = isoDate;

    // Upsert operations
    const { error: opsError } = await supabase
      .from("rbi_money_market_ops")
      .upsert(opsData as MoneyMarketData, { onConflict: "date" });

    if (opsError) {
      console.error("Failed to upsert rbi_money_market_ops:", opsError);
      throw opsError;
    }

    // Upsert liquidity
    const { error: liqError } = await supabase
      .from("rbi_liquidity_ops")
      .upsert(liqData as LiquidityData, { onConflict: "date" });

    if (liqError) {
      console.error("Failed to upsert rbi_liquidity_ops:", liqError);
      throw liqError;
    }

    console.log(`RBI Money Market data upserted for ${isoDate}`);
    console.log('Final opsData:', JSON.stringify(opsData));
    console.log('Final liqData:', JSON.stringify(liqData));

    return {
      rows_inserted: 1,
      metadata: {
        date: isoDate,
        ops_fields: Object.keys(opsData),
        liq_fields: Object.keys(liqData),
        pdf_success: !!opsData.call_money_vol && opsData.call_money_vol > 0
      }
    };
  });
});
