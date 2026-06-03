// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { runWithRetry } from "../_shared/job-runner.ts";
import { sendDiscordAlert } from "../_shared/webhook_utils.ts";
// @ts-ignore
import { google } from "npm:googleapis";

declare const Deno: any;

const JOB_NAME = "gsc-sync";

async function fetchAndUpsertGscData() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Parse Google Service Account credentials
  const gscCredsRaw = Deno.env.get("GSC_SERVICE_ACCOUNT_KEY");
  if (!gscCredsRaw) {
    throw new Error("Missing GSC_SERVICE_ACCOUNT_KEY environment variable. Must be valid JSON.");
  }

  let gscCreds;
  try {
    gscCreds = JSON.parse(gscCredsRaw);
  } catch (err) {
    throw new Error("GSC_SERVICE_ACCOUNT_KEY is not a valid JSON string");
  }

  // The property URL (e.g. "https://graphiquestor.com/") or Domain property (e.g. "sc-domain:graphiquestor.com")
  const siteUrl = Deno.env.get("GSC_SITE_URL") || "https://graphiquestor.com/"; // Defaulting to terminal domain

  console.log(`[${JOB_NAME}] Authenticating with Google APIs for site: ${siteUrl}`);

  // Create JWT Client
  const auth = new google.auth.JWT(
    gscCreds.client_email,
    null,
    // Ensure the private key handles escaped newlines correctly if passed as a single string
    gscCreds.private_key?.replace(/\\n/g, '\n'),
    ["https://www.googleapis.com/auth/webmasters.readonly"]
  );

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  // Calculate dates. GSC data is usually 2 days lagged. We'll fetch the last 7 days of available data.
  const today = new Date();
  
  // End date is 2 days ago
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - 2);
  const endDateStr = endDate.toISOString().split("T")[0];

  // Start date is 9 days ago (7 days before end date)
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 9);
  const startDateStr = startDate.toISOString().split("T")[0];

  console.log(`[${JOB_NAME}] Querying GSC data from ${startDateStr} to ${endDateStr}`);

  // Query GSC API
  const response = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: startDateStr,
      endDate: endDateStr,
      dimensions: ["date", "page", "query", "country", "device"],
      rowLimit: 25000, // Fetch up to 25k rows to ensure comprehensive coverage
    },
  });

  const rows = response.data.rows || [];
  console.log(`[${JOB_NAME}] Retrieved ${rows.length} rows from GSC`);

  if (rows.length === 0) {
    console.log(`[${JOB_NAME}] No data found for the given date range.`);
    return { rowsUpserted: 0 };
  }

  // Transform GSC rows to match database schema
  const dbRecords = rows.map((row: any) => {
    // dimensions match the requested array: ["date", "page", "query", "country", "device"]
    const keys = row.keys || [];
    return {
      date: keys[0] || null,
      page: keys[1] || null,
      query: keys[2] || null,
      country: keys[3] || null,
      device: keys[4] || null,
      impressions: row.impressions || 0,
      clicks: row.clicks || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    };
  }).filter((record: any) => record.date && record.page && record.query);

  if (dbRecords.length === 0) {
    return { rowsUpserted: 0 };
  }

  // Upsert into Supabase in batches of 1000 to avoid request size limits
  const BATCH_SIZE = 1000;
  let totalUpserted = 0;

  for (let i = 0; i < dbRecords.length; i += BATCH_SIZE) {
    const batch = dbRecords.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .from('gsc_performance')
      .upsert(batch, { 
        onConflict: 'date,page,query,country,device' 
      });

    if (error) {
      throw new Error(`Failed to upsert GSC data batch ${i/BATCH_SIZE + 1}: ${error.message}`);
    }

    totalUpserted += batch.length;
    console.log(`[${JOB_NAME}] Upserted batch ${i/BATCH_SIZE + 1} (${batch.length} rows)`);
  }

  console.log(`[${JOB_NAME}] Successfully synchronized ${totalUpserted} rows from GSC.`);
  return { rowsUpserted: totalUpserted };
}

serve(async (req: Request) => {
  // Only allow POST requests (standard for pg_cron invocations)
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  console.log(`[${JOB_NAME}] Edge Function Invoked`);

  // Run the job with standard retry logic (timeout: 5 mins, max retries: 3)
  const result = await runWithRetry(JOB_NAME, fetchAndUpsertGscData, {
    timeoutMs: 5 * 60 * 1000,
    maxRetries: 3,
    backoffMs: 15_000,
  });

  if (!result.ok) {
    const errorMessage = result.error || "Unknown error";
    console.error(`[${JOB_NAME}] Job failed: ${errorMessage}`);
    await sendDiscordAlert(
      `🚨 GSC Sync Failed (${JOB_NAME})`,
      `The Google Search Console data sync failed after ${result.attempts} attempts.\n\n**Error:** ${errorMessage}`,
      true
    );
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ 
    success: true, 
    data: result.value,
    attempts: result.attempts,
    totalMs: result.totalMs
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});
