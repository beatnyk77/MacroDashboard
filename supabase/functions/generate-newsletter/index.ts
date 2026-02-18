import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';


const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Helpers ---

// Formatters
const fmt = {
    usd: (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(val),
    pct: (val: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(val / 100),
    num: (val: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(val),
    date: (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
};

// SVG Sparkline Generator
function generateSparkline(data: number[], color: string = '#34d399'): string {
    if (!data || data.length === 0) return '';
    const width = 100;
    const height = 25;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Polyline points
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
        <polyline points="${points}" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Data Fetcher
async function fetchMetricSeries(supabase: any, metricId: string, limit: number = 12) {
    const { data } = await supabase
        .from('metric_observations')
        .select('value, as_of_date')
        .eq('metric_id', metricId)
        .order('as_of_date', { ascending: false })
        .limit(limit);
    return data ? data.reverse() : [];
}

async function fetchLatestMetric(supabase: any, metricId: string) {
    const { data } = await supabase
        .from('metric_observations')
        .select('*')
        .eq('metric_id', metricId)
        .order('as_of_date', { ascending: false })
        .limit(2); // Get current and previous
    return data || [];
}

// --- Main Handler ---

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Fetch Data
        // ------------------------------------------------------------------
        const metricsToFetch = {
            // Liquidity & Heartbeat
            net_liquidity: 'BIS_GLOBAL_LIQUIDITY_USD_BN',
            us_10y: 'UST_10Y_YIELD',
            dxy: 'DXY_INDEX',
            gold: 'GOLD_PRICE_USD',
            oil: 'BRENT_CRUDE_PRICE',
            btc: 'BITCOIN_PRICE_USD',
            vix: 'VIX_INDEX',

            // US Macro
            us_gdp: 'US_GDP_GROWTH_YOY',
            us_cpi: 'US_CPI_YOY',
            us_unemployment: 'US_UNEMPLOYMENT',
            us_pmi: 'PMI_US_MFG', // Proxy

            // Ratios
            debt_gold: 'RATIO_DEBT_GOLD',
            m2_gold: 'RATIO_M2_GOLD',
            spx_gold: 'RATIO_SPX_GOLD',

            // De-Dollarization
            usd_share: 'GLOBAL_USD_SHARE_PCT',
            gold_share: 'GLOBAL_GOLD_SHARE_PCT',

            // Energy
            spr_level: 'OIL_SPR_LEVEL_US',

            // India
            in_gdp: 'IN_GDP_GROWTH_YOY',
            in_cpi: 'IN_CPI_YOY',
            in_10y: 'IN_10Y_YIELD', // Check if exists, else skip
            us_inr: 'USD_INR_RATE',

            // China
            cn_growth: 'CN_GDP_GROWTH_YOY',
            cn_credit: 'CN_CREDIT_IMPULSE',
            cn_cpi: 'CN_CPI_YOY',

            // Sovereign
            us_insolvency: 'US_INSOLVENCY_RATIO', // custom logic check
            policy_div: 'POLICY_DIVERGENCE_INDEX'
        };

        const data: Record<string, any> = {};
        const seriesData: Record<string, any[]> = {};

        console.log("Fetching metrics...");

        // Parallel Fetching
        const STALENESS_THRESHOLD_DAYS = 7;
        const now = new Date();
        const staleMetrics: string[] = [];

        await Promise.all(Object.entries(metricsToFetch).map(async ([key, id]) => {
            // Get snapshot (last 2)
            const snap = await fetchLatestMetric(supabaseClient, id);
            const current = snap[0]?.value;
            const date = snap[0]?.as_of_date;

            // Staleness Check
            if (date) {
                const diffDays = (now.getTime() - new Date(date).getTime()) / (1000 * 3600 * 24);
                if (diffDays > STALENESS_THRESHOLD_DAYS) {
                    staleMetrics.push(id);
                }
            } else {
                staleMetrics.push(id); // Missing data is considered stale
            }

            data[key] = {
                current: current,
                prev: snap[1]?.value,
                date: date,
                change: snap[0] && snap[1] ? snap[0].value - snap[1].value : 0,
                isStale: date ? (now.getTime() - new Date(date).getTime()) / (1000 * 3600 * 24) > STALENESS_THRESHOLD_DAYS : true
            };

            // Get series (last 25 points for sparkline)
            const series = await fetchMetricSeries(supabaseClient, id, 25);
            seriesData[key] = series.map(x => x.value);
        }));

        if (staleMetrics.length > 5) {
            console.warn(`Critical Staleness Detected: ${staleMetrics.length} metrics are overdue. Proceeding with warnings.`);
        }

        // Specific Table Fetches
        const { data: events } = await supabaseClient.from('upcoming_events')
            .select('*').gt('event_date', new Date().toISOString()).limit(5).order('event_date', { ascending: true });

        const { data: indiastress } = await supabaseClient.from('india_fiscal_stress')
            .select('*').order('date', { ascending: false }).limit(1).single();

        // --- HTML Generation ---
        // ------------------------------------------------------------------

        const colors = {
            bg: '#111111',
            card: '#1a1a1a',
            text: '#dddddd',
            muted: '#888888',
            accent: '#3b82f6', // blue
            success: '#10b981', // green
            danger: '#ef4444', // red
            border: '#333333'
        };

        const getArrow = (change: number, inverse = false) => {
            if (!change) return '';
            const isPos = change > 0;
            const isGood = inverse ? !isPos : isPos;
            const color = isGood ? colors.success : colors.danger;
            const symbol = isPos ? '↑' : '↓';
            return `<span style="color:${color}; font-weight:bold;">${symbol} ${Math.abs(change).toFixed(2)}</span>`;
        };

        const MetricRow = (label: string, key: string, format: 'usd' | 'pct' | 'num' = 'num') => {
            const metric = data[key];
            if (!metric || metric.current === undefined) return '';
            const valStr = format === 'usd' ? fmt.usd(metric.current)
                : format === 'pct' ? fmt.pct(metric.current)
                    : fmt.num(metric.current);
            const arrow = getArrow(metric.change);
            const spark = generateSparkline(seriesData[key] || [], metric.change >= 0 ? colors.success : colors.danger);

            return `
        <tr>
            <td style="padding: 8px 0; color: ${colors.muted};">${label}</td>
            <td style="padding: 8px 0; text-align: right; color: ${colors.text}; font-weight: 600;">${valStr}</td>
            <td style="padding: 8px 0; text-align: right; font-size: 0.85em;">${arrow}</td>
            <td style="padding: 8px 0; text-align: right;"><img src="${spark}" width="80" height="20" style="vertical-align:middle; opacity:0.8;" /></td>
        </tr>`;
        };

        const SectionHeader = (title: string) => `
        <tr><td colspan="4" style="padding-top: 24px; padding-bottom: 8px; border-bottom: 1px solid ${colors.border};">
            <h3 style="margin:0; color: ${colors.accent}; font-family: sans-serif; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">${title}</h3>
        </td></tr>
    `;

        // Calculate dynamic values for summary
        const liquidityStatus = (data.net_liquidity?.change || 0) > 0 ? "expanding" : "contracting";
        const regimeLabel = (data.vix?.current || 0) > 20 ? "High Volatility" : "Risk On";

        // Build Body
        const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const subject = `GraphiQuestor Regime Digest – ${currentMonth}`;
        const preview = `Global liquidity is ${liquidityStatus}. Market Regime: ${regimeLabel}. Key updates on Debt/Gold, BRICS De-Dollarization, and India Macro Pulse.`;

        const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background-color:${colors.bg}; color:${colors.text}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: ${colors.bg};">
            <!-- HEADER -->
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid ${colors.border};">
                <img src="https://graphiquestor.com/logo.png" alt="GraphiQuestor" width="48" height="48" style="margin-bottom: 10px;" />
                <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 2px; color: ${colors.text};">MACRO REGIME DIGEST</h1>
                <p style="margin: 5px 0 0 0; color: ${colors.muted}; font-size: 14px;">${currentMonth} | Institutional Intelligence</p>
            </div>

            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                
                <!-- 1. MACRO HEARTBEAT -->
                ${SectionHeader('1. Macro Heartbeat & Global Liquidity')}
                <tr><td colspan="4" style="padding: 12px 0; color: ${colors.text}; text-align: justify;">
                    Global Net Liquidity is currently <strong>${liquidityStatus}</strong>, sitting at ${fmt.usd(data.net_liquidity?.current || 0)}. 
                    Risk appetite remains ${regimeLabel === 'Risk On' ? 'robust' : 'fragile'} as implied by VIX levels.
                </td></tr>
                ${MetricRow('Net Liquidity', 'net_liquidity', 'usd')}
                ${MetricRow('US 10Y Yield', 'us_10y', 'pct')}
                ${MetricRow('DXY Index', 'dxy', 'num')}
                ${MetricRow('Gold (USD)', 'gold', 'usd')}
                ${MetricRow('Bitcoin', 'btc', 'usd')}

                <!-- 2. US MACRO PULSE -->
                ${SectionHeader('2. US Macro Pulse & Debt/Gold')}
                <tr><td colspan="4" style="padding: 12px 0; color: ${colors.text};">
                    Inflation prints are coming in at ${fmt.pct(data.us_cpi?.current || 0)} YoY. The Debt/Gold Anchor ratio is tracked closely for signs of fiscal dominance.
                </td></tr>
                ${MetricRow('US CPI YoY', 'us_cpi', 'pct')}
                ${MetricRow('Debt/Gold Ratio', 'debt_gold', 'num')}
                ${MetricRow('M2/Gold Ratio', 'm2_gold', 'num')}
                ${MetricRow('SPX/Gold Ratio', 'spx_gold', 'num')}

                <!-- 3. DE-DOLLARIZATION -->
                ${SectionHeader('3. De-Dollarization Pulse')}
                ${MetricRow('Global USD Share', 'usd_share', 'pct')}
                ${MetricRow('Global Gold Share', 'gold_share', 'pct')}
                
                <!-- 4. ENERGY -->
                ${SectionHeader('4. Energy Security')}
                ${MetricRow('Brent Crude', 'oil', 'usd')}
                ${MetricRow('US SPR Level', 'spr_level', 'num')}

                <!-- 5. INDIA PULSE -->
                ${SectionHeader('5. India Market & Macro')}
                ${MetricRow('India GDP Growth', 'in_gdp', 'pct')}
                ${MetricRow('India CPI', 'in_cpi', 'pct')}
                ${MetricRow('USD/INR', 'us_inr', 'num')}
                ${indiastress ? `
                <tr><td colspan="4" style="padding: 8px 0; font-size: 0.9em; color:${colors.muted};">
                    Fiscal Stress: <strong>${indiastress.interest_payments > 30 ? 'Elevated' : 'Stable'}</strong> 
                    (Interest/Revenue: ${indiastress.interest_payments}%)
                </td></tr>` : ''}

                <!-- 8. WATCHLIST -->
                ${SectionHeader('8. Next Month Watchlist')}
                <tr><td colspan="4" style="padding: 12px 0;">
                    <ul style="padding-left: 20px; color: ${colors.text};">
                        ${events?.map((e: any) => `
                            <li style="margin-bottom: 8px;">
                                <strong style="color: ${colors.accent};">${new Date(e.event_date).toLocaleDateString()}</strong>: 
                                ${e.event_name} (${e.country})
                            </li>
                        `).join('') || '<li>No major high-impact events scheduled.</li>'}
                    </ul>
                </td></tr>

            </table>

            <!-- FOOTER -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid ${colors.border}; text-align: center; font-size: 12px; color: ${colors.muted};">
                <p>&copy; ${new Date().getFullYear()} GraphiQuestor. All data sourced from official institutional feeds (imf, bis, fred, mospi).</p>
                <p><a href="#" style="color: ${colors.muted}; text-decoration: underline;">Unsubscribe</a> | <a href="https://graphiquestor.com" style="color: ${colors.muted}; text-decoration: underline;">View Dashboard</a></p>
            </div>
        </div>
    </body>
    </html>
    `;

        // Plain Text Version
        const text = `
    GRAPHIESTOR MACRO REGIME DIGEST - ${currentMonth}
    ${preview}

    --------------------------------------------------
    1. MACRO HEARTBEAT
    --------------------------------------------------
    Net Liquidity: ${fmt.usd(data.net_liquidity?.current || 0)} (${getArrow(data.net_liquidity?.change)})
    US 10Y Yield: ${fmt.pct(data.us_10y?.current || 0)}
    DXY Index: ${fmt.num(data.dxy?.current || 0)}
    Gold: ${fmt.usd(data.gold?.current || 0)}

    --------------------------------------------------
    2. US MACRO PULSE & DEBT/GOLD
    --------------------------------------------------
    US CPI: ${fmt.pct(data.us_cpi?.current || 0)}
    Debt/Gold Ratio: ${fmt.num(data.debt_gold?.current || 0)}

    --------------------------------------------------
    WATCHLIST
    --------------------------------------------------
    ${events?.map((e: any) => `- ${new Date(e.event_date).toLocaleDateString()}: ${e.event_name} (${e.country})`).join('\n') || 'None'}

    [Unsubscribe Link]
    `;

        // --- Save to Database ---
        const yearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        // Upsert to monthly_regime_digests
        const { error: dbError } = await supabaseClient
            .from('monthly_regime_digests')
            .upsert({
                year_month: yearMonth,
                html_content: html.replace(/\s+/g, ' ').trim(),
                plain_text: text,
                subject_line: subject,
                generated_at: new Date().toISOString()
            }, { onConflict: 'year_month' });

        if (dbError) {
            console.error("Failed to save to DB:", dbError);
            // We don't fail the request, just log it. Data is still returned.
        }

        return new Response(JSON.stringify({
            subject,
            html: html.replace(/\s+/g, ' ').trim(), // Minify roughly
            text
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
