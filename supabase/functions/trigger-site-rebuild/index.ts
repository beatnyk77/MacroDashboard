// @ts-ignore
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { runWithRetry } from "../_shared/job-runner.ts";
import { sendDiscordAlert } from "../_shared/webhook_utils.ts";

declare const Deno: any;

const JOB_NAME = "trigger-site-rebuild";

interface RebuildResult {
  skipped: boolean;
  reason?: string;
  hookStatus?: number;
}

async function triggerNetlifyRebuild(): Promise<RebuildResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const buildHookUrl = Deno.env.get("NETLIFY_BUILD_HOOK_URL");
  if (!buildHookUrl) {
    throw new Error(
      "Missing NETLIFY_BUILD_HOOK_URL environment variable. " +
      "Create a build hook in Netlify (Site settings → Build & deploy → Build hooks) " +
      "and set it as a function secret."
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Guard: only rebuild when there is fresh daily content to publish.
  // A rebuild without a new brief burns Netlify build minutes for nothing.
  const today = new Date().toISOString().split("T")[0];
  const { data: briefs, error } = await supabase
    .from("daily_macro_briefs")
    .select("brief_date")
    .eq("brief_date", today)
    .limit(1);

  if (error) {
    throw new Error(`Failed to check daily_macro_briefs: ${error.message}`);
  }

  if (!briefs || briefs.length === 0) {
    console.log(`[${JOB_NAME}] No brief for ${today} — skipping rebuild.`);
    return { skipped: true, reason: `no daily_macro_briefs row for ${today}` };
  }

  console.log(`[${JOB_NAME}] Brief found for ${today} — triggering Netlify build hook.`);
  const resp = await fetch(buildHookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trigger_title: `daily-content-rebuild ${today}` }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Netlify build hook returned ${resp.status}: ${body.slice(0, 200)}`);
  }

  console.log(`[${JOB_NAME}] Netlify build hook accepted (HTTP ${resp.status}).`);
  return { skipped: false, hookStatus: resp.status };
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  console.log(`[${JOB_NAME}] Edge Function Invoked`);

  const result = await runWithRetry(JOB_NAME, triggerNetlifyRebuild, {
    timeoutMs: 60 * 1000,
    maxRetries: 3,
    backoffMs: 15_000,
  });

  if (!result.ok) {
    const errorMessage = result.error || "Unknown error";
    console.error(`[${JOB_NAME}] Job failed: ${errorMessage}`);
    await sendDiscordAlert(
      `🚨 Site Rebuild Trigger Failed (${JOB_NAME})`,
      `The daily Netlify rebuild trigger failed after ${result.attempts} attempts — ` +
      `today's brief will not be prerendered until the next deploy.\n\n**Error:** ${errorMessage}`,
      true
    );
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    data: result.value,
    attempts: result.attempts,
    totalMs: result.totalMs,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
