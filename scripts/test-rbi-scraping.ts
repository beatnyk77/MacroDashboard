import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';

const RBI_URL = 'https://www.rbi.org.in/Scripts/BS_viewMMO.aspx';

async function analyzeRbiPage() {
  try {
    console.log('Fetching RBI page:', RBI_URL);
    const response = await fetch(RBI_URL);
    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('\n=== Page Analysis ===\n');

    // Find the title/date
    const titleText = $(".tableheader:contains('Money Market Operations as on')").text()
      || $("b:contains('Money Market Operations as on')").first().text();

    console.log('Title text found:', titleText.trim().substring(0, 200));

    const dateMatch = titleText.match(/(?:as on\s+)?(\w+\s+\d+,\s+\d{4})/i);
    if (dateMatch) {
      const rawDate = new Date(dateMatch[1]);
      const isoDate = rawDate.toISOString().split('T')[0];
      console.log('Parsed date:', isoDate);
    } else {
      console.log('❌ Could not find date in title');
    }

    // Find all tables
    const tables = $('table');
    console.log(`\nFound ${tables.length} tables`);

    // Look for the main data table by inspecting table headers
    tables.each((i, table) => {
      const header = $(table).find('tr').first().text().trim();
      if (header.includes('Segment') || header.includes('Volume') || header.includes('Rate')) {
        console.log(`\nTable ${i} header:`, header.substring(0, 100));
        // Show all row labels
        console.log('Row labels:');
        $(table).find('tr').each((_, tr) => {
          const cells = $(tr).children();
          if (cells.length > 0) {
            const label = $(cells[0]).text().trim();
            if (label.length > 0 && label.length < 50) {
              const cellVals = Array.from(cells).slice(1, 4).map(c => $(c).text().trim()).join(' | ');
              console.log(`  "${label}" => ${cellVals}`);
            }
          }
        });
      }
    });

    // Try to find section markers
    console.log('\n=== Section Detection ===');
    let currentSection = '';
    $('tr').each((_, tr) => {
      const cells = $(tr).children();
      if (cells.length === 0) return;
      const label = $(cells[0]).text().trim();
      if (label.includes('A. Overnight Segment')) currentSection = 'overnight';
      else if (label.includes('B. Term Segment')) currentSection = 'term';
      else if (label.includes('C. Liquidity Adjustment')) currentSection = 'laf';
      else if (label.includes('D. Standing Liquidity Facility')) currentSection = 'slf';
      else if (label.includes('E. Net liquidity injected (Outstanding)')) currentSection = 'net_outstanding';
      else if (label.includes('F. Net liquidity injected (Total)')) currentSection = 'net_total';

      if (['overnight','laf','slf','net_outstanding','net_total'].includes(currentSection)) {
        const cell1 = $(cells[1])?.text().trim() || '-';
        const cell2 = $(cells[2])?.text().trim() || '-';
        console.log(`[${currentSection}] ${label} => ${cell1} | ${cell2}`);
      }
    });

    // Check for required fields
    console.log('\n=== Required Fields Check ===');
    const pageText = $('body').text();
    const required = ['Call Money', 'Triparty Repo', 'Market Repo', 'MSF', 'SDF'];
    required.forEach(term => {
      const found = pageText.includes(term);
      console.log(`${found ? '✓' : '✗'} ${term}`);
    });

  } catch (err) {
    console.error('Error:', err);
  }
}

analyzeRbiPage();
