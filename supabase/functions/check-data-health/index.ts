import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StaleMetric {
    metric_id: string;
    metric_name: string;
    days_since_update: number;
    status: string;
}

interface FailedIngestion {
    function_name: string;
    error_message: string;
    start_time: string;
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Check for stale metrics (Based on computed status)
        const { data: staleMetrics, error: staleError } = await supabaseClient
            .from('vw_data_staleness_monitor')
            .select('metric_id, metric_name, days_since_update, status')
            .neq('status', 'FRESH')

        if (staleError) throw staleError

        // 2. Check for failed ingestions in the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: failedIngestions, error: ingestError } = await supabaseClient
            .from('vw_latest_ingestions')
            .select('function_name, error_message, start_time')
            .eq('status', 'failed')
            .gte('start_time', twentyFourHoursAgo)

        if (ingestError) throw ingestError

        const totalIssues = (staleMetrics?.length ?? 0) + (failedIngestions?.length ?? 0)
        let message = 'All systems healthy'
        let status = 200

        if (totalIssues > 10) {
            status = 503
            message = `Critical Health Alert: Found ${totalIssues} issues (${staleMetrics?.length} stale, ${failedIngestions?.length} failed).`

            // 3. Send Email Alert via Resend
            const resendApiKey = Deno.env.get('RESEND_API_KEY')
            if (resendApiKey) {
                console.log('Sending email alert via Resend...')
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${resendApiKey}`
                    },
                    body: JSON.stringify({
                        from: 'GraphiQuestor Monitor <alerts@resend.dev>',
                        to: ['graphiquestor@gmail.com'],
                        subject: '⚠️ GraphiQuestor: Critical Data Health Alert',
                        html: `
                            <h1>Data Pipeline Health Alert</h1>
                            <p><strong>Total Issues:</strong> ${totalIssues}</p>
                            <hr/>
                            <h3>Stale Metrics (>30 days): ${staleMetrics?.length ?? 0}</h3>
                            <ul>
                                ${(staleMetrics as StaleMetric[])?.map(m => `<li>${m.metric_name} (${m.metric_id}): ${m.days_since_update} days since update</li>`).join('')}
                            </ul>
                            <h3>Failed Ingestions (Last 24h): ${failedIngestions?.length ?? 0}</h3>
                            <ul>
                                ${(failedIngestions as FailedIngestion[])?.map(f => `<li>${f.function_name}: ${f.error_message} (${new Date(f.start_time).toLocaleString()})</li>`).join('')}
                            </ul>
                            <p><a href="https://graphiquestor.com">View Dashboard</a></p>
                        `
                    })
                })

                if (!res.ok) {
                    const err = await res.text()
                    console.error('Failed to send email:', err)
                } else {
                    console.log('Email alert sent successfully.')
                }
            } else {
                console.warn('RESEND_API_KEY not found. Skipping email alert.')
            }
        }

        return new Response(JSON.stringify({
            status: status === 200 ? 'ok' : 'error',
            message,
            issues: {
                stale_count: staleMetrics?.length ?? 0,
                failure_count: failedIngestions?.length ?? 0,
                total: totalIssues
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('Health check failed:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
