/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

/**
 * send-weekly-digest
 * Scheduled (Sundays 13:00 UTC). Detects the most recent weekly_regime_digests
 * edition; if it hasn't already been emailed (digest_sends log), sends it to all
 * confirmed subscribers via Resend and records the send. Idempotent — safe to
 * re-run; it will no-op once an edition has gone out.
 */

interface WeeklyDigest {
    week_ending_date: string;
    executive_summary: string;
    holistic_narrative: string;
    what_to_watch: string[];
}

function buildHtml(digest: WeeklyDigest): string {
    const watch = (digest.what_to_watch ?? [])
        .map((w) => `<li style="margin-bottom:8px;color:#475569;">${w}</li>`)
        .join("");
    return `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;">
            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#2563eb;font-weight:900;margin-bottom:8px;">Weekly Regime Digest</div>
            <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 16px;">Week ending ${digest.week_ending_date}</h1>
            <p style="font-size:15px;line-height:1.6;color:#334155;">${digest.executive_summary}</p>
            <p style="font-size:14px;line-height:1.6;color:#475569;">${digest.holistic_narrative}</p>
            ${watch ? `<h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:#0f172a;">What to Watch</h3><ul style="padding-left:18px;font-size:14px;">${watch}</ul>` : ""}
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
            <p style="font-size:12px;color:#94a3b8;">
                You're receiving this because you confirmed your subscription at graphiquestor.com.
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

        // 1. Latest weekly digest edition.
        const { data: digest, error: digestError } = await supabase
            .from("weekly_regime_digests")
            .select("week_ending_date, executive_summary, holistic_narrative, what_to_watch")
            .order("week_ending_date", { ascending: false })
            .limit(1)
            .single();

        if (digestError && digestError.code !== "PGRST116") throw digestError;
        if (!digest) {
            return new Response(JSON.stringify({ success: true, message: "No digest available." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 2. Idempotency — has this edition already been sent?
        const { data: alreadySent } = await supabase
            .from("digest_sends")
            .select("week_ending_date")
            .eq("week_ending_date", digest.week_ending_date)
            .maybeSingle();

        if (alreadySent) {
            return new Response(
                JSON.stringify({ success: true, message: `Digest ${digest.week_ending_date} already sent.` }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. Confirmed subscribers.
        const { data: subscribers, error: subError } = await supabase
            .from("subscribers")
            .select("email")
            .eq("status", "confirmed");

        if (subError) throw subError;

        const recipients = (subscribers ?? []).map((s: { email: string }) => s.email);
        if (recipients.length === 0) {
            return new Response(JSON.stringify({ success: true, message: "No confirmed subscribers yet." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 4. Send via Resend.
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (!resendApiKey) {
            return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured." }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const html = buildHtml(digest as WeeklyDigest);
        const subject = `Weekly Regime Digest — week ending ${digest.week_ending_date}`;

        // Send in chunks to keep each request small; BCC the list per chunk.
        const CHUNK = 50;
        let sent = 0;
        let failed = 0;
        for (let i = 0; i < recipients.length; i += CHUNK) {
            const chunk = recipients.slice(i, i + CHUNK);
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${resendApiKey}`,
                },
                body: JSON.stringify({
                    from: "GraphiQuestor <digest@resend.dev>",
                    to: "digest@resend.dev",
                    bcc: chunk,
                    subject,
                    html,
                }),
            });
            if (res.ok) {
                sent += chunk.length;
            } else {
                failed += chunk.length;
                console.error("Resend send failed:", await res.text());
            }
        }

        // 5. Only mark the edition sent on FULL success. If any chunk failed, do
        //    not write the idempotency row and return an error so the scheduler
        //    retries on the next run (rather than silently dropping recipients).
        if (failed > 0 || sent === 0) {
            return new Response(
                JSON.stringify({
                    error: `Incomplete send for ${digest.week_ending_date}: ${sent} sent, ${failed} failed. Not recorded; will retry.`,
                }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        await supabase
            .from("digest_sends")
            .insert({ week_ending_date: digest.week_ending_date, recipient_count: sent });

        return new Response(
            JSON.stringify({ success: true, week_ending_date: digest.week_ending_date, recipients: sent }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
