// Simulate RBI ingestion parsing on the fetched HTML
const cheerio = require('cheerio');

// Load the HTML from the saved file (or fetch fresh)
const fs = require('fs');
const html = fs.readFileSync('/Users/kartikaysharma/.claude/projects/-Users-kartikaysharma-Desktop-Projects-Vibecode--Macro-MacroDashboard/1b36800a-b265-449e-8225-3bb39631e187/tool-results/b1yx7tnh4.txt', 'utf8');
const $ = cheerio.load(html);

// Parse date
let titleText = $(".tableheader:contains('Money Market Operations as on')").text();
if (!titleText) {
  titleText = $("b:contains('Money Market Operations as on')").first().text();
}
console.log("Title text:", titleText.trim().substring(0, 200));
const dateMatch = titleText.match(/(?:as on\s+)?(\w+\s+\d+,\s+\d{4})/i);
if (!dateMatch) throw new Error("Could not find date");
const rawDate = new Date(dateMatch[1]);
const isoDate = rawDate.toISOString().split("T")[0];
console.log("Parsed date:", isoDate);

// Parse function
const parse = (cell) => {
  const val = $(cell).text().trim().replace(/,/g, "");
  return isNaN(parseFloat(val)) ? 0 : parseFloat(val);
};

const logs = [];
let currentSection = "";
const opsData = {};
const liqData = {};

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
      console.log("Call Money:", opsData.call_money_vol, opsData.call_money_rate);
    } else if (label.includes("II. Triparty Repo")) {
      opsData.triparty_repo_vol = parse(cells[1]);
      opsData.triparty_repo_rate = parse(cells[2]);
      console.log("Triparty Repo:", opsData.triparty_repo_vol, opsData.triparty_repo_rate);
    } else if (label.includes("III. Market Repo")) {
      opsData.market_repo_vol = parse(cells[1]);
      opsData.market_repo_rate = parse(cells[2]);
      console.log("Market Repo:", opsData.market_repo_vol, opsData.market_repo_rate);
    }
  } else if (currentSection === "laf") {
    if (/MSF/i.test(label) && cells.length >= 5) {
      liqData.msf_amount = parse(cells[4]);
      console.log("MSF amount:", liqData.msf_amount);
    } else if (/SDF/i.test(label) && cells.length >= 5) {
      liqData.sdf_amount = parse(cells[4]);
      console.log("SDF amount:", liqData.sdf_amount);
    } else if (label.includes("today's operations")) {
      liqData.net_liquidity_today = parse(cells[cells.length - 2]) || parse(cells.last);
      console.log("Net liquidity today:", liqData.net_liquidity_today);
    }
  } else if (currentSection === "slf") {
    if (label.includes("Standing Liquidity Facility")) {
      liqData.slf_amount = parse(cells[cells.length - 1]);
      console.log("SLF amount:", liqData.slf_amount);
    }
  } else if (currentSection === "net_outstanding" || label.includes("(Outstanding)")) {
    const val = parse(cells[cells.length - 1]) || parse(cells[cells.length - 2]);
    if (val) liqData.net_liquidity_outstanding = val;
    console.log("Net liquidity outstanding:", liqData.net_liquidity_outstanding);
  } else if (currentSection === "net_total" || label.includes("(Total)")) {
    const val = parse(cells[cells.length - 1]) || parse(cells[cells.length - 2]);
    if (val) liqData.net_liquidity_total = val;
    console.log("Net liquidity total:", liqData.net_liquidity_total);
  }
});

console.log("\n=== Final data ===");
console.log("opsData:", opsData);
console.log("liqData:", liqData);
