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
        formula: 'M2/Gold Ratio = Global M2 (USD) / (Above-ground gold oz × Spot XAU/USD)',
        components: [
            'Global M2 – Sum of US, Eurozone, China, Japan, UK broad money (FRED, ECB, PBoC, BoJ, BoE)',
            'Above-ground gold – World Gold Council official stock estimate (~212,582 tonnes)',
            'Spot XAU/USD – COMEX front-month gold settlement',
        ],
        intuition: `When fiat money supply expands faster than gold's market capitalisation, the ratio rises — 
        signalling currency debasement without a corresponding hard-asset re-rating. The 2020 COVID stimulus 
        pushed this ratio to a 30-year extreme; subsequent gold rallies compress it as hard assets catch up 
        to monetary expansion. Institutional allocators treat sustained ratio elevation as a structural 
        mean-reversion setup for gold versus cash.`,
        institutionalUse: `Tracked by macro hedge funds and central bank reserve managers as a debasement 
        gauge distinct from real-rate models. BIS researchers and WGC publications reference M2/gold 
        normalisation in long-horizon gold allocation frameworks. GraphiQuestor's weekly Regime Digest 
        cites this ratio when flagging hard-asset regime shifts.`,
        interpretation: [
            { label: 'Extreme Debasement', condition: 'Ratio > 40-yr mean + 2σ', color: 'text-terminal-gold' },
            { label: 'Elevated Fiat', condition: 'Above long-run mean', color: 'text-orange-400' },
            { label: 'Neutral', condition: 'Within ±1σ of mean', color: 'text-terminal-muted' },
            { label: 'Gold Rich', condition: 'Below mean − 1σ', color: 'text-terminal-emerald' },
        ],
        relatedPage: '/methods/m2-gold-ratio',
        relatedPageLabel: 'Deep Dive: M2/Gold Methodology',
        sources: ['FRED', 'ECB', 'World Gold Council', 'BIS'],
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
];

