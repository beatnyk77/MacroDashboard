import { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    // Expected path: /api/v1/metrics/:slug/export
    // Parts: ['', 'api', 'v1', 'metrics', ':slug', 'export']
    const slug = pathParts[4];
    
    let format = url.searchParams.get('format') || 'json';
    format = format.toLowerCase();

    if (!slug) {
        return new Response(JSON.stringify({ error: 'Metric slug is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL') || Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
        return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/metric_observations?metric_id=eq.${slug}&select=as_of_date,value&order=as_of_date.desc`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch from Supabase: ${response.statusText}`);
        }

        const data = await response.json();

        if (format === 'csv') {
            const lines = ['as_of_date,value'];
            for (const row of data) {
                lines.push(`${row.as_of_date},${row.value}`);
            }
            return new Response(lines.join('\n'), {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${slug}-export.csv"`,
                },
            });
        }

        return new Response(JSON.stringify({ metricId: slug, data }), {
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (err: unknown) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
