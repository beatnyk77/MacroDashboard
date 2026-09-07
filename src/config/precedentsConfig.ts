/**
 * Precedents Configuration Registry
 * 
 * Canonical macro shock regimes and structural transitions.
 * Observe structural reality. Do not forecast.
 */

export interface MacroPrecedent {
    id: string;
    name: string;
    shortLabel: string;
    tZeroDate: string; // The anchor event (e.g. Rate hike shock, Lehman collapse, speech)
    startDate: string; // T - 60d or relevant lookback
    endDate: string;   // T + 180d or horizon
    summary: string;
    shockEvent: string;
    structuralDivergence: string; // Essential institutional perspective: why today is different
    tags: ('liquidity-shock' | 'sovereign-stress' | 'fx-defense' | 'inflation-surge')[];
    applicableMetrics: {
        metricId: string;
        label: string;
        relevanceDescription: string;
    }[];
}

export const MACRO_PRECEDENTS: MacroPrecedent[] = [
    {
        id: '2013-taper-tantrum',
        name: '2013 Taper Tantrum',
        shortLabel: '2013 Taper Tantrum',
        tZeroDate: '2013-05-22', // Bernanke congressional testimony on tapering QE
        startDate: '2013-03-01',
        endDate: '2013-12-31',
        shockEvent: 'Ben Bernanke indicates Fed could begin scaling back monthly asset purchases.',
        summary: 'Sudden spike in US 10Y Treasury yields (+140 bps in 4 months) triggered massive capital flight from EM Asia and severe FX depreciation across the "Fragile Five".',
        structuralDivergence: 'In 2013, India\'s FX reserves stood at ~$290B covering only 6.5 months of imports with a 4.8% CAD. Today, RBI FX reserves exceed $640B (>11 months import cover) and external debt-to-GDP is markedly lower.',
        tags: ['liquidity-shock', 'fx-defense'],
        applicableMetrics: [
            {
                metricId: 'UST_10Y_YIELD',
                label: 'US 10-Year Benchmark Yield',
                relevanceDescription: 'Surged from 1.63% to over 3.00% as markets repriced term premium.'
            },
            {
                metricId: 'IN_FX_RESERVES',
                label: 'India RBI FX Reserves',
                relevanceDescription: 'Rapid drawdowns to defend the rupee before emergency NRI deposit schemes.'
            },
            {
                metricId: 'DXY_INDEX',
                label: 'US Dollar Index (DXY)',
                relevanceDescription: 'Broad-based dollar rally squeezing dollar-denominated EM corporate debt.'
            }
        ]
    },
    {
        id: '2018-fed-qt-repo-spike',
        name: '2018–2019 Fed QT & Repo Freeze',
        shortLabel: '2018–19 QT & Repo Freeze',
        tZeroDate: '2018-10-03', // Powell "long way from neutral" speech & peak QT pace
        startDate: '2018-08-01',
        endDate: '2019-10-15',
        shockEvent: 'Fed balance sheet runoff reached $50B/month cap while US Treasury net issuance accelerated.',
        summary: 'Quantitative tightening steadily drained bank reserves until funding markets seized in September 2019, causing SOFR/repo rates to spike to 10% intraday and forcing Fed standing repo facilities.',
        structuralDivergence: 'Today, the Fed utilizes the Standing Repo Facility (SRF) as a backstop ceiling, and Overnight Reverse Repo (ON RRP) balances acted as a liquidity cushion throughout 2023-2024.',
        tags: ['liquidity-shock'],
        applicableMetrics: [
            {
                metricId: 'FED_BALANCE_SHEET',
                label: 'Federal Reserve Total Assets',
                relevanceDescription: 'Runoff compressed bank reserves below structural minimum operating levels (LCLoR).'
            },
            {
                metricId: 'SOFR_EFFR_SPREAD_BPS',
                label: 'SOFR vs EFFR Spread',
                relevanceDescription: 'Severe funding market dislocation culminating in the September 2019 repo spike.'
            },
            {
                metricId: 'SPX_INDEX',
                label: 'S&P 500 Index',
                relevanceDescription: 'Severe Q4 2018 equity drawdown (-19.8%) forcing the January 2019 "Powell Pivot".'
            }
        ]
    },
    {
        id: '2022-inflation-rate-shock',
        name: '2022 Fed Aggressive Tightening',
        shortLabel: '2022 Tightening Cycle',
        tZeroDate: '2022-03-16', // First Fed rate hike of cycle (+25 bps, followed by four consecutive +75 bps)
        startDate: '2022-01-01',
        endDate: '2023-03-31',
        shockEvent: 'Fed initiates the most aggressive rate-hike campaign since Paul Volcker (+525 bps total).',
        summary: 'Global energy price shock compounded by rapid policy rate escalation led to historic sovereign bond drawdowns and inverted yield curves globally.',
        structuralDivergence: 'Unlike 2022 when CPI exceeded 9% and supply chains were paralyzed, current macro conditions reflect disinflation or normalized supply chains with higher baseline real rates.',
        tags: ['inflation-surge', 'sovereign-stress'],
        applicableMetrics: [
            {
                metricId: 'UST_10Y_2Y_SPREAD',
                label: 'US 10Y-2Y Yield Curve Spread',
                relevanceDescription: 'Deepest inversion since 1981, signaling aggressive policy restriction.'
            },
            {
                metricId: 'OIL_BRENT_PRICE_USD',
                label: 'Brent Crude Oil Price',
                relevanceDescription: 'Geopolitical energy supply dislocation driving headline inflation transmission.'
            },
            {
                metricId: 'US_CPI_YOY',
                label: 'US CPI Headline YoY',
                relevanceDescription: 'Peaked at 9.1% in June 2022, driving central bank terminal rate repricing.'
            }
        ]
    },
    {
        id: '2008-gfc-liquidity-freeze',
        name: '2008 Great Financial Crisis',
        shortLabel: '2008 GFC Shock',
        tZeroDate: '2008-09-15', // Lehman Brothers bankruptcy filing
        startDate: '2008-06-01',
        endDate: '2009-06-30',
        shockEvent: 'Lehman Brothers files for Chapter 11 bankruptcy, freezing global interbank lending.',
        summary: 'Systemic banking solvency crisis causing extreme counterparty risk aversion, collapse of commercial paper markets, and worldwide deflationary credit contraction.',
        structuralDivergence: 'Global Tier 1 banking capital ratios and liquidity coverage ratios (LCR) are more than double 2008 levels under Basel III, preventing systemic interbank counterparty freezes.',
        tags: ['liquidity-shock', 'sovereign-stress'],
        applicableMetrics: [
            {
                metricId: 'TED_SPREAD',
                label: 'TED Spread (3M LIBOR - 3M T-Bill)',
                relevanceDescription: 'Reached historic record >450 bps reflecting extreme interbank lending freeze.'
            },
            {
                metricId: 'GOLD_PRICE_USD',
                label: 'Spot Gold Price',
                relevanceDescription: 'Initial margin-call liquidation followed by historic monetary debasement hedge rally.'
            }
        ]
    }
];

export function getPrecedentById(id: string): MacroPrecedent | undefined {
    return MACRO_PRECEDENTS.find(p => p.id === id);
}

export function getPrecedentsForMetric(metricId: string): MacroPrecedent[] {
    return MACRO_PRECEDENTS.filter(p => p.applicableMetrics.some(m => m.metricId === metricId));
}
