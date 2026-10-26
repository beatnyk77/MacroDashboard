/**
 * dossierRegistry — the 25 /metrics/:id pages rendered as full chart dossiers.
 * Methodology copy lives in METRICS_CATALOG (same id); this file declares how to
 * build each series from stored observations and how to present it.
 */

import { METRIC_IDS as MID } from '@/constants/metricIds';
import type { EpisodeKey } from './macroEpisodes';

export type DossierSource =
    | { kind: 'observations'; metricId: string; scale?: number }
    | { kind: 'netLiquidity'; field: 'value' | 'z_score' }
    /**
     * numerator ÷ denominator on matching months. `minNumerator` keeps only numerator
     * observations at or above a unit floor when a stored series mixes units.
     */
    | { kind: 'ratio'; numerator: string; denominator: string; minNumerator?: number }
    /** nominal series deflated to the latest month of a price index */
    | { kind: 'real'; metricId: string; deflator: string }
    /** policy rate minus YoY inflation computed from a price index */
    | { kind: 'realRate'; rate: string; priceIndex: string };

export type DossierUnit = 'ratio' | 'pct' | 'bp' | 'usd-bn' | 'usd-oz' | 'sigma';

export type DossierPillar = 'Liquidity' | 'Gold & reserves' | 'Fiscal' | 'Rates & credit';

export interface DossierSpec {
    /** = METRICS_CATALOG id and URL slug */
    id: string;
    /** Display name when the charted series is narrower than the catalog metric */
    name?: string;
    /** Shown above the catalog formula when the page charts one input of a composite */
    chartedSeries?: string;
    pillar: DossierPillar;
    /** Search-intent title (brand suffix added by SEOManager) */
    seoTitle: string;
    seoDescription: string;
    h1: string;
    source: DossierSource;
    /** Freshness/provenance chip — omitted for series computed only in the browser */
    liveMetricId?: string;
    unit: DossierUnit;
    decimals: number;
    logScale?: boolean;
    /** How a reader should state the unit in prose, e.g. "of tax receipts" */
    unitNote?: string;
    episodes: EpisodeKey[];
    compare: string[];
    glossary?: { to: string; label: string };
    upstream: { label: string; url: string }[];
}

const fred = (id: string) => ({ label: `FRED ${id}`, url: `https://fred.stlouisfed.org/series/${id}` });

export const DOSSIERS: DossierSpec[] = [
    // ── Liquidity ────────────────────────────────────────────────────────────
    {
        id: 'net-liquidity',
        pillar: 'Liquidity',
        seoTitle: 'Fed Net Liquidity Chart (WALCL − TGA − RRP) Since 2003',
        seoDescription: 'Fed net liquidity — balance sheet minus the Treasury General Account and reverse repo — charted since 2003 with percentile, 1-year change, and the episodes that moved it.',
        h1: 'Fed net liquidity: chart and history since 2003',
        source: { kind: 'netLiquidity', field: 'value' },
        unit: 'usd-bn',
        decimals: 0,
        episodes: ['lehman', 'qe1', 'qe3End', 'qt2017', 'repoSpike2019', 'covidQe', 'qt2022', 'rrpPeak', 'svb', 'debtCeiling2023'],
        compare: ['net-liquidity-zscore', 'tga-balance', 'reverse-repo-balance'],
        glossary: { to: '/glossary/net-liquidity-z-score/', label: 'Net liquidity z-score' },
        upstream: [fred('WALCL'), fred('WTREGEN'), fred('RRPONTSYD')],
    },
    {
        id: 'net-liquidity-zscore',
        pillar: 'Liquidity',
        seoTitle: 'Net Liquidity Z-Score: How Stretched Is Fed Liquidity?',
        seoDescription: 'Fed net liquidity expressed as a z-score against its own history since 2003 — where today sits versus QE peaks and QT troughs, with episode-by-episode outcomes.',
        h1: 'Net liquidity z-score: chart and history',
        source: { kind: 'netLiquidity', field: 'z_score' },
        unit: 'sigma',
        decimals: 2,
        episodes: ['lehman', 'qe3End', 'qt2017', 'repoSpike2019', 'covidQe', 'qt2022', 'svb'],
        compare: ['net-liquidity', 'tga-balance', 'reverse-repo-balance'],
        glossary: { to: '/glossary/net-liquidity-z-score/', label: 'Net liquidity z-score' },
        upstream: [fred('WALCL'), fred('WTREGEN'), fred('RRPONTSYD')],
    },
    {
        id: 'tga-balance',
        pillar: 'Liquidity',
        seoTitle: 'TGA Balance Chart (FRED WTREGEN): Treasury Cash at the Fed',
        seoDescription: 'Treasury General Account balance (FRED WTREGEN) charted with percentile and recent change, and how TGA rebuilds and drawdowns move bank reserves and net liquidity.',
        h1: 'Treasury General Account (TGA) balance',
        source: { kind: 'observations', metricId: MID.TGA_BALANCE_BN, scale: 0.001 },
        liveMetricId: MID.TGA_BALANCE_BN,
        unit: 'usd-bn',
        decimals: 0,
        episodes: ['debtCeiling2021', 'debtCeiling2023'],
        compare: ['net-liquidity', 'reverse-repo-balance', 'sofr-effr-spread'],
        glossary: { to: '/glossary/tga/', label: 'Treasury General Account (TGA)' },
        upstream: [fred('WTREGEN')],
    },
    {
        id: 'reverse-repo-balance',
        pillar: 'Liquidity',
        seoTitle: 'Fed Reverse Repo (ON RRP) Balance Chart: RRPONTSYD',
        seoDescription: 'Overnight reverse repo facility usage (FRED RRPONTSYD) charted with percentile and recent change — the liquidity buffer that funded QT and Treasury bill issuance.',
        h1: 'Overnight reverse repo (ON RRP) balance',
        source: { kind: 'observations', metricId: MID.RRP_BALANCE_BN },
        liveMetricId: MID.RRP_BALANCE_BN,
        unit: 'usd-bn',
        decimals: 1,
        episodes: ['rrpPeak', 'svb', 'debtCeiling2023'],
        compare: ['net-liquidity', 'tga-balance', 'sofr-effr-spread'],
        glossary: { to: '/glossary/reverse-repo-facility-rrp/', label: 'Reverse repo facility (RRP)' },
        upstream: [fred('RRPONTSYD')],
    },
    {
        id: 'fed-balance-sheet',
        pillar: 'Liquidity',
        seoTitle: 'Fed Balance Sheet (WALCL) Chart Since 2002: QE and QT',
        seoDescription: 'Federal Reserve total assets (FRED WALCL) weekly since 2002 — every QE expansion and QT runoff, with percentile, 1- and 5-year change, and episode outcomes.',
        h1: 'Fed balance sheet (WALCL) since 2002',
        source: { kind: 'observations', metricId: MID.FED_BALANCE_SHEET, scale: 0.001 },
        liveMetricId: MID.FED_BALANCE_SHEET,
        unit: 'usd-bn',
        decimals: 0,
        episodes: ['bnpFreeze', 'lehman', 'qe1', 'qe3End', 'qt2017', 'repoSpike2019', 'covidQe', 'qt2022', 'svb'],
        compare: ['net-liquidity', 'tga-balance', 'reverse-repo-balance'],
        upstream: [fred('WALCL')],
    },
    {
        id: 'us-m2-money-supply',
        pillar: 'Liquidity',
        seoTitle: 'US M2 Money Supply Chart and History Since 1959',
        seoDescription: 'US M2 money supply charted monthly since 1959 on a log scale, with 1- and 5-year growth, percentile, and the policy episodes behind each surge and contraction.',
        h1: 'US M2 money supply: chart and history since 1959',
        source: { kind: 'observations', metricId: MID.US_M2 },
        liveMetricId: MID.US_M2,
        unit: 'usd-bn',
        decimals: 0,
        logScale: true,
        episodes: ['nixonShock', 'volckerShock', 'lehman', 'qe1', 'covidQe', 'qt2022'],
        compare: ['m2-gold-ratio', 'fed-balance-sheet', 'real-fed-funds-rate'],
        upstream: [fred('M2SL')],
    },

    // ── Gold & reserves ──────────────────────────────────────────────────────
    {
        id: 'm2-gold-ratio',
        pillar: 'Gold & reserves',
        seoTitle: 'M2 to Gold Ratio Chart Since 1959: Is Gold Cheap vs Money?',
        seoDescription: 'US M2 money supply divided by the gold price since 1959 — percentile, last time at this level, and what the ratio did after the Nixon shock, the 1980 peak, the 2011 gold high, and 2020.',
        h1: 'M2 to gold ratio: chart and history since 1959',
        // Computed from components: the stored RATIO_M2_GOLD series skips individual months after 2010.
        source: { kind: 'ratio', numerator: MID.US_M2, denominator: MID.GOLD_PRICE_USD },
        liveMetricId: MID.RATIO_M2_GOLD,
        unit: 'ratio',
        decimals: 2,
        logScale: true,
        episodes: ['nixonShock', 'goldPeak1980', 'dotcomPeak', 'lehman', 'goldPeak2011', 'covidQe', 'russiaReserves'],
        compare: ['real-gold-price', 'spx-gold-ratio', 'us-m2-money-supply'],
        glossary: { to: '/glossary/m2-gold-ratio/', label: 'M2/gold ratio' },
        upstream: [fred('M2SL'), { label: 'World Bank Pink Sheet (gold, 1960 onward)', url: 'https://www.worldbank.org/en/research/commodity-markets' }],
    },
    {
        id: 'real-gold-price',
        pillar: 'Gold & reserves',
        seoTitle: 'Inflation-Adjusted Gold Price Chart Since 1947',
        seoDescription: 'Gold in today’s dollars — the nominal price deflated by US CPI, monthly since 1947. Compare the 1980 and 2011 peaks with today on a like-for-like basis.',
        h1: 'Gold price adjusted for inflation since 1947',
        source: { kind: 'real', metricId: MID.GOLD_PRICE_USD, deflator: MID.US_CPI_INDEX },
        unit: 'usd-oz',
        decimals: 0,
        logScale: true,
        unitNote: 'in latest-month CPI dollars',
        episodes: ['nixonShock', 'oilEmbargo', 'goldPeak1980', 'dotcomPeak', 'lehman', 'goldPeak2011', 'covidQe', 'russiaReserves'],
        compare: ['m2-gold-ratio', 'real-fed-funds-rate', 'gold-silver-ratio'],
        upstream: [fred('CPIAUCSL'), { label: 'World Bank Pink Sheet (gold, 1960 onward)', url: 'https://www.worldbank.org/en/research/commodity-markets' }],
    },
    {
        id: 'spx-gold-ratio',
        pillar: 'Gold & reserves',
        seoTitle: 'S&P 500 to Gold Ratio Chart: Stocks Priced in Gold',
        seoDescription: 'The S&P 500 divided by the gold price — equities measured in ounces of gold — with percentile, 1- and 5-year change, and episode outcomes since 2016.',
        h1: 'S&P 500 to gold ratio',
        source: { kind: 'observations', metricId: MID.RATIO_SPX_GOLD },
        liveMetricId: MID.RATIO_SPX_GOLD,
        unit: 'ratio',
        decimals: 2,
        episodes: ['qt2017', 'repoSpike2019', 'covidQe', 'hikingCycle2022', 'svb', 'cuts2024'],
        compare: ['m2-gold-ratio', 'copper-gold-ratio', 'real-gold-price'],
        upstream: [{ label: 'S&P 500 and gold futures (stored series)', url: 'https://graphiquestor.com/data-sources/' }],
    },
    {
        id: 'copper-gold-ratio',
        pillar: 'Gold & reserves',
        seoTitle: 'Copper to Gold Ratio Chart Since 1992: Growth vs Fear',
        seoDescription: 'Copper ($/metric ton) divided by gold ($/oz), monthly since 1992 — the industrial-versus-haven gauge, with percentile, last time at this level, and episode outcomes.',
        h1: 'Copper to gold ratio: chart and history since 1992',
        // COPPER_PRICE_USD interleaves daily COMEX prints in $/lb with monthly IMF prints in $/mt
        // from Nov 2025; only the $/mt observations are used.
        source: { kind: 'ratio', numerator: MID.COPPER_PRICE_USD, denominator: MID.GOLD_PRICE_USD, minNumerator: 1000 },
        unit: 'ratio',
        decimals: 2,
        logScale: true,
        episodes: ['ltcm', 'dotcomPeak', 'lehman', 'goldPeak2011', 'covidQe', 'hikingCycle2022'],
        compare: ['spx-gold-ratio', 'yield-curve-10y-2y', 'gold-silver-ratio'],
        glossary: { to: '/glossary/copper-gold-ratio/', label: 'Copper/gold ratio' },
        upstream: [fred('PCOPPUSDM'), { label: 'World Bank Pink Sheet (gold, 1960 onward)', url: 'https://www.worldbank.org/en/research/commodity-markets' }],
    },
    {
        id: 'gold-silver-ratio',
        pillar: 'Gold & reserves',
        seoTitle: 'Gold to Silver Ratio Chart: Current Reading and Range',
        seoDescription: 'Ounces of silver per ounce of gold, with percentile within the stored history, recent change, and what a high or low ratio has signalled.',
        h1: 'Gold to silver ratio',
        source: { kind: 'observations', metricId: MID.RATIO_GOLD_SILVER },
        liveMetricId: MID.RATIO_GOLD_SILVER,
        unit: 'ratio',
        decimals: 1,
        episodes: [],
        compare: ['copper-gold-ratio', 'real-gold-price', 'm2-gold-ratio'],
        glossary: { to: '/glossary/gold-silver-ratio/', label: 'Gold/silver ratio' },
        upstream: [{ label: 'Gold and silver futures (stored series)', url: 'https://graphiquestor.com/data-sources/' }],
    },
    {
        id: 'global-usd-reserve-share',
        pillar: 'Gold & reserves',
        seoTitle: 'US Dollar Share of Global FX Reserves (IMF COFER) Since 1999',
        seoDescription: 'The dollar’s share of allocated global FX reserves from IMF COFER since 1999, with percentile and change — the core de-dollarization gauge.',
        h1: 'US dollar share of global FX reserves since 1999',
        source: { kind: 'observations', metricId: MID.GLOBAL_USD_SHARE_PCT },
        liveMetricId: MID.GLOBAL_USD_SHARE_PCT,
        unit: 'pct',
        decimals: 1,
        unitNote: 'of allocated reserves',
        episodes: ['euroLaunch', 'lehman', 'russiaReserves'],
        compare: ['global-gold-reserve-share', 'm2-gold-ratio', 'real-gold-price'],
        glossary: { to: '/glossary/reserve-currency-composition/', label: 'Reserve currency composition' },
        upstream: [{ label: 'IMF COFER', url: 'https://data.imf.org/regular.aspx?key=41175' }],
    },
    {
        id: 'global-gold-reserve-share',
        pillar: 'Gold & reserves',
        seoTitle: 'Gold Share of Global Reserves Since 1999',
        seoDescription: 'Gold as a share of total official reserve assets since 1999 — how central-bank buying and price moves have rebuilt gold’s weight in reserves.',
        h1: 'Gold share of global reserves since 1999',
        source: { kind: 'observations', metricId: MID.GLOBAL_GOLD_SHARE_PCT },
        liveMetricId: MID.GLOBAL_GOLD_SHARE_PCT,
        unit: 'pct',
        decimals: 1,
        unitNote: 'of total reserves',
        episodes: ['euroLaunch', 'lehman', 'goldPeak2011', 'russiaReserves'],
        compare: ['global-usd-reserve-share', 'real-gold-price', 'm2-gold-ratio'],
        glossary: { to: '/glossary/central-bank-gold-purchases/', label: 'Central bank gold purchases' },
        upstream: [{ label: 'IMF / World Gold Council (stored series)', url: 'https://graphiquestor.com/data-sources/' }],
    },

    // ── Fiscal ───────────────────────────────────────────────────────────────
    {
        id: 'fiscal-dominance-meter',
        name: 'Interest Expense to Tax Receipts',
        chartedSeries: 'Federal interest payments ÷ federal tax receipts × 100 — the first term of the Fiscal Dominance Meter composite below.',
        pillar: 'Fiscal',
        seoTitle: 'US Interest Expense as % of Tax Receipts Since 1947',
        seoDescription: 'Federal interest payments as a share of tax receipts since 1947 — the core input to the Fiscal Dominance Meter — with percentile, last time at this level, and episodes.',
        h1: 'Fiscal dominance: interest expense vs tax receipts since 1947',
        source: { kind: 'observations', metricId: MID.US_FISCAL_INTEREST_TO_RECEIPTS_PCT },
        liveMetricId: MID.US_FISCAL_INTEREST_TO_RECEIPTS_PCT,
        unit: 'pct',
        decimals: 1,
        unitNote: 'of tax receipts',
        episodes: ['volckerShock', 'liftoff2015', 'covidQe', 'hikingCycle2022', 'cuts2024'],
        compare: ['interest-expense-to-gdp', 'federal-interest-payments', 'us-debt-to-gdp'],
        glossary: { to: '/glossary/fiscal-dominance/', label: 'Fiscal dominance' },
        upstream: [fred('A091RC1Q027SBEA'), fred('W006RC1Q027SBEA')],
    },
    {
        id: 'interest-expense-to-gdp',
        pillar: 'Fiscal',
        seoTitle: 'US Federal Interest Expense as % of GDP Since 1963',
        seoDescription: 'Federal interest payments relative to GDP since 1963 — the 1980s peak versus today — with percentile, 5-year change, and the rate cycles behind each turn.',
        h1: 'Federal interest expense as a share of GDP',
        source: { kind: 'observations', metricId: MID.US_FISCAL_INTEREST_TO_GDP_PCT },
        liveMetricId: MID.US_FISCAL_INTEREST_TO_GDP_PCT,
        unit: 'pct',
        decimals: 2,
        unitNote: 'of GDP',
        episodes: ['volckerShock', 'lehman', 'covidQe', 'hikingCycle2022'],
        compare: ['fiscal-dominance-meter', 'us-debt-to-gdp', 'federal-interest-payments'],
        glossary: { to: '/glossary/interest-expense-to-tax-revenue/', label: 'Interest expense to tax revenue' },
        upstream: [fred('A091RC1Q027SBEA'), fred('GDP')],
    },
    {
        id: 'federal-interest-payments',
        pillar: 'Fiscal',
        seoTitle: 'US Federal Interest Payments Chart Since 1940',
        seoDescription: 'Annualised federal government interest payments since 1940 on a log scale, with 1- and 5-year growth and the debt and rate episodes that drove them.',
        h1: 'US federal interest payments since 1940',
        source: { kind: 'observations', metricId: MID.US_FEDERAL_INTEREST_PAYMENTS },
        liveMetricId: MID.US_FEDERAL_INTEREST_PAYMENTS,
        unit: 'usd-bn',
        decimals: 0,
        logScale: true,
        unitNote: 'annualised',
        episodes: ['volckerShock', 'lehman', 'covidQe', 'hikingCycle2022'],
        compare: ['fiscal-dominance-meter', 'interest-expense-to-gdp', 'us-debt-to-gdp'],
        upstream: [{ label: 'BEA NIPA via FRED (stored series)', url: 'https://graphiquestor.com/data-sources/' }],
    },
    {
        id: 'entitlements-to-receipts',
        pillar: 'Fiscal',
        seoTitle: 'US Entitlement Spending as % of Tax Receipts Since 1963',
        seoDescription: 'Major entitlement outlays relative to federal tax receipts since 1963 — how much of revenue is committed before discretionary spending or interest.',
        h1: 'Entitlement spending as a share of tax receipts',
        source: { kind: 'observations', metricId: MID.US_FISCAL_ENTITLEMENTS_TO_RECEIPTS_PCT },
        liveMetricId: MID.US_FISCAL_ENTITLEMENTS_TO_RECEIPTS_PCT,
        unit: 'pct',
        decimals: 1,
        unitNote: 'of tax receipts',
        episodes: ['lehman', 'covidQe'],
        compare: ['mandatory-spending-to-receipts', 'fiscal-dominance-meter', 'us-debt-to-gdp'],
        upstream: [{ label: 'BEA NIPA via FRED (stored series)', url: 'https://graphiquestor.com/data-sources/' }],
    },
    {
        id: 'mandatory-spending-to-receipts',
        pillar: 'Fiscal',
        seoTitle: 'US Mandatory Spending as % of Tax Receipts Since 1963',
        seoDescription: 'Mandatory federal outlays relative to tax receipts since 1963, with percentile and change — the share of revenue Congress does not vote on each year.',
        h1: 'Mandatory spending as a share of tax receipts',
        source: { kind: 'observations', metricId: MID.US_FISCAL_MANDATORY_TO_RECEIPTS_PCT },
        liveMetricId: MID.US_FISCAL_MANDATORY_TO_RECEIPTS_PCT,
        unit: 'pct',
        decimals: 1,
        unitNote: 'of tax receipts',
        episodes: ['lehman', 'covidQe'],
        compare: ['entitlements-to-receipts', 'fiscal-dominance-meter', 'us-debt-to-gdp'],
        upstream: [{ label: 'BEA NIPA via FRED (stored series)', url: 'https://graphiquestor.com/data-sources/' }],
    },
    {
        id: 'us-debt-to-gdp',
        pillar: 'Fiscal',
        seoTitle: 'US Federal Debt to GDP Chart Since 1966',
        seoDescription: 'Total US federal debt as a percentage of GDP since 1966, with percentile, 5-year change, and the recessions and stimulus programmes behind each step up.',
        h1: 'US federal debt to GDP since 1966',
        source: { kind: 'observations', metricId: MID.US_DEBT_GDP_PCT },
        liveMetricId: MID.US_DEBT_GDP_PCT,
        unit: 'pct',
        decimals: 1,
        unitNote: 'of GDP',
        episodes: ['volckerShock', 'dotcomPeak', 'lehman', 'covidQe'],
        compare: ['fiscal-dominance-meter', 'interest-expense-to-gdp', 'federal-interest-payments'],
        glossary: { to: '/glossary/public-debt-to-gdp/', label: 'Public debt to GDP' },
        upstream: [fred('GFDEGDQ188S')],
    },

    // ── Rates & credit ───────────────────────────────────────────────────────
    {
        id: 'treasury-10y-yield',
        pillar: 'Rates & credit',
        seoTitle: '10-Year Treasury Yield History Since 1987: Chart and Episodes',
        seoDescription: 'The US 10-year Treasury yield daily since 1987 — percentile, last time at this level, and how yields moved after Black Monday, Lehman, the taper tantrum, and 2022.',
        h1: '10-year Treasury yield: chart and history since 1987',
        source: { kind: 'observations', metricId: MID.UST_10Y_YIELD },
        liveMetricId: MID.UST_10Y_YIELD,
        unit: 'pct',
        decimals: 2,
        episodes: ['blackMonday', 'ltcm', 'dotcomPeak', 'lehman', 'taperTantrum', 'covidQe', 'hikingCycle2022', 'cuts2024'],
        compare: ['yield-curve-10y-2y', 'real-fed-funds-rate', 'breakeven-inflation-5y'],
        glossary: { to: '/glossary/term-premium/', label: 'Term premium' },
        upstream: [fred('DGS10')],
    },
    {
        id: 'yield-curve-10y-2y',
        pillar: 'Rates & credit',
        seoTitle: '10Y–2Y Treasury Yield Curve Spread History Since 1987',
        seoDescription: 'The 10-year minus 2-year Treasury spread in basis points since 1987 — every inversion, how long each lasted, and what followed over the next 12 months.',
        h1: '10Y–2Y yield curve spread since 1987',
        source: { kind: 'observations', metricId: MID.UST_10Y_2Y_SPREAD, scale: 100 },
        liveMetricId: MID.UST_10Y_2Y_SPREAD,
        unit: 'bp',
        decimals: 0,
        episodes: ['blackMonday', 'ltcm', 'dotcomPeak', 'bnpFreeze', 'lehman', 'repoSpike2019', 'covidQe', 'hikingCycle2022', 'cuts2024'],
        compare: ['treasury-10y-yield', 'real-fed-funds-rate', 'high-yield-credit-spread'],
        upstream: [fred('T10Y2Y')],
    },
    {
        id: 'real-fed-funds-rate',
        pillar: 'Rates & credit',
        seoTitle: 'Real Fed Funds Rate Chart Since 1954 (Inflation-Adjusted)',
        seoDescription: 'The effective fed funds rate minus year-over-year CPI inflation, monthly since 1954 — how restrictive policy really is versus the Volcker era and 2022.',
        h1: 'Real fed funds rate since 1954',
        source: { kind: 'realRate', rate: MID.FED_FUNDS_RATE, priceIndex: MID.US_CPI_INDEX },
        unit: 'pct',
        decimals: 2,
        episodes: ['nixonShock', 'oilEmbargo', 'volckerShock', 'lehman', 'liftoff2015', 'covidQe', 'hikingCycle2022', 'cuts2024'],
        compare: ['treasury-10y-yield', 'real-gold-price', 'breakeven-inflation-5y'],
        glossary: { to: '/glossary/real-interest-rates/', label: 'Real interest rates' },
        upstream: [fred('FEDFUNDS'), fred('CPIAUCSL')],
    },
    {
        id: 'breakeven-inflation-5y',
        pillar: 'Rates & credit',
        seoTitle: '5-Year Breakeven Inflation Rate Chart (T5YIE)',
        seoDescription: 'Market-implied 5-year inflation from nominal versus TIPS yields (FRED T5YIE), with percentile, 1-year change, and how expectations moved through 2020–2024.',
        h1: '5-year breakeven inflation rate',
        source: { kind: 'observations', metricId: MID.INFLATION_BREAKEVEN_5Y },
        liveMetricId: MID.INFLATION_BREAKEVEN_5Y,
        unit: 'pct',
        decimals: 2,
        episodes: ['repoSpike2019', 'covidQe', 'russiaReserves', 'hikingCycle2022', 'svb', 'cuts2024'],
        compare: ['real-fed-funds-rate', 'treasury-10y-yield', 'real-gold-price'],
        glossary: { to: '/glossary/breakeven-inflation-rate/', label: 'Breakeven inflation rate' },
        upstream: [fred('T5YIE')],
    },
    {
        id: 'high-yield-credit-spread',
        pillar: 'Rates & credit',
        seoTitle: 'High-Yield Credit Spread (ICE BofA OAS) Chart',
        seoDescription: 'The ICE BofA US High Yield option-adjusted spread in basis points, with percentile and change — the market price of corporate default risk.',
        h1: 'US high-yield credit spread (OAS)',
        source: { kind: 'observations', metricId: MID.US_HY_CREDIT_OAS_BPS, scale: 100 },
        liveMetricId: MID.US_HY_CREDIT_OAS_BPS,
        unit: 'bp',
        decimals: 0,
        episodes: ['svb', 'cuts2024'],
        compare: ['yield-curve-10y-2y', 'sofr-effr-spread', 'treasury-10y-yield'],
        upstream: [fred('BAMLH0A0HYM2')],
    },
    {
        id: 'sofr-effr-spread',
        pillar: 'Rates & credit',
        seoTitle: 'SOFR–EFFR Spread: Repo Funding Pressure Gauge',
        seoDescription: 'The secured overnight financing rate minus the effective fed funds rate in basis points — an early signal of reserve scarcity in repo markets.',
        h1: 'SOFR minus EFFR spread',
        source: { kind: 'observations', metricId: MID.SOFR_EFFR_SPREAD_BPS },
        liveMetricId: MID.SOFR_EFFR_SPREAD_BPS,
        unit: 'bp',
        decimals: 1,
        episodes: [],
        compare: ['reverse-repo-balance', 'tga-balance', 'net-liquidity'],
        upstream: [fred('SOFR'), fred('EFFR')],
    },
];

export const DOSSIER_BY_ID: ReadonlyMap<string, DossierSpec> = new Map(DOSSIERS.map((d) => [d.id, d]));

export function getDossier(id: string | undefined): DossierSpec | undefined {
    return id ? DOSSIER_BY_ID.get(id) : undefined;
}
