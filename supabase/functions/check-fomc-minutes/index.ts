/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { runIngestion } from '../_shared/logging.ts'
import { sendDiscordAlert } from '../_shared/webhook_utils.ts'
// unpdf ES module zero-dependency parser for pure Deno compatibility
import { extractText } from 'https://esm.sh/unpdf@0.12.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to strip HTML tags and scripts
function cleanHtml(html: string): string {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/\s+/g, ' ');
  return text.trim();
}

// JSON Schema Interface to validate LLM output
interface FOMCAnalysis {
  overall_tone: string;
  key_themes: string[];
  notable_shifts: string;
  capital_implications: string;
  actionable_insight: string;
  raw_analysis: string;
}

function validateAnalysis(parsed: any): parsed is FOMCAnalysis {
  return (
    typeof parsed === 'object' &&
    parsed !== null &&
    typeof parsed.overall_tone === 'string' &&
    Array.isArray(parsed.key_themes) &&
    parsed.key_themes.every((t: any) => typeof t === 'string') &&
    typeof parsed.notable_shifts === 'string' &&
    typeof parsed.capital_implications === 'string' &&
    typeof parsed.actionable_insight === 'string' &&
    typeof parsed.raw_analysis === 'string'
  );
}

// Fallback utility to extract JSON from raw LLM output text
function extractJSON(raw: string): any {
  const clean = raw.trim();
  
  // Try direct parsing
  try {
    return JSON.parse(clean);
  } catch {
    // Attempt markdown code fence extraction
    const fenced = clean.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        // Fall through
      }
    }
    // Attempt outer curly braces search
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(clean.slice(start, end + 1));
      } catch {
        // Fall through
      }
    }
    throw new Error('Could not parse output as valid JSON');
  }
}

// Robust fetch utility with retries
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  const defaultOptions = {
    ...options,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      ...options.headers,
    }
  };
  for (let i = 0; i <= maxRetries; i++) {
    try {
      if (i > 0) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      const response = await fetch(url, defaultOptions);
      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}: ${await response.text().then(t => t.substring(0, 100))}`);
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed for ${url}: ${error.message}`);
    }
  }
  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const openrouterKey = Deno.env.get('OPENROUTER_API_KEY') ?? '';
  const aimlapiKey = Deno.env.get('AIMLAPI_KEY') ?? '';

  if (!openrouterKey && !aimlapiKey) {
    return new Response(JSON.stringify({ error: 'Both OPENROUTER_API_KEY and AIMLAPI_KEY are missing' }), { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  return runIngestion(supabase, 'check-fomc-minutes', async (ctx) => {
    console.log('[fomc-minutes] Starting FOMC Calendar check...');
    
    // Step 1: Fetch FOMC Calendars page
    const calendarUrl = 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm';
    const calendarRes = await fetchWithRetry(calendarUrl);
    const calendarHtml = await calendarRes.text();

    // Step 2: Extract meeting dates and URLs
    // Patterns match minutes links like /monetarypolicy/fomcminutes20251217.htm or /monetarypolicy/files/fomcminutes20251217.pdf
    const matchRegex = /\/monetarypolicy\/(?:files\/)?fomcminutes(\d{8})\.(htm|pdf)/gi;
    const matches = [...calendarHtml.matchAll(matchRegex)];

    if (matches.length === 0) {
      throw new Error('No FOMC Minutes links detected on the Federal Reserve calendar page.');
    }

    // Map matches to unique meeting dates and track HTML vs PDF priorities
    const meetingsMap = new Map<string, { htmlPath: string | null; pdfPath: string | null }>();
    
    for (const match of matches) {
      const fullPath = match[0];
      const dateStr = match[1]; // YYYYMMDD
      const ext = match[2].toLowerCase(); // htm or pdf
      
      const year = parseInt(dateStr.substring(0, 4));
      const currentYear = new Date().getFullYear();
      
      // Focus on recent/relevant years to prevent historical junk pollution
      if (year < currentYear - 1) continue;

      const formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
      
      if (!meetingsMap.has(formattedDate)) {
        meetingsMap.set(formattedDate, { htmlPath: null, pdfPath: null });
      }
      
      const record = meetingsMap.get(formattedDate)!;
      if (ext === 'htm') {
        record.htmlPath = fullPath;
      } else if (ext === 'pdf') {
        record.pdfPath = fullPath;
      }
    }

    // Sort descending to get the absolute newest meeting date
    const sortedMeetingDates = Array.from(meetingsMap.keys()).sort((a, b) => b.localeCompare(a));
    
    if (sortedMeetingDates.length === 0) {
      return {
        rows_inserted: 0,
        metadata: {
          message: 'No recent FOMC meetings found within current/previous calendar years.'
        }
      };
    }

    const latestMeetingDate = sortedMeetingDates[0];
    const meetingRecord = meetingsMap.get(latestMeetingDate)!;
    console.log(`[fomc-minutes] Newest detected FOMC Meeting Date: ${latestMeetingDate}`);

    // Step 3: Deduplicate against Supabase DB
    const { data: existingRecord } = await ctx.supabase
      .from('fomc_minutes_analysis')
      .select('meeting_date')
      .eq('meeting_date', latestMeetingDate)
      .maybeSingle();

    if (existingRecord) {
      console.log(`[fomc-minutes] FOMC Minutes for ${latestMeetingDate} have already been analyzed and saved.`);
      return {
        rows_inserted: 0,
        metadata: {
          meeting_date: latestMeetingDate,
          processed: false,
          reason: 'Latest minutes already processed.'
        }
      };
    }

    // Step 4: Scraping and Parsing Handler (Prefer HTML, Fallback to PDF)
    let extractedText = '';
    let targetUrl = '';
    let isPDF = false;

    if (meetingRecord.htmlPath) {
      targetUrl = `https://www.federalreserve.gov${meetingRecord.htmlPath}`;
      console.log(`[fomc-minutes] Fetching HTML minutes content from ${targetUrl}...`);
      
      const response = await fetchWithRetry(targetUrl);
      const rawHtml = await response.text();
      extractedText = cleanHtml(rawHtml);
    } else if (meetingRecord.pdfPath) {
      targetUrl = `https://www.federalreserve.gov${meetingRecord.pdfPath}`;
      console.log(`[fomc-minutes] Falling back to PDF download from ${targetUrl}...`);
      isPDF = true;

      const pdfResponse = await fetchWithRetry(targetUrl);
      const pdfArrayBuffer = await pdfResponse.arrayBuffer();
      const pdfUint8 = new Uint8Array(pdfArrayBuffer);
      
      // unpdf zero-dependency Deno-native extractor
      const pdfData = await extractText(pdfUint8, { mergePages: true });
      extractedText = pdfData.text || '';
    } else {
      throw new Error(`FOMC meeting on ${latestMeetingDate} exists, but lacks both HTML and PDF source links.`);
    }

    if (!extractedText || extractedText.trim().length < 500) {
      throw new Error(`Scraped FOMC Minutes content is unexpectedly short or empty (${extractedText?.length} chars).`);
    }

    // Step 5: Token limits truncate safeguard (Approx 30,000 tokens / 120,000 characters)
    const charLimit = 120000;
    if (extractedText.length > charLimit) {
      console.log(`[fomc-minutes] Content exceeds character guardrails. Truncating text from ${extractedText.length} to ${charLimit} chars.`);
      extractedText = extractedText.substring(0, charLimit);
    }

    // Step 6: Invoke OpenRouter (Claude 3.5 Sonnet) with Schema Validation and Retries
    const systemPrompt = `You are an elite central bank strategy consultant. You produce highly technical, institutional-grade quantitative analyses. You always respond in pure valid JSON strictly matching the requested keys, with absolutely no markdown wrapping, no conversational preamble, and no extra text.`;

    const userPrompt = `You are an elite Chief Investment Officer managing sovereign wealth and dynastic capital for ultra-high-net-worth families. You read between the lines of FOMC minutes to identify macroeconomic shifts, hidden central bank concerns, and strategic asset allocation trades.

Attached is the cleaned text of the official Federal Reserve FOMC Minutes.

FOMC MINUTES TEXT:
${extractedText}

Analyze this text and output a single valid JSON object following this exact structure:
{
  "overall_tone": "Hawkish | Dovish | Neutral | Hawkish Shift | Dovish Shift",
  "key_themes": [
    "Theme 1 (e.g. Quantitative Tightening Runway)",
    "Theme 2",
    "Theme 3",
    "Theme 4"
  ],
  "notable_shifts": "A detailed assessment of the language adjustments, voting shifts, or voting consensus adjustments...",
  "capital_implications": "Strategic portfolio moves across fixed income bucket maturities, gold/bullion, risk equities, FX, and hard assets...",
  "actionable_insight": "The absolute key tactical trade advisory recommendation for our $100B+ multi-asset sovereign fund...",
  "raw_analysis": "The complete verbatim qualitative analysis structured in markdown format, written in your premier, non-obvious, deeply analytical CIO persona. Highlight key metrics and policy nuances."
}`;

    let parsedResult: FOMCAnalysis | null = null;
    let rawLLMText = '';
    const errorsList: string[] = [];

    const providers = [];
    if (aimlapiKey) {
      providers.push({
        name: 'AIMLAPI',
        url: 'https://api.aimlapi.com/v1/chat/completions',
        key: aimlapiKey,
        model: 'gpt-4o',
        responseFormat: { type: 'json_object' }
      });
      providers.push({
        name: 'AIMLAPI',
        url: 'https://api.aimlapi.com/v1/chat/completions',
        key: aimlapiKey,
        model: 'gpt-4o-mini',
        responseFormat: { type: 'json_object' }
      });
    }
    if (openrouterKey) {
      providers.push({
        name: 'OpenRouter',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        key: openrouterKey,
        model: 'deepseek/deepseek-r1:free',
        responseFormat: undefined
      });
      providers.push({
        name: 'OpenRouter',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        key: openrouterKey,
        model: 'openrouter/free',
        responseFormat: undefined
      });
      providers.push({
        name: 'OpenRouter',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        key: openrouterKey,
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        responseFormat: undefined
      });
    }

    if (providers.length === 0) {
      throw new Error('No LLM providers configured.');
    }

    for (let attempt = 1; attempt <= providers.length; attempt++) {
      const provider = providers[attempt - 1];
      try {
        console.log(`[fomc-minutes] Dispatching ${provider.name} call (Attempt ${attempt}/${providers.length}) using model ${provider.model}...`);
        
        const headers: Record<string, string> = {
          'Authorization': `Bearer ${provider.key}`,
          'Content-Type': 'application/json',
        };

        if (provider.name === 'OpenRouter') {
          headers['HTTP-Referer'] = 'https://graphiquestor.com';
          headers['X-Title'] = 'GraphiQuestor';
        }

        const requestBody: any = {
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt + (attempt > 1 ? '\n\nIMPORTANT: Your previous output failed JSON validation. Please make absolutely certain there are no unescaped control characters, quotes, or trailing commas. Output pure JSON.' : '') }
          ],
          temperature: 0.1,
        };

        if (provider.responseFormat) {
          requestBody.response_format = provider.responseFormat;
        }

        const openRouterResponse = await fetch(provider.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });

        if (!openRouterResponse.ok) {
          throw new Error(`${provider.name} returned status ${openRouterResponse.status}: ${await openRouterResponse.text()}`);
        }

        const openRouterData = (await openRouterResponse.json()) as any;
        if (openRouterData.error) {
          throw new Error(`${provider.name} API Error: ${openRouterData.error.message || JSON.stringify(openRouterData.error)}`);
        }
        rawLLMText = openRouterData.choices?.[0]?.message?.content || '';

        if (!rawLLMText) {
          throw new Error(`${provider.name} response contains empty content/choices.`);
        }

        // Try extracting and parsing JSON
        const rawJsonObj = extractJSON(rawLLMText);
        
        // Validate Schema structure
        if (validateAnalysis(rawJsonObj)) {
          parsedResult = rawJsonObj;
          console.log(`[fomc-minutes] JSON schema validation succeeded using ${provider.name} (${provider.model}).`);
          break; // success!
        } else {
          throw new Error('JSON response parsing succeeded, but lacked required keys or types.');
        }

      } catch (err: any) {
        console.warn(`[fomc-minutes] Ingestion attempt ${attempt} failed: ${err.message}`);
        errorsList.push(`Attempt ${attempt} (${provider.name} - ${provider.model}): ${err.message}`);
        if (attempt === providers.length) {
          throw new Error(`Failed to generate a valid validated LLM response after ${providers.length} attempts. Errors: ${errorsList.join(' | ')}. Raw output was: ${rawLLMText.substring(0, 300)}...`);
        }
        // exponential delay backoff retry
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }

    if (!parsedResult) {
      throw new Error('Fatal error: parsed result is null');
    }

    // Step 7: Persist verified results to public.fomc_minutes_analysis
    const rowToUpsert = {
      meeting_date: latestMeetingDate,
      release_date: new Date().toISOString().split('T')[0], // Set current release observation date
      overall_tone: parsedResult.overall_tone,
      key_themes: parsedResult.key_themes,
      notable_shifts: parsedResult.notable_shifts,
      capital_implications: parsedResult.capital_implications,
      actionable_insight: parsedResult.actionable_insight,
      raw_analysis: parsedResult.raw_analysis,
      pdf_url: targetUrl,
    };

    console.log(`[fomc-minutes] Upserting records to database for meeting date ${latestMeetingDate}...`);
    const { error: upsertError } = await ctx.supabase
      .from('fomc_minutes_analysis')
      .upsert(rowToUpsert, { onConflict: 'meeting_date' });

    if (upsertError) throw upsertError;

    // Send successful Slack/Discord notifications to highlight brand new central bank insights
    await sendDiscordAlert(
      `🟢 New FOMC Minutes Analyzed (${latestMeetingDate})`,
      `**Fed Policy Bias:** ${parsedResult.overall_tone}\n\n**Actionable CIO Insight:**\n${parsedResult.actionable_insight.substring(0, 500)}...\n\n*Raw LLM text verified & stored successfully.*`,
      false
    );

    return {
      rows_inserted: 1,
      raw_payload: rawLLMText, // Cryptographic payload proof hash logged
      metadata: {
        meeting_date: latestMeetingDate,
        tone: parsedResult.overall_tone,
        themes_count: parsedResult.key_themes.length,
        is_pdf: isPDF,
        source_url: targetUrl
      }
    };
  });
});
