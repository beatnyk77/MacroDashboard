import type { ResearchCitationInput } from '@/lib/researchCitation';

/** Citation metadata for /methods/* articles — consumed by CiteThisPage via pathname. */
export const METHOD_CITATIONS: Record<string, ResearchCitationInput> = {
    'net-liquidity-z-score': {
        title: 'Net Liquidity Z-Score — Methodology',
        path: '/methods/net-liquidity-z-score',
        pageType: 'methodology',
        category: 'Liquidity',
        summary:
            'Normalises Fed effective market liquidity (WALCL − TGA − ON RRP) against a 25-year rolling window to classify monetary regimes.',
        keyPoints: [
            'Net Liquidity = Fed balance sheet minus Treasury General Account minus overnight reverse repo.',
            'Z-scores ≤ −1.5 historically align with equity drawdown risk; ≥ +1.5 with expansionary regimes.',
            'All inputs sourced from FRED with live staleness flags on GraphiQuestor.',
        ],
        formula: 'Z = (Net Liquidity − μ₂₅ᵧ) / σ₂₅ᵧ',
        source: 'FRED: WALCL, WTREGEN, RRPONTSYD',
    },
    'debt-gold-z-score': {
        title: 'Debt/Gold Z-Score — Methodology',
        path: '/methods/debt-gold-z-score',
        pageType: 'methodology',
        category: 'Hard Assets',
        summary:
            'Compares US federal debt outstanding to official gold reserves to measure implied gold backing and structural undervaluation signals.',
        keyPoints: [
            'Uses Treasury fiscal data and official gold stock series with 25-year Z-score context.',
            'Extreme positive Z-scores have preceded multi-year gold bull phases.',
            'Designed for sovereign solvency surveillance, not short-term trading.',
        ],
        source: 'FRED, US Treasury FiscalData, World Gold Council',
    },
    'm2-gold-ratio': {
        title: 'M2/Gold Ratio — Methodology',
        path: '/methods/m2-gold-ratio',
        pageType: 'methodology',
        category: 'Hard Assets',
        summary:
            'Structural debasement gauge comparing global M2 money supply to above-ground gold market capitalisation at spot prices.',
        keyPoints: [
            'Rising ratio = fiat expanding faster than gold; historically precedes gold re-ratings.',
            '2020 COVID stimulus pushed the ratio to a 30-year high — a mean-reversion setup.',
            'Interactive explorer available on GraphiQuestor terminal and glossary.',
        ],
        formula: 'M2/Gold Ratio = Global M2 (USD) / (Above-ground gold oz × Spot price)',
        source: 'BIS, World Gold Council, FRED',
    },
    'fiscal-dominance-meter': {
        title: 'Fiscal Dominance Meter — Methodology',
        path: '/methods/fiscal-dominance-meter',
        pageType: 'methodology',
        category: 'Sovereign Debt',
        summary:
            'Composite score tracking when debt service constraints compromise independent monetary policy — net interest vs revenue plus deficit dynamics.',
        keyPoints: [
            'Fiscal dominance emerges when interest expense crowds out policy flexibility.',
            'Combines interest/revenue ratio with deficit/GDP for regime classification.',
            'Used by macro desks monitoring US Treasury rollover and Fed reaction function.',
        ],
        source: 'FRED, US Treasury FiscalData',
    },
    'energy-dependency-ratio': {
        title: 'Energy Dependency Ratio — Methodology',
        path: '/methods/energy-dependency-ratio',
        pageType: 'methodology',
        category: 'Macro Indicators',
        summary:
            'Measures import dependency on hydrocarbons relative to GDP and industrial output — a physical constraint overlay for growth hubs.',
        keyPoints: [
            'Captures energy security risk beyond spot oil prices.',
            'Critical for India, China, and EM current-account surveillance.',
            'Paired with SPR levels and refining capacity on GraphiQuestor.',
        ],
        source: 'EIA, IEA, national statistical agencies',
    },
    'loan-to-job-efficiency': {
        title: 'Loan-to-Job Efficiency — Methodology',
        path: '/methods/loan-to-job-efficiency',
        pageType: 'methodology',
        category: 'Macro Indicators',
        summary:
            'India-specific credit productivity metric linking RBI credit growth to formal employment creation via EPFO registrations.',
        keyPoints: [
            'Measures whether credit expansion translates to productive employment.',
            "State-level granularity for India's federal credit cycle.",
            'Proprietary composite built on MoSPI and RBI official series.',
        ],
        source: 'RBI DBIE, EPFO, MoSPI',
    },
    'fed-monetization-monitor': {
        title: 'Fed Debt Monetization Monitor — Methodology',
        path: '/methods/fed-monetization-monitor',
        pageType: 'methodology',
        category: 'Monetary Policy',
        summary:
            'Tracks the proportion of net Treasury issuance absorbed by the Federal Reserve — a stealth QE / fiscal dominance indicator.',
        keyPoints: [
            'Rising Fed share of issuance signals monetary financing of deficits.',
            'Distinct from headline QE announcements — captures flow, not stock.',
            'Pairs with TGA and RRP for full liquidity plumbing context.',
        ],
        source: 'FRED, Federal Reserve H.4.1, Treasury FiscalData',
    },
    'india-credit-cycle-clock': {
        title: 'India Credit Cycle Clock — Methodology',
        path: '/methods/india-credit-cycle-clock',
        pageType: 'methodology',
        category: 'Macro Indicators',
        summary:
            "Phase clock for India's credit cycle using bank credit growth, yield curve shape, and liquidity conditions.",
        keyPoints: [
            'Classifies expansion, peak, contraction, and trough phases for allocation overlays.',
            'Built on RBI and MoSPI official data with daily refresh.',
            'Complements India Macro Pulse hub on GraphiQuestor.',
        ],
        source: 'RBI DBIE, MoSPI',
    },
    'de-dollarization-guide': {
        title: 'De-Dollarization Guide — Methodology',
        path: '/methods/de-dollarization-guide',
        pageType: 'methodology',
        category: 'Geopolitics',
        summary:
            'Framework for tracking reserve currency share shifts, bilateral settlement systems, and central bank gold accumulation.',
        keyPoints: [
            'IMF COFER reserve composition with BRICS+ settlement telemetry.',
            'Gold purchases by central banks as structural de-dollarization signal.',
            'Links to Sovereign Compass and Trade Intelligence modules.',
        ],
        source: 'IMF COFER, BIS, World Gold Council',
    },
};

export function getMethodCitation(pathname: string): ResearchCitationInput | null {
    const slug = pathname.replace(/^\/methods\//, '').replace(/\/$/, '');
    return METHOD_CITATIONS[slug] ?? null;
}