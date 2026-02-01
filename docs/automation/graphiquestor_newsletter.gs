/**
 * GraphiQuestor Monthly Macro Newsletter Automation
 * 
 * Instructions:
 * 1. Create a new Google Apps Script project (script.google.com).
 * 2. Paste this code into Code.gs.
 * 3. Set Script Properties (Project Settings > Script Properties):
 *    - SUPABASE_URL: https://debdriyzfcwvgrhzzzre.supabase.co
 *    - SUPABASE_ANON_KEY: [Your Supabase Anon Key]
 *    - GEMINI_API_KEY: [Your Google Gemini API Key]
 *    - USER_EMAIL: [Your Email]
 * 4. Add a "Time-driven" trigger for `generateNewsletter` (e.g., Monthly on the 1st).
 */

// Configuration
const CONFIG = {
  MODEL_NAME: 'gemini-1.5-pro-latest' // Or gemini-pro
};

/**
 * Main Trigger Function
 */
function generateNewsletter() {
  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const supabaseKey = props.getProperty('SUPABASE_ANON_KEY');
  const geminiKey = props.getProperty('GEMINI_API_KEY');
  const userEmail = props.getProperty('USER_EMAIL');

  if (!supabaseUrl || !supabaseKey || !geminiKey) {
    throw new Error('Missing Script Properties: SUPABASE_URL, SUPABASE_ANON_KEY, or GEMINI_API_KEY');
  }

  // 1. Fetch Data from Supabase Edge Function
  console.log('Fetching macro data from Supabase...');
  const payload = fetchSupabaseData(supabaseUrl, supabaseKey);
  
  if (!payload || payload.error) {
    console.error('Supabase Error:', payload);
    sendErrorEmail(userEmail, 'Supabase returned error: ' + JSON.stringify(payload));
    return;
  }

  // 2. Construct Prompt
  console.log('Constructing prompt...');
  const prompt = constructPrompt(payload);

  // 3. Call Gemini API
  console.log('Calling Gemini...');
  let newsletterContent;
  try {
    newsletterContent = callGemini(geminiKey, prompt);
  } catch (e) {
    console.error('Gemini call crashed:', e);
  }

  if (!newsletterContent) {
    console.error('Gemini Error: No content returned');
    sendErrorEmail(userEmail, 'Newsletter draft failed — check Supabase logs.');
    return;
  }

  // 4. Create Google Doc
  console.log('Creating Google Doc...');
  const docUrl = createGoogleDoc(newsletterContent, payload);

  // 5. Notify User
  console.log('Done! Doc URL:', docUrl);
  MailApp.sendEmail({
    to: userEmail,
    subject: 'GraphiQuestor Newsletter Generated',
    htmlBody: `Success! Your monthly newsletter draft is ready.<br><br>Review here: <a href="${docUrl}">${docUrl}</a>`
  });
}

function fetchSupabaseData(url, key) {
  const endpoint = `${url}/functions/v1/get-newsletter-data`;
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${key}`,
      'apikey': key
    },
    payload: JSON.stringify({}), // Use defaults
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(endpoint, options);
  const json = JSON.parse(response.getContentText());
  return json;
}

function constructPrompt(data) {
  const context = JSON.stringify(data.narrative_context, null, 2);
  const charts = data.narrative_context.charts;
  
  return `You are the editorial AI for GraphiQuestor – Macro Observatory.

Task: Generate a complete monthly newsletter (~800–1200 words) in storytelling style from the provided dashboard data.

Metadata Requirements (At the very top of the Markdown):
1. Subject Line: Provide 3 distinct subject line options (one punchy, one data-driven, one narrative).
2. Preview Text: Provide a compelling preview text (exactly first 100 characters).

Tone: Calm, institutional, evidence-based, zero hype — let data speak.

Structure:
1. Opening Narrative (150–200 words)
   - Current regime status
   - Biggest regime-shift risk
   - One-sentence monthly thesis

2. Liquidity & Hard Asset Update (200–300 words)
   - Net liquidity change (cite the 30d change)
   - Gold/Silver spreads
   - Debt/Gold ratio movement
   - Embed the Net Liquidity chart here: ![Net Liquidity](${charts.net_liquidity_1y})

3. Sovereign & De-Dollarization Pulse (200–300 words)
   - BRICS+ gold accumulation
   - US Treasury foreign holders change
   - China & India macro highlights
   - Embed the Gold Spread chart here: ![Gold Spread](${charts.gold_spread_1y})

4. Key Event Recap & Forward Look (150–200 words)
   - Recap significant surprises
   - Highlight high-impact upcoming events

5. Closing (50–100 words)
   - Dashboard link (https://graphiquestor.com)
   - Ko-fi/Patreon link
   - "See you next month"

Use exact numbers from the data. Cite sources briefly. Embed the provided chart URLs exactly as shown above using Markdown syntax.

Data Context:
${context}
`;
}

function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.MODEL_NAME}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());

  if (json.error) {
    console.error('Gemini API Error:', json.error);
    return null;
  }

  return json.candidates?.[0]?.content?.parts?.[0]?.text;
}

function createGoogleDoc(content, data) {
  const dateStr = new Date().toISOString().split('T')[0];
  const title = `GraphiQuestor Monthly Macro Pulse – ${dateStr}`;
  const doc = DocumentApp.create(title);
  const body = doc.getBody();

  // Basic formatting parsing
  // Note: A robust markdown parser for GAS is complex. 
  // We will dump the text and user can format, or do simple bolding.
  body.setText(content);
  
  // Add Header
  const header = doc.addHeader();
  header.appendParagraph("GraphiQuestor Automated Draft\nGenerated: " + data.generated_at);

  doc.saveAndClose();
  return doc.getUrl();
}

function sendErrorEmail(email, errorMsg) {
  if (email) {
    MailApp.sendEmail({
      to: email,
      subject: 'GraphiQuestor Newsletter Automation FAILED',
      body: errorMsg
    });
  }
}
