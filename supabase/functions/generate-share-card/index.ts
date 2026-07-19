/**
 * generate-share-card
 * Renders a branded SVG share card for today's morning brief, uploads to
 * storage bucket share-cards, and stamps daily_macro_briefs.share_image_url.
 * Free-tier friendly (no Puppeteer).
 */
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const PROJECT_URL = Deno.env.get("SUPABASE_URL") ?? "";
const BUCKET = "share-cards";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLines(text: string, maxLen: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxLen && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = next;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines.slice(0, maxLines);
}

function buildSvg(opts: {
  date: string;
  regime: string;
  score: number | null;
  bullets: string[];
}): string {
  const regime = esc(opts.regime || "NEUTRAL");
  const date = esc(opts.date);
  const score =
    typeof opts.score === "number" ? `${Math.round(opts.score)}/100` : "";
  const bulletLines = opts.bullets
    .slice(0, 3)
    .flatMap((b, i) => {
      const lines = wrapLines(b, 52, 2);
      return lines.map((ln, j) => {
        const y = 210 + i * 48 + j * 20;
        const prefix = j === 0 ? "→ " : "  ";
        return `<text x="64" y="${y}" fill="#cbd5e1" font-size="18" font-family="ui-sans-serif,system-ui,sans-serif">${esc(prefix + ln)}</text>`;
      });
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1220"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="12" height="630" fill="#2563eb"/>
  <text x="64" y="72" fill="#60a5fa" font-size="18" font-weight="800" letter-spacing="4" font-family="ui-sans-serif,system-ui,sans-serif">GRAPHIQUESTOR</text>
  <text x="64" y="130" fill="#f8fafc" font-size="42" font-weight="800" font-family="ui-sans-serif,system-ui,sans-serif">Morning Macro Brief</text>
  <text x="64" y="172" fill="#94a3b8" font-size="22" font-family="ui-sans-serif,system-ui,sans-serif">${date}</text>
  <rect x="64" y="190" width="320" height="36" rx="8" fill="#b45309" fill-opacity="0.25" stroke="#b45309" stroke-opacity="0.5"/>
  <text x="80" y="214" fill="#fbbf24" font-size="16" font-weight="800" letter-spacing="2" font-family="ui-sans-serif,system-ui,sans-serif">REGIME · ${regime}${score ? ` · ${score}` : ""}</text>
  ${bulletLines}
  <text x="64" y="580" fill="#64748b" font-size="18" font-family="ui-sans-serif,system-ui,sans-serif">graphiquestor.com · observe structural reality</text>
  <text x="64" y="608" fill="#475569" font-size="14" font-family="ui-sans-serif,system-ui,sans-serif">Free terminal · public data health · no paywall</text>
</svg>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      PROJECT_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let body: { type?: string; date?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const today =
      body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
        ? body.date
        : new Date().toISOString().split("T")[0];

    const { data: brief, error: briefErr } = await supabase
      .from("daily_macro_briefs")
      .select("brief_date, content, regime_label, regime_score")
      .eq("brief_date", today)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (briefErr) throw briefErr;
    if (!brief) {
      return new Response(
        JSON.stringify({ ok: true, message: `No brief for ${today}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const content = (brief.content ?? {}) as {
      what_changed?: string[];
      watch_today?: string[];
      regime_status?: string;
    };
    const bullets = [
      ...(content.what_changed ?? []),
      ...(content.watch_today ?? []),
    ].filter(Boolean);

    const svg = buildSvg({
      date: brief.brief_date,
      regime: brief.regime_label ?? "NEUTRAL",
      score: brief.regime_score,
      bullets,
    });

    const path = `brief-${brief.brief_date}.svg`;
    const bytes = new TextEncoder().encode(svg);

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: "image/svg+xml",
        upsert: true,
      });

    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    // Stamp all rows for this date (multiple focus combos share the card).
    const { error: updErr } = await supabase
      .from("daily_macro_briefs")
      .update({ share_image_url: publicUrl })
      .eq("brief_date", brief.brief_date);

    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({
        ok: true,
        brief_date: brief.brief_date,
        share_image_url: publicUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    console.error("[generate-share-card]", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
