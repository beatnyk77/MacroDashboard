/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

/**
 * send-daily-brief
 * Scheduled daily after generate-morning-brief. Sends today's morning macro
 * brief to confirmed subscribers with cadence 'daily' or 'both'. Idempotent
 * via brief_sends (one row per brief date). If today's brief was not
 * generated (LLM failure day), exits cleanly with a logged no-op — never
 * emails a stale brief.
 *
 * Unlike send-weekly-digest's BCC chunks, this sends per-recipient batches
 * (Resend /emails/batch, 100 per call) so each email carries a personal
 * unsubscribe / cadence-management link built from the subscriber's
 * confirm_token (see manage_subscription() migration).
 */

interface BriefContent {
    what_changed?: string[];
    regime_status?: string;
    focus_observations?: string[];
    watch_today?: string[];
}

interface DailyBrief {
    brief_date: string;
    content: BriefContent;
    regime_label: string | null;
    regime_score: number | null;
    share_image_url?: string | null;
}

const BASE_URL = "https://graphiquestor.com";
const UTM = "utm_source=newsletter&utm_medium=email&utm_campaign=daily-brief";

function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHtml(brief: DailyBrief, manageToken: string): string {
    const briefUrl = `${BASE_URL}/macro-brief/${brief.brief_date}?${UTM}`;
    const shareText = encodeURIComponent(
        `Morning Macro Brief — ${brief.brief_date} (${brief.regime_label ?? "Neutral"} regime)`
    );
    const shareUrl = encodeURIComponent(`${BASE_URL}/macro-brief/${brief.brief_date}?utm_source=share&utm_medium=email`);
    const manageBase = `${BASE_URL}/subscribe/manage?token=${encodeURIComponent(manageToken)}`;

    const bullets = (items?: string[]) =>
        (items ?? [])
            .slice(0, 5)
            .map((w) => `<li style="margin-bottom:8px;color:#475569;">${esc(w)}</li>`)
            .join("");

    const changed = bullets(brief.content.what_changed);
    const watch = bullets(brief.content.watch_today);

    const ogImage =
        brief.share_image_url ||
        `${BASE_URL}/og/brief-${brief.brief_date}.png`;

    return `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;">
            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#2563eb;font-weight:900;margin-bottom:8px;">Morning Macro Brief</div>
            <a href="${briefUrl}" style="display:block;margin-bottom:16px;text-decoration:none;">
                <img src="${ogImage}" alt="Morning Macro Brief — ${brief.brief_date}" width="560" style="width:100%;max-width:560px;border-radius:10px;border:1px solid #e2e8f0;" />
            </a>
            <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 6px;">${brief.brief_date}</h1>
            ${brief.regime_label ? `<p style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#b45309;margin:0 0 16px;">Regime: ${esc(brief.regime_label)}${typeof brief.regime_score === "number" ? ` · ${Math.round(brief.regime_score)}/100` : ""}</p>` : ""}
            ${brief.content.regime_status ? `<p style="font-size:15px;line-height:1.6;color:#334155;">${esc(brief.content.regime_status)}</p>` : ""}
            ${changed ? `<h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:#0f172a;">What Changed Overnight</h3><ul style="padding-left:18px;font-size:14px;">${changed}</ul>` : ""}
            ${watch ? `<h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:#0f172a;">Watch Today</h3><ul style="padding-left:18px;font-size:14px;">${watch}</ul>` : ""}
            <p style="margin:24px 0;">
                <a href="${briefUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:13px;font-weight:800;text-decoration:none;padding:10px 20px;border-radius:8px;">Read the full brief →</a>
            </p>
            <p style="font-size:12px;color:#64748b;">
                Useful? <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" style="color:#2563eb;font-weight:700;">Share on X</a>
                · Forwarded this? <a href="${BASE_URL}/?utm_source=newsletter&utm_medium=email&utm_campaign=forward#newsletter" style="color:#2563eb;font-weight:700;">Subscribe free</a>
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
            <p style="font-size:12px;color:#94a3b8;">
                You're receiving the daily brief because you opted in at graphiquestor.com.
                <a href="${manageBase}&action=cadence_weekly" style="color:#64748b;">Switch to weekly only</a>
                · <a href="${manageBase}&action=unsubscribe" style="color:#64748b;">Unsubscribe</a>
            </p>
        </div>
    `;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Today's brief only — never email a stale one on generation-failure days.
        const today = new Date().toISOString().split("T")[0];
        const { data: brief, error: briefError } = await supabase
            .from("daily_macro_briefs")
            .select("brief_date, content, regime_label, regime_score, share_image_url")
            .eq("brief_date", today)
            .order("generated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (briefError) throw briefError;
        if (!brief) {
            console.log(`[send-daily-brief] No brief for ${today} — no-op.`);
            return new Response(
                JSON.stringify({ success: true, message: `No brief for ${today}; nothing sent.` }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. Idempotency — already sent today?
        const { data: alreadySent } = await supabase
            .from("brief_sends")
            .select("brief_date")
            .eq("brief_date", today)
            .maybeSingle();

        if (alreadySent) {
            return new Response(
                JSON.stringify({ success: true, message: `Brief ${today} already sent.` }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. Confirmed daily-cadence subscribers (need tokens for manage links).
        const { data: subscribers, error: subError } = await supabase
            .from("subscribers")
            .select("email, confirm_token")
            .eq("status", "confirmed")
            .in("cadence", ["daily", "both"]);

        if (subError) throw subError;

        const recipients = (subscribers ?? []) as { email: string; confirm_token: string }[];
        if (recipients.length === 0) {
            return new Response(
                JSON.stringify({ success: true, message: "No daily-cadence subscribers yet." }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 4. Send via Resend batch API (personalized manage links → one email per recipient).
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (!resendApiKey) {
            return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured." }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const typedBrief = brief as unknown as DailyBrief;
        const subject = `Morning Macro Brief — ${today}${typedBrief.regime_label ? ` · ${typedBrief.regime_label}` : ""}`;

        const BATCH = 100; // Resend /emails/batch limit
        let sent = 0;
        let failed = 0;
        for (let i = 0; i < recipients.length; i += BATCH) {
            const chunk = recipients.slice(i, i + BATCH);
            const payload = chunk.map((r) => ({
                from: "GraphiQuestor <digest@graphiquestor.com>",
                to: [r.email],
                subject,
                html: buildHtml(typedBrief, r.confirm_token),
            }));
            const res = await fetch("https://api.resend.com/emails/batch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${resendApiKey}`,
                },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                sent += chunk.length;
            } else {
                failed += chunk.length;
                console.error("Resend batch send failed:", await res.text());
            }
        }

        // 5. Record idempotency row only on FULL success so failures retry next run.
        if (failed > 0 || sent === 0) {
            return new Response(
                JSON.stringify({
                    error: `Incomplete send for ${today}: ${sent} sent, ${failed} failed. Not recorded; will retry.`,
                }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        await supabase
            .from("brief_sends")
            .insert({ brief_date: today, recipient_count: sent });

        return new Response(
            JSON.stringify({ success: true, brief_date: today, recipients: sent }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
