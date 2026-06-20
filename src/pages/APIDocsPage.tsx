import { useState, useEffect, useRef } from 'react';
import { SEOManager } from '@/components/SEOManager';
import { Link } from 'react-router-dom';

// ─── Nav structure ────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
    { id: 'overview', label: 'Overview' },
    { id: 'endpoints', label: 'Endpoints', sub: [
        { id: 'ep-metrics',      label: 'GET /metrics' },
        { id: 'ep-observations', label: 'GET /observations' },
        { id: 'ep-regime',       label: 'GET /regime/current' },
        { id: 'ep-composite',    label: 'GET /composite-scores' },
        { id: 'ep-india',        label: 'GET /india/summary' },
        { id: 'ep-events',       label: 'GET /events' },
    ]},
    { id: 'metric-reference', label: 'Metric IDs' },
    { id: 'use-cases', label: 'Use Cases' },
    { id: 'rate-limits', label: 'Rate Limits' },
];

// ─── Metric reference (40 rows) ───────────────────────────────────────────────

const METRIC_REFERENCE: { id: string; label: string; source: string }[] = [
    { id: 'india_rbi_rate',              label: 'RBI Policy Rate',               source: 'Reserve Bank of India' },
    { id: 'india_cpi_yoy',              label: 'India CPI YoY',                 source: 'MOSPI / FRED' },
    { id: 'india_gdp_yoy',              label: 'India GDP Growth YoY',          source: 'World Bank' },
    { id: 'india_fx_reserves_usd_bn',   label: 'India FX Reserves (USD bn)',    source: 'RBI DBIE' },
    { id: 'india_cd_ratio',             label: 'Credit-Deposit Ratio',          source: 'RBI' },
    { id: 'india_mfg_pmi',              label: 'India Manufacturing PMI',       source: 'S&P Global' },
    { id: 'india_gst_collections',      label: 'GST Collections (₹ tn)',        source: 'Ministry of Finance' },
    { id: 'india_inr_usd',              label: 'INR/USD Exchange Rate',         source: 'RBI / Alpha Vantage' },
    { id: 'india_10y_yield',            label: 'India 10Y G-Sec Yield',         source: 'RBI' },
    { id: 'india_fiscal_deficit_gdp',   label: 'Fiscal Deficit (% GDP)',        source: 'CGA / RBI' },
    { id: 'india_macro_composite',      label: 'India Macro Score',             source: 'GQ Proprietary' },
    { id: 'india_vix',                  label: 'India VIX',                     source: 'NSE' },
    { id: 'us_fed_funds_rate',          label: 'Fed Funds Rate',                source: 'FRED / Federal Reserve' },
    { id: 'us_cpi_yoy',                label: 'US CPI YoY',                    source: 'BLS / FRED' },
    { id: 'us_10y_yield',              label: 'US 10Y Treasury Yield',         source: 'FRED' },
    { id: 'us_m2_yoy',                 label: 'US M2 Money Supply YoY',        source: 'FRED' },
    { id: 'us_dxy_index',              label: 'DXY Dollar Index',              source: 'Alpha Vantage' },
    { id: 'global_net_liquidity',       label: 'Global Net Liquidity',          source: 'GQ Composite' },
    { id: 'gq_net_liquidity_zscore',    label: 'Net Liquidity Z-Score',         source: 'GQ Proprietary' },
    { id: 'gq_dedollarization_index',   label: 'De-Dollarization Index',        source: 'GQ Proprietary' },
    { id: 'g20_sovereign_stress_avg',   label: 'G20 Sovereign Stress',          source: 'GQ Composite' },
    { id: 'china_pmi_mfg',             label: 'China Manufacturing PMI',       source: 'NBS' },
    { id: 'china_fx_reserves_usd_bn',   label: 'China FX Reserves (USD bn)',    source: 'SAFE' },
    { id: 'gold_spot_usd',             label: 'Gold Spot Price (USD)',          source: 'Alpha Vantage' },
    { id: 'brent_crude_usd',           label: 'Brent Crude Oil (USD)',         source: 'EIA' },
    { id: 'PMI_US_MFG',               label: 'US Manufacturing PMI',          source: 'ISM / S&P Global' },
    { id: 'PMI_US_SERVICES',           label: 'US Services PMI',               source: 'ISM / S&P Global' },
    { id: 'INFLATION_HEADLINE_YOY',    label: 'Headline Inflation (YoY %)',    source: 'BLS / FRED' },
    { id: 'INFLATION_CORE_YOY',        label: 'Core Inflation (YoY %)',        source: 'BLS / FRED' },
    { id: 'INFLATION_BREAKEVEN_5Y',    label: '5Y Breakeven Inflation (%)',    source: 'FRED' },
    { id: 'LABOR_UNEMPLOYMENT_RATE',   label: 'Unemployment Rate (%)',         source: 'BLS / FRED' },
    { id: 'LABOR_WAGE_GROWTH_YOY',     label: 'Wage Growth (YoY %)',           source: 'BLS / FRED' },
    { id: 'LABOR_VACANCIES_JOLTS',     label: 'Job Vacancies (JOLTS)',         source: 'BLS / FRED' },
    { id: 'CAPITAL_FROM_TREASURIES_BN',label: 'Capital from Treasuries (bn USD)', source: 'GQ Composite' },
    { id: 'CAPITAL_FROM_GOLD_ETF_BN',  label: 'Capital from Gold ETFs (bn USD)', source: 'GQ Composite' },
    { id: 'BOP_CURRENT_ACCOUNT_GDP',   label: 'Current Account (% GDP)',       source: 'World Bank' },
    { id: 'BOP_RESERVES_MONTHS',       label: 'FX Reserves (months import cover)', source: 'World Bank' },
    { id: 'HOUSING_PRICE_INDEX',       label: 'Housing Price Index',           source: 'S&P Case-Shiller' },
    { id: 'HOUSING_MORTGAGE_RATE_30Y', label: '30Y Mortgage Rate (%)',         source: 'FRED' },
    { id: 'ACTIVITY_REGIME_SCORE',     label: 'Activity Regime Score',         source: 'GQ Composite' },
];

// ─── JSON syntax highlighter ──────────────────────────────────────────────────

function syntaxHighlight(raw: string): string {
    const escaped = raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return escaped.replace(
        /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|true|false|null|-?\d+(?:\.\d*)?(?:[eE][-+]?\d+)?)/g,
        (match) => {
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    // JSON key
                    return `<span style="color:#93c5fd">${match}</span>`;
                }
                // String value
                return `<span style="color:#6ee7b7">${match}</span>`;
            }
            if (/true|false/.test(match)) return `<span style="color:#c084fc">${match}</span>`;
            if (/null/.test(match)) return `<span style="color:#94a3b8">${match}</span>`;
            // Number
            return `<span style="color:#fcd34d">${match}</span>`;
        }
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
    return (
        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            style={{ fontFamily: "'IBM Plex Mono', 'Fira Code', monospace" }}>
            {method}
        </span>
    );
}

function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const highlighted = lang === 'json' ? syntaxHighlight(code) : code;

    return (
        <div className="relative group rounded-lg border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {lang}
                </span>
                <button
                    onClick={handleCopy}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
                >
                    {copied ? 'COPIED' : 'COPY'}
                </button>
            </div>
            <pre
                className="p-4 overflow-x-auto text-[13px] leading-relaxed"
                style={{
                    background: 'rgb(2 6 23)',
                    fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
                    tabSize: 2,
                    color: '#e2e8f0',
                }}
                dangerouslySetInnerHTML={{ __html: highlighted }}
            />
        </div>
    );
}

interface Param {
    name: string;
    type: string;
    required: boolean;
    description: string;
}

function ParamTable({ params }: { params: Param[] }) {
    return (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60">
                        <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Type</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Required</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Description</th>
                    </tr>
                </thead>
                <tbody>
                    {params.map((p, i) => (
                        <tr key={p.name} className={i % 2 === 0 ? 'bg-slate-950/40' : 'bg-transparent'}>
                            <td className="px-4 py-2.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#93c5fd', fontSize: 12 }}>{p.name}</td>
                            <td className="px-4 py-2.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#fcd34d', fontSize: 12 }}>{p.type}</td>
                            <td className="px-4 py-2.5">
                                {p.required
                                    ? <span className="text-[10px] font-bold text-rose-400 uppercase">required</span>
                                    : <span className="text-[10px] font-bold text-slate-500 uppercase">optional</span>}
                            </td>
                            <td className="px-4 py-2.5 text-slate-400 text-xs">{p.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function SectionAnchor({ id }: { id: string }) {
    return <span id={id} className="block" style={{ scrollMarginTop: 96 }} />;
}

function EndpointHeader({ id, method, path, description }: {
    id: string; method: string; path: string; description: string;
}) {
    return (
        <div className="mb-6">
            <SectionAnchor id={id} />
            <div className="flex flex-wrap items-center gap-3 mb-2">
                <MethodBadge method={method} />
                <code
                    className="text-slate-100 text-sm font-medium"
                    style={{ fontFamily: "'IBM Plex Mono', 'Fira Code', monospace" }}>
                    {path}
                </code>
            </div>
            <p className="text-slate-400 text-sm">{description}</p>
        </div>
    );
}

function Divider() {
    return <div className="border-t border-slate-800/60 my-12" />;
}

function Note({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm text-blue-300/80">
            <span className="shrink-0 text-blue-400 font-bold text-xs uppercase tracking-widest mt-0.5">Note</span>
            <div>{children}</div>
        </div>
    );
}

function ProprietaryBadge() {
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 text-violet-400">
            ◆ GQ SIGNAL
        </span>
    );
}

// ─── Section IDs (static — safe to declare outside component) ────────────────

const ALL_SECTION_IDS = [
    'overview', 'endpoints',
    'ep-metrics', 'ep-observations', 'ep-regime', 'ep-composite', 'ep-india', 'ep-events',
    'metric-reference', 'use-cases', 'rate-limits',
];

// ─── Main Component ───────────────────────────────────────────────────────────

export const APIDocsPage = () => {
    const [activeId, setActiveId] = useState('overview');
    const [metricFilter, setMetricFilter] = useState('');
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        observerRef.current = new IntersectionObserver(
            (entries) => {
                // Pick the topmost visible section
                const visible = entries.filter(e => e.isIntersecting);
                if (visible.length === 0) return;
                const top = visible.reduce((a, b) =>
                    a.boundingClientRect.top < b.boundingClientRect.top ? a : b
                );
                setActiveId(top.target.id);
            },
            { rootMargin: '-10% 0px -80% 0px' }
        );

        ALL_SECTION_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) observerRef.current!.observe(el);
        });

        return () => observerRef.current?.disconnect();
    }, []);

    const filteredMetrics = METRIC_REFERENCE.filter(m =>
        !metricFilter ||
        m.id.toLowerCase().includes(metricFilter.toLowerCase()) ||
        m.label.toLowerCase().includes(metricFilter.toLowerCase()) ||
        m.source.toLowerCase().includes(metricFilter.toLowerCase())
    );

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // ── Mobile top nav ──
    const mobileNavItems = [
        { id: 'overview', label: 'Overview' },
        { id: 'endpoints', label: 'Endpoints' },
        { id: 'metric-reference', label: 'Metrics' },
        { id: 'use-cases', label: 'Use Cases' },
        { id: 'rate-limits', label: 'Rate Limits' },
    ];

    return (
        <div className="min-h-screen text-slate-100">
            <SEOManager
                title="API Documentation — GraphiQuestor"
                description="Complete REST API reference for GraphiQuestor. 270+ institutional macro metrics, time-series history, regime signals, and composite scores. Integration guide for quantitative teams."
                keywords={['GraphiQuestor API', 'Macro Data API', 'Institutional Macro REST API', 'India macro data API', 'regime signal API']}
            />

            {/* Mobile sticky top nav */}
            <div className="lg:hidden sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 overflow-x-auto">
                <div className="flex gap-1 px-4 py-2 whitespace-nowrap">
                    {mobileNavItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => scrollTo(item.id)}
                            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-colors ${
                                activeId === item.id
                                    ? 'bg-blue-500/15 text-blue-400'
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:flex lg:gap-10">

                {/* Desktop sticky left nav */}
                <aside className="hidden lg:block w-52 shrink-0">
                    <div className="sticky top-24 space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3 px-3">
                            Documentation
                        </p>
                        {NAV_SECTIONS.map(section => (
                            <div key={section.id}>
                                <button
                                    onClick={() => scrollTo(section.id)}
                                    className={`w-full text-left px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                                        activeId === section.id
                                            ? 'bg-blue-500/10 text-blue-400'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                    }`}
                                >
                                    {section.label}
                                </button>
                                {section.sub && (
                                    <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-800 pl-3">
                                        {section.sub.map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => scrollTo(sub.id)}
                                                className={`w-full text-left py-1 text-[11px] font-medium transition-colors truncate block ${
                                                    activeId === sub.id
                                                        ? 'text-emerald-400'
                                                        : 'text-slate-500 hover:text-slate-300'
                                                }`}
                                                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="pt-6 px-3">
                            <Link
                                to="/api-access"
                                className="block text-center py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
                            >
                                Get API Key
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 min-w-0 max-w-3xl">

                    {/* ══════════════════════════════════════════════
                        SECTION 1 — OVERVIEW
                    ══════════════════════════════════════════════ */}
                    <SectionAnchor id="overview" />
                    <div className="mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                            GraphiQuestor REST API
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3 leading-tight">
                        Institutional Macro Intelligence
                    </h1>
                    <p className="text-slate-400 text-base mb-10 max-w-2xl">
                        270+ macro metrics. Time-series history. Regime signals and proprietary composite scores —
                        with full methodology and provenance for every data point.
                    </p>

                    {/* Authentication */}
                    <div className="mb-8">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Authentication</h2>
                        <CodeBlock lang="http" code={`Authorization: Bearer YOUR_API_KEY`} />
                        <div className="mt-3 text-xs text-slate-500 space-y-1">
                            <p>API keys are available via the <Link to="/api-access" className="text-blue-400 hover:underline">API Access page</Link>.</p>
                            <p>Free tier: <span className="text-slate-300">100 requests/day</span> · Institutional tier: <a href="mailto:api@graphiquestor.com" className="text-blue-400 hover:underline">api@graphiquestor.com</a></p>
                        </div>
                    </div>

                    {/* Base URL */}
                    <div className="mb-12">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Base URL</h2>
                        <CodeBlock lang="url" code={`https://graphiquestor.com/api/v1`} />
                        <p className="mt-2 text-xs text-slate-500">All endpoints are HTTPS-only. Responses are JSON with UTF-8 encoding.</p>
                    </div>

                    <Divider />

                    {/* ══════════════════════════════════════════════
                        SECTION 2 — ENDPOINTS
                    ══════════════════════════════════════════════ */}
                    <SectionAnchor id="endpoints" />
                    <h2 className="text-xl font-black uppercase tracking-tight text-white mb-10">Endpoints</h2>

                    {/* ── EP 1: /metrics ── */}
                    <div className="mb-12">
                        <EndpointHeader
                            id="ep-metrics"
                            method="GET"
                            path="/api/v1/metrics"
                            description="List all available metrics with latest values, staleness status, and metadata."
                        />
                        <div className="space-y-5">
                            <ParamTable params={[
                                { name: 'country',  type: 'string', required: false, description: 'ISO 3166-1 alpha-2 code (e.g. IN, US, CN)' },
                                { name: 'category', type: 'string', required: false, description: 'Metric category — monetary, fiscal, external, activity' },
                                { name: 'limit',    type: 'integer',required: false, description: 'Number of results. Default 50, max 270' },
                            ]} />
                            <CodeBlock lang="bash" code={`curl -H "Authorization: Bearer $GQ_API_KEY" \\
  "https://graphiquestor.com/api/v1/metrics?country=IN"`} />
                            <CodeBlock lang="json" code={`{
  "data": [
    {
      "metric_id": "india_rbi_rate",
      "label": "RBI Policy Rate",
      "value": 6.50,
      "unit": "%",
      "as_of": "2026-06-03T00:00:00Z",
      "staleness": "fresh",
      "source": "Reserve Bank of India",
      "methodology_url": "/methods/india-credit-cycle-clock"
    }
  ],
  "total": 42,
  "country": "IN"
}`} />
                        </div>
                    </div>

                    <Divider />

                    {/* ── EP 2: /observations ── */}
                    <div className="mb-12">
                        <EndpointHeader
                            id="ep-observations"
                            method="GET"
                            path="/api/v1/observations"
                            description="Time-series history for a specific metric. Up to 5 years of daily observations."
                        />
                        <div className="space-y-5">
                            <ParamTable params={[
                                { name: 'metric_id', type: 'string',  required: true,  description: 'Metric identifier from the /metrics endpoint' },
                                { name: 'from',      type: 'date',    required: false, description: 'ISO 8601 start date. Default: 90 days ago' },
                                { name: 'to',        type: 'date',    required: false, description: 'ISO 8601 end date. Default: today' },
                                { name: 'limit',     type: 'integer', required: false, description: 'Max rows. Default 90, max 730' },
                            ]} />
                            <CodeBlock lang="bash" code={`curl -H "Authorization: Bearer $GQ_API_KEY" \\
  "https://graphiquestor.com/api/v1/observations?metric_id=india_rbi_rate&from=2025-01-01"`} />
                            <CodeBlock lang="json" code={`{
  "metric_id": "india_rbi_rate",
  "label": "RBI Policy Rate",
  "unit": "%",
  "observations": [
    { "date": "2026-06-03", "value": 6.50 },
    { "date": "2026-05-01", "value": 6.50 },
    { "date": "2026-04-01", "value": 6.75 }
  ]
}`} />
                        </div>
                    </div>

                    <Divider />

                    {/* ── EP 3: /regime/current ── */}
                    <div className="mb-12">
                        <EndpointHeader
                            id="ep-regime"
                            method="GET"
                            path="/api/v1/regime/current"
                            description="Current macro regime signal — GraphiQuestor's proprietary daily composite across five structural pillars."
                        />
                        <div className="space-y-5">
                            <Note>
                                No parameters required. Updated daily at 06:30 UTC using the prior day's close data.{' '}
                                <ProprietaryBadge /> indicates GQ-proprietary composite methodology.
                                See{' '}
                                <Link to="/methods/regime-scoring" className="text-blue-400 hover:underline">
                                    /methods/regime-scoring
                                </Link>.
                            </Note>
                            <CodeBlock lang="bash" code={`curl -H "Authorization: Bearer $GQ_API_KEY" \\
  "https://graphiquestor.com/api/v1/regime/current"`} />
                            <CodeBlock lang="json" code={`{
  "regime_label": "Neutral",
  "regime_score": 55,
  "confidence_interval": 0.66,
  "score_delta": 2.3,
  "signal_components": {
    "volatility": 82,
    "rates": 40,
    "dollar": 34,
    "metals": 47,
    "liquidity": 70
  },
  "as_of": "2026-06-03T06:30:00Z",
  "methodology_url": "/methods/regime-scoring"
}`} />
                        </div>
                    </div>

                    <Divider />

                    {/* ── EP 4: /composite-scores ── */}
                    <div className="mb-12">
                        <EndpointHeader
                            id="ep-composite"
                            method="GET"
                            path="/api/v1/composite-scores"
                            description="All GraphiQuestor proprietary composite scores in a single call — net liquidity, India macro, de-dollarization, and G20 sovereign stress."
                        />
                        <div className="space-y-5">
                            <Note>
                                All scores in this endpoint carry the <ProprietaryBadge /> designation.
                                Methodology for each composite is linked in the full API response.
                            </Note>
                            <CodeBlock lang="bash" code={`curl -H "Authorization: Bearer $GQ_API_KEY" \\
  "https://graphiquestor.com/api/v1/composite-scores"`} />
                            <CodeBlock lang="json" code={`{
  "scores": {
    "gq_net_liquidity_zscore": {
      "value": 0.82,
      "label": "Net Liquidity Z-Score",
      "regime": "Expanding",
      "as_of": "2026-06-03T00:00:00Z"
    },
    "india_macro_composite": {
      "value": 67,
      "label": "India Macro Score",
      "regime": "Expansion",
      "as_of": "2026-06-03T00:00:00Z"
    },
    "gq_dedollarization_index": {
      "value": 42.1,
      "label": "De-Dollarization Index",
      "direction": "accelerating",
      "as_of": "2026-06-03T00:00:00Z"
    },
    "g20_sovereign_stress_avg": {
      "value": 61.4,
      "label": "G20 Sovereign Stress",
      "regime": "Elevated",
      "as_of": "2026-06-03T00:00:00Z"
    }
  }
}`} />
                        </div>
                    </div>

                    <Divider />

                    {/* ── EP 5: /india/summary ── */}
                    <div className="mb-12">
                        <EndpointHeader
                            id="ep-india"
                            method="GET"
                            path="/api/v1/india/summary"
                            description="Complete India macro snapshot in one call — optimized for dashboard integration and reduced round-trips."
                        />
                        <div className="space-y-5">
                            <CodeBlock lang="bash" code={`curl -H "Authorization: Bearer $GQ_API_KEY" \\
  "https://graphiquestor.com/api/v1/india/summary"`} />
                            <CodeBlock lang="json" code={`{
  "as_of": "2026-06-03T00:00:00Z",
  "macro_score": 67,
  "regime": "Expansion",
  "metrics": {
    "india_rbi_rate":           { "value": 6.50, "unit": "%" },
    "india_cpi_yoy":            { "value": 4.31, "unit": "%" },
    "india_gdp_yoy":            { "value": 7.20, "unit": "%" },
    "india_fx_reserves_usd_bn": { "value": 665.4, "unit": "USD bn" },
    "india_cd_ratio":           { "value": 80.2, "unit": "%" },
    "india_mfg_pmi":            { "value": 58.1, "unit": "index" },
    "india_gst_collections":    { "value": 1.92, "unit": "₹ tn" },
    "india_inr_usd":            { "value": 83.4, "unit": "INR/USD" }
  },
  "credit_cycle_regime": "Downturn",
  "rbi_intervention_posture": "Neutral"
}`} />
                        </div>
                    </div>

                    <Divider />

                    {/* ── EP 6: /events ── */}
                    <div className="mb-12">
                        <EndpointHeader
                            id="ep-events"
                            method="GET"
                            path="/api/v1/events"
                            description="Upcoming and recent macro events — FOMC, RBI MPC, G20 summits, and scheduled data releases with impact classification."
                        />
                        <div className="space-y-5">
                            <ParamTable params={[
                                { name: 'from', type: 'date',   required: false, description: 'Start date. Default: today' },
                                { name: 'to',   type: 'date',   required: false, description: 'End date. Default: 30 days ahead' },
                                { name: 'type', type: 'string', required: false, description: 'Filter by type — FOMC, RBI_MPC, DATA_RELEASE, G20' },
                            ]} />
                            <CodeBlock lang="bash" code={`curl -H "Authorization: Bearer $GQ_API_KEY" \\
  "https://graphiquestor.com/api/v1/events?from=2026-06-01&type=FOMC"`} />
                            <CodeBlock lang="json" code={`{
  "events": [
    {
      "id": "fomc_2026_06_11",
      "type": "FOMC",
      "title": "FOMC Rate Decision",
      "date": "2026-06-11T18:00:00Z",
      "impact": "high",
      "consensus": "hold",
      "prior": "4.50%",
      "market_implied_move": "±0.8%"
    }
  ],
  "total": 1
}`} />
                        </div>
                    </div>

                    <Divider />

                    {/* ══════════════════════════════════════════════
                        SECTION 3 — METRIC REFERENCE
                    ══════════════════════════════════════════════ */}
                    <SectionAnchor id="metric-reference" />
                    <h2 className="text-xl font-black uppercase tracking-tight text-white mb-2">Metric ID Reference</h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Use these IDs in the <code style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#93c5fd' }}>metric_id</code> parameter.
                        Showing {filteredMetrics.length} of {METRIC_REFERENCE.length} metrics.
                    </p>

                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Filter by ID, label, or source…"
                            value={metricFilter}
                            onChange={e => setMetricFilter(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        />
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-800 mb-12">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/60">
                                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Metric ID</th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Label</th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMetrics.map((m, i) => (
                                    <tr key={m.id} className={i % 2 === 0 ? 'bg-slate-950/40' : 'bg-transparent'}>
                                        <td className="px-4 py-2.5 text-[12px] text-blue-300/90 whitespace-nowrap"
                                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                                            {m.id}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-slate-300">{m.label}</td>
                                        <td className="px-4 py-2.5 text-xs text-slate-500">{m.source}</td>
                                    </tr>
                                ))}
                                {filteredMetrics.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-600">
                                            No metrics match "{metricFilter}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Divider />

                    {/* ══════════════════════════════════════════════
                        SECTION 4 — USE CASES
                    ══════════════════════════════════════════════ */}
                    <SectionAnchor id="use-cases" />
                    <h2 className="text-xl font-black uppercase tracking-tight text-white mb-10">Use Cases</h2>

                    {/* 4a: Embed */}
                    <div className="mb-10">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-1">Embed in your platform</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Every GQ component supports <code style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6ee7b7' }}>?embed=true</code> for chromeless iframe embedding.
                            White-label available for institutional partners.
                        </p>
                        <CodeBlock lang="html" code={`<!-- GraphiQuestor Regime Signal — embeddable widget -->
<iframe
  src="https://graphiquestor.com/embed/regime?embed=true"
  width="100%"
  height="320"
  frameborder="0"
  style="border-radius:12px;background:transparent"
  allow="fullscreen"
  title="GraphiQuestor Macro Regime Signal"
></iframe>`} />
                        <p className="mt-3 text-xs text-slate-500">
                            Replace <code style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6ee7b7' }}>/embed/regime</code> with any page path.
                            White-label domain aliasing available for institutional partners —{' '}
                            <a href="mailto:api@graphiquestor.com" className="text-blue-400 hover:underline">contact us</a>.
                        </p>
                    </div>

                    {/* 4b: White-label */}
                    <div className="mb-10 p-5 rounded-lg bg-violet-500/5 border border-violet-500/15">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-violet-300 mb-2">White-label integration</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            GraphiQuestor's India Macro Terminal and De-Dollarization Lab are available for
                            white-label embedding in institutional research platforms, Bloomberg portals,
                            and fund manager dashboards. Custom branding, domain aliasing, and SSO available.
                        </p>
                        <a
                            href="mailto:api@graphiquestor.com"
                            className="inline-block mt-4 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-colors"
                        >
                            Contact: api@graphiquestor.com
                        </a>
                    </div>

                    {/* 4c: MCP */}
                    <div className="mb-10 p-5 rounded-lg bg-cyan-500/5 border border-cyan-500/15">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-300 mb-2">AI agent integration (MCP)</h3>
                        <p className="text-sm text-slate-400 leading-relaxed mb-4">
                            The <strong className="text-slate-300">graphiquestor/macro-intelligence</strong> MCP server
                            mirrors these REST endpoints as typed tools for Cursor, Claude Desktop, and Smithery.
                            Every response includes institutional commentary and dashboard deep links.
                        </p>
                        <CodeBlock lang="bash" code={`# Smithery one-command install (Cursor)
npx -y @smithery/cli@latest mcp add graphiquestor/macro-intelligence --client cursor

# Smithery MCP URL (remote)
# https://macro-intelligence--graphiquestor.run.tools

# Local build (from repo mcp/graphiquestor/)
npm install && npm run build
export SUPABASE_URL="..." SUPABASE_ANON_KEY="..."
node dist/index.js`} />
                        <p className="mt-3 text-xs text-slate-500">
                            Tools: <code style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#67e8f9' }}>get_regime_current</code>,{' '}
                            <code style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#67e8f9' }}>get_composite_scores</code>,{' '}
                            <code style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#67e8f9' }}>get_india_summary</code>, and 5 more.{' '}
                            <Link to="/for-researchers" className="text-cyan-400 hover:underline">Full MCP docs →</Link>
                        </p>
                    </div>

                    {/* 4d: Python */}
                    <div className="mb-12">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-1">Data science / quant integration</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Pull the India macro snapshot directly into Python for quant analysis or model inputs.
                        </p>
                        <CodeBlock lang="python" code={`import requests
import pandas as pd

GQ_API_KEY = "YOUR_API_KEY"
BASE = "https://graphiquestor.com/api/v1"

headers = {"Authorization": f"Bearer {GQ_API_KEY}"}

# Fetch India macro snapshot
r = requests.get(f"{BASE}/india/summary", headers=headers)
data = r.json()

print(f"Regime: {data['regime']}  |  Score: {data['macro_score']}")
metrics = pd.DataFrame(data["metrics"]).T
print(metrics)`} />
                    </div>

                    <Divider />

                    {/* ══════════════════════════════════════════════
                        SECTION 5 — RATE LIMITS
                    ══════════════════════════════════════════════ */}
                    <SectionAnchor id="rate-limits" />
                    <h2 className="text-xl font-black uppercase tracking-tight text-white mb-6">Rate Limits</h2>

                    <div className="overflow-x-auto rounded-lg border border-slate-800 mb-6">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/60">
                                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Tier</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Requests / day</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">History</th>
                                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Composite Scores</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-slate-800/50">
                                    <td className="px-5 py-3 text-sm font-semibold text-slate-300">Free</td>
                                    <td className="px-5 py-3 text-sm text-slate-400">100</td>
                                    <td className="px-5 py-3 text-sm text-slate-400">90 days</td>
                                    <td className="px-5 py-3">
                                        <span className="text-emerald-400 font-bold">✓</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-5 py-3 text-sm font-semibold text-blue-300">Institutional</td>
                                    <td className="px-5 py-3 text-sm text-slate-400">Unlimited</td>
                                    <td className="px-5 py-3 text-sm text-slate-400">5 years</td>
                                    <td className="px-5 py-3">
                                        <span className="text-emerald-400 font-bold">✓</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-sm text-slate-500">
                        Rate limit headers are included in every response:{' '}
                        <code style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#93c5fd' }}>X-RateLimit-Limit</code>,{' '}
                        <code style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#93c5fd' }}>X-RateLimit-Remaining</code>,{' '}
                        <code style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#93c5fd' }}>X-RateLimit-Reset</code>.
                        Burst allowance: up to 20 requests/minute on Free, 200/minute on Institutional.
                    </p>
                    <p className="text-sm text-slate-500 mt-3">
                        For institutional access or custom arrangements:{' '}
                        <a href="mailto:api@graphiquestor.com" className="text-blue-400 hover:underline">
                            api@graphiquestor.com
                        </a>
                    </p>

                    {/* Bottom CTA */}
                    <div className="mt-16 p-6 rounded-xl bg-blue-500/5 border border-blue-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-slate-200 mb-1">Ready to integrate?</p>
                            <p className="text-xs text-slate-500">Get your API key and start pulling institutional macro data in minutes.</p>
                        </div>
                        <Link
                            to="/api-access"
                            className="shrink-0 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest bg-blue-500 text-white hover:bg-blue-400 transition-colors"
                        >
                            Get API Key →
                        </Link>
                    </div>

                    <div className="pb-20" />
                </main>
            </div>
        </div>
    );
};
