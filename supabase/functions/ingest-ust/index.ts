import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Observation {
    metric_id: string
    as_of_date: string
    value: number
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

        const { data: sourceData, error: sourceError } = await supabaseClient
            .from('data_sources')
            .select('id')
            .eq('name', 'FiscalData')
            .single()

        if (sourceError || !sourceData) {
            throw new Error('FiscalData data source not found')
        }
        const sourceId = sourceData.id

        const { data: metrics, error: metricsError } = await supabaseClient
            .from('metrics')
            .select('id')
            .eq('source_id', sourceId)
            .eq('is_active', true)

        if (metricsError) throw metricsError
        const activeMetricIds = new Set(metrics?.map(m => m.id) || [])

        const results = []
        const observations: Observation[] = []

        const pushObs = (metricId: string, date: string, val: any) => {
            if (!activeMetricIds.has(metricId)) return
            const num = typeof val === 'string' ? parseFloat(val) : val
            if (num != null && !isNaN(num)) {
                observations.push({
                    metric_id: metricId,
                    as_of_date: date,
                    value: num
                })
            }
        }

        // A. Debt to the Penny (Daily)
        const debtUrl = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=200'
        try {
            const resp = await fetch(debtUrl)
            const json = await resp.json()
            const data = json.data as any[]
            if (data && data.length > 0) {
                data.forEach(obs => {
                    pushObs('UST_DEBT_TOTAL', obs.record_date, obs.tot_pub_debt_out_amt)
                })

                const monthlyRecords: Record<string, { date: string, value: number }> = {}
                data.forEach(obs => {
                    const monthKey = obs.record_date.substring(0, 7)
                    const val = parseFloat(obs.tot_pub_debt_out_amt)
                    if (!isNaN(val)) {
                        if (!monthlyRecords[monthKey] || obs.record_date > monthlyRecords[monthKey].date) {
                            monthlyRecords[monthKey] = { date: obs.record_date, value: val }
                        }
                    }
                })

                const sortedMonths = Object.keys(monthlyRecords).sort()
                for (let i = 1; i < sortedMonths.length; i++) {
                    const curr = monthlyRecords[sortedMonths[i]]
                    const prev = monthlyRecords[sortedMonths[i - 1]]
                    pushObs('UST_NET_ISSUANCE_M', curr.date, curr.value - prev.value)
                }
                results.push({ endpoint: 'debt_to_penny', status: 'success' })
            }
        } catch (e) { results.push({ endpoint: 'debt_to_penny', status: 'error', error: String(e) }) }

        // B. MSPD Table 1 (Tenor Breakdown)
        const mspd1Url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/debt/mspd/mspd_table_1?filter=security_type_desc:eq:Marketable&sort=-record_date&page[size]=100'
        try {
            const resp = await fetch(mspd1Url)
            const json = await resp.json()
            const data = json.data as any[]
            if (data) {
                data.forEach(obs => {
                    let metricId = ''
                    if (obs.security_class_desc === 'Bills') metricId = 'UST_BILLS_OUTSTANDING'
                    else if (obs.security_class_desc === 'Notes') metricId = 'UST_NOTES_OUTSTANDING'
                    else if (obs.security_class_desc === 'Bonds') metricId = 'UST_BONDS_OUTSTANDING'

                    if (metricId) {
                        // Values are in Millions, convert to absolute dollars
                        const val = parseFloat(obs.debt_held_public_mil_amt)
                        if (!isNaN(val)) pushObs(metricId, obs.record_date, val * 1000000)
                    }
                })
                results.push({ endpoint: 'mspd_table_1', status: 'success' })
            }
        } catch (e) { results.push({ endpoint: 'mspd_table_1', status: 'error', error: String(e) }) }

        // C. MSPD Table 3 Market (Maturity Profile)
        const mspd3Url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/debt/mspd/mspd_table_3_market?sort=-record_date&page[size]=5000'
        try {
            const resp = await fetch(mspd3Url)
            const json = await resp.json()
            const data = json.data as any[]
            if (data) {
                const byDate: Record<string, any[]> = {}
                data.forEach(obs => {
                    if (!byDate[obs.record_date]) byDate[obs.record_date] = []
                    byDate[obs.record_date].push(obs)
                })

                Object.entries(byDate).forEach(([date, records]) => {
                    const recordDate = new Date(date)
                    let totalMarketable = 0
                    let maturing6M = 0
                    let maturing12M = 0

                    records.forEach(r => {
                        // Use issued_amt + inflation_adj_amt - redeemed_amt for individual securities
                        // Filter out total lines (which have maturity_date == 'null' or null)
                        if (!r.maturity_date || r.maturity_date === 'null') return

                        const issued = parseFloat(r.issued_amt) || 0
                        const inflation = parseFloat(r.inflation_adj_amt) || 0
                        const redeemed = parseFloat(r.redeemed_amt) || 0

                        const amt = issued + inflation + redeemed // Redeemed is often negative in some datasets? 
                        // Actually, looking at sample: redeemed_amt is negative in total line, 0 in individual?
                        // Let's be safe: many individuallines have outstanding_amt null but issued_amt non-null.

                        if (issued <= 0) return

                        totalMarketable += issued + inflation

                        const matDate = new Date(r.maturity_date)
                        const diffDays = (matDate.getTime() - recordDate.getTime()) / (1000 * 3600 * 24)

                        if (diffDays >= 0) {
                            if (diffDays <= 180) maturing6M += (issued + inflation)
                            if (diffDays <= 365) maturing12M += (issued + inflation)
                        }
                    })

                    if (totalMarketable > 0) {
                        pushObs('UST_MATURITY_6M_PCT', date, (maturing6M / totalMarketable) * 100)
                        pushObs('UST_MATURITY_12M_PCT', date, (maturing12M / totalMarketable) * 100)
                    }
                })
                results.push({ endpoint: 'mspd_table_3_market', status: 'success' })
            }
        } catch (e) { results.push({ endpoint: 'mspd_table_3_market', status: 'error', error: String(e) }) }

        if (observations.length > 0) {
            const uniqueObs = Array.from(new Map(observations.map(o => [`${o.metric_id}-${o.as_of_date}`, o])).values())
            const { error: upsertError } = await supabaseClient.from('metric_observations').upsert(uniqueObs, { onConflict: 'metric_id, as_of_date' })
            if (upsertError) throw upsertError
            results.push({ status: 'upsert_success', count: uniqueObs.length })
        }

        return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || String(error) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }
})
