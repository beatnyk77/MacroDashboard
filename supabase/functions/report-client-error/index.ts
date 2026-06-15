import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ErrorBody {
  message?: string;
  stack?: string;
  component_stack?: string;
  route?: string;
  boundary?: string;
  user_agent?: string;
}

function hashKey(parts: (string | undefined)[]): string {
  const key = parts.filter(Boolean).join('|');
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h << 5) - h + key.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as ErrorBody;
    const message = (body.message ?? 'Unknown error').slice(0, 500);

    if (!message.trim()) {
      return new Response(JSON.stringify({ ok: false, error: 'message required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const errorHash = hashKey([message, body.boundary, body.route]);

    const { error } = await supabase.from('client_error_reports').insert({
      error_hash: errorHash,
      message,
      stack: body.stack?.slice(0, 2000) ?? null,
      component_stack: body.component_stack?.slice(0, 2000) ?? null,
      route: body.route?.slice(0, 256) ?? null,
      boundary: body.boundary?.slice(0, 128) ?? null,
      user_agent: body.user_agent?.slice(0, 256) ?? null,
    });

    if (error) {
      console.error('[report-client-error] insert failed:', error.message);
      return new Response(JSON.stringify({ ok: false, error: 'persist failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[report-client-error]', err);
    return new Response(JSON.stringify({ ok: false, error: 'invalid payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});