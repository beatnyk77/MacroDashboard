import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SEOManager } from '@/components/SEOManager';
import { Database, Globe, BarChart3, Building2, Shield, FileText, ExternalLink, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Frequency = 'Real-time' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual' | 'Ad-hoc';

interface DataSourceEntry {
    id: string;
    name: string;
    acronym: string;
    category: string;
    description: string;
    url: string;
    frequency: Frequency;
    coverage: string;
    keyMetrics: string[];
    howWeUseIt: string;
    tier: 'Primary' | 'Secondary' | 'Market';
}

// ── Source Database ───────────────────────────────────────────────────────────

const DATA_SOURCES: DataSourceEntry[] = [
    // ── United States Federal Sources ─────────────────────────────────────────
    {
        id: 'fred',
        name: 'Federal Reserve Economic Data',
        acronym: 'FRED',
        category: 'United States – Federal Reserve',
        description: `The gold-standard repository for US macroeconomic and financial time series, 
        maintained by the Federal Reserve Bank of St. Louis. Contains over 800,000 series from 
        100+ data sources including Fed H.4.1 releases, BEA national accounts, BLS labour statistics, 
        and US Treasury fiscal data.`,
        url: 'https://fred.stlouisfed.org/',
        frequency: 'Daily',
        coverage: 'US; Global (selected multilateral series)',
        keyMetrics: [
            'WALCL – Fed Total Assets (weekly)',
            'WTREGEN – Treasury General Account (TGA)',
            'RRPONTSYD – Overnight Reverse Repo usage',
            'M2SL – US M2 Money Supply',
            'SOFR – Secured Overnight Financing Rate',
            'FEDFUNDS – Effective Fed Funds Rate',
            'GFDEBTN – Federal Debt Outstanding',
            'DFF – Daily Fed Funds Rate',
            'T10YIE – 10-Year Breakeven Inflation',
        ],
        howWeUseIt: `Core backbone for all US liquidity, monetary, and fiscal metrics. Net Liquidity, 
        Fed Balance Sheet components, interest rate signals, and Treasury data all originate from FRED's 
        H.4.1, H.15, and FRB/US feeds. Updated via automated Supabase Edge Functions with daily 
        ingestion and 90-day historical backfill.`,
        tier: 'Primary',
    },
    {
        id: 'us-treasury-fiscaldata',
        name: 'US Treasury FiscalData',
        acronym: 'FiscalData',
        category: 'United States – Treasury',
        description: `The official US federal government data portal for fiscal and debt data, 
        operated by the Bureau of the Fiscal Service. Provides machine-readable API access to 
        Treasury auction results, daily debt statements, and historical federal budget data.`,
        url: 'https://fiscaldata.treasury.gov/',
        frequency: 'Daily',
        coverage: 'United States – federal government only',
        keyMetrics: [
            'Total Public Debt Outstanding (daily)',
            'Treasury Auction Results (bid-to-cover, high yield)',
            'US Debt Maturity Wall (by cusip and maturity)',
            'Federal Budget Surplus/Deficit',
            'Debt Subject to Limit',
        ],
        howWeUseIt: `Primary source for the US Debt Maturity Wall tracker and Treasury Auction 
        Demand Gauge. Auction bid-to-cover ratios and high yields are ingested in near-real-time 
        post-auction via the FiscalData REST API. Maturity wall data drives the structural 
        rollover risk analysis in the US Macro & Fiscal Lab.`,
        tier: 'Primary',
    },

    {
        id: 'eia',
        name: 'US Energy Information Administration',
        acronym: 'EIA',
        category: 'United States – Energy',
        description: `The principal US government statistical agency for energy data and analysis. 
        Produces independent statistics on domestic energy production, consumption, inventories, 
        and trade across oil, natural gas, electricity, and coal sectors. Powers our Energy & 
        Commodities Lab with authoritative domestic supply/demand data.`,
        url: 'https://www.eia.gov/',
        frequency: 'Weekly',
        coverage: 'United States; global energy trade flows',
        keyMetrics: [
            'US Crude Oil Production (weekly, mbd)',
            'US Petroleum Inventory Levels (EIA weekly report)',
            'US Natural Gas Storage',
            'US Refinery Utilisation',
            'WTI Spot Price (NYMEX settlement)',
            'Energy Import/Export Balance',
        ],
        howWeUseIt: `Weekly EIA Petroleum Status Report data forms the basis of our crude inventory 
        and supply-demand balance analysis. EIA production data provides the US shale supply signal 
        for the Energy & Commodities Lab's price forecasting framework. Ingested weekly; compared 
        against analyst consensus for surprise-detection signals.`,
        tier: 'Primary',
    },

    // ── International Monetary Institutions ──────────────────────────────────
    {
        id: 'imf',
        name: 'International Monetary Fund',
        acronym: 'IMF',
        category: 'International – Multilateral',
        description: `The IMF is the definitive source for cross-country macroeconomic data, 
        fiscal sustainability assessments, and global reserve composition data. Its datasets 
        — particularly the World Economic Outlook (WEO) and COFER — are indispensable for 
        sovereign comparative analysis.`,
        url: 'https://www.imf.org/en/Data',
        frequency: 'Quarterly',
        coverage: '190 member countries',
        keyMetrics: [
            'COFER – Currency Composition of Official Foreign Exchange Reserves',
            'WEO – World Economic Outlook (GDP, Debt/GDP, Current Account, CPI)',
            'IFS – International Financial Statistics (trade, capital flows)',
            'GFSR – Global Financial Stability Report indicators',
            'World Revenue Longitudinal Data (WoRLD)',
        ],
        howWeUseIt: `COFER data is the backbone of our De-Dollarisation tracker — specifically 
        USD reserve share, CNY allocation trends, and gold's growing share of allocated reserves. 
        WEO data populates the Country Profile Pages for 40+ countries with GDP growth, debt/GDP, 
        current account balance, and IMF forecast data. Updated quarterly on IMF publication cycle.`,
        tier: 'Primary',
    },
    {
        id: 'bis',
        name: 'Bank for International Settlements',
        acronym: 'BIS',
        category: 'International – Multilateral',
        description: `The central bank of central banks. The BIS Statistics Portal provides 
        uniquely authoritative data on cross-border banking flows, global credit aggregates, 
        OTC derivatives markets, and central bank balance sheets that no other single source 
        can match. Essential for monitoring systemic liquidity and shadow banking stress.`,
        url: 'https://www.bis.org/statistics/',
        frequency: 'Quarterly',
        coverage: '64 BIS-reporting countries',
        keyMetrics: [
            'BIS Locational Banking Statistics (cross-border banking flows)',
            'BIS Global Credit Aggregates (total credit to private non-financial sector)',
            'OTC Derivatives Statistics (total notional outstanding)',
            'Central Bank Policy Rate Database',
            'Credit-to-GDP Gap (early warning indicator)',
            'Global Liquidity Indicators (international credit in USD, EUR)',
        ],
        howWeUseIt: `BIS Global Liquidity Indicators drive our shadow banking stress signals — 
        specifically, the offshore USD credit expansion metric tracks dollar funding stress 
        outside the US banking system. BIS cross-border banking statistics provide the 
        high-quality capital flow data for the De-Dollarisation and Sovereign Stress Labs. 
        Always supplemented by BIS Working Papers for methodological benchmarking.`,
        tier: 'Primary',
    },

    // ── India Sources ─────────────────────────────────────────────────────────
    {
        id: 'mospi',
        name: 'Ministry of Statistics & Programme Implementation',
        acronym: 'MoSPI',
        category: 'India – Government',
        description: `India's apex statistical authority, responsible for compiling National 
        Accounts Statistics (NAS), Consumer Price Index (CPI), Index of Industrial Production 
        (IIP), and the National Sample Survey. MoSPI data is the definitive reference for 
        India's GDP, inflation, and structural production data.`,
        url: 'https://mospi.gov.in/',
        frequency: 'Monthly',
        coverage: 'India (national and state-level)',
        keyMetrics: [
            'India GDP (quarterly advance and revised estimates)',
            'CPI Inflation (headline + core, monthly)',
            'IIP – Index of Industrial Production (monthly)',
            'Gross Capital Formation (quarterly)',
            'Private Final Consumption Expenditure',
            'NSS – National Sample Survey (employment)',
        ],
        howWeUseIt: `Core source for India's macro growth signal in the India Intel page and 
        India Lab. CPI data is used for real yield calculations; IIP for manufacturing momentum; 
        GDP quarterly data for growth trajectory tracking. MoSPI's advance GDP estimate is 
        tracked as the highest-profile India data release with surprise detection vs consensus.`,
        tier: 'Primary',
    },
    {
        id: 'rbi-dbie',
        name: 'RBI Database on Indian Economy',
        acronym: 'RBI DBIE',
        category: 'India – Reserve Bank of India',
        description: `The Reserve Bank of India's structured data portal — the most comprehensive 
        repository of India-specific financial and monetary data. Contains banking sector metrics, 
        monetary aggregates, foreign exchange reserves, external debt, and India's balance of 
        payments data in machine-readable format.`,
        url: 'https://dbie.rbi.org.in/',
        frequency: 'Weekly',
        coverage: 'India – monetary system, banking sector, external sector',
        keyMetrics: [
            'Scheduled Commercial Bank Credit (weekly)',
            'M3 Money Supply (weekly)',
            'Repo Rate, Reverse Repo, CRR, SLR',
            'India Foreign Exchange Reserves (weekly)',
            'External Commercial Borrowings',
            'India Current Account Balance',
            'Call Money Market Rates',
        ],
        howWeUseIt: `Primary source for the Loan-to-Job Efficiency Ratio (SCB credit component), 
        India FX Reserve Tracker, and monetary policy signal in India Intel. Bank credit data 
        and monetary aggregates are ingested weekly. India's forex reserve data is tracked 
        against BOP inflows to identify structural reserve accumulation vs valuation effects.`,
        tier: 'Primary',
    },
    {
        id: 'epfo',
        name: 'Employees Provident Fund Organisation',
        acronym: 'EPFO',
        category: 'India – Government',
        description: `India's statutory body managing mandatory provident fund contributions 
        for formal sector employees. Its monthly payroll data, released with a 2-month lag, 
        is the highest-frequency, highest-quality proxy for formal employment creation in India 
        — far more reliable than survey-based employment statistics.`,
        url: 'https://www.epfindia.gov.in/',
        frequency: 'Monthly',
        coverage: 'India – formal private sector employment',
        keyMetrics: [
            'Monthly Net EPFO Subscriber Additions (new formal jobs)',
            'Age-cohort breakdown of first-time subscribers',
            'State-wise and industry-wise subscriber data',
        ],
        howWeUseIt: `The denominator in our proprietary Loan-to-Job Efficiency Ratio. Monthly 
        EPFO additions represent genuine new formal employment creation. By comparing credit 
        growth (RBI data) against formal job creation (EPFO), we quantify whether bank lending 
        is actually reaching productive real economy employment or being absorbed by asset inflation.`,
        tier: 'Primary',
    },

    // ── Global Trade & Commodities ────────────────────────────────────────────
    {
        id: 'comtrade',
        name: 'UN Comtrade Database',
        acronym: 'Comtrade',
        category: 'International – Trade',
        description: `The United Nations repository for international merchandise trade statistics. 
        Comtrade aggregates trade data reported by over 200 countries and territories, covering 
        bilateral trade flows by commodity (HS code level) with a 1-year reporting lag. The 
        definitive source for tracking commodity trade shifts, oil settlement patterns, and 
        supply chain reconfigurations.`,
        url: 'https://comtradeplus.un.org/',
        frequency: 'Annual',
        coverage: '200+ countries, full HS commodity code coverage',
        keyMetrics: [
            'Bilateral oil trade flows (HS 2709)',
            'Gold trade flows (HS 7108)',
            'US-China trade balance (detailed HS breakdown)',
            'Critical mineral supply chain flows',
            'Semiconductor and tech hardware trade',
        ],
        howWeUseIt: `Primary source for the Petrodollar vs Petroyuan Monitor in the De-Dollarisation 
        Lab. Bilateral oil trade data allows estimation of what proportion of global oil trade is 
        settled outside USD. Also used for supply chain analysis in the Energy Lab and critical 
        mineral dependency calculations for India and China pages.`,
        tier: 'Secondary',
    },
    {
        id: 'wgc',
        name: 'World Gold Council',
        acronym: 'WGC',
        category: 'International – Commodities',
        description: `The market development organisation for the gold industry, providing the 
        most granular and authoritative data on central bank gold demand, global gold supply 
        (mine production, recycling), and ETF flows. Gold Demand Trends is the industry-standard 
        quarterly publication for gold market analysis.`,
        url: 'https://www.gold.org/goldhub/data',
        frequency: 'Quarterly',
        coverage: 'Global – central bank, ETF, jewellery, industrial demand',
        keyMetrics: [
            'Central Bank Gold Demand (quarterly tonnes)',
            'Gold ETF Total Holdings (monthly, tonnes)',
            'Global Gold Mine Production (quarterly)',
            'BRICS+ Central Bank Gold Reserves',
            'Gold-for-Oil Trade Flows (estimated)',
        ],
        howWeUseIt: `The BRICS gold accumulation tracker in the De-Dollarisation Lab relies on 
        WGC's central bank reserve data. quarterly breakdown by country allows identification 
        of which central banks are systematically increasing gold reserves as a reserve 
        diversification strategy. Supplemented by IMF IFS gold data for cross-validation.`,
        tier: 'Secondary',
    },
    {
        id: 'iea',
        name: 'International Energy Agency',
        acronym: 'IEA',
        category: 'International – Energy',
        description: `The OECD's autonomous intergovernmental energy organisation, providing 
        authoritative global energy statistics, outlooks, and policy analysis. The IEA Oil 
        Market Report and World Energy Outlook are the industry benchmarks for supply, demand, 
        and pricing fundamentals in global energy markets.`,
        url: 'https://www.iea.org/data-and-statistics',
        frequency: 'Monthly',
        coverage: 'Global – IEA member countries + major producers',
        keyMetrics: [
            'Global Oil Supply/Demand Balance (monthly)',
            'OECD Oil Inventory Levels',
            'Refinery Throughput (global)',
            'Energy Import Dependency by Country',
            'Global LNG Trade Flows',
            'Renewable Energy Capacity Additions',
        ],
        howWeUseIt: `The Energy Dependency Ratio for India and other countries is calibrated using 
        IEA energy balance data. Global oil supply/demand balance from the IEA Monthly Oil Market 
        Report drives our crude price regime signal. IEA's forecast data provides the consensus 
        against which we track supply surprises and demand revisions.`,
        tier: 'Primary',
    },

    // ── Market Data ───────────────────────────────────────────────────────────
    {
        id: 'yahoo-finance',
        name: 'Yahoo Finance (yfinance API)',
        acronym: 'yfinance',
        category: 'Market Data',
        description: `Open-source Python library providing programmatic access to Yahoo Finance's 
        market data. Used exclusively for high-frequency, real-time price signals where no free 
        authoritative institutional source exists. Data quality is sufficient for daily closing 
        prices but cannot be used for intraday or tick-level analysis.`,
        url: 'https://github.com/ranaroussi/yfinance',
        frequency: 'Daily',
        coverage: 'Global equities, commodities, FX, indices',
        keyMetrics: [
            'GC=F – Gold Spot Price (COMEX front-month)',
            'CL=F – WTI Crude Oil (NYMEX front-month)',
            '^VIX – CBOE Volatility Index',
            'DX-Y.NYB – US Dollar Index (DXY)',
            '^SPX – S&P 500 Index',
            'SI=F – Silver Spot Price',
        ],
        howWeUseIt: `Market price signals used in ratio calculations (M2/Gold, Debt/Gold, SPX/Gold) 
        and as daily inputs to Macro Regime classification. Gold and Silver prices feed the 
        Gold/Silver ratio indicator. VIX is a component of the Sovereign Stress composite. 
        DXY tracks dollar strength trends in the De-Dollarisation Lab.`,
        tier: 'Market',
    },

];

// ── Category Metadata ─────────────────────────────────────────────────────────

const SOURCE_CATEGORIES = [
    { id: 'all', label: 'All Sources' },
    { id: 'United States – Federal Reserve', label: 'US Fed & Treasury' },
    { id: 'United States – Treasury', label: 'US Treasury' },
    { id: 'United States – Securities & Exchange Commission', label: 'US SEC' },
    { id: 'United States – Energy', label: 'US Energy (EIA)' },
    { id: 'International – Multilateral', label: 'IMF / BIS' },
    { id: 'International – Trade', label: 'Trade Data' },
    { id: 'International – Commodities', label: 'Commodities' },
    { id: 'International – Energy', label: 'IEA' },
    { id: 'India – Government', label: 'India Gov' },
    { id: 'India – Reserve Bank of India', label: 'RBI' },
    { id: 'Market Data', label: 'Market Data' },
    { id: 'India – Market Data', label: 'India Markets' },
];

const TIER_COLORS: Record<string, string> = {
    Primary: 'text-terminal-emerald border-terminal-emerald/30 bg-terminal-emerald/10',
    Secondary: 'text-terminal-gold border-terminal-gold/30 bg-terminal-gold/10',
    Market: 'text-terminal-blue border-terminal-blue/30 bg-terminal-blue/10',
};

const FREQ_COLORS: Record<Frequency, string> = {
    'Real-time': 'text-terminal-emerald',
    'Daily': 'text-terminal-emerald',
    'Weekly': 'text-terminal-blue',
    'Monthly': 'text-terminal-blue',
    'Quarterly': 'text-terminal-gold',
    'Annual': 'text-orange-400',
    'Ad-hoc': 'text-terminal-muted',
};

// ── Source Card Component ─────────────────────────────────────────────────────

const SourceCard: React.FC<{ source: DataSourceEntry }> = ({ source }) => (
    <article
        id={source.id}
        className="border border-border/60 rounded-2xl bg-card/30 p-6 flex flex-col gap-5 hover:border-border transition-colors duration-200"
        aria-label={source.name}
    >
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-uppercase border',
                        TIER_COLORS[source.tier]
                    )}>
                        {source.tier}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-uppercase text-muted-foreground">
                        {source.category}
                    </span>
                </div>
                <h3 className="text-base font-bold text-foreground tracking-heading">
                    {source.name}
                </h3>
                <code className="text-xs font-mono text-terminal-blue">{source.acronym}</code>
            </div>
            <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                aria-label={`Visit ${source.name} website`}
            >
                <ExternalLink size={11} />
                Visit Source
            </a>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
            {source.description}
        </p>

        {/* Key Metrics */}
        <div>
            <h4 className="text-[10px] font-black uppercase tracking-uppercase text-terminal-muted mb-3">
                Key Metrics / Series Used
            </h4>
            <ul className="space-y-1.5">
                {source.keyMetrics.map((metric, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/70">
                        <CheckCircle2 size={12} className="text-terminal-emerald flex-shrink-0 mt-0.5" />
                        <code className="font-mono leading-relaxed">{metric}</code>
                    </li>
                ))}
            </ul>
        </div>

        {/* How We Use It */}
        <div className="p-4 rounded-xl border border-terminal-blue/20 bg-terminal-blue/[0.03]">
            <h4 className="text-[10px] font-black uppercase tracking-uppercase text-terminal-blue mb-2">
                How We Use This Source
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{source.howWeUseIt}</p>
        </div>

        {/* Footer: Coverage + Frequency */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/30 text-xs">
            <div className="flex items-center gap-1.5 text-terminal-muted">
                <Globe size={12} />
                <span>{source.coverage}</span>
            </div>
            <div className={cn('flex items-center gap-1.5 font-bold', FREQ_COLORS[source.frequency])}>
                <RefreshCw size={12} />
                <span>Updated: {source.frequency}</span>
            </div>
        </div>
    </article>
);

// ── Summary Stats ─────────────────────────────────────────────────────────────

const SUMMARY_STATS = [
    { label: 'Total Sources', value: DATA_SOURCES.length.toString(), icon: Database },
    { label: 'Primary Sources', value: DATA_SOURCES.filter(s => s.tier === 'Primary').length.toString(), icon: Shield },
    { label: 'Countries Covered', value: '190+', icon: Globe },
    { label: 'Metrics Ingested', value: '400+', icon: BarChart3 },
];

// ── JSON-LD ───────────────────────────────────────────────────────────────────

const DATA_SOURCES_JSON_LD = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    name: 'GraphiQuestor Data Sources',
    headline: 'Transparent Data Source Disclosure — GraphiQuestor',
    description: 'Full list of primary institutional data sources used by GraphiQuestor, including FRED, MoSPI, RBI DBIE, BIS, IMF COFER, EIA, UN Comtrade, and World Gold Council.',
    url: 'https://graphiquestor.com/data-sources',
    author: {
        '@type': 'Person',
        name: 'Kartikay Sharma',
        jobTitle: 'Chartered Accountant & Macro Analyst',
        url: 'https://graphiquestor.com/about',
    },
    publisher: {
        '@type': 'Organization',
        name: 'GraphiQuestor',
        url: 'https://graphiquestor.com',
    },
    inLanguage: 'en',
    dateModified: new Date().toISOString().split('T')[0],
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const DataSourcesPage: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('all');

    const filtered = activeCategory === 'all'
        ? DATA_SOURCES
        : DATA_SOURCES.filter(s => s.category === activeCategory);

    return (
        <div className="min-h-screen bg-background">
            <SEOManager
                title="Data Sources — Authoritative Macro Intelligence Inputs"
                description="Full transparency on every data source powering GraphiQuestor: FRED, US Treasury FiscalData, IMF COFER, BIS Statistics, RBI DBIE, MoSPI, EIA, UN Comtrade, World Gold Council, and more. Update frequencies, key metrics, and institutional use cases documented."
                keywords={[
                    'FRED data source', 'IMF COFER data', 'BIS statistics', 'RBI DBIE India data',
                    'MoSPI India GDP', 'EIA energy data', 'UN Comtrade trade data',
                    'macro data sources', 'institutional data transparency',
                ]}
                canonicalUrl="https://graphiquestor.com/data-sources"
                jsonLd={DATA_SOURCES_JSON_LD}
            />

            {/* Hero */}
            <header className="w-full border-b border-border/40 bg-card/20 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terminal-emerald/10 border border-terminal-emerald/20 text-terminal-emerald text-[10px] font-black uppercase tracking-uppercase mb-6">
                        <Database size={12} />
                        Source Transparency
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-heading text-foreground mb-4 leading-tight">
                        Data Sources &amp;<br />
                        <span className="text-terminal-emerald">Institutional Inputs</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-6">
                        Every metric on this platform is sourced from authoritative primary institutions.
                        We do not use scraped data, estimated proxies, or unverifiable aggregators for 
                        any <strong className="text-foreground">Core</strong>-tier metric.
                        Full provenance is documented below.
                    </p>

                    {/* Breadcrumb nav */}
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-foreground">Data Sources</span>
                    </nav>
                </div>
            </header>

            {/* Summary Stats */}
            <div className="border-b border-border/40 bg-card/10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {SUMMARY_STATS.map(stat => (
                            <div key={stat.label} className="text-center">
                                <div className="text-3xl font-black text-foreground mb-1">{stat.value}</div>
                                <div className="text-xs font-bold uppercase tracking-uppercase text-muted-foreground">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Tier Legend */}
                <section aria-labelledby="tier-legend-heading" className="mb-12">
                    <h2 id="tier-legend-heading" className="text-2xl font-bold tracking-heading text-foreground mb-6">
                        Source Tier Classification
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            {
                                tier: 'Primary',
                                desc: 'Direct official government, central bank, or multilateral institution source. Data definitions, methodology, and revisions published in official statistical frameworks.',
                                color: 'border-terminal-emerald/20 bg-terminal-emerald/[0.03]',
                                badge: TIER_COLORS.Primary,
                            },
                            {
                                tier: 'Secondary',
                                desc: 'Compiled or derived data from authoritative industry bodies or international trade registries. Subject to reporting lags and country cooperation variability.',
                                color: 'border-terminal-gold/20 bg-terminal-gold/[0.03]',
                                badge: TIER_COLORS.Secondary,
                            },
                            {
                                tier: 'Market',
                                desc: 'Exchange or market data aggregators used for price signals only. Not used for structural or fundamental metric constructions. Clearly labelled where used.',
                                color: 'border-terminal-blue/20 bg-terminal-blue/[0.03]',
                                badge: TIER_COLORS.Market,
                            },
                        ].map(t => (
                            <div key={t.tier} className={cn('p-5 rounded-xl border', t.color)}>
                                <span className={cn(
                                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-uppercase border mb-3',
                                    t.badge
                                )}>
                                    {t.tier}
                                </span>
                                <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Update Cadence Notice */}
                <div className="flex items-start gap-3 p-4 rounded-xl border border-terminal-gold/20 bg-terminal-gold/[0.03] mb-10">
                    <Clock size={16} className="text-terminal-gold flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">Ingestion Cadence:</strong>{' '}
                        All data ingestion is managed via scheduled Supabase Edge Functions (pg_cron).
                        Daily series update at 06:00 UTC; weekly at Monday 08:00 UTC; quarterly series
                        are refreshed within 48 hours of official publication. The{' '}
                        <Link to="/admin/data-health" className="text-terminal-blue hover:text-blue-300 transition-colors">
                            Data Health Dashboard
                        </Link>{' '}
                        provides live ingestion status for all series.
                    </div>
                </div>

                {/* Category Filter */}
                <nav aria-label="Source category filter" className="flex flex-wrap gap-2 mb-8">
                    {SOURCE_CATEGORIES.slice(0, 7).map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setActiveCategory(id)}
                            className={cn(
                                'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-uppercase border transition-all duration-200',
                                activeCategory === id
                                    ? 'bg-terminal-emerald/20 border-terminal-emerald/40 text-terminal-emerald'
                                    : 'bg-transparent border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </nav>
                <nav aria-label="Source category filter continued" className="flex flex-wrap gap-2 mb-10">
                    {SOURCE_CATEGORIES.slice(7).map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setActiveCategory(id)}
                            className={cn(
                                'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-uppercase border transition-all duration-200',
                                activeCategory === id
                                    ? 'bg-terminal-emerald/20 border-terminal-emerald/40 text-terminal-emerald'
                                    : 'bg-transparent border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </nav>

                {/* Source Count */}
                <p className="text-sm text-terminal-muted mb-6">
                    Showing <strong className="text-foreground">{filtered.length}</strong> of{' '}
                    <strong className="text-foreground">{DATA_SOURCES.length}</strong> sources
                </p>

                {/* Source Cards Grid */}
                <section aria-labelledby="sources-list-heading">
                    <h2 id="sources-list-heading" className="sr-only">Data Sources List</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filtered.map(source => (
                            <SourceCard key={source.id} source={source} />
                        ))}
                    </div>
                </section>

                {/* Full Reference Table */}
                <section aria-labelledby="reference-table-heading" className="mt-20">
                    <h2 id="reference-table-heading" className="text-2xl font-bold tracking-heading text-foreground mb-6">
                        Quick Reference Matrix
                    </h2>
                    <div className="rounded-xl border border-border overflow-hidden bg-background">
                        <div className="overflow-x-auto data-table-scroll">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted/30 border-b border-border">
                                    <tr>
                                        <th className="py-3 px-4 font-bold text-muted-foreground">Source</th>
                                        <th className="py-3 px-4 font-bold text-muted-foreground">Category</th>
                                        <th className="py-3 px-4 font-bold text-muted-foreground">Tier</th>
                                        <th className="py-3 px-4 font-bold text-muted-foreground">Frequency</th>
                                        <th className="py-3 px-4 font-bold text-muted-foreground">Coverage</th>
                                        <th className="py-3 px-4 font-bold text-muted-foreground">Link</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {DATA_SOURCES.map(source => (
                                        <tr key={source.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="py-3 px-4 font-bold text-foreground">
                                                <span className="font-mono text-terminal-blue mr-2">{source.acronym}</span>
                                                <span className="text-muted-foreground font-normal">{source.name.split(' ').slice(0, 3).join(' ')}</span>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">{source.category}</td>
                                            <td className="py-3 px-4">
                                                <span className={cn(
                                                    'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border',
                                                    TIER_COLORS[source.tier]
                                                )}>
                                                    {source.tier}
                                                </span>
                                            </td>
                                            <td className={cn('py-3 px-4 font-semibold', FREQ_COLORS[source.frequency])}>
                                                {source.frequency}
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">{source.coverage}</td>
                                            <td className="py-3 px-4">
                                                <a
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-terminal-blue hover:text-blue-300 transition-colors"
                                                    aria-label={`Open ${source.acronym} website`}
                                                >
                                                    <ExternalLink size={11} />
                                                    Open
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Data Integrity Principles */}
                <section aria-labelledby="integrity-heading" className="mt-20 space-y-8">
                    <h2 id="integrity-heading" className="text-2xl font-bold tracking-heading text-foreground">
                        Data Integrity Principles
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: Shield,
                                title: 'No Estimated or Interpolated Core Data',
                                desc: 'For all Core-tier metrics, we use only official releases. Where official data has reporting lags (e.g., quarterly BOP), we document the lag explicitly rather than estimating.',
                            },
                            {
                                icon: RefreshCw,
                                title: 'Automated Freshness Monitoring',
                                desc: 'Every data series has a monitored staleness threshold. The Data Health Dashboard flags any series that has not updated within 1.5× its expected refresh cadence.',
                            },
                            {
                                icon: FileText,
                                title: 'Revision Handling',
                                desc: 'When source agencies revise historical data (common with GDP, trade, and inflation series), we ingest both the preliminary and the final revised figure and label them accordingly.',
                            },
                            {
                                icon: Building2,
                                title: 'Cross-Validation Protocol',
                                desc: 'Critical metrics are cross-validated against at least two independent sources before being surfaced in the terminal. Discrepancies > 3% trigger a manual data quality review.',
                            },
                        ].map(p => (
                            <div key={p.title} className="flex items-start gap-4 p-5 rounded-xl border border-border/60 bg-card/20">
                                <div className="w-10 h-10 rounded-xl bg-terminal-blue/10 flex items-center justify-center flex-shrink-0">
                                    <p.icon size={18} className="text-terminal-blue" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground mb-1">{p.title}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Cross-link to Methodology */}
                <aside className="mt-16 p-8 rounded-2xl border border-terminal-gold/20 bg-terminal-gold/[0.03]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-foreground mb-1">Want to Understand the Formulas?</h3>
                            <p className="text-sm text-muted-foreground">
                                The Methodology page explains how raw source data is transformed into every derived metric on this platform.
                            </p>
                        </div>
                        <Link
                            to="/methodology"
                            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terminal-gold/20 border border-terminal-gold/30 text-terminal-gold text-sm font-bold hover:bg-terminal-gold/30 transition-colors"
                        >
                            <ExternalLink size={14} />
                            View Methodology
                        </Link>
                    </div>
                </aside>
            </main>
        </div>
    );
};
