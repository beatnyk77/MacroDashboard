/**
 * metricsCatalog — single source of truth for proprietary metric methodology.
 * Powers both /methodology (index) and the programmatic /metrics/:id pages.
 * Only metrics with substantive methodology copy belong here (thin-content
 * pages hurt more than they help — see roadmap F5).
 */

export interface MetricEntry {
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

export const METRICS_CATALOG: MetricEntry[] = [
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
        relatedPage: '/methods/net-liquidity-z-score',
        relatedPageLabel: 'Deep Dive: Liquidity Methodology',
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
        relatedPage: '/methods/net-liquidity-z-score',
        relatedPageLabel: 'Deep Dive: Z-Score Normalisation',
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
        relatedPage: '/methods/fiscal-dominance-meter',
        relatedPageLabel: 'Deep Dive: Fiscal Dominance',
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
        relatedPage: '/methods/debt-gold-z-score',
        relatedPageLabel: 'Deep Dive: Debt vs Hard Assets',
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
        relatedPage: '/methods/energy-dependency-ratio',
        relatedPageLabel: 'Deep Dive: Energy Security',
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
        relatedPage: '/methods/loan-to-job-efficiency',
        relatedPageLabel: 'Deep Dive: Credit Efficiency',
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

    // ── China Debt Iceberg Block ──────────────────────────────────────────────
    {
        id: 'china-iceberg-ratio',
        name: 'China Iceberg Ratio',
        category: 'Sovereign Risk',
        formula: 'Iceberg Ratio = Consolidated Public Sector Debt (high) / Central Government Debt (official)',
        components: [
            'Consolidated High – IMF Article IV upper-bound estimate of total public sector leverage',
            'Central Official – MoF-reported on-budget central government debt (IMF GGXWDG / World Bank)',
            'Five-layer stack: central, local gov, LGFV, policy banks, SOE contingent',
        ],
        intuition: `China's MoF-reported central government debt (~25% GDP) dramatically understates the 
        consolidated public sector balance sheet. The Iceberg Ratio operationalises this divergence: 
        values above 2.0× indicate the shadow stack (LGFV + policy banks + SOE guarantees) exceeds 
        official debt by a factor that historically precedes fiscal stress episodes in other EM economies.`,
        institutionalUse: `Used alongside IMF Article IV surveillance and BIS credit-to-GDP data by 
        EM sovereign desks monitoring China LG bond rollover risk. Pairs with four additional composites 
        (LGFV stress, monetization pressure, debt wall proximity, land fiscal dependence) on the 
        Intel China debt terminal.`,
        interpretation: [
            { label: 'Shadow Debt Critical', condition: 'Ratio > 2.5×', color: 'text-terminal-rose' },
            { label: 'Elevated Hidden Leverage', condition: '2.0× < Ratio ≤ 2.5×', color: 'text-orange-400' },
            { label: 'Contained', condition: 'Ratio ≤ 2.0×', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/methods/china-debt-iceberg',
        relatedPageLabel: 'Deep Dive: China Debt Iceberg',
        sources: ['IMF Article IV', 'IMF DataMapper', 'BIS', 'World Bank'],
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

    // ── GSC pilot expansion (F5) — method-aligned pages with live series ───────
    {
        id: 'm2-gold-ratio',
        name: 'M2/Gold Ratio',
        category: 'De-Dollarization',
        formula: 'M2/Gold = US M2 money stock (USD billions) ÷ Gold price (USD per troy ounce), monthly',
        components: [
            'M2SL – US M2 money stock, seasonally adjusted, monthly (Federal Reserve H.6)',
            'Gold price – monthly last print of the stored gold price history, USD/oz',
            'Both legs are aligned by calendar month before dividing',
        ],
        intuition: `The ratio asks how many ounces of gold the US broad money stock would buy, scaled to billions of
        dollars per ounce. It rises when money supply grows faster than the gold price and falls when gold reprices
        faster than money. Low readings have historically coincided with gold re-ratings — around 1980 and again in
        2011 — while the 2001 high marked the end of a two-decade gold bear market.`,
        institutionalUse: `Allocators use it as a debasement gauge that is independent of real-rate models: it asks
        whether gold has already repriced for the money created, rather than predicting what gold should do next.
        GraphiQuestor's weekly Regime Digest cites the ratio when flagging hard-asset regime shifts.`,
        interpretation: [
            { label: 'Gold cheap vs money', condition: 'Upper part of historical range', color: 'text-terminal-emerald' },
            { label: 'Neutral', condition: 'Middle of historical range', color: 'text-terminal-muted' },
            { label: 'Gold rich vs money', condition: 'Lower part of historical range', color: 'text-orange-400' },
        ],
        relatedPage: '/methods/m2-gold-ratio',
        relatedPageLabel: 'Deep Dive: M2/Gold Methodology',
        sources: ['FRED (M2SL)', 'Gold price history (stored series)'],
    },
    {
        id: 'fed-monetization-ratio',
        name: 'Fed Debt Monetization Ratio',
        category: 'Fiscal Health',
        formula: 'Monetization % = (Fed Treasury Holdings / Total Public Debt Outstanding) × 100',
        components: [
            'Fed Treasury Holdings – Securities held outright on the Fed balance sheet (WALCL Treasuries component)',
            'Total Public Debt – Gross federal debt outstanding (GFDEBTN)',
        ],
        intuition: `This ratio measures how much of outstanding Treasury debt the Federal Reserve 
        effectively holds — a flow-and-stock proxy for monetary financing of fiscal deficits. 
        When the ratio rises above 20%, historical precedents (1940s, Japan post-2000) show 
        yield curve control or implicit caps become politically necessary. Unlike headline QE 
        announcements, this captures the structural stock of Fed absorption.`,
        institutionalUse: `Used by fixed income PMs and fiscal dominance desks to anticipate 
        when rate hikes become self-defeating. Pairs with Net Liquidity and TGA for full 
        plumbing context. GraphiQuestor's US Macro Fiscal Lab surfaces this alongside the 
        Fiscal Dominance Meter.`,
        interpretation: [
            { label: 'Heavy Monetization', condition: 'Ratio > 25%', color: 'text-terminal-rose' },
            { label: 'Elevated', condition: '20% < Ratio ≤ 25%', color: 'text-orange-400' },
            { label: 'Normal', condition: '10% < Ratio ≤ 20%', color: 'text-terminal-muted' },
            { label: 'Market-Financed', condition: 'Ratio ≤ 10%', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/methods/fed-monetization-monitor',
        relatedPageLabel: 'Deep Dive: Fed Monetization',
        sources: ['FRED (WALCL, GFDEBTN)', 'Federal Reserve H.4.1'],
    },
    {
        id: 'india-credit-cycle',
        name: 'India Credit Cycle Clock',
        category: 'Credit Quality',
        formula: 'Quadrant = f(Credit Growth YoY, Credit-Deposit Ratio) vs 10-yr RBI averages',
        components: [
            'Credit Growth YoY – Scheduled commercial bank non-food credit (RBI DBIE)',
            'Credit-Deposit Ratio – Total bank credit / total deposits',
            'Repo Rate – RBI policy rate for phase calibration',
        ],
        intuition: `India's credit cycle is best read as a two-axis clock: how fast credit is growing 
        versus how leveraged the banking system's deposit base already is. Expansion phases feature 
        rising credit growth with manageable CD ratios; downturn phases show credit deceleration 
        with elevated CD ratios — a classic RBI tightening setup. This bridges monetary policy 
        signals to real-economy transmission.`,
        institutionalUse: `EM macro desks and India-focused allocators use credit-cycle phase 
        mapping for RBI policy inflection calls. The framework mirrors BIS credit-gap methodology 
        adapted to India's high-frequency RBI weekly data. Complements Loan-to-Job Efficiency 
        for credit productivity surveillance.`,
        interpretation: [
            { label: 'Expansion', condition: 'Credit growth ↑, CD ratio contained', color: 'text-terminal-emerald' },
            { label: 'Late Cycle', condition: 'Credit growth ↑, CD ratio elevated', color: 'text-terminal-gold' },
            { label: 'Downturn', condition: 'Credit growth ↓, CD ratio high', color: 'text-terminal-rose' },
            { label: 'Repair', condition: 'Credit growth ↓, CD ratio normalising', color: 'text-terminal-blue' },
        ],
        relatedPage: '/methods/india-credit-cycle-clock',
        relatedPageLabel: 'Deep Dive: India Credit Cycle',
        sources: ['RBI DBIE', 'MoSPI'],
    },
    {
        id: 'gold-silver-ratio',
        name: 'Gold/Silver Ratio',
        category: 'De-Dollarization',
        formula: 'Gold/Silver Ratio = Gold Spot (USD/oz) / Silver Spot (USD/oz)',
        components: [
            'Gold Spot – COMEX XAU/USD front settlement',
            'Silver Spot – COMEX XAG/USD front settlement',
        ],
        intuition: `The gold/silver ratio is one of the oldest macro relative-value signals in 
        existence. Extreme readings (>80) historically coincide with deflationary fear or 
        industrial demand collapse; compressed readings (<60) with reflation and solar/industrial 
        silver demand surges. In de-dollarization regimes, silver often lags gold initially 
        then catches up violently — making the ratio a timing tool for precious metals allocation.`,
        institutionalUse: `Commodity hedge funds and precious metals desks use the ratio for 
        pair trades and regime confirmation. Central bank gold buying (structural bid) tends 
        to widen the ratio before silver mean-reverts. GraphiQuestor tracks the live ratio 
        on the De-Dollarization & Gold Lab.`,
        interpretation: [
            { label: 'Gold Extreme Rich', condition: 'Ratio > 80', color: 'text-terminal-gold' },
            { label: 'Gold Rich', condition: '70 < Ratio ≤ 80', color: 'text-orange-400' },
            { label: 'Historical Norm', condition: '60 ≤ Ratio ≤ 70', color: 'text-terminal-muted' },
            { label: 'Silver Catch-up', condition: 'Ratio < 60', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/labs/de-dollarization-gold',
        relatedPageLabel: 'De-Dollarization & Gold Lab',
        sources: ['COMEX', 'Yahoo Finance (GC=F, SI=F)'],
    },
    {
        id: 'dxy-dollar-index',
        name: 'US Dollar Index (DXY)',
        category: 'De-Dollarization',
        formula: 'DXY = Trade-weighted geometric mean of USD vs EUR (57.6%), JPY (13.6%), GBP (11.9%), CAD (9.1%), SEK (4.2%), CHF (3.6%)',
        components: [
            'EUR/USD – Largest DXY component (inverse)',
            'USD/JPY – BoJ policy-sensitive leg',
            'GBP/USD, USD/CAD, USD/SEK, USD/CHF – Remaining basket',
        ],
        intuition: `DXY is the master variable for global risk appetite, EM stress, and 
        de-dollarization tempo. A strengthening dollar tightens global financial conditions 
        via dollar-denominated debt servicing; a weakening dollar releases pressure on gold, 
        commodities, and EM assets. In 2025–2026 de-dollarization narratives, watch DXY 
        against reserve-share shifts — they are correlated but not identical.`,
        institutionalUse: `Every global macro desk tracks DXY as the first screen. FX reserve 
        managers, carry trade funds, and commodity traders use it for hedging overlays. 
        GraphiQuestor surfaces DXY on the Regime Digest vitals strip and country profile pages.`,
        interpretation: [
            { label: 'Strong Dollar', condition: 'DXY > 105', color: 'text-terminal-rose' },
            { label: 'Firm', condition: '100 < DXY ≤ 105', color: 'text-orange-400' },
            { label: 'Neutral', condition: '95 ≤ DXY ≤ 100', color: 'text-terminal-muted' },
            { label: 'Weak Dollar', condition: 'DXY < 95', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/regime-digest',
        relatedPageLabel: 'Regime Digest Vitals',
        sources: ['ICE (DXY)', 'FRED (DTWEXBGS)'],
    },
    {
        id: 'vix-volatility-index',
        name: 'VIX Volatility Index',
        category: 'Sovereign Risk',
        formula: 'VIX = 30-day implied volatility of S&P 500 options (CBOE model)',
        components: [
            'S&P 500 option chain – Near-term and next-term put/call implied vols',
            'Risk-free rate – T-bill rate for option pricing model',
        ],
        intuition: `VIX measures the market's demand for downside protection — the "fear gauge." 
        Sustained readings above 25 historically coincide with equity drawdowns and liquidity 
        stress; sub-15 readings with complacency and carry-trade buildups. For macro allocators, 
        VIX is a cross-asset regime filter: high VIX favours Treasuries, gold, and USD; 
        low VIX favours risk assets and EM carry.`,
        institutionalUse: `Volatility funds, risk parity strategies, and CIO offices use VIX 
        for hedging cadence. Central bank financial stability reports cite equity implied vol 
        as an early warning indicator. GraphiQuestor includes VIX on the Regime Digest vitals strip.`,
        interpretation: [
            { label: 'Crisis', condition: 'VIX > 30', color: 'text-terminal-rose' },
            { label: 'Elevated', condition: '20 < VIX ≤ 30', color: 'text-orange-400' },
            { label: 'Normal', condition: '15 ≤ VIX ≤ 20', color: 'text-terminal-muted' },
            { label: 'Complacent', condition: 'VIX < 15', color: 'text-terminal-blue' },
        ],
        relatedPage: '/labs/sovereign-stress',
        relatedPageLabel: 'Sovereign Stress Lab',
        sources: ['CBOE (VIX)', 'FRED'],
    },
    {
        id: 'treasury-10y-yield',
        name: 'US 10-Year Treasury Yield',
        category: 'Fiscal Health',
        formula: 'Yield = Market-clearing coupon rate on 10-year US Treasury note (DGS10)',
        components: [
            'Real yield component – Inflation expectations subtracted',
            'Term premium – Duration risk compensation',
            'Policy rate expectations – Fed funds path implied by OIS curve',
        ],
        intuition: `The 10-year Treasury yield is the global risk-free rate anchor. Its level 
        and slope versus 2-year yields drive mortgage rates, equity discount rates, and 
        sovereign borrowing costs worldwide. In fiscal dominance regimes, the 10Y becomes 
        politically sensitive — the Fed may cap yields (implicit YCC) when debt service 
        costs threaten sustainability.`,
        institutionalUse: `Fixed income PMs, liability-driven investors, and mortgage REITs 
        anchor to the 10Y. Macro hedge funds watch 10Y-2Y spread for recession signals. 
        GraphiQuestor tracks UST yields on country profiles and the US Macro Fiscal Lab.`,
        interpretation: [
            { label: 'Restrictive', condition: '10Y > 4.5%', color: 'text-terminal-rose' },
            { label: 'Elevated', condition: '3.5% < 10Y ≤ 4.5%', color: 'text-orange-400' },
            { label: 'Neutral', condition: '2.5% ≤ 10Y ≤ 3.5%', color: 'text-terminal-muted' },
            { label: 'Accommodative', condition: '10Y < 2.5%', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/labs/us-macro-fiscal',
        relatedPageLabel: 'US Macro Fiscal Lab',
        sources: ['FRED (DGS10)', 'US Treasury'],
    },
    {
        id: 'brent-crude-oil',
        name: 'Brent Crude Oil Price',
        category: 'Energy & Commodities',
        formula: 'Brent = ICE Brent front-month futures settlement (USD/barrel)',
        components: [
            'Spot Brent – Dated Brent benchmark (ICE)',
            'OPEC+ supply decisions – Production quota adjustments',
            'Global demand proxy – PMI composites, China imports',
        ],
        intuition: `Brent is the global oil benchmark — the single most important input for 
        EM current accounts, imported inflation, and energy security ratios. For India, 
        every $10/bbl Brent move shifts the current account by ~0.4% of GDP. Oil shocks 
        propagate to bond yields via inflation expectations and to FX via terms-of-trade.`,
        institutionalUse: `Energy desks, EM sovereign analysts, and inflation traders anchor 
        to Brent. IEA and OPEC monthly reports contextualise supply-demand. GraphiQuestor 
        tracks Brent on the Regime Digest vitals strip and Energy Commodities Lab.`,
        interpretation: [
            { label: 'Supply Shock', condition: 'Brent > $90/bbl', color: 'text-terminal-rose' },
            { label: 'Elevated', condition: '$75 < Brent ≤ $90', color: 'text-orange-400' },
            { label: 'Mid-Cycle', condition: '$55 ≤ Brent ≤ $75', color: 'text-terminal-muted' },
            { label: 'Demand Weak', condition: 'Brent < $55', color: 'text-terminal-blue' },
        ],
        relatedPage: '/labs/energy-commodities',
        relatedPageLabel: 'Energy Commodities Lab',
        sources: ['ICE Brent', 'EIA', 'FRED (DCOILBRENTEU)'],
    },
    {
        id: 'china-lgfv-stress',
        name: 'China LGFV Stress Index',
        category: 'Sovereign Risk',
        formula: 'LGFV Stress = f(LGFV bond spreads, rollover calendar, land-sale revenue, policy bank lending)',
        components: [
            'LGFV bond yields – Local government financing vehicle offshore/onshore spreads',
            'Land fiscal revenue – Local government fund budget receipts (MoF)',
            'Policy bank lending – CDB/ADBC infrastructure loan pipeline',
        ],
        intuition: `Local Government Financing Vehicles are the epicentre of China's hidden 
        debt stress. When land sales collapse and LGFV bond spreads widen simultaneously, 
        rollover risk spikes — even if official central government debt looks manageable. 
        This composite distills four opaque signals into a single stress coordinate for 
        the shadow sovereign balance sheet.`,
        institutionalUse: `EM sovereign desks and China macro specialists use LGFV stress 
        as a leading indicator for PBOC easing and property-sector policy. IMF Article IV 
        surveillance highlights LGFV rollover as the key China tail risk. GraphiQuestor's 
        Intel China terminal tracks this alongside the Iceberg Ratio.`,
        interpretation: [
            { label: 'Systemic Stress', condition: 'Index > 75', color: 'text-terminal-rose' },
            { label: 'Elevated', condition: '50 < Index ≤ 75', color: 'text-orange-400' },
            { label: 'Watch', condition: '25 < Index ≤ 50', color: 'text-terminal-gold' },
            { label: 'Contained', condition: 'Index ≤ 25', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/methods/china-debt-iceberg',
        relatedPageLabel: 'Deep Dive: China Debt Iceberg',
        sources: ['IMF Article IV', 'PBOC', 'Wind (LGFV bonds)'],
    },
    {
        id: 'india-gdp-growth',
        name: 'India Real GDP Growth (YoY)',
        category: 'Credit Quality',
        formula: 'GDP Growth YoY = (Real GDP_t / Real GDP_{t-4q} − 1) × 100',
        components: [
            'Real GDP – MoSPI quarterly national accounts (constant prices)',
            'GVA breakdown – Agriculture, industry, services contributions',
            'Deflator – Implicit GDP deflator for nominal/real conversion',
        ],
        intuition: `India's GDP growth rate is the headline signal for EM allocation, RBI 
        policy, and fiscal revenue projections. But the quality of growth matters as much 
        as the rate — credit growth, EPFO formalisation, and IIP production should confirm 
        GDP prints. GraphiQuestor pairs GDP with proprietary credit-efficiency metrics 
        to detect jobless or credit-less recoveries.`,
        institutionalUse: `Global EM funds, multilateral lenders, and sovereign credit analysts 
        anchor India models to GDP growth. RBI's MPC statement references growth-inflation 
        tradeoffs explicitly. GraphiQuestor's India Intel page surfaces GDP alongside 
        40+ additional India macro vitals.`,
        interpretation: [
            { label: 'High Growth', condition: 'GDP > 7% YoY', color: 'text-terminal-emerald' },
            { label: 'Trend Growth', condition: '5% < GDP ≤ 7%', color: 'text-terminal-muted' },
            { label: 'Slowing', condition: '3% < GDP ≤ 5%', color: 'text-orange-400' },
            { label: 'Stall', condition: 'GDP ≤ 3%', color: 'text-terminal-rose' },
        ],
        relatedPage: '/intel/india',
        relatedPageLabel: 'India Intel Terminal',
        sources: ['MoSPI', 'RBI', 'IMF WEO'],
    },
    {
        id: 'treasury-auction-demand',
        name: 'US Treasury Auction Demand Telemetry',
        category: 'Fiscal Health',
        formula: 'Demand Score = 0.4×(Bid-to-Cover Z) + 0.35×(Indirect Bidder % Z) − 0.25×(Primary Dealer Allotment % Z)',
        components: [
            'Bid-to-Cover Ratio – Total tenders received divided by total accepted volume at Treasury auctions',
            'Indirect Bidder % – Foreign central banks and institutional allocators bidding via New York Fed / dealers',
            'Primary Dealer Allotment – Unabsorbed tail inventory forced onto dealer balance sheets',
        ],
        intuition: `Headline Treasury yields only tell half the story. Auction demand metrics measure whether private 
        capital and foreign central banks are willing to absorb trillion-dollar US debt issuance at current yields. 
        When Indirect Bidders retreat and Primary Dealers are forced to absorb larger allotments (>20%), dealer balance 
        sheet capacity becomes constrained, causing auction "tails" and sharp repo rate spikes.`,
        institutionalUse: `Tracked in real time by Treasury primary dealers, fixed income arbitrage funds, and rate strategists. 
        An auction demand score below −1.5 signals primary dealer indigestion and precedes higher term premiums.`,
        interpretation: [
            { label: 'Strong Auction Bid', condition: 'Score > 1.0 (High indirect absorption)', color: 'text-terminal-emerald' },
            { label: 'Normal Absorption', condition: '−0.5 ≤ Score ≤ 1.0', color: 'text-terminal-muted' },
            { label: 'Auction Tail Risk', condition: '−1.5 ≤ Score < −0.5', color: 'text-orange-400' },
            { label: 'Dealer Indigestion', condition: 'Score < −1.5 (High dealer concession)', color: 'text-terminal-rose' },
        ],
        relatedPage: '/labs/us-macro-fiscal',
        relatedPageLabel: 'US Macro Fiscal Lab',
        sources: ['US Treasury FiscalData', 'Federal Reserve Board H.4.1', 'New York Fed'],
    },
    {
        id: 'us-debt-maturity-wall',
        name: 'US Debt Maturity Wall & Refinancing Schedule',
        category: 'Fiscal Health',
        formula: 'Maturity Burden % = (Treasury Debt Maturing in ≤12M / Total Marketable Public Debt) × 100',
        components: [
            'Debt Maturing ≤12M – Total Treasury bills, notes, and bonds expiring within 365 calendar days',
            'Total Marketable Debt – Gross marketable Treasury debt held by public and central banks',
            'Weighted Average Maturity (WAM) – Average duration of outstanding sovereign liabilities',
        ],
        intuition: `When the Treasury finances deficits heavily with short-term T-bills rather than long-term coupon bonds, 
        the effective maturity profile collapses. A high maturity wall (>30% maturing in 12 months) transforms the federal 
        government into a variable-rate borrower, making interest expense hypersensitive to Fed policy rates. Every 100 bps 
        hike transmits directly into hundreds of billions in additional annual deficit financing within 4 quarters.`,
        institutionalUse: `Central bank policy desks and sovereign bond allocators monitor the maturity schedule 
        to evaluate fiscal dominance and term premium vulnerability. Used by IMF fiscal monitoring teams in annual Debt Sustainability Analyses.`,
        interpretation: [
            { label: 'Acute Refinancing Pressure', condition: 'Maturity Burden > 35%', color: 'text-terminal-rose' },
            { label: 'Elevated Rollover Wall', condition: '25% < Burden ≤ 35%', color: 'text-orange-400' },
            { label: 'Balanced Term Profile', condition: '15% ≤ Burden ≤ 25%', color: 'text-terminal-muted' },
            { label: 'Termed Out', condition: 'Burden < 15%', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/labs/us-macro-fiscal',
        relatedPageLabel: 'US Macro Fiscal Lab',
        sources: ['US Treasury Monthly Statement of the Public Debt (MSPD)', 'FRED (GFDEBTN)'],
    },
    {
        id: 'wti-physical-stress',
        name: 'WTI Physical Market & Cushing Storage Stress',
        category: 'Energy & Commodities',
        formula: 'Prompt Spread = Front-Month WTI (M1) − Second-Month WTI (M2) (USD/bbl)',
        components: [
            'Prompt Spread (M1−M2) – Front-to-second month calendar spread indicating immediate physical tightness',
            'Cushing Inventory Capacity – Working storage utilization at Cushing, Oklahoma hub (EIA)',
            'Crack Spread 3:2:1 – Refinery margin incentive proxy for crude consumption demand',
        ],
        intuition: `Paper futures prices can diverge from physical crude reality. The prompt calendar spread reveals 
        immediate physical delivery bottlenecks: steep backwardation (M1 > M2) signals immediate physical scarcity and 
        depleted commercial storage, while steep contango (M1 < M2) indicates acute physical oversupply and storage saturation.`,
        institutionalUse: `Commodity trading desks, physical oil refiners, and global macro funds use prompt calendar 
        spreads as the pure leading signal for inventory cycles before EIA weekly inventory numbers are reported.`,
        interpretation: [
            { label: 'Super Backwardation (Extreme Scarcity)', condition: 'Prompt Spread > $1.50/bbl', color: 'text-terminal-emerald' },
            { label: 'Physical Tightness', condition: '$0.25 < Spread ≤ $1.50/bbl', color: 'text-terminal-blue' },
            { label: 'Balanced Supply', condition: '−$0.25 ≤ Spread ≤ $0.25/bbl', color: 'text-terminal-muted' },
            { label: 'Contango (Physical Glut)', condition: 'Spread < −$0.25/bbl', color: 'text-terminal-rose' },
        ],
        relatedPage: '/labs/energy-commodities',
        relatedPageLabel: 'Energy Commodities Lab',
        sources: ['NYMEX WTI', 'EIA Petroleum Status Report', 'CME Group'],
    },
    {
        id: 'cftc-cot-positioning',
        name: 'CFTC Speculative Net Positioning & Squeeze Telemetry',
        category: 'Market Positioning',
        formula: 'Spec Net % = (Non-Commercial Longs − Non-Commercial Shorts) / Total Open Interest × 100',
        components: [
            'Non-Commercial Longs/Shorts – Speculative positioning from hedge funds, CTAs, and asset managers',
            'Commercial Hedgers – Physical producers and merchant consumers hedging real commodity exposure',
            '3-Year Percentile Rank – Historical context of current net positioning crowding',
        ],
        intuition: `Extreme speculative consensus is the primary precursor to violent market squeezes. When speculative 
        net length reaches the 95th percentile, marginal buyers are exhausted; any bearish catalyst forces cascade liquidations. 
        Conversely, extreme speculative short positioning provides the fuel for short squeezes when macro conditions stabilize.`,
        institutionalUse: `Macro positioning desks and systematic trend-following funds incorporate COT z-scores 
        and percentile rankings to size risk and set reversal stop-loss levels across crude, gold, currencies, and 10Y Treasuries.`,
        interpretation: [
            { label: 'Extreme Long Crowding (Squeeze Risk)', condition: 'Percentile > 90%', color: 'text-terminal-rose' },
            { label: 'Long Bias', condition: '60% < Percentile ≤ 90%', color: 'text-orange-400' },
            { label: 'Balanced Positioning', condition: '40% ≤ Percentile ≤ 60%', color: 'text-terminal-muted' },
            { label: 'Extreme Short Crowding (Rebound Fuel)', condition: 'Percentile < 10%', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/labs/energy-commodities',
        relatedPageLabel: 'Energy & Positioning Lab',
        sources: ['CFTC Commitments of Traders (Disaggregated & Legacy)', 'CME', 'ICE'],
    },
    {
        id: 'g20-fiscal-vulnerability',
        name: 'G20 Fiscal Vulnerability vs Vitality Matrix',
        category: 'Sovereign Risk',
        formula: 'Vulnerability Index = (Debt/GDP %) × (Interest Expense / Revenue %) / (Nominal GDP Growth %)',
        components: [
            'Debt/GDP Ratio – Gross general government debt as % of national nominal GDP (IMF WEO)',
            'Interest Expense Burden – Net interest payments as percentage of total sovereign revenue',
            'Nominal GDP Growth (g) – Nominal GDP growth rate acting as the sovereign denominator growth engine',
        ],
        intuition: `A high debt ratio is sustainable if the sovereign's nominal economic growth (g) exceeds the effective 
        interest rate on debt (r) — the classic r−g differential. The G20 Fiscal Matrix maps 20 major economies across 
        four distinct quadrants: Fiscal Vitality (low debt, high growth), Complacent Buffer (high debt, high growth), 
        Stagnant Burden (low debt, low growth), and Structural Trap (high debt, low growth, elevated interest).`,
        institutionalUse: `Sovereign credit rating analysts, EM debt managers, and global capital allocators use this matrix 
        to evaluate sovereign spread divergence and sovereign CDS risk across developed and emerging nations.`,
        interpretation: [
            { label: 'Fiscal Vitality (Resilient)', condition: 'Low Debt/GDP + High Nominal Growth', color: 'text-terminal-emerald' },
            { label: 'Refinancing Risk (Warning)', condition: 'High Debt/GDP + Moderate Growth', color: 'text-orange-400' },
            { label: 'Fiscal Trap (Severe Risk)', condition: 'Debt/GDP > 110% & r > g', color: 'text-terminal-rose' },
            { label: 'Fiscal Repair', condition: 'Primary balance surplus & expanding growth', color: 'text-terminal-blue' },
        ],
        relatedPage: '/labs/sovereign-stress',
        relatedPageLabel: 'Sovereign Stress Lab',
        sources: ['IMF World Economic Outlook (WEO)', 'BIS Debt Statistics', 'OECD'],
    },
    {
        id: 'china-monetization-pressure',
        name: 'China Quasi-Fiscal Monetization Pressure',
        category: 'Sovereign Risk',
        formula: 'Monetization Pressure = (PSL + Policy Bank Lending + Central Bank Claims on Gov) / Nominal GDP × 100',
        components: [
            'Pledged Supplementary Lending (PSL) – PBOC direct funding facility to policy banks (CDB, ADBC)',
            'Special Refinancing Bond Quota – Central sovereign quota allocated to swap off-budget LGFV debt',
            'PBOC Balance Sheet Claims on Depository Corporations – Core liquidity injection conduit',
        ],
        intuition: `China rarely conducts conventional Western quantitative easing with open market purchases of central government bonds. 
        Instead, quasi-fiscal monetization happens through policy bank credit (CDB/ADBC) funded by the PBOC via Pledged Supplementary 
        Lending (PSL) and relending quotas. When local debt maturity stress peaks, this index surges, revealing the actual pace 
        of debt socialization and currency debasement pressure.`,
        institutionalUse: `EM macro funds and China sovereign risk specialists use this indicator to forecast PBOC reserve requirement 
        ratio (RRR) cuts, LPR adjustments, and RMB currency pressure before official communique releases.`,
        interpretation: [
            { label: 'Aggressive Quasi-QE', condition: 'Pressure > 15% GDP', color: 'text-terminal-rose' },
            { label: 'Targeted Easing', condition: '8% < Pressure ≤ 15%', color: 'text-orange-400' },
            { label: 'Normal Transmission', condition: 'Pressure ≤ 8%', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/intel/china',
        relatedPageLabel: 'China Intel Terminal',
        sources: ['PBOC Statistical Bulletin', 'Ministry of Finance PRC', 'IMF Article IV'],
    },

    // ── Dossier series (rendered by src/features/dossier) ─────────────────────
    {
        id: 'fed-balance-sheet',
        name: 'Fed Balance Sheet (Total Assets)',
        category: 'Liquidity',
        formula: 'WALCL = Total assets of the Federal Reserve Banks, Wednesday level (H.4.1), USD',
        components: [
            'WALCL – Federal Reserve total assets, weekly Wednesday level (FRED)',
            'Main holdings: Treasury securities, agency MBS, repo and lending facilities',
        ],
        intuition: `The Fed balance sheet expands when it buys securities or lends to banks and contracts when holdings
        mature without replacement. Each expansion creates bank reserves; each runoff removes them. It is the gross
        input to net liquidity before the Treasury's cash balance and reverse repo are subtracted.`,
        institutionalUse: `Liquidity desks track the pace of QE and QT through WALCL and pair it with the TGA and
        reverse repo to estimate how much of the change reaches bank reserves.`,
        interpretation: [
            { label: 'Expanding (QE or lending)', condition: 'Weekly change > 0', color: 'text-terminal-emerald' },
            { label: 'Contracting (QT)', condition: 'Weekly change < 0', color: 'text-orange-400' },
        ],
        relatedPage: '/metrics/net-liquidity/',
        relatedPageLabel: 'Fed net liquidity dossier',
        sources: ['FRED (WALCL)', 'Federal Reserve H.4.1'],
    },
    {
        id: 'tga-balance',
        name: 'Treasury General Account Balance',
        category: 'Liquidity',
        formula: 'TGA = US Treasury operating cash held at the Federal Reserve (H.4.1, weekly average)',
        components: [
            'WTREGEN – Treasury General Account, weekly average, published in the Fed H.4.1 release',
            'Daily Treasury Statement – operating cash balance used for intra-week moves',
        ],
        intuition: `The TGA is the government's checking account at the Fed. When the Treasury raises cash through
        tax receipts or debt issuance faster than it spends, the balance rises and bank reserves fall by the same amount.
        When it spends down the balance — typically under a binding debt ceiling — reserves flow back into the banking
        system. Because these swings happen with no change in monetary policy, the TGA is one of the largest
        non-policy drivers of dollar liquidity.`,
        institutionalUse: `Liquidity desks track the TGA alongside the Fed balance sheet and reverse repo to estimate
        net reserve supply. Treasury refunding announcements and debt-ceiling deadlines are read through their
        expected effect on the TGA path.`,
        interpretation: [
            { label: 'Rebuild', condition: 'Balance rising — reserves drained', color: 'text-orange-400' },
            { label: 'Drawdown', condition: 'Balance falling — reserves added', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/metrics/net-liquidity/',
        relatedPageLabel: 'Fed net liquidity dossier',
        sources: ['FRED (WTREGEN)', 'US Treasury Daily Treasury Statement'],
    },
    {
        id: 'reverse-repo-balance',
        name: 'Overnight Reverse Repo Balance',
        category: 'Liquidity',
        formula: 'ON RRP = Total overnight reverse repurchase agreements conducted by the NY Fed (daily)',
        components: [
            'RRPONTSYD – Overnight reverse repurchase agreements: Treasury securities sold by the Fed in temporary open market operations',
            'Counterparties – mainly money market funds, plus GSEs and banks',
        ],
        intuition: `The reverse repo facility lets money market funds lend cash to the Fed overnight at a fixed rate.
        Large balances mean surplus cash with nowhere better to go; as Treasury bill supply rises or the balance sheet
        shrinks, that cash leaves the facility and is absorbed elsewhere. A balance near zero means the buffer that
        cushioned quantitative tightening is spent, and further drains come out of bank reserves.`,
        institutionalUse: `Funding strategists watch the facility as a buffer gauge: while it is large, QT and bill
        issuance drain it rather than reserves. Once it is depleted, repo rates and the SOFR–EFFR spread become the
        early warning for reserve scarcity.`,
        interpretation: [
            { label: 'Buffer available', condition: 'Balance well above zero', color: 'text-terminal-emerald' },
            { label: 'Buffer depleted', condition: 'Balance near zero', color: 'text-orange-400' },
        ],
        relatedPage: '/metrics/net-liquidity/',
        relatedPageLabel: 'Fed net liquidity dossier',
        sources: ['FRED (RRPONTSYD)', 'Federal Reserve Bank of New York'],
    },
    {
        id: 'us-m2-money-supply',
        name: 'US M2 Money Supply',
        category: 'Liquidity',
        formula: 'M2 = Currency + demand deposits + other checkable deposits + savings deposits + small time deposits + retail money market funds',
        components: [
            'M2SL – M2 money stock, seasonally adjusted, monthly (Federal Reserve H.6)',
            'The May 2020 redefinition moved savings deposits into M1; M2 coverage was largely unchanged',
        ],
        intuition: `M2 measures the broad stock of money households and firms can spend quickly. Its growth reflects bank
        credit creation, fiscal transfers that land in deposits, and central-bank asset purchases. The 2020–21 surge and
        the 2022–23 contraction — the first year-over-year decline since the series began in 1959 — are the clearest recent examples
        of how policy reaches the deposit base.`,
        institutionalUse: `Allocators use M2 as the denominator for debasement ratios (M2/gold, market cap/M2) and as
        a slow-moving check on whether nominal growth is being financed by money creation.`,
        interpretation: [],
        relatedPage: '/metrics/m2-gold-ratio/',
        relatedPageLabel: 'M2 to gold ratio dossier',
        sources: ['FRED (M2SL)', 'Federal Reserve H.6'],
    },
    {
        id: 'real-gold-price',
        name: 'Inflation-Adjusted Gold Price',
        category: 'Precious Metals',
        formula: 'Real gold(t) = Gold price(t) × CPI(latest month) / CPI(t)',
        components: [
            'Gold price – monthly last print of the stored gold price history (USD/oz)',
            'CPIAUCSL – US consumer price index, all urban consumers, seasonally adjusted',
        ],
        intuition: `Nominal gold records say little on their own: a dollar in 2011 bought more than a dollar today.
        Deflating by CPI expresses every month's price in the purchasing power of the latest month, so past peaks
        can be compared directly with the current price.`,
        institutionalUse: `Real gold is used to judge whether a nominal record is also a real one, and alongside real
        interest rates to separate a monetary bid for gold from a simple inflation pass-through.`,
        interpretation: [],
        relatedPage: '/metrics/m2-gold-ratio/',
        relatedPageLabel: 'M2 to gold ratio dossier',
        sources: ['Gold price history (stored series)', 'FRED (CPIAUCSL)'],
    },
    {
        id: 'spx-gold-ratio',
        name: 'S&P 500 to Gold Ratio',
        category: 'Precious Metals',
        formula: 'SPX/Gold = S&P 500 index level ÷ Gold price (USD/oz)',
        components: [
            'S&P 500 index level – daily close',
            'Gold price – continuous front-month futures, USD/oz',
        ],
        intuition: `Dividing the S&P 500 by gold prices equities in ounces of gold rather than dollars. That removes the
        common effect of dollar debasement and isolates the relative performance of productive assets against the
        monetary hedge. A rising ratio means equities are outrunning gold; a falling one means gold is.`,
        institutionalUse: `Multi-asset allocators use the ratio as a regime gauge between risk-on growth leadership and
        defensive, hard-asset leadership.`,
        interpretation: [
            { label: 'Equities leading', condition: 'Ratio rising', color: 'text-terminal-emerald' },
            { label: 'Gold leading', condition: 'Ratio falling', color: 'text-orange-400' },
        ],
        sources: ['S&P 500 (stored series)', 'Gold futures (stored series)'],
    },
    {
        id: 'copper-gold-ratio',
        name: 'Copper to Gold Ratio',
        category: 'Precious Metals',
        formula: 'Copper/Gold = Copper price (USD per metric ton) ÷ Gold price (USD per troy ounce), monthly',
        components: [
            'PCOPPUSDM – global copper price, USD per metric ton, monthly (IMF via FRED)',
            'Gold price – monthly last print, USD/oz',
            'Only USD-per-metric-ton observations are used; daily COMEX prints quoted in USD per pound are excluded rather than converted',
        ],
        intuition: `Copper is priced on industrial demand; gold on monetary and safe-haven demand. Their ratio rises when
        markets price stronger growth and falls when they price fear or monetary hedging. Because both legs are
        dollar-priced, the dollar's own moves largely cancel out.`,
        institutionalUse: `Rates strategists compare the ratio with long-dated Treasury yields as a cross-check on
        growth expectations; commodity desks use it to separate cyclical from defensive metal demand.`,
        interpretation: [
            { label: 'Growth bid', condition: 'Ratio rising', color: 'text-terminal-emerald' },
            { label: 'Haven bid', condition: 'Ratio falling', color: 'text-orange-400' },
        ],
        sources: ['FRED (PCOPPUSDM)', 'Gold price history (stored series)'],
    },
    {
        id: 'global-gold-reserve-share',
        name: 'Gold Share of Global Reserves',
        category: 'De-Dollarization',
        formula: 'Gold share = Official gold holdings at market value ÷ Total official reserve assets × 100',
        components: [
            'Official gold holdings – central bank gold valued at market prices',
            'Total reserve assets – foreign exchange reserves plus gold, SDRs, and IMF reserve position',
        ],
        intuition: `Gold's weight in reserves moves for two reasons: central banks buy or sell metal, and the gold price
        revalues what they already hold. Since 2022, record official purchases and a rising price have pushed the share
        up together, which is why it is read alongside the dollar's share of currency reserves.`,
        institutionalUse: `Reserve managers and de-dollarization researchers track the share to see how much reserve
        diversification is happening through gold rather than other currencies.`,
        interpretation: [],
        relatedPage: '/labs/central-bank-gold-purchases/',
        relatedPageLabel: 'Central bank gold purchases lab',
        sources: ['IMF International Financial Statistics', 'World Gold Council'],
    },
    {
        id: 'interest-expense-to-gdp',
        name: 'Federal Interest Expense to GDP',
        category: 'Fiscal Health',
        formula: 'Interest / GDP = Federal government interest payments (SAAR) ÷ Nominal GDP (SAAR) × 100',
        components: [
            'A091RC1Q027SBEA – federal government current expenditures: interest payments, quarterly SAAR',
            'GDP – nominal gross domestic product, quarterly SAAR',
        ],
        intuition: `Scaling interest by GDP shows the cost of carrying federal debt relative to the economy that services
        it. It rises when debt grows faster than output or when maturing debt rolls into higher rates, and it captures
        both effects in one number.`,
        institutionalUse: `Sovereign analysts compare it with the late-1980s and early-1990s highs and with other G7 issuers when
        assessing debt sustainability and term-premium risk.`,
        interpretation: [],
        relatedPage: '/methods/fiscal-dominance-meter/',
        relatedPageLabel: 'Fiscal dominance methodology',
        sources: ['FRED (A091RC1Q027SBEA, GDP)', 'BEA NIPA'],
    },
    {
        id: 'federal-interest-payments',
        name: 'US Federal Interest Payments',
        category: 'Fiscal Health',
        formula: 'Federal government interest payments, seasonally adjusted annual rate (USD billions)',
        components: [
            'BEA NIPA federal current expenditures: interest payments',
            'Quarterly observations, annualised',
        ],
        intuition: `This is the dollar cost of servicing federal debt. On a log scale its slope shows how quickly the
        bill compounds as debt stock and average interest rates rise together, and it is the numerator of the fiscal
        dominance measures on this site.`,
        institutionalUse: `Used as the base input for interest-to-receipts and interest-to-GDP ratios and in
        projections of how much new issuance is needed just to pay interest.`,
        interpretation: [],
        relatedPage: '/metrics/fiscal-dominance-meter/',
        relatedPageLabel: 'Interest expense vs tax receipts',
        sources: ['BEA NIPA', 'FRED'],
    },
    {
        id: 'entitlements-to-receipts',
        name: 'Entitlement Spending to Tax Receipts',
        category: 'Fiscal Health',
        formula: 'Entitlements / receipts = Major entitlement outlays ÷ Federal tax receipts × 100',
        components: [
            'Major entitlements – Social Security, Medicare, Medicaid, and related transfer programmes',
            'Federal tax receipts – current tax receipts, quarterly SAAR',
        ],
        intuition: `Entitlements are paid automatically under existing law. The share of tax revenue they absorb shows how
        much of the budget is committed before Congress votes on discretionary spending — and, combined with interest,
        how little fiscal room is left in a downturn.`,
        institutionalUse: `Fiscal analysts use it to frame structural deficits independently of the business cycle.`,
        interpretation: [],
        relatedPage: '/labs/us-macro-fiscal/',
        relatedPageLabel: 'US macro and fiscal lab',
        sources: ['BEA NIPA', 'FRED'],
    },
    {
        id: 'mandatory-spending-to-receipts',
        name: 'Mandatory Spending to Tax Receipts',
        category: 'Fiscal Health',
        formula: 'Mandatory / receipts = Mandatory federal outlays ÷ Federal tax receipts × 100',
        components: [
            'Mandatory outlays – spending governed by existing law rather than annual appropriations',
            'Federal tax receipts – current tax receipts, quarterly SAAR',
        ],
        intuition: `Mandatory spending is the broader set of outlays that run on autopilot. When it exceeds a large share
        of receipts, discretionary spending and interest are effectively financed by borrowing.`,
        institutionalUse: `Sovereign credit analysts use it alongside interest-to-receipts to gauge how quickly fiscal
        flexibility is eroding.`,
        interpretation: [],
        relatedPage: '/labs/us-macro-fiscal/',
        relatedPageLabel: 'US macro and fiscal lab',
        sources: ['BEA NIPA', 'FRED'],
    },
    {
        id: 'us-debt-to-gdp',
        name: 'US Federal Debt to GDP',
        category: 'Fiscal Health',
        formula: 'Debt / GDP = Total public debt outstanding ÷ Nominal GDP × 100',
        components: [
            'GFDEGDQ188S – federal debt: total public debt as a percent of GDP, quarterly',
        ],
        intuition: `Debt-to-GDP measures the stock of federal debt against the size of the economy. It steps up in
        recessions, when deficits widen and output falls together, and declines only through sustained surpluses or
        nominal growth that outpaces borrowing.`,
        institutionalUse: `It is the standard cross-country sovereign leverage measure and the starting point for debt
        sustainability analysis.`,
        interpretation: [],
        relatedPage: '/labs/sovereign-stress/',
        relatedPageLabel: 'Sovereign stress lab',
        sources: ['FRED (GFDEGDQ188S)', 'US Treasury', 'BEA'],
    },
    {
        id: 'yield-curve-10y-2y',
        name: '10Y–2Y Treasury Yield Spread',
        category: 'Rates',
        formula: 'Spread = 10-year Treasury constant-maturity yield − 2-year Treasury constant-maturity yield (bp)',
        components: [
            'T10Y2Y – 10-year minus 2-year Treasury constant maturity, daily (FRED)',
            'Shown in basis points (1 percentage point = 100 bp)',
        ],
        intuition: `The 2-year yield is anchored by expected policy rates; the 10-year adds longer-run growth, inflation,
        and term premium. When the curve inverts, markets expect policy to be tighter now than it will need to be later
        — historically a sign that tight policy is restraining the economy.`,
        institutionalUse: `It is the most widely cited recession-watch spread. Desks track both the depth and duration
        of inversions and the re-steepening that typically follows the start of an easing cycle.`,
        interpretation: [
            { label: 'Inverted', condition: 'Spread < 0 bp', color: 'text-terminal-rose' },
            { label: 'Flat', condition: '0–50 bp', color: 'text-orange-400' },
            { label: 'Upward sloping', condition: 'Spread > 50 bp', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/metrics/treasury-10y-yield/',
        relatedPageLabel: '10-year Treasury yield dossier',
        sources: ['FRED (T10Y2Y)', 'US Treasury'],
    },
    {
        id: 'real-fed-funds-rate',
        name: 'Real Fed Funds Rate',
        category: 'Rates',
        formula: 'Real rate(t) = Effective fed funds rate(t) − CPI year-over-year inflation(t)',
        components: [
            'FEDFUNDS – effective federal funds rate, monthly average',
            'CPI YoY – computed from CPIAUCSL as the 12-month percent change in the index',
        ],
        intuition: `The nominal policy rate says little about restraint without inflation alongside it. Subtracting
        realised inflation shows whether money is costly or cheap in real terms: deeply negative in the 1970s and 2021,
        strongly positive under Volcker and again after 2023.`,
        institutionalUse: `Macro desks use the real policy rate to judge the stance of policy and as an input to gold
        and long-duration asset valuation.`,
        interpretation: [
            { label: 'Restrictive', condition: 'Real rate > +1 pp', color: 'text-orange-400' },
            { label: 'Neutral-ish', condition: '−1 to +1 pp', color: 'text-terminal-muted' },
            { label: 'Accommodative', condition: 'Real rate < −1 pp', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/glossary/real-interest-rates/',
        relatedPageLabel: 'Real interest rates explained',
        sources: ['FRED (FEDFUNDS, CPIAUCSL)'],
    },
    {
        id: 'breakeven-inflation-5y',
        name: '5-Year Breakeven Inflation Rate',
        category: 'Rates',
        formula: 'Breakeven = 5-year nominal Treasury yield − 5-year TIPS real yield',
        components: [
            'T5YIE – 5-year breakeven inflation rate, daily (FRED)',
            'Includes an inflation risk premium and TIPS liquidity effects, so it is not a pure expectation',
        ],
        intuition: `The breakeven is the inflation rate at which nominal Treasuries and TIPS deliver the same return. It is
        the market's real-time price of medium-term inflation, and it moves fast when energy shocks or policy surprises
        change the inflation outlook.`,
        institutionalUse: `Central banks monitor it as a check on whether inflation expectations stay anchored; investors
        use it to choose between nominal and inflation-linked bonds.`,
        interpretation: [],
        relatedPage: '/glossary/breakeven-inflation-rate/',
        relatedPageLabel: 'Breakeven inflation explained',
        sources: ['FRED (T5YIE)'],
    },
    {
        id: 'high-yield-credit-spread',
        name: 'US High-Yield Credit Spread',
        category: 'Credit',
        formula: 'HY OAS = Option-adjusted spread of the ICE BofA US High Yield Index over Treasuries (bp)',
        components: [
            'BAMLH0A0HYM2 – ICE BofA US High Yield Index option-adjusted spread, daily (FRED, reported in percent)',
            'Shown in basis points',
        ],
        intuition: `The high-yield spread is the extra yield investors demand to hold sub-investment-grade corporate debt
        instead of Treasuries. It compresses when default risk looks remote and widens quickly when funding conditions
        tighten, making it one of the fastest market reads of credit stress.`,
        institutionalUse: `Credit and macro desks use it as a risk-appetite gauge and as an input to financial conditions
        indices.`,
        interpretation: [],
        sources: ['FRED (BAMLH0A0HYM2)', 'ICE Data Indices'],
    },
    {
        id: 'sofr-effr-spread',
        name: 'SOFR–EFFR Spread',
        category: 'Liquidity',
        formula: 'Spread = Secured Overnight Financing Rate − Effective Federal Funds Rate (bp)',
        components: [
            'SOFR – broad Treasury repo rate, daily (NY Fed)',
            'EFFR – effective federal funds rate, daily (NY Fed)',
        ],
        intuition: `SOFR is a secured rate and usually trades at or below unsecured fed funds. When repo funding becomes
        scarce — at quarter-ends, around tax dates, or as reserves fall toward scarcity — SOFR rises above EFFR. A
        persistent positive spread is an early sign that the reserve buffer is running thin.`,
        institutionalUse: `Funding desks and Fed watchers use it with the reverse repo balance to judge how close the
        system is to reserve scarcity and to anticipate the end of balance-sheet runoff.`,
        interpretation: [
            { label: 'Repo pressure', condition: 'Spread > 0 bp', color: 'text-orange-400' },
            { label: 'Normal', condition: 'Spread ≤ 0 bp', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/labs/interbank-funding/',
        relatedPageLabel: 'Interbank funding lab',
        sources: ['Federal Reserve Bank of New York (SOFR, EFFR)'],
    },
];


