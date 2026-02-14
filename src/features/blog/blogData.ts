export interface BlogArticle {
    id: string;
    slug: string;
    title: string;
    description: string;
    date: string;
    author: string;
    category: string;
    tags: string[];
    keywords: string[];
    content: string;
}

export const blogArticles: BlogArticle[] = [
    {
        id: '1',
        slug: 'debt-gold-ratio-analysis-2026',
        title: 'The Debt/Gold Ratio: Why It Matters for Monetary Sovereignty in 2026',
        description: 'An institutional-grade analysis of sovereign debt burdens relative to gold reserves, featuring our proprietary Gold Ratio Ribbon.',
        date: '2026-02-14',
        author: 'GraphiQuestor Research',
        category: 'Monetary Policy',
        tags: ['Gold', 'Debt', 'Inflation', 'Sovereign Risk'],
        keywords: ['Debt Gold Ratio', 'Monetary Sovereignty', 'Gold Valuation', 'Sovereign Debt'],
        content: `
# The Debt/Gold Ratio: Why It Matters for Monetary Sovereignty in 2026

In an era of unprecedented fiscal deficit spending and central bank balance sheet expansion, traditional metrics for sovereign creditworthiness are increasingly failing to capture the full spectrum of monetary risk. At GraphiQuestor, we argue that the **Debt/Gold Ratio** is the most reliable indicator of a nation's true monetary optionality.

## The Constitutional Check on Fiat

Since the closing of the gold window in 1971, the link between currency and hard assets has been severed in the public consciousness, but not in the physical reality of international settlement. Our proprietary **Gold Ratio Ribbon** tracks the standard deviation of sovereign debt relative to official gold reserves.

### India's Resilience
India currently sits at a negative Z-score relative to its 25-year Debt/Gold average. This suggests that despite headline fiscal concerns, the Reserve Bank of India's (RBI) aggressive gold accumulation serves as a significant buffer against external shocks.

### The US Fragility
Conversely, the US Debt/Gold ratio is currently exceeding +2σ levels. This indicates a structural dislocation where paper claims (Treasuries) have decoupled from the physical monetary anchor.

## Institutional Application
For capital allocators, these Z-scores provide a framework for currency hedging. Nations with improving gold-to-debt ratios offer superior purchasing power protection over generational timescales.

*Source: GraphiQuestor Institutional Data, RBI, FRED.*
`
    },
    {
        id: '2',
        slug: 'brics-de-dollarization-tracker-2026',
        title: 'BRICS+ De-Dollarization: Mapping the Structural Shift in Global Reserves',
        description: 'Tracking the secular decline of USD reserve share and the rise of mBridge and bilateral settlement systems.',
        date: '2026-02-13',
        author: 'GraphiQuestor Research',
        category: 'Geopolitics',
        tags: ['BRICS', 'De-Dollarization', 'Reserve Currency', 'mBridge'],
        keywords: ['BRICS De-Dollarization', 'Central Bank Reserves', 'Currency Wars', 'USD Hegemony'],
        content: `
# BRICS+ De-Dollarization: Mapping the Structural Shift in Global Reserves

The unipolar moment of the US Dollar as the undisputed global reserve currency is transitioning toward a multipolar arrangement. This "Geopolitical Pivot" is not merely rhetorical—it is being coded into the infrastructure of global finance.

## The Rise of mBridge
Projects like mBridge (Multiple CBDC Bridge) are enabling real-time, peer-to-peer settlement between central banks outside the SWIFT system. Our tracker monitors the throughput of these parallel systems.

## Gold as the Neutral Reserve
Nations like Russia and China have systematically reduced their UST holdings in favor of physical gold. This shift is a defense mechanism against the "weaponization" of the financial system.

## India's Strategic Autonomy
India continues to play a balancing act, participating in BRICS+ initiatives while maintaining deep ties to Western capital markets. Our "Geopolitical Influence Map" visualizes this strategic positioning.

*Source: IMF COFER, BIS, GraphiQuestor Analytics.*
`
    },
    {
        id: '3',
        slug: 'india-macro-pulse-mospi-dashboard-guide',
        title: 'India Macro Pulse: A Deep Dive into MoSPI Industrial and Labor Data',
        description: 'Understanding India’s real economy through PLFS, ASI, and CPI granularity.',
        date: '2026-02-12',
        author: 'GraphiQuestor Research',
        category: 'Emerging Markets',
        tags: ['India', 'MoSPI', 'PLFS', 'ASI', 'Macro Data'],
        keywords: ['India Macro Pulse MoSPI', 'Indian Economy', 'Manufacturing GVA', 'Labor Force India'],
        content: `
# India Macro Pulse: A Deep Dive into MoSPI Industrial and Labor Data

Official GDP figures often mask the underlying sectoral dynamics of the Indian economy. To gain a true edge, institutional investors must look at the **India Macro Pulse**—a synthesis of high-frequency telemetry from the Ministry of Statistics and Programme Implementation (MoSPI).

## Annual Survey of Industries (ASI)
Our terminal provides state-level granularity on India's industrial base. By tracking Gross Value Added (GVA) at the sector level (e.g., Pharmaceuticals in Gujarat vs. Textiles in Tamil Nadu), we identify geographical clusters of productive growth.

## PLFS: The Employment Reality
The Periodic Labour Force Survey (PLFS) provides insights into real-wage growth and hours worked. In an economy transitioning toward formalization, these signals are more predictive than lagging consumption data.

## Why This Matters
For sovereign bond investors, these real-economy signals indicate whether monetary policy is stimulative (output increasing) or inflationary (slack exhausted).

*Source: MoSPI eSankhyiki, GraphiQuestor EM Pulse.*
`
    },
    {
        id: '4',
        slug: 'shanghai-divergence-indicator-explained',
        title: 'Shanghai Divergence: When Monetary Policy Conflicts with Fiscal Mandates',
        description: 'Explaining our proprietary indicator that tracks policy tension between the PBOC and Beijing fiscal authorities.',
        date: '2026-02-11',
        author: 'GraphiQuestor Research',
        category: 'China Macro',
        tags: ['China', 'PBOC', 'Shanghai Divergence', 'Monetary Policy'],
        keywords: ['Shanghai Divergence', 'China Macro Pulse', 'PBOC Policy', 'EM Capital Flows'],
        content: `
# Shanghai Divergence: When Monetary Policy Conflicts with Fiscal Mandates

Investing in China requires understanding the tension between monetary accommodation and structural deleveraging. We call this the **Shanghai Divergence**.

## The Indicator
The Shanghai Divergence Indicator monitors the spread between interbank liquidity conditions (Shanghai/PBOC) and the fiscal directives issued from Beijing. 

## Case Study: 2025 Inflection
In late 2025, a significant divergence appeared as the PBOC attempted to support the property market while fiscal authorities maintained strict deleveraging caps on Local Government Financing Vehicles (LGFVs). This signal preceded the Q4 volatility in EM capital flows.

## Global Implications
When the world's second-largest economy shows signs of internal policy tension, the ripple effects are felt across the G20, particularly in commodity-exporting nations.

*Source: PBoC, GraphiQuestor China Intelligence.*
`
    },
    {
        id: '5',
        slug: 'india-energy-security-state-wise-analysis',
        title: 'India Energy Security: A State-wise Vulnerability Mapping',
        description: 'Analyzing energy dependency ratios across Indian states using MoSPI Energy Statistics.',
        date: '2026-02-10',
        author: 'GraphiQuestor Research',
        category: 'Energy',
        tags: ['Energy Security', 'India', 'Sustainability', 'Infrastructure'],
        keywords: ['India Energy Security State-wise Analysis', 'Oil Imports India', 'Renewable Energy India', 'State-level Energy Data'],
        content: `
# India Energy Security: A State-wise Vulnerability Mapping

Energy is the fundamental constraint of economic growth. In India, energy security is not a monolithic national issue but a collection of state-level challenges.

## The Energy Dependency Ratio
Using MoSPI's Energy Statistics, we calculate the energy dependency ratio for each state—the percentage of primary energy consumption met by external imports (either national or international).

### Coal-Rich vs. Import-Dependent
States like Jharkhand and Odisha possess significant domestic coal reserves, providing a physical buffer against global price volatility. In contrast, industrial hubs like Tamil Nadu and Maharashtra rely heavily on imported fossil fuels, making their GVA growth sensitive to global brent prices.

## The Transition Alpha
As states pivot toward solar and wind, the map of energy security is being redrawn. Our terminal tracks the delta in renewable capacity vs. industrial load, identifying states that will lead the next decade of "Green Growth."

*Source: MoSPI Energy Statistics, GraphiQuestor Energy Lab.*
`
    },
    {
        id: '6',
        slug: 'global-net-liquidity-guide-2026',
        title: 'The Capital Allocator’s Guide to Global Net Liquidity',
        description: 'How to track the "Oxygen" of the financial markets using Fed, TGA, and RRP signals.',
        date: '2026-02-09',
        author: 'GraphiQuestor Research',
        category: 'Liquidity',
        tags: ['Liquidity', 'Fed', 'TGA', 'RRP', 'Monetary Oxygen'],
        keywords: ['Global Net Liquidity Guide', 'Fed Balance Sheet', 'TGA RRP Drain', 'Market Liquidity'],
        content: `
# The Capital Allocator’s Guide to Global Net Liquidity

In a world governed by central bank interventions, "Asset Price Inflation" is often just another name for "Net Liquidity Expansion."

## What is Net Liquidity?
We define Global Net Liquidity as the Federal Reserve's balance sheet minus the Treasury General Account (TGA) and the Reverse Repo Facility (RRP). This represents the actual spendable liquidity available to prime dealers and commercial banks.

## The Z-Score Regime
Our 25-year pipeline allows us to calculate Z-scores for current liquidity levels. Historical analysis shows that institutional risk-on regimes coincide with Net Liquidity Z-scores above +1.

## Why Forward Guidance is Noise
While central bank officials focus on interest rate "forward guidance," the actual liquidity plumbing (TGA replenishment, RRP drainage) provides the high-frequency reality that dictates asset movement.

*Source: FRED, GraphiQuestor Liquidity Engine.*
`
    },
    {
        id: '7',
        slug: 'asi-manufacturing-intelligence-india-advantage',
        title: 'ASI Manufacturing Intelligence: Beyond Headline IIP Numbers',
        description: 'Leveraging the Annual Survey of Industries for institutional EM positioning.',
        date: '2026-02-08',
        author: 'GraphiQuestor Research',
        category: 'Manufacturing',
        tags: ['ASI', 'Manufacturing', 'India', 'Industrial Growth'],
        keywords: ['ASI Manufacturing Intelligence', 'India Industrial Production', 'MoSPI ASI', 'EM Manufacturing'],
        content: `
# ASI Manufacturing Intelligence: Beyond Headline IIP Numbers

While the Index of Industrial Production (IIP) provides a monthly pulse, the **Annual Survey of Industries (ASI)** provides the structural skeleton of the Indian manufacturing story.

## Sectoral Gross Value Added (GVA)
By analyzing ASI data, we can see exactly where the "Value Addition" is happening. Is it in low-margin assembly or high-margin precision engineering? The delta in sectoral GVA is the ultimate signal for long-term equity allocation in the manufacturing space.

## Capital Formation Trends
Data from the ASI reveals which sectors are reinvesting in fixed assets. This "Physical Capital Formation" is the prerequisite for the next leg of India's growth cycle.

## The GraphiQuestor Edge
We provide direct integration with MoSPI's ASI infrastructure, delivering insights that lagging Western terminals cannot replicate.

*Source: MoSPI ASI, GraphiQuestor Industrial Pulse.*
`
    },
    {
        id: '8',
        slug: 'g20-macro-surveillance-dashboard-analysis',
        title: 'G20 Macro Surveillance: Tracking Sovereign Stress in a Fragmenting World',
        description: 'How unified macro surveillance helps identify systemic risks across the G20 nations.',
        date: '2026-02-07',
        author: 'GraphiQuestor Research',
        category: 'Global Macro',
        tags: ['G20', 'Sovereign Debt', 'Macro Risk', 'Global Economy'],
        keywords: ['G20 Macro Surveillance Dashboard', 'Sovereign Stress', 'Global Debt Cycle', 'Macro Risk Monitoring'],
        content: `
# G20 Macro Surveillance: Tracking Sovereign Stress in a Fragmenting World

The G20 represents 85% of global GDP, but its internal cohesion is at a multi-decade low. In this environment, macro surveillance must be autonomous and institutional-grade.

## Identifying Sovereign Stress
We track debt-to-GDP ratios, primary balances, and external funding gaps across all G20 members. By standardizing these metrics, we identify "Outlier Risk" before it matures into a crisis.

## The Geopolitical Buffer
Nations with high "Hard Asset Coverage" (Gold/Debt) are less vulnerable to the capital flight that typically plagues EM during USD tightening cycles. Our surveillance focuses on this "Real Wealth" buffer.

## A Multipolar View
By integrating data from the NDB and AIIB alongside the IMF, we provide a 360-degree view of the shifting spheres of institutional influence.

*Source: BIS, IMF, NDB, GraphiQuestor Surveillance.*
`
    }
];
