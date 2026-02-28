export interface GlossaryTerm {
    id: string;
    term: string;
    definition: string;
    category: 'Liquidity' | 'Monetary Policy' | 'Geopolitics' | 'Hard Assets' | 'Sovereign Debt';
    relatedMetrics?: string[];
    slug: string;
}

export const glossaryData: GlossaryTerm[] = [
    {
        id: '1',
        term: 'Net Liquidity Z-Score',
        slug: 'net-liquidity-z-score',
        category: 'Liquidity',
        definition: 'A statistical measurement of global fiat liquidity availability relative to its historical mean. A highly positive Z-score indicates expansionary conditions (excess liquidity), while a negative score indicates quantitative tightening and liquidity drain. It is often calculated by analyzing Central Bank balance sheets, adjusting for the Treasury General Account (TGA), and Reverse Repo (RRP) facilities.',
        relatedMetrics: ['Federal Reserve Balance Sheet', 'TGA', 'RRP']
    },
    {
        id: '2',
        term: 'Stealth QE',
        slug: 'stealth-qe',
        category: 'Monetary Policy',
        definition: 'Quantitative Easing (QE) maneuvers executed by central banks that are not officially labeled as QE to avoid signaling panic. Examples include massive, sudden expansions of liquidity facilities (like the BTFP in 2023) or unscheduled repo market interventions, injecting capital into the system while publicly maintaining a restrictive stance.',
        relatedMetrics: ['Bank Term Funding Program', 'Repo Market Volume']
    },
    {
        id: '3',
        term: 'Sovereign Rollover Risk',
        slug: 'sovereign-rollover-risk',
        category: 'Sovereign Debt',
        definition: 'The risk that a government will be unable or unwilling to refinance its maturing debt at favorable interest rates. This risk spikes when a significant percentage of a nation\'s debt is short-term (T-Bills) and must be refinanced during a period of rising global yields, leading to a sudden, severe increase in interest expense.',
        relatedMetrics: ['Maturity Profile', 'Interest Expense / Tax Receipts']
    },
    {
        id: '4',
        term: 'De-Dollarization',
        slug: 'de-dollarization',
        category: 'Geopolitics',
        definition: 'The strategic macro trend where nations (particularly BRICS+ members) deliberately reduce their reliance on the US Dollar as a reserve currency, medium of exchange, or unit of account. This is tracked by analyzing the share of USD in global FX reserves, bilateral local currency trade agreements, and sovereign gold accumulation.',
        relatedMetrics: ['Global FX Reserves', 'Central Bank Gold Net Purchases']
    },
    {
        id: '5',
        term: 'M2 / Gold Ratio',
        slug: 'm2-gold-ratio',
        category: 'Hard Assets',
        definition: 'A valuation metric comparing the total global M2 money supply to the market capitalization of above-ground gold. It is used to determine if fiat currency has been fundamentally debased relative to hard assets. A rapidly climbing ratio suggests fiat expansion without corresponding backing, signaling physical gold is undervalued relative to the currency supply.',
        relatedMetrics: ['M2 Money Supply', 'Gold Valuation Z-Score']
    },
    {
        id: '6',
        term: 'Treasury General Account (TGA)',
        slug: 'tga',
        category: 'Liquidity',
        definition: 'The Treasury General Account is the US government\'s primary operating account at the Federal Reserve. When the Treasury collects taxes or issues debt, the TGA balance rises, draining liquidity from the commercial banking system. When the Treasury spends this money into the economy, the TGA balance falls, injecting liquidity back into the system.',
        relatedMetrics: ['Net Liquidity']
    },
    {
        id: '7',
        term: 'Reverse Repo Facility (RRP)',
        slug: 'reverse-repo-facility-rrp',
        category: 'Liquidity',
        definition: 'The Overnight Reverse Repurchase Agreement Facility allows eligible institutions (like money market funds) to lend cash to the Federal Reserve in exchange for Treasury securities as collateral. An increasing RRP balance means cash is being parked at the Fed rather than circulating in the financial system, acting as a drain on broader market liquidity.',
        relatedMetrics: ['Net Liquidity', 'SOFR']
    },
    {
        id: '8',
        term: 'Term Premium',
        slug: 'term-premium',
        category: 'Sovereign Debt',
        definition: 'The extra yield that investors demand to hold a longer-term bond instead of a series of shorter-term bonds. It compensates investors for the risk of tying up their capital for a longer period, primarily inflation and interest rate uncertainty. A rising term premium often coincides with increased fears of fiscal profligacy or sovereign supply indigestion.',
        relatedMetrics: ['Yield Curve Slope', '10Y Treasury Yield']
    },
    {
        id: '9',
        term: 'MoSPI (Ministry of Statistics and Programme Implementation)',
        slug: 'mospi',
        category: 'Geopolitics',
        definition: 'The official agency of the Government of India responsible for the release of macroeconomic indicators, including GDP, Index of Industrial Production (IIP), and Consumer Price Index (CPI). Direct integration with MoSPI allows for zero-lag, state-level fundamental analysis of India\'s fiscal and industrial performance, bypassing traditional delayed data aggregators.',
        relatedMetrics: ['India Fiscal Matrix', 'Capex Velocity']
    },
    {
        id: '10',
        term: 'mBridge (Multiple CBDC Bridge)',
        slug: 'mbridge',
        category: 'Geopolitics',
        definition: 'A multi-central bank digital currency (CBDC) platform developed by the BIS Innovation Hub in collaboration with the central banks of China, Hong Kong, Thailand, and the UAE. It functions as a structural alternative to the SWIFT network, facilitating real-time, peer-to-peer cross-border payments in local currencies, thereby serving as a core mechanism for de-dollarization.',
        relatedMetrics: ['Shadow Trade Flows', 'De-Dollarization']
    },
    {
        id: '11',
        term: 'GRIT Index',
        slug: 'grit-index',
        category: 'Sovereign Debt',
        definition: 'GraphiQuestor\'s proprietary composite score for Geopolitical Risk and Institutional Transition. The GRIT Index serves as an overarching macroeconomic barometer, synthetically combining sovereign debt stress markers (like debt-to-gold ratios), reserve diversification velocity, and global liquidity drain signals to quantify the systemic transition away from the pre-2008 multipolar consensus.',
        relatedMetrics: ['Sovereign Debt', 'Central Bank Gold Net Purchases', 'Net Liquidity']
    }
];
