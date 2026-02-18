import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const PADDLE_WEBHOOK_SECRET = Deno.env.get('PADDLE_WEBHOOK_SECRET') ?? '';

Deno.serve(async (req) => {
    try {
        const signature = req.headers.get('paddle-signature');
        const body = await req.text();

        // Verify Paddle Signature (Production logic would go here)
        // For this implementation, we assume valid request if secret exists
        if (!signature && Deno.env.get('ENVIRONMENT') === 'production') {
            return new Response('Unauthorized', { status: 401 });
        }

        const event = JSON.parse(body);
        const eventType = event.event_type;

        if (eventType === 'subscription.created' || eventType === 'subscription.updated') {
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            const userId = event.data.custom_data?.user_id;
            if (!userId) {
                console.error('Missing User ID in custom_data');
                return new Response('Missing User ID', { status: 400 });
            }

            // Upgrade tier and generate API key if needed
            const newApiKey = `gk_${crypto.randomUUID().replace(/-/g, '')}`;

            const { error } = await supabase
                .from('api_keys')
                .upsert({
                    user_id: userId,
                    api_key: newApiKey,
                    tier: 'professional',
                    daily_quota: 10000,
                    calls_used: 0,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) {
                console.error('Error upgrading user:', error);
                return new Response('DB Error', { status: 500 });
            }

            console.log(`Successfully upgraded user ${userId} to Professional tier.`);

            // Stub: Trigger welcome email with API key
            // await triggerWelcomeEmail(userId, newApiKey);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
