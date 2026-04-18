import { SupabaseClient } from '@supabase/supabase-js';

interface Observation {
    metric_id: string
    as_of_date: string
    value: number
}

export async function processUST(supabase: SupabaseClient) {
    try {
        const { data: sourceData, error: sourceError } = await supabase
            .from('data_sources')
            .select('id')
            .eq('name', 'FiscalData')
            .single()

        if (sourceError || !sourceData) {
            throw new Error('FiscalData data source not found')
        }
        const sourceId = sourceData.id

        const { data: metrics, error: metricsError } = await supabase
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
                    const rawVal = parseFloat(obs.tot_pub_debt_out_amt)
                    pushObs('UST_DEBT_TOTAL', obs.record_date, rawVal)
                    // Harmonized metric for charts: Trillions of USD
                    pushObs('US_DEBT_USD_TN', obs.record_date, rawVal / 1000000000000)
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
        } catch (e: any) { results.push({ endpoint: 'debt_to_penny', status: 'error', error: String(e) }) }

        // B. MSPD Table 1
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
                        const val = parseFloat(obs.debt_held_public_mil_amt)
                        if (!isNaN(val)) pushObs(metricId, obs.record_date, val * 1000000)
                    }
                })
                results.push({ endpoint: 'mspd_table_1', status: 'success' })
            }
        } catch (e: any) { results.push({ endpoint: 'mspd_table_1', status: 'error', error: String(e) }) }

        if (observations.length > 0) {
            const uniqueObs = Array.from(new Map(observations.map(o => [`${o.metric_id}-${o.as_of_date}`, o])).values())
            const { error: upsertError } = await supabase.from('metric_observations').upsert(uniqueObs, { onConflict: 'metric_id, as_of_date' })
            if (upsertError) throw upsertError
            return { success: true, count: uniqueObs.length, details: results }
        }

        return { success: true, count: 0, details: results }
    } catch (error: any) {
        return { success: false, error: error.message || String(error) }
    }
}
