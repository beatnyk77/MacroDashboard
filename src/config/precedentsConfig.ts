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
                metricId: 'USD_INR_RATE',
                label: 'USD/INR Exchange Rate',
                relevanceDescription: 'Plunged from 54.0 to over 68.8 as external financing stress hit the Fragile Five currencies.'
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
                metricId: 'UST_10Y_2Y_SPREAD',
                label: 'US 10Y-2Y Yield Curve Spread',
                relevanceDescription: 'Flattened from +50 bps to near-inversion as QT drained liquidity and markets priced restrictive policy.'
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
                metricId: 'UST_10Y_YIELD',
                label: 'US 10-Year Benchmark Yield',
                relevanceDescription: 'Violent sovereign rate shock surging from 1.5% to >4.2%, driving cross-asset repricing.'
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
                metricId: 'FED_BALANCE_SHEET',
                label: 'Federal Reserve Total Assets',
                relevanceDescription: 'Emergency balance sheet expansion more than doubling from $900B to $2.2T to backstop insolvent bank funding.'
            },
            {
                metricId: 'GOLD_PRICE_USD',
                label: 'Spot Gold Price',
                relevanceDescription: 'Initial margin-call liquidation followed by historic monetary debasement hedge rally.'
            },
            {
                metricId: 'US_DEBT_GDP_PCT',
                label: 'US Public Debt / GDP',
                relevanceDescription: 'Surged from 64% in 2007 to over 85% by 2009 as fiscal stabilizers and TARP deployed.'
            }
        ]
    },
    {
        id: '2020-covid-monetary-shock',
        name: '2020 COVID M2 Expansion & Debasement',
        shortLabel: '2020 COVID M2 Surge',
        tZeroDate: '2020-03-23', // Fed announces unlimited QE and emergency liquidity facilities
        startDate: '2020-01-01',
        endDate: '2021-06-30',
        shockEvent: 'Federal Reserve unleashes unlimited open-ended asset purchases; US Treasury injects $5T+ in fiscal stimulus.',
        summary: 'US M2 expanded by +27% YoY, the fastest rate in post-WWII history, causing the M2-to-Gold index to spike to 148 before initiating a multi-year structural gold catch-up cycle.',
        structuralDivergence: 'In 2020, fiscal transfers directly funded household bank accounts, driving immediate velocity and M2 surge. Today, M2 is constrained by high real policy rates and quantitative tightening runoff.',
        tags: ['liquidity-shock', 'inflation-surge'],
        applicableMetrics: [
            {
                metricId: 'US_M2',
                label: 'US M2 Money Supply',
                relevanceDescription: 'Exploded from $15.4T to over $21.5T within 18 months.'
            },
            {
                metricId: 'GOLD_PRICE_USD',
                label: 'Spot Gold Price',
                relevanceDescription: 'Broke all-time highs ($2,075/oz in Aug 2020) reflecting fiat currency debasement hedges.'
            },
            {
                metricId: 'US_DEBT_GDP_PCT',
                label: 'US Public Debt / GDP',
                relevanceDescription: 'Spiked to historic peak of ~132% of GDP in Q2 2020.'
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
