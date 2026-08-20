/**
 * growth-actions — multi-task free-tier growth slot
 *   task=regime-alert  (cron / service_role) — email on regime label flip
 *   task=scout-lead    (anon ok) — capture Export Scout lead + optional email
 *
 * Terminal and playbooks stay free. No paywall.
 */
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const BASE_URL = "https://graphiquestor.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function isServiceOrCron(req: Request): boolean {
  const cron = req.headers.get("x-cron-secret");
  const expected = Deno.env.get("CRON_SECRET");
  if (expected && cron && cron === expected) return true;
  const auth = req.headers.get("Authorization") ?? "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (service && auth === `Bearer ${service}`) return true;
  return false;
}

async function sendResend(opts: {
  to: string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_API_KEY not configured");
  const defaultFrom = Deno.env.get("RESEND_FROM_EMAIL") ?? "GraphiQuestor <digest@mahanka.com>";
  const from = opts.from ?? defaultFrom;

  // Resend batch for many; single for one.
  if (opts.to.length === 1) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from,
        to: opts.to[0],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) console.error("Resend single fail", await res.text());
    return res.ok;
  }

  let ok = true;
  const BATCH = 100;
  for (let i = 0; i < opts.to.length; i += BATCH) {
    const chunk = opts.to.slice(i, i + BATCH);
    const payload = chunk.map((email) => ({
      from,
      to: [email],
      subject: opts.subject,
      html: opts.html,
    }));
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      ok = false;
      console.error("Resend batch fail", await res.text());
    }
  }
  return ok;
}

async function handleRegimeAlert(
  supabase: ReturnType<typeof createClient>,
): Promise<Response> {
  const today = new Date().toISOString().split("T")[0];

  const { data: already } = await supabase
    .from("regime_alert_sends")
    .select("as_of_date")
    .eq("as_of_date", today)
    .maybeSingle();
  if (already) {
    return json({ ok: true, message: "Already sent regime alert today" });
  }

  // Prefer morning brief labels (same product surface users see).
  const { data: briefs } = await supabase
    .from("daily_macro_briefs")
    .select("brief_date, regime_label, content")
    .order("brief_date", { ascending: false })
    .limit(10);

  const byDate = new Map<string, { label: string; content: unknown }>();
  for (const row of briefs ?? []) {
    if (!byDate.has(row.brief_date) && row.regime_label) {
      byDate.set(row.brief_date, {
        label: String(row.regime_label),
        content: row.content,
      });
    }
  }
  const dates = [...byDate.keys()].sort().reverse();
  if (dates.length < 2) {
    return json({ ok: true, message: "Not enough history for flip detect" });
  }

  const todayLabel = byDate.get(today)?.label;
  // Find previous calendar brief date with a label
  let prevLabel: string | undefined;
  for (const d of dates) {
    if (d < today) {
      prevLabel = byDate.get(d)?.label;
      break;
    }
  }

  if (!todayLabel || !prevLabel) {
    return json({ ok: true, message: "Missing labels for flip compare" });
  }
  if (todayLabel === prevLabel) {
    return json({
      ok: true,
      message: `No flip (${prevLabel} → ${todayLabel})`,
    });
  }

  const content = byDate.get(today)?.content as {
    what_changed?: string[];
    regime_status?: string;
  } | null;
  const bullets = (content?.what_changed ?? []).slice(0, 3);
  const statusLine = content?.regime_status ?? "";

  const { data: subs, error: subErr } = await supabase
    .from("subscribers")
    .select("email")
    .eq("status", "confirmed");
  if (subErr) throw subErr;
  const emails = (subs ?? []).map((s) => s.email as string).filter(Boolean);
  if (emails.length === 0) {
    await supabase.from("regime_alert_sends").insert({
      as_of_date: today,
      from_label: prevLabel,
      to_label: todayLabel,
      sent_count: 0,
    });
    return json({ ok: true, message: "Flip detected; no confirmed subscribers" });
  }

  const bulletHtml = bullets
    .map((b) => `<li style="margin-bottom:8px;color:#475569;">${esc(b)}</li>`)
    .join("");
  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#2563eb;font-weight:900;">GraphiQuestor · Regime Alert</div>
      <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:12px 0;">
        Regime flip — ${esc(prevLabel)} → ${esc(todayLabel)}
      </h1>
      <p style="font-size:14px;color:#64748b;margin:0 0 16px;">${esc(today)}</p>
      ${statusLine ? `<p style="font-size:15px;line-height:1.6;color:#334155;">${esc(statusLine)}</p>` : ""}
      ${bulletHtml ? `<ul style="padding-left:18px;font-size:14px;">${bulletHtml}</ul>` : ""}
      <p style="margin:24px 0;">
        <a href="${BASE_URL}/macro-brief/${today}/?utm_source=email&utm_medium=regime-alert"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-size:13px;font-weight:800;padding:10px 20px;border-radius:8px;">
          Open free terminal brief →
        </a>
      </p>
      <p style="font-size:12px;color:#94a3b8;">
        Free structural signal — not a forecast. Manage cadence at graphiquestor.com.
      </p>
    </div>`;

  const ok = await sendResend({
    to: emails,
    subject: `Regime flip — ${prevLabel} → ${todayLabel} · GraphiQuestor`,
    html,
  });

  await supabase.from("regime_alert_sends").insert({
    as_of_date: today,
    from_label: prevLabel,
    to_label: todayLabel,
    sent_count: ok ? emails.length : 0,
  });

  if (!ok) {
    return json({ error: "Resend incomplete" }, 502);
  }
  return json({
    ok: true,
    flip: { from: prevLabel, to: todayLabel },
    sent: emails.length,
  });
}

async function handleScoutLead(
  supabase: ReturnType<typeof createClient>,
  body: {
    email?: string;
    hs_code?: string;
    playbook_path?: string;
    source?: string;
    honeypot?: string;
  },
): Promise<Response> {
  // Bot trap
  if (body.honeypot && body.honeypot.trim().length > 0) {
    return json({ ok: true });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: "Valid email required" }, 400);
  }

  const hs = (body.hs_code ?? "").slice(0, 16);
  const path = (body.playbook_path ?? "").slice(0, 256);
  const source = (body.source ?? "export-scout").slice(0, 64);

  const { error: insErr } = await supabase.from("export_scout_leads").insert({
    email,
    hs_code: hs || null,
    playbook_path: path || null,
    source,
  });
  if (insErr) {
    console.error("scout lead insert", insErr);
    return json({ error: "Could not save lead" }, 500);
  }

  // Optional: email playbook link (best-effort)
  const playbookUrl = path
    ? path.startsWith("http")
      ? path
      : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`
    : `${BASE_URL}/trade`;

  try {
    await sendResend({
      to: [email],
      subject: `Export Scout playbook${hs ? ` · HS ${hs}` : ""} · GraphiQuestor`,
      html: `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#2563eb;font-weight:900;">GraphiQuestor · Export Scout</div>
          <h1 style="font-size:20px;font-weight:800;color:#0f172a;">Your playbook link</h1>
          <p style="font-size:15px;color:#334155;line-height:1.6;">
            Free Export Scout synthesis for${hs ? ` HS ${esc(hs)}` : " your product"}.
            Terminal and playbooks are not paywalled.
          </p>
          <p style="margin:24px 0;">
            <a href="${esc(playbookUrl)}?utm_source=email&utm_medium=scout-lead"
               style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-size:13px;font-weight:800;padding:10px 20px;border-radius:8px;">
              Open playbook →
            </a>
          </p>
          <p style="font-size:12px;color:#94a3b8;">
            For India trade desk pilots, reply to this email or use graphiquestor.com/institutional.
          </p>
        </div>`,
    });
  } catch (e) {
    console.warn("scout lead email failed (row saved)", e);
  }

  // Notify admin at k@foundersoffice.co of the new lead response
  try {
    const adminEmail = Deno.env.get("ADMIN_NOTIFY_EMAIL") ?? "k@foundersoffice.co";
    await sendResend({
      to: [adminEmail],
      subject: `[GraphiQuestor] Export Scout Lead: ${email}`,
      html: `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h2 style="color:#0f172a;margin-bottom:12px;">New Export Scout Lead Captured</h2>
          <p><strong>Email:</strong> ${esc(email)}</p>
          <p><strong>HS Code:</strong> ${esc(hs || "Not specified")}</p>
          <p><strong>Playbook Path:</strong> ${esc(path || "Trade terminal")}</p>
          <p><strong>Source:</strong> ${esc(source)}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>`,
    });
  } catch (adminErr) {
    console.warn("admin notification failed for scout lead", adminErr);
  }

  return json({ ok: true });
}

async function handleInquiry(
  _supabase: ReturnType<typeof createClient>,
  body: {
    email?: string;
    name?: string;
    message?: string;
    company?: string;
    source?: string;
    honeypot?: string;
  },
): Promise<Response> {
  // Bot trap
  if (body.honeypot && body.honeypot.trim().length > 0) {
    return json({ ok: true });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: "Valid email required" }, 400);
  }

  const name = (body.name ?? "").slice(0, 128);
  const message = (body.message ?? "").slice(0, 2000);
  const company = (body.company ?? "").slice(0, 128);
  const source = (body.source ?? "contact-form").slice(0, 64);
  const adminEmail = Deno.env.get("ADMIN_NOTIFY_EMAIL") ?? "k@foundersoffice.co";

  try {
    await sendResend({
      to: [adminEmail],
      subject: `[GraphiQuestor] New Inquiry Response from ${name || email}`,
      html: `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h2 style="color:#0f172a;margin-bottom:12px;">New Response / Inquiry Received</h2>
          <p><strong>Name:</strong> ${esc(name || "N/A")}</p>
          <p><strong>Email:</strong> ${esc(email)}</p>
          <p><strong>Company:</strong> ${esc(company || "N/A")}</p>
          <p><strong>Source:</strong> ${esc(source)}</p>
          <p><strong>Message:</strong></p>
          <div style="background:#f1f5f9;padding:12px 16px;border-radius:8px;font-size:14px;color:#334155;white-space:pre-wrap;">${esc(message || "No message content")}</div>
          <p style="color:#94a3b8;font-size:12px;margin-top:16px;">Timestamp: ${new Date().toISOString()}</p>
        </div>`,
    });
  } catch (err) {
    console.error("inquiry email notification failed", err);
    return json({ error: "Failed to dispatch notification" }, 500);
  }

  return json({ ok: true, message: "Response received and forwarded to desk" });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const task = String(body.task ?? "");

    if (task === "regime-alert") {
      if (!isServiceOrCron(req)) {
        return json({ error: "Unauthorized" }, 401);
      }
      return await handleRegimeAlert(supabase);
    }

    if (task === "scout-lead") {
      return await handleScoutLead(supabase, body as {
        email?: string;
        hs_code?: string;
        playbook_path?: string;
        source?: string;
        honeypot?: string;
      });
    }

    if (task === "inquiry" || task === "contact") {
      return await handleInquiry(supabase, body as {
        email?: string;
        name?: string;
        message?: string;
        company?: string;
        source?: string;
        honeypot?: string;
      });
    }

    return json({ error: "Unknown task. Use regime-alert | scout-lead | inquiry" }, 400);
  } catch (err: unknown) {
    console.error("[growth-actions]", err);
    return json({ error: (err as Error).message }, 500);
  }
});
