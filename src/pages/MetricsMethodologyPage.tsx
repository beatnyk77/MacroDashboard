import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { SEOManager } from '@/components/SEOManager';
import { BookOpen, FlaskConical, TrendingUp, Shield, Zap, Globe, BarChart3, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MetricEntry {
    id: string;
    name: string;
    category: string;
    formula: string;
    components: string[];
    intuition: string;
    institutionalUse: string;
    interpretation: { label: string; condition: string; color: string }[];
    relatedPage?: string;
    relatedPageLabel?: string;
    sources: string[];
}

// ── Metric Definitions ────────────────────────────────────────────────────────

const METRICS: MetricEntry[] = [
    // ── Liquidity Block ───────────────────────────────────────────────────────
    {
        id: 'net-liquidity',
        name: 'Net Liquidity Index',
        category: 'Liquidity',
        formula: 'Net Liquidity = Fed Balance Sheet (WALCL) − Treasury General Account (TGA) − Overnight Reverse Repo (ONRRP)',
        components: [
            'WALCL – Federal Reserve total assets (securities held outright + loans)',
            'TGA – Cash held at the Fed by the US Treasury; drains reserves when drawn down',
            'ONRRP – Overnight reverse repo facility usage; cash parked at the Fed by money market funds',
        ],
        intuition: `Gross Fed balance sheet expansion is misleading without adjusting for where reserves actually sit. 
        When the TGA is large, the Treasury effectively "holds" reserves off the system — banks are not flush with liquidity 
        even if the Fed technically holds assets. Similarly, a large ONRRP balance means reserve-equivalent cash is 
        sitting idle. Net Liquidity captures the dollar value of reserves that are actually circulating in the economy 
        and financial markets, acting as the structural floor for asset risk appetite.`,
        institutionalUse: `Used by macro hedge funds and sovereign wealth offices as the root variable in central bank 
        liquidity cycle analysis. A sustained decline in Net Liquidity (even without rate hikes) historically 
        precedes equity drawdowns of >15% with 3–6 month lag. Widely tracked in BIS Quarterly Reviews under 
        the label "effective reserve supply."`,
        interpretation: [
            { label: 'Expanding', condition: 'MoM Δ > 0 & Z-Score > 0', color: 'text-terminal-emerald' },
            { label: 'Contracting', condition: 'MoM Δ < 0 & Z-Score < −1.0', color: 'text-terminal-rose' },
            { label: 'Neutral', condition: '−1.0 < Z-Score < 0', color: 'text-terminal-muted' },
        ],
        relatedPage: '/labs/us-macro-fiscal',
        relatedPageLabel: 'US Macro & Fiscal Lab',
        sources: ['FRED (WALCL, WTREGEN, RRPONTSYD)'],
    },
    {
        id: 'net-liquidity-zscore',
        name: 'Net Liquidity Z-Score',
        category: 'Liquidity',
        formula: 'Z = (Net Liquidity(t) − μ₂₅ᴦ) / σ₂₅ᴦ',
        components: [
            'Net Liquidity(t) – Current period Net Liquidity value (in $B)',
            'μ₂₅ᴦ – Rolling 25-year mean of Net Liquidity',
            'σ₂₅ᴦ – Rolling 25-year standard deviation of Net Liquidity',
        ],
        intuition: `A raw dollar figure for Net Liquidity has limited cross-cycle comparability because both the 
        economy and the balance sheet have grown substantially. The Z-Score normalises the current reading 
        against a 25-year rolling window — capturing both secular expansion and cyclical volatility. 
        A Z-Score of −2.0 means the system is historically as liquidity-drained as it was during the nadir 
        of 2018 QT or the immediate post-Lehman shock. This makes the signal regime-invariant.`,
        institutionalUse: `Leading central bank research desks (NY Fed, BIS, ECB) embed Z-Score normalisation 
        in financial conditions indices. A reading of ≤ −1.5 is a standard macro stress threshold used by 
        risk management teams at tier-1 asset managers to trigger hedging overlays.`,
        interpretation: [
            { label: 'Crisis-Level Drain', condition: 'Z < −2.0', color: 'text-terminal-rose' },
            { label: 'Tightening Regime', condition: '−2.0 ≤ Z < −1.0', color: 'text-orange-400' },
            { label: 'Neutral', condition: '−1.0 ≤ Z ≤ 1.0', color: 'text-terminal-muted' },
            { label: 'Expansion', condition: 'Z > 1.0', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/labs/us-macro-fiscal',
        relatedPageLabel: 'US Macro & Fiscal Lab',
        sources: ['FRED (WALCL, WTREGEN, RRPONTSYD)'],
    },

    // ── Fiscal Dominance Block ────────────────────────────────────────────────
    {
        id: 'fiscal-dominance-meter',
        name: 'Fiscal Dominance Meter',
        category: 'Fiscal Health',
        formula: 'FD Score = (Net Interest / Federal Revenue) × 100 + (Deficit / GDP) × 50',
        components: [
            'Net Interest – Annual federal interest payments (FRED: A091RC1Q027SBEA)',
            'Federal Revenue – Total federal receipts excluding intragovernmental transfers',
            'Deficit – Unified budget deficit as reported by US Treasury FiscalData',
            'GDP – Nominal US GDP (FRED: GDP)',
        ],
        intuition: `Fiscal dominance occurs when debt service obligations constrain monetary policy — 
        the central bank cannot raise rates without materially increasing sovereign financing costs. 
        This composite score operationalises that constraint. When net interest exceeds ~25% of 
        revenue, independent monetary policy becomes structurally compromised. The GDP deficit ratio 
        adds a sustainability dimension: deficits exceeding 5% of GDP during non-recessionary periods 
        signal that primary fiscal adjustment is required, not just cyclical normalisation.`,
        institutionalUse: `Used by IMF fiscal surveillance teams and sovereign credit analysts at rating 
        agencies (Moody's, Fitch, S&P) as a key input in Debt Sustainability Analysis (DSA) frameworks. 
        BIS Working Papers since 2021 specifically cite the interest-to-revenue ratio as the cleanest 
        single-variable predictor of sovereign stress events.`,
        interpretation: [
            { label: 'Severe Dominance', condition: 'Score > 80', color: 'text-terminal-rose' },
            { label: 'Elevated', condition: '50 < Score ≤ 80', color: 'text-orange-400' },
            { label: 'Moderate', condition: '25 < Score ≤ 50', color: 'text-terminal-gold' },
            { label: 'Sustainable', condition: 'Score ≤ 25', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/labs/us-macro-fiscal',
        relatedPageLabel: 'US Macro & Fiscal Lab',
        sources: ['FRED', 'US Treasury FiscalData', 'BEA (GDP)'],
    },
    {
        id: 'debt-gold-zscore',
        name: 'Debt / Gold Z-Score',
        category: 'Fiscal Health',
        formula: 'Z = (Debt_t / Gold_t − μ₂₅ᴦ) / σ₂₅ᴦ',
        components: [
            'Debt_t – Total US Public Debt outstanding (in $B)',
            'Gold_t – Gold spot price (USD/troy oz)',
            'μ₂₅ᴦ / σ₂₅ᴦ – 25-year rolling mean and standard deviation of the Debt/Gold ratio',
        ],
        intuition: `The ratio of public debt to gold captures how overextended sovereign spending is 
        relative to hard monetary anchors. Historically, periods of extremely high Debt/Gold ratios 
        have preceded either debt restructuring events, currency debasement, or significant gold 
        repricing. The Z-Score normalisation reveals whether the current ratio is anomalous relative 
        to its historical distribution — critical for understanding whether gold is structurally 
        underpriced given the current fiscal trajectory.`,
        institutionalUse: `Central bank reserve managers at institutions like the Bundesbank, RBI, and 
        PBoC use variations of this ratio to assess the relative attractiveness of gold versus sovereign 
        instruments in their reserve portfolios. The BIS Annual Economic Report 2023 specifically 
        highlighted the structural repricing risk embedded in historically elevated Debt/Gold ratios.`,
        interpretation: [
            { label: 'Gold Structurally Cheap', condition: 'Z > 2.0', color: 'text-terminal-gold' },
            { label: 'Elevated Ratio', condition: '1.0 < Z ≤ 2.0', color: 'text-terminal-gold' },
            { label: 'Historical Norm', condition: '−1.0 ≤ Z ≤ 1.0', color: 'text-terminal-muted' },
            { label: 'Gold Relatively Expensive', condition: 'Z < −1.0', color: 'text-terminal-rose' },
        ],
        relatedPage: '/labs/de-dollarization-gold',
        relatedPageLabel: 'De-Dollarization & Gold Lab',
        sources: ['US Treasury FiscalData', 'FRED (GFDEBTN)', 'Yahoo Finance (GC=F)'],
    },

    // ── Energy Block ──────────────────────────────────────────────────────────
    {
        id: 'energy-dependency-ratio',
        name: 'Energy Dependency Ratio',
        category: 'Energy & Commodities',
        formula: 'EDR = (Net Energy Imports / Total Primary Energy Consumption) × 100',
        components: [
            'Net Energy Imports – Total energy imports minus total energy exports (in quadrillion BTU)',
            'Total Primary Energy Consumption – Domestic consumption from all sources',
        ],
        intuition: `A high Energy Dependency Ratio signals structural vulnerability to supply disruptions, 
        commodity price shocks, and geopolitical energy weaponisation. For a country with EDR > 50%, 
        a 30% rise in global oil prices translates directly into an approximate 15% deterioration 
        in terms of trade — with second-order effects on current account, inflation, and monetary 
        policy optionality. EDR is particularly critical for assessing India's external balance 
        sensitivity to oil price cycles and the OPEC+ cartel decisions.`,
        institutionalUse: `The IEA, European Commission, and World Bank embed EDR in energy security 
        scoring models. For India-focused macro analysis, this metric is tracked by RBI's Monetary 
        Policy Committee as an input to imported inflation forecasts. Sovereign credit analysts 
        at JPMorgan and GS treat high EDR as a negative structural factor in EM ratings.`,
        interpretation: [
            { label: 'Highly Dependent', condition: 'EDR > 60%', color: 'text-terminal-rose' },
            { label: 'Moderately Dependent', condition: '30% < EDR ≤ 60%', color: 'text-orange-400' },
            { label: 'Balanced', condition: '10% < EDR ≤ 30%', color: 'text-terminal-muted' },
            { label: 'Net Exporter', condition: 'EDR < 0%', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/labs/energy-commodities',
        relatedPageLabel: 'Energy & Commodities Lab',
        sources: ['EIA (US Energy Information Administration)', 'IEA', 'MoPNG (India)'],
    },

    // ── Debt Efficiency Block ─────────────────────────────────────────────────
    {
        id: 'loan-to-job-efficiency',
        name: 'Loan-to-Job Efficiency Ratio',
        category: 'Credit Quality',
        formula: 'L/J Ratio = ΔBank Credit (₹Cr) / ΔFormal Employment (EPFO Net Additions)',
        components: [
            'ΔBank Credit – Change in scheduled commercial bank credit (RBI weekly SCB data)',
            'ΔEPFO Net Additions – Monthly new EPFO (Employees Provident Fund Organisation) subscribers, used as formal employment proxy',
        ],
        intuition: `This ratio quantifies how much bank credit must be deployed to create one unit of 
        formal employment — a credit productivity measure. A rising L/J ratio means credit is expanding 
        faster than jobs, which can signal credit flowing into unproductive assets (real estate speculation, 
        financial arbitrage) rather than the real economy. For India, where EPFO data is the highest-
        frequency formal employment signal, this metric bridges the monetary and real economy divide.`,
        institutionalUse: `Developed by GraphiQuestor as a proprietary composite. The underlying logic 
        maps to the BIS "Credit-to-GDP gap" methodology but calibrated to emerging market employment 
        data. The RBI's "Report on Currency and Finance" tracks credit-employment elasticity as a 
        structural growth diagnostic in a conceptually similar framework.`,
        interpretation: [
            { label: 'Low Productivity', condition: 'L/J > ₹50Cr per job', color: 'text-terminal-rose' },
            { label: 'Monitoring Zone', condition: '₹25Cr < L/J ≤ ₹50Cr', color: 'text-orange-400' },
            { label: 'Healthy Range', condition: 'L/J ≤ ₹25Cr', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/intel/india',
        relatedPageLabel: 'India Macro Intel',
        sources: ['RBI DBIE (Bank Credit Data)', 'EPFO Monthly Payroll Data', 'MOSPI'],
    },

    // ── De-Dollarization Block ────────────────────────────────────────────────
    {
        id: 'global-usd-reserve-share',
        name: 'Global USD Reserve Share',
        category: 'De-Dollarization',
        formula: 'USD Reserve Share = (USD-denominated Allocated Reserves / Total Allocated Reserves) × 100',
        components: [
            'USD-denominated Allocated Reserves – Dollar holdings reported by central banks to the IMF COFER database',
            'Total Allocated Reserves – All currency-allocated foreign exchange reserves globally',
        ],
        intuition: `The USD Reserve Share is the definitive metric for tracking structural de-dollarisation. 
        It has declined from 73% at the turn of the millennium to approximately 58% in 2024 — a 
        structural shift that occurs slowly but has profound implications for dollar demand, US 
        Treasury yields, and the exorbitant privilege underpinning American fiscal policy. Even a 
        1 percentage point shift implies roughly $200–300B in reserve reallocation decisions by 
        central banks globally.`,
        institutionalUse: `Tracked by every major central bank research division. The IMF publishes 
        COFER data quarterly with a one-quarter lag. Goldman Sachs, JPMorgan, and BIS researchers 
        have all published dedicated studies on the pace and composition of reserve diversification. 
        This metric is a core input in currency reserve management frameworks at sovereign wealth funds.`,
        interpretation: [
            { label: 'Accelerating Decline', condition: 'YoY Δ < −1.0pp', color: 'text-terminal-rose' },
            { label: 'Gradual Erosion', condition: '−1.0pp ≤ YoY Δ < 0', color: 'text-orange-400' },
            { label: 'Stable', condition: 'YoY |Δ| < 0.5pp', color: 'text-terminal-muted' },
            { label: 'Recovering', condition: 'YoY Δ > 0.5pp', color: 'text-terminal-blue' },
        ],
        relatedPage: '/labs/de-dollarization-gold',
        relatedPageLabel: 'De-Dollarization & Gold Lab',
        sources: ['IMF COFER', 'BIS Statistics Portal'],
    },

    // ── Sovereign Stress Block ────────────────────────────────────────────────
    {
        id: 'sovereign-stress-index',
        name: 'Sovereign Stress Index',
        category: 'Sovereign Risk',
        formula: 'SSI = 0.35×(CDS Spread Z) + 0.25×(10Y-2Y Spread Z) + 0.25×(FX Vol Z) + 0.15×(Debt/GDP Z)',
        components: [
            'CDS Spread Z – 5-year sovereign CDS spread normalised to global EM distribution',
            '10Y-2Y Spread Z – Yield curve slope (can invert during stress), Z-scored over 10-year history',
            'FX Vol Z – Currency implied volatility, normalised; higher = more stress',
            'Debt/GDP Z – Sovereign debt-to-GDP ratio, normalised against peer EM benchmark',
        ],
        intuition: `No single sovereign stress signal is reliable in isolation. CDS spreads can be 
        illiquid; yield curves distorted by QE; FX volatility driven by global risk-off. By 
        compositing four independent signals with empirically-derived weights, the SSI is more 
        robust than any single-factor measure. The index is designed to be comparable across 
        countries and time periods, making it suitable for cross-sovereign portfolio risk assessment.`,
        institutionalUse: `Analogous to the IMF's "Vulnerability Exercise for Emerging Markets" 
        composite scoring. Rating agencies construct similar multi-factor stress indices for their 
        sovereign rating watches. The ECB's Financial Stability Review uses equivalent composites 
        for euro area peripheral country monitoring.`,
        interpretation: [
            { label: 'Systemic Crisis Risk', condition: 'SSI > 3.0', color: 'text-terminal-rose' },
            { label: 'Elevated Stress', condition: '1.5 < SSI ≤ 3.0', color: 'text-orange-400' },
            { label: 'Watch Zone', condition: '0.5 < SSI ≤ 1.5', color: 'text-terminal-gold' },
            { label: 'Stable', condition: 'SSI ≤ 0.5', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/labs/sovereign-stress',
        relatedPageLabel: 'Sovereign Stress Lab',
        sources: ['BIS Statistics Portal', 'Bloomberg (CDS, FX Vol)', 'IMF WEO (Debt/GDP)'],
    },

    // ── Z-Score Methodology ───────────────────────────────────────────────────
    {
        id: 'zscore-methodology',
        name: 'Universal Z-Score Standardisation',
        category: 'Statistical Methods',
        formula: 'Z(t) = [X(t) − μ(rolling N)] / σ(rolling N)',
        components: [
            'X(t) – Raw metric value at time t',
            'μ(rolling N) – Rolling arithmetic mean computed over N periods (default: 25 years / 300 months)',
            'σ(rolling N) – Rolling standard deviation over same window',
            'N = 25 years – Chosen to span full debt supercycle and monetary regime cycles post-1971',
        ],
        intuition: `The 25-year window is a deliberate methodological choice. Shorter windows 
        (1–5 years) are too sensitive to the most recent cycle and will not detect regime shifts 
        accurately. Longer windows (40+ years) include structurally different monetary regimes 
        (Bretton Woods, Volcker shock) that distort the baseline. 25 years — roughly three full 
        business cycles — captures enough history to render the Z-Score regime-invariant while 
        remaining relevant to the current monetary framework.`,
        institutionalUse: `The Federal Reserve H.4.1 analytical teams, BIS Quarterly Review researchers, 
        and Goldman Sachs Financial Conditions Monitor all use equivalent rolling Z-Score normalisation 
        for their liquidity and credit data series. The methodology is also used by the IMF in their 
        "Early Warning Exercise" for financial stability surveillance.`,
        interpretation: [
            { label: 'Extreme Stress (≤ −2σ)', condition: 'Z < −2.0', color: 'text-terminal-rose' },
            { label: 'Moderate Stress (−2σ to −1σ)', condition: '−2.0 ≤ Z < −1.0', color: 'text-orange-400' },
            { label: 'Normal Range (±1σ)', condition: '−1.0 ≤ Z ≤ 1.0', color: 'text-terminal-muted' },
            { label: 'Elevated (1σ to 2σ)', condition: '1.0 < Z ≤ 2.0', color: 'text-terminal-gold' },
            { label: 'Extreme Expansion (> 2σ)', condition: 'Z > 2.0', color: 'text-terminal-blue' },
        ],
        sources: ['Internal methodology — data inputs vary by metric'],
    },
];

// ── Category Metadata ─────────────────────────────────────────────────────────

const CATEGORIES = [
    { id: 'all', label: 'All Metrics', icon: BookOpen },
    { id: 'Liquidity', label: 'Liquidity', icon: Zap },
    { id: 'Fiscal Health', label: 'Fiscal Health', icon: Shield },
    { id: 'Energy & Commodities', label: 'Energy', icon: FlaskConical },
    { id: 'Credit Quality', label: 'Credit', icon: BarChart3 },
    { id: 'De-Dollarization', label: 'De-Dollarization', icon: Globe },
    { id: 'Sovereign Risk', label: 'Sovereign Risk', icon: TrendingUp },
    { id: 'Statistical Methods', label: 'Statistics', icon: BookOpen },
];

const CATEGORY_COLORS: Record<string, string> = {
    'Liquidity': 'text-terminal-blue border-terminal-blue/30 bg-terminal-blue/10',
    'Fiscal Health': 'text-terminal-rose border-terminal-rose/30 bg-terminal-rose/10',
    'Energy & Commodities': 'text-terminal-gold border-terminal-gold/30 bg-terminal-gold/10',
    'Credit Quality': 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    'De-Dollarization': 'text-orange-400 border-orange-400/30 bg-orange-400/10',
    'Sovereign Risk': 'text-terminal-emerald border-terminal-emerald/30 bg-terminal-emerald/10',
    'Statistical Methods': 'text-terminal-muted border-terminal-muted/30 bg-terminal-muted/10',
};

// ── MetricCard ────────────────────────────────────────────────────────────────

const MetricCard: React.FC<{ metric: MetricEntry }> = ({ metric }) => {
    const [expanded, setExpanded] = useState(false);
    const colorClass = CATEGORY_COLORS[metric.category] ?? 'text-terminal-muted border-border bg-muted/10';

    return (
        <article
            id={metric.id}
            className="group border border-border/60 rounded-2xl bg-card/30 overflow-hidden transition-all duration-300 hover:border-border"
            aria-label={metric.name}
        >
            {/* Header */}
            <button
                className="w-full text-left p-6 flex items-start gap-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500"
                onClick={() => setExpanded(prev => !prev)}
                aria-expanded={expanded}
                aria-controls={`metric-body-${metric.id}`}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-uppercase border',
                            colorClass
                        )}>
                            {metric.category}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-heading leading-tight">
                        {metric.name}
                    </h3>
                    <code className="block mt-2 text-xs text-terminal-muted font-mono leading-relaxed">
                        {metric.formula}
                    </code>
                </div>
                <div className="flex-shrink-0 ml-4 text-terminal-muted mt-1">
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
            </button>

            {/* Expandable Body */}
            {expanded && (
                <div
                    id={`metric-body-${metric.id}`}
                    className="px-6 pb-6 space-y-6 border-t border-border/40"
                >
                    {/* Formula Components */}
                    <section aria-label="Formula components">
                        <h4 className="text-[10px] font-black uppercase tracking-uppercase text-terminal-muted mb-3 pt-5">
                            Formula Components
                        </h4>
                        <ul className="space-y-2">
                            {metric.components.map((comp, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                                    <span className="w-1.5 h-1.5 rounded-full bg-terminal-blue flex-shrink-0 mt-2" />
                                    <code className="font-mono text-xs leading-relaxed">{comp}</code>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Intuition */}
                    <section aria-label="Economic intuition">
                        <h4 className="text-[10px] font-black uppercase tracking-uppercase text-terminal-muted mb-3">
                            Economic Intuition
                        </h4>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                            {metric.intuition}
                        </p>
                    </section>

                    {/* Institutional Use */}
                    <section aria-label="Institutional use cases">
                        <h4 className="text-[10px] font-black uppercase tracking-uppercase text-terminal-muted mb-3">
                            Institutional Use Cases
                        </h4>
                        <div className="p-4 rounded-xl border border-terminal-blue/20 bg-terminal-blue/[0.04]">
                            <p className="text-sm text-foreground/70 leading-relaxed">
                                {metric.institutionalUse}
                            </p>
                        </div>
                    </section>

                    {/* Signal Interpretation */}
                    <section aria-label="Signal interpretation table">
                        <h4 className="text-[10px] font-black uppercase tracking-uppercase text-terminal-muted mb-3">
                            Signal Interpretation
                        </h4>
                        <div className="rounded-xl border border-border/50 overflow-hidden">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/20 border-b border-border/50">
                                    <tr>
                                        <th className="py-2 px-4 text-left font-bold text-terminal-muted">Signal</th>
                                        <th className="py-2 px-4 text-left font-bold text-terminal-muted">Condition</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {metric.interpretation.map((row, i) => (
                                        <tr key={i} className="hover:bg-muted/10 transition-colors">
                                            <td className={cn('py-2 px-4 font-bold', row.color)}>{row.label}</td>
                                            <td className="py-2 px-4 font-mono text-terminal-muted">{row.condition}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Footer: Sources + Link */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/30">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-uppercase text-terminal-muted mr-2">Sources:</span>
                            {metric.sources.map((src, i) => (
                                <span key={i} className="text-xs text-terminal-muted">
                                    {src}{i < metric.sources.length - 1 ? ', ' : ''}
                                </span>
                            ))}
                        </div>
                        {metric.relatedPage && (
                            <Link
                                to={metric.relatedPage}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-terminal-blue hover:text-blue-300 transition-colors"
                            >
                                <ExternalLink size={12} />
                                {metric.relatedPageLabel}
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </article>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const METHODOLOGY_JSON_LD = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    name: 'GraphiQuestor Macro Intelligence Methodology',
    headline: 'Metric Methodology & Calculation Framework',
    description: 'Detailed formulas, intuition, and institutional use cases for every derived macro metric on GraphiQuestor, including Net Liquidity Z-Score, Debt/Gold Z-Score, Fiscal Dominance Meter, and Sovereign Stress Index.',
    url: 'https://graphiquestor.com/methodology',
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

export const MetricsMethodologyPage: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('all');

    const filtered = activeCategory === 'all'
        ? METRICS
        : METRICS.filter(m => m.category === activeCategory);

    return (
        <div className="min-h-screen bg-background">
            <SEOManager
                title="Metric Methodology & Calculation Framework"
                description="Detailed formulas, economic intuition, and institutional use cases for every derived macro metric on GraphiQuestor — Net Liquidity Z-Score, Debt/Gold Z-Score, Fiscal Dominance Meter, Energy Dependency Ratio, and more."
                keywords={[
                    'Net Liquidity Z-Score methodology', 'Debt Gold ratio formula', 'Fiscal Dominance Meter',
                    'Energy Dependency Ratio', 'Sovereign Stress Index', 'macro metric calculation',
                    'institutional macro analysis', 'Z-score financial methodology',
                ]}
                canonicalUrl="https://graphiquestor.com/methodology"
                jsonLd={METHODOLOGY_JSON_LD}
            />

            {/* Hero */}
            <header className="w-full border-b border-border/40 bg-card/20 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terminal-blue/10 border border-terminal-blue/20 text-terminal-blue text-[10px] font-black uppercase tracking-uppercase mb-6">
                        <BookOpen size={12} />
                        Methodology Disclosure
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-heading text-foreground mb-4 leading-tight">
                        Metric Methodology &amp;<br />
                        <span className="text-terminal-blue">Calculation Framework</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-6">
                        Every derived metric on this platform is documented with its precise formula,
                        underlying data components, economic intuition, and real-world institutional use cases.
                        All Z-scores use a <strong className="text-foreground">25-year rolling window</strong> to
                        capture full debt and monetary cycles post-1971.
                    </p>

                    {/* Breadcrumb nav */}
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-foreground">Methodology</span>
                    </nav>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Principles Grid */}
                <section aria-labelledby="principles-heading" className="mb-16">
                    <h2 id="principles-heading" className="text-2xl font-bold tracking-heading text-foreground mb-8">
                        Core Analytical Principles
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'Regime-Invariant Design',
                                desc: 'All metrics are normalised against long-run distributions, not recent history. This prevents cycle bias and ensures signals remain comparable across monetary regimes.',
                                color: 'border-terminal-blue/20 bg-terminal-blue/[0.03]',
                                accent: 'text-terminal-blue',
                            },
                            {
                                title: 'Institutional Source Hierarchy',
                                desc: 'Primary sources (FRED, IMF, BIS, RBI DBIE) take precedence over secondary aggregators. Market data (Yahoo Finance) is used only for high-frequency price signals.',
                                color: 'border-terminal-emerald/20 bg-terminal-emerald/[0.03]',
                                accent: 'text-terminal-emerald',
                            },
                            {
                                title: 'Transparent Composition',
                                desc: 'Every composite metric documents its weights and component definitions. There are no black-box signals — every formula is reproducible by any analyst with access to the same inputs.',
                                color: 'border-terminal-gold/20 bg-terminal-gold/[0.03]',
                                accent: 'text-terminal-gold',
                            },
                        ].map((p) => (
                            <Card key={p.title} className={cn('p-6 border', p.color)}>
                                <h3 className={cn('text-base font-bold mb-2', p.accent)}>{p.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Category Filter */}
                <nav aria-label="Category filter" className="flex flex-wrap gap-2 mb-8">
                    {CATEGORIES.map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setActiveCategory(id)}
                            className={cn(
                                'px-4 py-2 rounded-full text-xs font-bold uppercase tracking-uppercase border transition-all duration-200',
                                activeCategory === id
                                    ? 'bg-terminal-blue/20 border-terminal-blue/40 text-terminal-blue'
                                    : 'bg-transparent border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </nav>

                {/* Metrics List */}
                <section aria-labelledby="metrics-heading" className="space-y-4">
                    <h2 id="metrics-heading" className="sr-only">Metric Definitions</h2>
                    {filtered.map(metric => (
                        <MetricCard key={metric.id} metric={metric} />
                    ))}
                </section>

                {/* Regime Detection */}
                <section aria-labelledby="regime-heading" className="mt-20 space-y-8">
                    <div>
                        <h2 id="regime-heading" className="text-2xl font-bold tracking-heading text-foreground mb-2">
                            Macro Regime Classification
                        </h2>
                        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                            The platform classifies the macro environment into three regimes using a deterministic 
                            rules-based model combining normalised liquidity and volatility signals. No machine learning 
                            or probabilistic inference is used — the classification is fully transparent and auditable.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'Tightening Risk',
                                rule: 'Net Liquidity Z < −1.5 OR SOFR Spread > 15bps',
                                color: 'border-terminal-rose/20 bg-terminal-rose/[0.03]',
                                textColor: 'text-terminal-rose',
                                desc: 'Central bank liquidity withdrawal is at a pace that historically precedes credit event risk. Reduce duration; increase defensive positioning.',
                            },
                            {
                                title: 'Liquidity Expansion',
                                rule: 'Net Liquidity Z > 1.5 AND SOFR Spread < 5bps',
                                color: 'border-terminal-emerald/20 bg-terminal-emerald/[0.03]',
                                textColor: 'text-terminal-emerald',
                                desc: 'Aggressive central bank accommodation or TGA drain is injecting reserves into the system. Risk appetite historically elevated in this regime.',
                            },
                            {
                                title: 'Neutral / Structural',
                                rule: '−1.5 ≤ Net Liquidity Z ≤ 1.5',
                                color: 'border-border/40',
                                textColor: 'text-muted-foreground',
                                desc: 'Signals within ±1.5σ of the 25-year mean. Market is in a trend-following structural phase. Factor and momentum strategies historically outperform.',
                            },
                        ].map(r => (
                            <Card key={r.title} className={cn('p-6 border', r.color)}>
                                <h3 className={cn('text-base font-bold mb-1', r.textColor)}>{r.title}</h3>
                                <code className="block text-xs font-mono text-muted-foreground mb-3 leading-relaxed">{r.rule}</code>
                                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Cross-link to Data Sources */}
                <aside className="mt-16 p-8 rounded-2xl border border-terminal-blue/20 bg-terminal-blue/[0.03]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-foreground mb-1">Reviewing Our Data Sources?</h3>
                            <p className="text-sm text-muted-foreground">
                                Every metric above is backed by authoritative primary sources with documented refresh cadences.
                            </p>
                        </div>
                        <Link
                            to="/data-sources"
                            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terminal-blue/20 border border-terminal-blue/30 text-terminal-blue text-sm font-bold hover:bg-terminal-blue/30 transition-colors"
                        >
                            <ExternalLink size={14} />
                            View Data Sources
                        </Link>
                    </div>
                </aside>
            </main>
        </div>
    );
};
