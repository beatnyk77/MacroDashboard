import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://debdriyzfcwvgrhzzzre.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ0NzM5MCwiZXhwIjoyMDg1MDIzMzkwfQ.xODd81IhdGOhR94OwU8JmUeIZzUU9FF81lFxHKa-pd4";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const metricIds = [
        'FED_FUNDS_RATE',
        'IN_REPO_RATE',
        'USD_INR_RATE',
        'POLICY_DIVERGENCE_INDEX',
        'FLOW_TENSION_INDEX',
        'USD_CNY_RATE',
        'USD_BRL_RATE',
        'USD_MXN_RATE',
        'USD_TWD_RATE',
        'COMPOSITE_PRESSURE_INDEX',
        'EM_RELATIVE_PRESSURE'
    ];

    // Updated Logic: DESC + Limit 5000
    const { data, error } = await supabase
        .from('metric_observations')
        .select('metric_id, as_of_date, value')
        .in('metric_id', metricIds)
        .order('as_of_date', { ascending: false })
        .limit(5000);

    if (error) {
        console.error(error);
        return;
    }

    const pivoted = {};
    const keyMap = {
        'FED_FUNDS_RATE': 'fed_rate',
        'IN_REPO_RATE': 'rbi_rate',
        'USD_INR_RATE': 'usd_inr',
        'POLICY_DIVERGENCE_INDEX': 'divergence',
        'FLOW_TENSION_INDEX': 'tension',
        'USD_CNY_RATE': 'usd_cny',
        'USD_BRL_RATE': 'usd_brl',
        'USD_MXN_RATE': 'usd_mxn',
        'USD_TWD_RATE': 'usd_twd',
        'COMPOSITE_PRESSURE_INDEX': 'composite_pressure',
        'EM_RELATIVE_PRESSURE': 'em_relative_pressure'
    };

    data.forEach(obs => {
        const key = keyMap[obs.metric_id];
        if (!key) return;

        if (!pivoted[obs.as_of_date]) {
            pivoted[obs.as_of_date] = { date: obs.as_of_date };
        }

        pivoted[obs.as_of_date][key] = obs.value;
        
        if (key === 'composite_pressure') {
            pivoted[obs.as_of_date]['pressure'] = obs.value;
        }
    });

    // reverse() logic mirroring the hook
    const result = Object.values(pivoted).sort((a, b) => a.date.localeCompare(b.date));
    
    console.log(`Total pivoted days: ${result.length}`);
    console.log(`Days with composite_pressure: ${result.filter(r => r.composite_pressure !== undefined).length}`);
    if (result.length > 0) {
        console.log("Earliest row in fetch:", JSON.stringify(result[0], null, 2));
        console.log("Latest row in fetch:", JSON.stringify(result[result.length - 1], null, 2));
    }
}

check();
