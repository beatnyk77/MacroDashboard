import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://graphiquestor.com";

function buildHtml(confirmUrl: string): string {
    return `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#2563eb;font-weight:900;margin-bottom:8px;">
                GraphiQuestor
            </div>
            <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 16px;">
                Confirm your subscription
            </h1>
            <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 24px;">
                You're one step away from receiving the <strong>Weekly Regime Digest</strong> —
                de-dollarization, liquidity &amp; energy signals synthesised from 15+ official sources,
                every Sunday.
            </p>
            <a href="${confirmUrl}"
               style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;
                      font-size:13px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;
                      padding:12px 28px;border-radius:10px;">
                Confirm subscription
            </a>
            <p style="font-size:12px;color:#94a3b8;margin-top:32px;line-height:1.6;">
                If the button doesn't work, copy this link into your browser:<br/>
                <a href="${confirmUrl}" style="color:#2563eb;">${confirmUrl}</a>
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
            <p style="font-size:11px;color:#cbd5e1;line-height:1.5;">
                If you didn't subscribe to GraphiQuestor, you can safely ignore this email.<br/>
                This link expires after one use.
            </p>
        </div>
    `;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { email, token } = await req.json() as { email: string; token: string };

        if (!email || !token) {
            return new Response(JSON.stringify({ error: "email and token are required." }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Verify the subscriber row exists (prevents token fishing from outside sources).
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { data: subscriber } = await supabase
            .from("subscribers")
            .select("id, status")
            .eq("email", email.trim().toLowerCase())
            .eq("confirm_token", token)
            .maybeSingle();

        if (!subscriber) {
            // Don't leak whether the email exists.
            return new Response(JSON.stringify({ ok: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (subscriber.status === "confirmed") {
            // Already confirmed — silently succeed (idempotent).
            return new Response(JSON.stringify({ ok: true, message: "already_confirmed" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (!resendApiKey) {
            return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured." }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const confirmUrl = `${SITE_URL}/subscribe/confirm?token=${encodeURIComponent(token)}`;
        const html = buildHtml(confirmUrl);

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: "GraphiQuestor <digest@graphiquestor.com>",
                to: email.trim().toLowerCase(),
                subject: "Confirm your Weekly Regime Digest subscription",
                html,
            }),
        });

        if (!res.ok) {
            const detail = await res.text();
            console.error("Resend error:", detail);
            return new Response(JSON.stringify({ error: "Failed to send email.", detail }), {
                status: 502,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err: unknown) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
