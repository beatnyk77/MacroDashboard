/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js';
import { runIngestion } from '../_shared/logging.ts'
import { runWithRetry } from '../_shared/job-runner.ts'
import { extractText } from "https://esm.sh/unpdf@0.12.1";
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
    const result = await runWithRetry(
      'ingest-rbi-money-market',
      () => doIngestRbiMoneyMarket(supabase),
      { timeoutMs: 20 * 60 * 1000, maxRetries: 3, backoffMs: 20_000 }
    )
    if (!result.ok) throw new Error(`All attempts failed: ${result.error}`)
    return result.value!
  });
});

// ─── Core ingest logic ────────────────────────────────────────────────────────
async function doIngestRbiMoneyMarket(supabase: any) {
  console.log("Fetching RBI Money Market Operations...");

  const response = await fetch(RBI_URL);
  const html = await response.text();
  const $ = cheerio.load(html);

  // 1. Extract Date
  let titleText = $(".tableheader:contains('Money Market Operations as on')").text();
  if (!titleText) {
    titleText = $("b:contains('Money Market Operations as on')").first().text();
  }

  // Fallback: search all text nodes for date pattern
  if (!titleText) {
    const allText = $("body").text();
    const matches = allText.match(/Money Market Operations as on\s+(\w+\s+\d+,\s+\d{4})/i);
    if (matches) titleText = matches[0];
  }

  console.log(`Searching for date in: "${titleText}"`);
  const dateMatch = titleText.match(/(?:as on\s+)?(\w+\s+\d+,\s+\d{4})/i);
  if (!dateMatch) {
    // More lenient: try to extract any recent date from the page
    const datePatterns = [
      /(\d{1,2}[-/]\d{1,2}[-/]\d{4})/,  // DD-MM-YYYY or MM-DD-YYYY
      /(\w+\s+\d{1,2},\s+\d{4})/,       // Month DD, YYYY
      /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/   // YYYY-MM-DD
    ];
    let foundDate = null;
    for (const pattern of datePatterns) {
      const match = $("body").text().match(pattern);
      if (match) {
        foundDate = match[1];
        break;
      }
    }
    if (!foundDate) throw new Error(`Could not find date in page. Title text: "${titleText}"`);
    titleText = `Money Market Operations as on ${foundDate}`;
  }

  const rawDate = new Date(dateMatch[1]);
  const isoDate = rawDate.toISOString().split("T")[0];
  console.log(`Detected Date: ${isoDate}`);

  // 2. Extract Data using a section-tracking state machine with improved fallbacks
  const parse = (cell: any) => {
    const val = $(cell).text().trim().replace(/,/g, "");
    return isNaN(parseFloat(val)) ? 0 : parseFloat(val);
  };

  const logs: string[] = [];
  let currentSection = "";
  let lafSubSection: "today" | "outstanding" | null = null;
  const opsData: Partial<MoneyMarketData> = {};
  const liqData: Partial<LiquidityData> = {};
  let rowsParsed = 0;

  $("tr").each((_, tr) => {
    const cells = $(tr).children();
    if (cells.length === 0) return;

    const label = $(cells[0]).text().trim();

    // Section Landmarks (case-insensitive for robustness)
    if (/overnight|A\./i.test(label)) currentSection = "overnight";
    else if (/term|B\./i.test(label)) currentSection = "term";
    else if (/Liquidity Adjustment|C\./i.test(label)) currentSection = "laf";
    else if (/Standing Liquidity|D\./i.test(label)) currentSection = "slf";
    else if (/Outstanding.*liquidity|E\./i.test(label)) currentSection = "net_outstanding";
    else if (/Total.*liquidity|F\./i.test(label)) currentSection = "net_total";

    if (currentSection === "laf") {
      // Determine LAF subsection
      if (/Today|I\./i.test(label)) lafSubSection = "today";
      else if (/Outstanding|II\./i.test(label)) lafSubSection = "outstanding";
    } else if (currentSection !== "laf") {
      lafSubSection = null;
    }

    logs.push(`Row ${rowsParsed}: "${label}" | Section: ${currentSection}${currentSection==='laf'?`(${lafSubSection})`:''} | Cells: ${cells.length}`);
    rowsParsed++;

    // Extract numeric data with flexible cell indexing
    if (currentSection === "overnight") {
      if (/Call Money/i.test(label) && cells.length >= 3) {
        const vol = parse(cells[1]);
        const rate = parse(cells[2]);
        if (vol > 0 || rate > 0) { opsData.call_money_vol = vol; opsData.call_money_rate = rate; }
      } else if (/Triparty|Triparty Repo/i.test(label) && cells.length >= 3) {
        const vol = parse(cells[1]);
        const rate = parse(cells[2]);
        if (vol > 0 || rate > 0) { opsData.triparty_repo_vol = vol; opsData.triparty_repo_rate = rate; }
      } else if (/Market Repo/i.test(label) && cells.length >= 3) {
        const vol = parse(cells[1]);
        const rate = parse(cells[2]);
        if (vol > 0 || rate > 0) { opsData.market_repo_vol = vol; opsData.market_repo_rate = rate; }
      }
    } else if (currentSection === "term") {
      if (/Notice Money/i.test(label) && cells.length >= 3) {
        const vol = parse(cells[1]);
        const rate = parse(cells[2]);
        if (vol > 0 || rate > 0) { opsData.notice_money_vol = vol; opsData.notice_money_rate = rate; }
      } else if (/Term Money/i.test(label) && cells.length >= 3) {
        const vol = parse(cells[1]);
        const rate = parse(cells[2]);
        if (vol > 0 || rate > 0) { opsData.term_money_vol = vol; opsData.term_money_rate = rate; }
      }
    } else if (currentSection === "laf" && lafSubSection === "today") {
      if (/MSF/i.test(label) && cells.length >= 5) {
        liqData.msf_amount = parse(cells[4]);
        if (cells.length >= 6) liqData.msf_rate = parse(cells[5]);
      } else if (/SDF/i.test(label) && cells.length >= 5) {
        liqData.sdf_amount = parse(cells[4]);
        if (cells.length >= 6) liqData.sdf_rate = parse(cells[5]);
      } else if (/today.*operation/i.test(label) && cells.length >= 2) {
        const val = parse(cells[cells.length - 2]) || parse(cells[cells.length - 1]);
        if (val !== 0) liqData.net_liquidity_today = val;
      }
    } else if (currentSection === "slf") {
      if (/Standing Liquidity/i.test(label) && cells.length >= 2) {
        liqData.slf_amount = parse(cells[cells.length - 1]);
      }
    } else if (currentSection === "net_outstanding") {
      const val = parse(cells[cells.length - 1]) || parse(cells[cells.length - 2]);
      if (val !== 0) liqData.net_liquidity_outstanding = val;
    } else if (currentSection === "net_total") {
      const val = parse(cells[cells.length - 1]) || parse(cells[cells.length - 2]);
      if (val !== 0) liqData.net_liquidity_total = val;
    }
  });

  console.log(`Parsed ${rowsParsed} HTML rows`);

  // Log some of the extracted HTML data for debugging
  console.log('HTML extracted liqData:', JSON.stringify(liqData));
  console.log('HTML extracted opsData (before PDF):', JSON.stringify(opsData));

  // Validate that we got some data from HTML
  const htmlHasData = (
    (opsData.call_money_vol && opsData.call_money_vol > 0) ||
    (opsData.call_money_rate && opsData.call_money_rate > 0) ||
    (opsData.triparty_repo_vol && opsData.triparty_repo_vol > 0) ||
    (liqData.msf_amount && liqData.msf_amount > 0) ||
    (liqData.sdf_amount && liqData.sdf_amount > 0)
  );

  // 3. Extract detailed overnight segment data from linked PDF to get non-zero volumes/rates
  let pdfSuccess = false;
  try {
    const pdfLink = $('a[id^="APDF_"]').attr('href');
    if (pdfLink) {
      const pdfUrl = pdfLink.startsWith('http') ? pdfLink : `https://www.rbi.org.in${pdfLink}`;
      console.log(`Fetching PDF for detailed segment data: ${pdfUrl}`);
      const pdfResp = await fetch(pdfUrl);
      if (pdfResp.ok) {
        const pdfArrayBuffer = await pdfResp.arrayBuffer();
        const pdfBuffer = new Uint8Array(pdfArrayBuffer);
        const pdfData = await extractText(pdfBuffer, { mergePages: true });
        const text = pdfData.text;

        const patterns = [
          { label: 'I. Call Money', vol: 'call_money_vol', rate: 'call_money_rate' },
          { label: 'II. Triparty Repo', vol: 'triparty_repo_vol', rate: 'triparty_repo_rate' },
          { label: 'III. Market Repo', vol: 'market_repo_vol', rate: 'market_repo_rate' }
        ];

        let pdfDataPoints = 0;
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
              pdfDataPoints++;
              console.log(`PDF extracted ${p.label}: vol=${vol}, rate=${rate}`);
            }
          }
        }
        if (pdfDataPoints > 0) pdfSuccess = true;
      } else {
        console.warn(`Failed to fetch PDF, status: ${pdfResp.status}`);
      }
    } else {
      console.warn('No PDF link found on the page');
    }
  } catch (pdfErr: any) {
    console.error('PDF extraction failed:', pdfErr.message);
    // If HTML had no data, this is a critical failure
    if (!htmlHasData) {
      throw new Error(`Both HTML and PDF extraction failed. HTML data: ${JSON.stringify(opsData)}, Error: ${pdfErr.message}`);
    }
  }

  // Final validation: ensure we have some actual data before upserting
  if (!htmlHasData && !pdfSuccess) {
    throw new Error(`No valid money market data extracted from RBI page. opsData: ${JSON.stringify(opsData)}, liqData: ${JSON.stringify(liqData)}`);
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
    rows_inserted: 2,
    metadata: {
      date: isoDate,
      ops_fields: Object.keys(opsData),
      liq_fields: Object.keys(liqData),
      html_has_data: htmlHasData,
      pdf_success: pdfSuccess,
      call_money_rate: opsData.call_money_rate,
      msf_amount: liqData.msf_amount,
      sdf_amount: liqData.sdf_amount
    }
  };
}
