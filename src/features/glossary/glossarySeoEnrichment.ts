export interface GlossaryFaqItem {
    question: string;
    answer: string;
}

export interface GlossaryReadingLink {
    to: string;
    label: string;
    kind: 'method' | 'lab' | 'glossary' | 'intel' | 'terminal';
}

export interface GlossarySeoEnrichment {
    /** Keyword-optimized <title> — overrides dynamic title when set */
    seoTitle: string;
    /** Meta description — 150–160 chars, includes primary keyword */
    seoDescription: string;
    /** Primary + secondary organic query targets */
    seoKeywords: string[];
    /** Optional H1 override for on-page keyword match */
    h1?: string;
    /** 2026 macro relevance paragraph */
    context2026: string;
    /** Additional FAQ entities for JSON-LD + visible FAQ block */
    faqItems: GlossaryFaqItem[];
    /** Curated internal links (3–5) for Related Metrics & Reading */
    relatedReading: GlossaryReadingLink[];
    /** Metric ID for embedded live sparkline (optional) */
    liveMetricId?: string;
    liveMetricLabel?: string;
    liveMetricUnit?: string;
}

export const GLOSSARY_SEO_ENRICHMENT: Record<string, GlossarySeoEnrichment> = {
    'breakeven-inflation-rate': {
        seoTitle: 'Breakeven Inflation Rate: Definition, Formula & Live 10Y Data (2026)',
        seoDescription:
            'What is breakeven inflation? Market-implied inflation from nominal Treasury vs TIPS yields. Live 10Y breakeven (T10YIE), formula, and 2026 Fed policy context for macro allocators.',
        seoKeywords: [
            'breakeven inflation',
            'breakeven inflation rate',
            '10 year breakeven inflation',
            'TIPS breakeven',
            'inflation expectations',
            'T10YIE',
        ],
        h1: 'Breakeven Inflation Rate',
        context2026:
            'In H1 2026, the 10-year breakeven inflation rate remains the primary market gauge of whether the Fed can hold its 2% anchor while running concurrent fiscal deficits above $1.8T annually. Breakevens above 2.4% historically constrain the Fed\'s ability to cut aggressively without re-anchoring expectations; readings below 2.0% signal disinflation risk that supports duration and gold. Macro desks cross breakevens with real yields (TIPS) and the Fiscal Dominance Meter to identify policy inflection points — the same framework used in GraphiQuestor\'s Fed Monetization Monitor.',
        liveMetricId: 'T10YIE',
        liveMetricLabel: '10-Year Breakeven Inflation (T10YIE)',
        liveMetricUnit: '%',
        faqItems: [
            {
                question: 'What is a good breakeven inflation rate?',
                answer:
                    'The Fed\'s explicit target is 2% average inflation. A 10-year breakeven near 2.0–2.2% is considered well-anchored. Sustained readings above 2.5% signal markets expect the Fed to miss its mandate; below 1.8% signals disinflation or deflation risk.',
            },
            {
                question: 'What is the difference between breakeven inflation and CPI?',
                answer:
                    'CPI measures realised past inflation. Breakeven inflation is a forward-looking market price derived from the spread between nominal Treasuries and TIPS — it reflects what traders expect inflation to average over the bond\'s life, not what has already occurred.',
            },
            {
                question: 'How do breakeven inflation rates affect gold prices?',
                answer:
                    'Gold responds more to real interest rates (nominal yield minus breakeven) than to breakevens alone. Rising breakevens without matching nominal yield increases compress real rates, which is bullish for gold. Rising breakevens alongside rising nominal yields (positive real rates) is typically bearish for gold.',
            },
        ],
        relatedReading: [
            { to: '/glossary/real-interest-rates', label: 'Real Interest Rates', kind: 'glossary' },
            { to: '/methods/fed-monetization-monitor', label: 'Fed Monetization Monitor', kind: 'method' },
            { to: '/glossary/fiscal-dominance', label: 'Fiscal Dominance', kind: 'glossary' },
            { to: '/labs/us-macro-fiscal', label: 'US Macro & Fiscal Lab', kind: 'lab' },
            { to: '/', label: 'Live Macro Terminal', kind: 'terminal' },
        ],
    },

    'foreign-exchange-reserves': {
        seoTitle: 'Foreign Exchange Reserves: Definition, Forex Reserves & 2026 Trends',
        seoDescription:
            'Foreign exchange reserves (forex reserves) explained: what central banks hold, why FX reserves matter for currency stability, import cover ratios, and live India RBI reserve data on GraphiQuestor.',
        seoKeywords: [
            'foreign exchange reserves',
            'forex reserves',
            'FX reserves',
            'central bank reserves',
            'forex reserve management',
            'foreign exchange reserve definition',
        ],
        h1: 'Foreign Exchange Reserves (Forex Reserves)',
        context2026:
            'Global FX reserve accumulation slowed in 2024–2025 as EM central banks diversified into gold — WGC data shows official sector gold buying exceeded 1,000 tonnes annually while USD-denominated reserve share fell toward 58% (IMF COFER). In 2026, forex reserve composition matters as much as level: India\'s $600B+ stock provides ~11 months import cover, while rapid drawdowns in frontier markets remain the earliest BOP stress signal. Reserve managers now balance USD liquidity, gold, and RMB allocations amid BRICS settlement expansion.',
        liveMetricId: 'IN_FX_RESERVES',
        liveMetricLabel: 'India FX Reserves (RBI)',
        liveMetricUnit: '$Bn',
        faqItems: [
            {
                question: 'What are foreign exchange reserves used for?',
                answer:
                    'Central banks hold forex reserves to: (1) intervene in currency markets to prevent disorderly depreciation, (2) service external debt and import bills during crises, (3) maintain confidence in the sovereign\'s external solvency, and (4) diversify away from single-currency exposure.',
            },
            {
                question: 'Which country has the largest forex reserves?',
                answer:
                    'China holds the world\'s largest foreign exchange reserves (~$3.2T+), followed by Japan, Switzerland, and India. The composition — USD assets vs gold vs SDRs — varies significantly and drives de-dollarization analytics.',
            },
            {
                question: 'What is a healthy level of forex reserves?',
                answer:
                    'The IMF Guidotti-Greenspan rule suggests reserves should cover 100% of short-term external debt. Import cover of 6–12 months is standard for emerging markets. India targets 10+ months; levels below 3 months import cover historically precede currency crises.',
            },
        ],
        relatedReading: [
            { to: '/intel/india', label: 'India Macro Pulse', kind: 'intel' },
            { to: '/intel/china', label: 'China Macro Pulse', kind: 'intel' },
            { to: '/glossary/de-dollarization', label: 'De-Dollarization', kind: 'glossary' },
            { to: '/labs/de-dollarization-gold', label: 'Gold & Reserve Lab', kind: 'lab' },
            { to: '/glossary/reserve-currency-composition', label: 'Reserve Currency Composition', kind: 'glossary' },
        ],
    },

    'fiscal-dominance': {
        seoTitle: 'Fiscal Dominance: Definition, Formula & US Debt Context (2026)',
        seoDescription:
            'Fiscal dominance defined: when government debt constrains central bank policy. Interest-to-tax ratios, Thomas Sargent framework, live Fiscal Dominance Meter, and 2026 US sovereign stress signals.',
        seoKeywords: [
            'fiscal dominance',
            'fiscal dominance definition',
            'fiscal dominance monetary policy',
            'fiscal dominance Fed',
            'debt monetisation',
        ],
        h1: 'Fiscal Dominance',
        context2026:
            'US federal interest expense exceeded $1T annually in 2025 — roughly 22–24% of tax receipts — placing the economy in a fiscal dominance regime by historical standards (1940s, 1990s Japan). With $9T+ of debt maturing within 12 months, every 100bps rise in average yields adds ~$90B in annual interest cost, mechanically limiting how long the Fed can maintain restrictive rates. The GraphiQuestor Fiscal Dominance Meter tracks this ratio as a Z-score; readings above +1.5σ have historically preceded gold outperformance and curve steepening regardless of CPI trajectory.',
        faqItems: [
            {
                question: 'What is the difference between fiscal dominance and monetary dominance?',
                answer:
                    'Under monetary dominance, the central bank sets rates independently to control inflation. Under fiscal dominance, the government\'s debt burden is so large that the central bank cannot raise rates without triggering a fiscal crisis — monetary policy becomes subservient to debt sustainability.',
            },
            {
                question: 'Is the US in fiscal dominance in 2026?',
                answer:
                    'By the interest-expense-to-tax-revenue criterion (>20%), the US exhibits fiscal dominance characteristics. The Fed retains operational independence nominally, but the fiscal math constrains how high and how long rates can stay restrictive — evidenced by QT tapering despite above-target inflation prints.',
            },
            {
                question: 'How does fiscal dominance affect investors?',
                answer:
                    'Fiscal dominance historically correlates with: higher gold allocations, steeper yield curves (term premium expansion), USD weakness over multi-year horizons, and compressed real rates as the central bank avoids triggering debt spirals.',
            },
        ],
        relatedReading: [
            { to: '/methods/fiscal-dominance-meter', label: 'Fiscal Dominance Meter Methodology', kind: 'method' },
            { to: '/labs/us-macro-fiscal', label: 'US Macro & Fiscal Lab', kind: 'lab' },
            { to: '/glossary/interest-expense-to-tax-revenue', label: 'Interest Expense / Tax Revenue', kind: 'glossary' },
            { to: '/labs/sovereign-stress', label: 'Sovereign Stress Lab', kind: 'lab' },
            { to: '/glossary/breakeven-inflation-rate', label: 'Breakeven Inflation', kind: 'glossary' },
        ],
    },

    tga: {
        seoTitle: 'Treasury General Account (TGA): Definition, Balance & Liquidity Impact',
        seoDescription:
            'Treasury General Account (TGA) explained: the Fed\'s fiscal liquidity lever. How TGA balance drains or injects reserves, WTREGEN data, net liquidity formula, and 2026 market impact.',
        seoKeywords: [
            'treasury general account',
            'TGA',
            'TGA balance',
            'treasury general account Fed',
            'WTREGEN',
            'TGA liquidity',
        ],
        h1: 'Treasury General Account (TGA)',
        context2026:
            'The TGA balance at the NY Fed (FRED: WTREGEN) remains a critical but underreported liquidity variable in 2026. Post-debt-ceiling rebuilds drain reserves mechanically — each $100B TGA increase removes an equivalent amount from bank reserves without any Fed policy action. Conversely, tax-refund season and fiscal spending drawdowns inject liquidity equivalent to stealth QE. GraphiQuestor tracks TGA within the Net Liquidity formula (WALCL − WTREGEN − RRPONTSYD); TGA swings frequently explain equity moves that FOMC statements alone cannot.',
        faqItems: [
            {
                question: 'What is a normal TGA balance?',
                answer:
                    'Pre-2020, TGA averaged $300–400B. Post-COVID and debt-ceiling cycles pushed peaks above $900B. Levels below $300B indicate active liquidity injection; above $700B indicates structural drain equivalent to quantitative tightening.',
            },
            {
                question: 'How does the TGA affect the stock market?',
                answer:
                    'TGA drawdowns inject reserves into the banking system, historically correlating with risk-on moves (2021 example). TGA rebuilds after debt-ceiling resolutions drain liquidity and have preceded corrections — most notably Q3 2023.',
            },
            {
                question: 'What is the relationship between TGA and quantitative easing?',
                answer:
                    'TGA drawdowns mimic QE mechanically: when the Treasury spends down its Fed account, reserves enter the banking system without Fed balance sheet expansion. This is why net liquidity (not just WALCL) is the superior indicator.',
            },
        ],
        relatedReading: [
            { to: '/methods/net-liquidity-z-score', label: 'Net Liquidity Methodology', kind: 'method' },
            { to: '/glossary/net-liquidity-z-score', label: 'Net Liquidity Z-Score', kind: 'glossary' },
            { to: '/labs/shadow-system', label: 'Shadow System / Funding Plumbing Lab', kind: 'lab' },
            { to: '/glossary/reverse-repo-facility-rrp', label: 'Reverse Repo Facility', kind: 'glossary' },
            { to: '/', label: 'Live Net Liquidity Terminal', kind: 'terminal' },
        ],
    },

    'm2-gold-ratio': {
        seoTitle: 'M2/Gold Ratio: Definition, Formula, Live Chart & Fiat Debasement Signal',
        seoDescription:
            'M2 to gold ratio explained: comparing global money supply to above-ground gold. Live M2/gold ratio chart, historical episodes, Z-score methodology, and 2026 gold re-rating context.',
        seoKeywords: [
            'M2 gold ratio',
            'm2 to gold ratio',
            'M2/gold ratio',
            'fiat debasement',
            'gold monetary ratio',
            'money supply gold',
        ],
        h1: 'M2/Gold Ratio',
        context2026:
            'Gold\'s breach above $3,000/oz in 2025–2026 is actively compressing the M2/Gold ratio from its 2020 COVID extreme — but the ratio remains elevated versus the 40-year mean, implying further gold re-rating potential if global M2 re-accelerates. Central bank gold purchases (>1,000t/year) provide a structural bid disconnected from traditional real-rate models. The GraphiQuestor M2/Gold methodology aggregates US, Eurozone, China, Japan, and UK M2 against WGC above-ground gold stock — the same framework used in our weekly Regime Digest.',
        faqItems: [
            {
                question: 'What does a high M2/gold ratio mean?',
                answer:
                    'A high ratio means fiat money supply has expanded faster than gold\'s market capitalisation — signalling currency debasement without corresponding hard-asset appreciation. Historically, extreme highs precede multi-year gold bull markets.',
            },
            {
                question: 'What was the M2/gold ratio during COVID?',
                answer:
                    'Global M2 surged ~$25T in under 18 months while gold rose only ~25%, pushing the ratio to its highest level in 30+ years. This set up the 2022–2026 structural gold re-rating cycle.',
            },
            {
                question: 'How is global M2 calculated for the M2/gold ratio?',
                answer:
                    'GraphiQuestor sums M2 from the US (FRED), Eurozone (ECB), China (PBoC), Japan (BoJ), UK (BoE), plus a rest-of-world estimate. Gold market cap uses WGC above-ground stock (~212,582 tonnes) × spot XAU/USD.',
            },
        ],
        relatedReading: [
            { to: '/methods/m2-gold-ratio', label: 'M2/Gold Ratio Methodology', kind: 'method' },
            { to: '/labs/de-dollarization-gold', label: 'De-Dollarization & Gold Lab', kind: 'lab' },
            { to: '/methods/debt-gold-z-score', label: 'Debt/Gold Z-Score', kind: 'method' },
            { to: '/glossary/central-bank-gold-purchases', label: 'Central Bank Gold Purchases', kind: 'glossary' },
            { to: '/glossary/de-dollarization', label: 'De-Dollarization', kind: 'glossary' },
        ],
    },

    'net-liquidity-z-score': {
        seoTitle: 'Net Liquidity: Definition, Formula & Z-Score Methodology (2026)',
        seoDescription:
            'Net liquidity defined: Fed balance sheet minus TGA minus reverse repo. Formula (WALCL − WTREGEN − RRPONTSYD), Z-score interpretation, live data, and why net liquidity drives risk assets.',
        seoKeywords: [
            'net liquidity',
            'net liquidity formula',
            'fed net liquidity',
            'net liquidity z-score',
            'WALCL WTREGEN RRP',
        ],
        h1: 'Net Liquidity Z-Score',
        context2026:
            'Fed QT continues to shrink WALCL while the RRP facility has largely drained to near-zero — meaning further QT directly removes bank reserves without the RRP offset that cushioned 2023–2024. Net liquidity Z-scores below −1.0σ in 2026 signal tightening financial conditions even when the Fed holds rates steady. Institutional PMs treat net liquidity as the master overlay: S&P 500 12-month returns correlate ~0.65 with net liquidity changes since 2008.',
        faqItems: [
            {
                question: 'What is the net liquidity formula?',
                answer:
                    'Net Liquidity = Federal Reserve Balance Sheet (WALCL) − Treasury General Account (WTREGEN) − Overnight Reverse Repo (RRPONTSYD). This measures reserves actually available to the banking system.',
            },
            {
                question: 'Why is net liquidity more important than the Fed balance sheet alone?',
                answer:
                    'WALCL ignores TGA and RRP — both of which can inject or drain reserves without any Fed policy change. Net liquidity captures the actual plumbing-level liquidity available to markets.',
            },
        ],
        relatedReading: [
            { to: '/methods/net-liquidity-z-score', label: 'Full Methodology Article', kind: 'method' },
            { to: '/labs/shadow-system', label: 'Shadow System Lab', kind: 'lab' },
            { to: '/glossary/tga', label: 'Treasury General Account', kind: 'glossary' },
            { to: '/glossary/reverse-repo-facility-rrp', label: 'Reverse Repo Facility', kind: 'glossary' },
            { to: '/', label: 'Live Terminal', kind: 'terminal' },
        ],
    },

    'de-dollarization': {
        seoTitle: 'De-Dollarization: Definition, USD Reserve Share & 2026 Evidence',
        seoDescription:
            'De-dollarization explained: the structural shift away from USD in reserves, trade, and settlement. IMF COFER data, central bank gold buying, BRICS alternatives, and live reserve composition.',
        seoKeywords: [
            'de-dollarization',
            'dedollarization',
            'USD reserve share',
            'dollar decline reserves',
            'BRICS de-dollarization',
        ],
        h1: 'De-Dollarization',
        context2026:
            'USD share of allocated global reserves fell from 73% (2001) to ~58% (2024, IMF COFER) — a 15pp shift over two decades. 2025–2026 acceleration drivers: record central bank gold purchases, Saudi yuan-settled oil trades, mBridge CBDC pilot expansion, and BRICS+ local-currency settlement agreements. De-dollarization is gradual, not catastrophic — but the directional trend reduces structural Treasury demand and increases the inflationary cost of US fiscal deficits.',
        faqItems: [
            {
                question: 'Is the dollar being replaced as reserve currency?',
                answer:
                    'No single currency is replacing the USD. De-dollarization is diversification — into gold, EUR, CNY, and bilateral settlement mechanisms — not a wholesale abandonment. USD remains ~58% of allocated reserves.',
            },
            {
                question: 'What data tracks de-dollarization?',
                answer:
                    'IMF COFER (quarterly reserve composition), WGC central bank gold purchases, BIS cross-border payment volumes, and bilateral trade settlement currency breakdowns. GraphiQuestor aggregates these into a de-dollarization composite.',
            },
        ],
        relatedReading: [
            { to: '/methods/de-dollarization-guide', label: 'De-Dollarization Guide', kind: 'method' },
            { to: '/labs/de-dollarization-gold', label: 'Gold & Reserve Lab', kind: 'lab' },
            { to: '/glossary/foreign-exchange-reserves', label: 'Foreign Exchange Reserves', kind: 'glossary' },
            { to: '/glossary/petrodollar-system', label: 'Petrodollar System', kind: 'glossary' },
            { to: '/intel/china', label: 'China Macro Pulse', kind: 'intel' },
        ],
    },

    'real-interest-rates': {
        seoTitle: 'Real Interest Rates: Definition, Formula & TIPS Yield (2026)',
        seoDescription:
            'Real interest rates defined: nominal yield minus inflation expectations. TIPS-based measurement, gold correlation, live 10Y real rate data, and macro allocation framework.',
        seoKeywords: [
            'real interest rates',
            'real interest rate definition',
            'TIPS real yield',
            'real rate gold',
            '10 year real interest rate',
        ],
        h1: 'Real Interest Rates',
        context2026:
            'US 10-year real rates (FRED: REAINTRATREARAT10Y) remain the primary headwind or tailwind for gold, growth equities, and EM carry trades in 2026. Positive real rates above +2% historically suppress gold; negative real rates (2020–2021) coincided with gold\'s rally to $2,100. With breakevens anchored near 2.2% and nominal 10Y yields at 4.3–4.5%, real rates near +2.1% explain much of gold\'s resilience — central bank buying is offsetting the traditional real-rate headwind.',
        liveMetricId: 'REAINTRATREARAT10Y',
        liveMetricLabel: '10-Year Real Interest Rate',
        liveMetricUnit: '%',
        faqItems: [
            {
                question: 'How do you calculate real interest rates?',
                answer:
                    'Real Rate = Nominal Yield − Expected Inflation (Breakeven Rate). The cleanest market measure is the yield on Treasury Inflation-Protected Securities (TIPS), which embeds inflation compensation directly.',
            },
            {
                question: 'Why do real interest rates matter for gold?',
                answer:
                    'Gold pays no yield. When real rates are positive, holding gold has an opportunity cost versus bonds. When real rates are negative, gold\'s zero yield becomes attractive — this inverse correlation has held since 1971.',
            },
        ],
        relatedReading: [
            { to: '/glossary/breakeven-inflation-rate', label: 'Breakeven Inflation Rate', kind: 'glossary' },
            { to: '/methods/m2-gold-ratio', label: 'M2/Gold Ratio Methodology', kind: 'method' },
            { to: '/labs/de-dollarization-gold', label: 'Gold & Reserve Lab', kind: 'lab' },
            { to: '/glossary/fiscal-dominance', label: 'Fiscal Dominance', kind: 'glossary' },
            { to: '/', label: 'Live Macro Terminal', kind: 'terminal' },
        ],
    },

    'reverse-repo-facility-rrp': {
        seoTitle: 'Overnight Reverse Repo (ON RRP): Definition & Liquidity Impact (2026)',
        seoDescription:
            'Reverse repo facility explained: how the Fed\'s ON RRP absorbs or releases market liquidity. RRPONTSYD balance, net liquidity formula, 2022 peak vs 2026 drain, and stealth QE mechanics.',
        seoKeywords: [
            'reverse repo facility',
            'overnight reverse repo',
            'ON RRP',
            'RRPONTSYD',
            'reverse repo Fed',
        ],
        h1: 'Overnight Reverse Repo Facility (ON RRP)',
        context2026:
            'The ON RRP facility peaked at $2.55T in December 2022 as money market funds parked excess cash at the Fed. By 2026, RRP balances have largely drained toward zero — releasing ~$2.4T of liquidity back into the financial system without any Fed balance sheet expansion. This "hidden QE" effect explains why financial conditions eased in 2023–2024 despite the Fed Funds rate at 5.25%. With RRP near exhaustion, future liquidity changes will track WALCL and TGA more directly.',
        faqItems: [
            {
                question: 'What is the reverse repo facility?',
                answer:
                    'The Fed\'s Overnight Reverse Repo Facility allows money market funds and GSEs to lend cash to the Fed overnight in exchange for Treasury collateral. It sets a floor on short-term rates and absorbs excess reserves.',
            },
            {
                question: 'Why did RRP balances spike to $2.55 trillion?',
                answer:
                    'Post-COVID QE flooded the system with reserves. With few alternative investments offering safe yield above the RRP rate, money funds parked trillions at the Fed — effectively removing liquidity from credit markets.',
            },
        ],
        relatedReading: [
            { to: '/glossary/net-liquidity-z-score', label: 'Net Liquidity Z-Score', kind: 'glossary' },
            { to: '/methods/net-liquidity-z-score', label: 'Net Liquidity Methodology', kind: 'method' },
            { to: '/glossary/tga', label: 'Treasury General Account', kind: 'glossary' },
            { to: '/labs/shadow-system', label: 'Shadow System Lab', kind: 'lab' },
            { to: '/', label: 'Live Terminal', kind: 'terminal' },
        ],
    },

    'central-bank-gold-purchases': {
        seoTitle: 'Central Bank Gold Purchases: 2026 Trends & Reserve Diversification',
        seoDescription:
            'Central bank gold purchases explained: why CBs are buying gold, WGC data, de-dollarization link, live reserve trends, and impact on gold price floor.',
        seoKeywords: [
            'central bank gold purchases',
            'central bank gold buying',
            'CB gold reserves',
            'gold reserves central bank',
            'official sector gold',
        ],
        h1: 'Central Bank Gold Purchases',
        context2026:
            'Official sector gold buying exceeded 1,000 tonnes in both 2022 and 2023 (WGC) — the highest since 1967. China (PBoC), India (RBI), Turkey, and Poland lead accumulation, diversifying away from USD-denominated reserves amid sanctions risk and BRICS expansion. This institutional bid creates a structural floor under gold prices that decouples from traditional real-rate correlations — a key input in GraphiQuestor\'s M2/Gold and Debt/Gold models.',
        liveMetricId: 'CB_GOLD_RESERVES',
        liveMetricLabel: 'Central Bank Gold Reserves',
        liveMetricUnit: 't',
        faqItems: [
            {
                question: 'Why are central banks buying gold in 2026?',
                answer:
                    'Three drivers: (1) de-dollarization and sanctions risk reduction, (2) reserve diversification after 2022 asset freezes, (3) gold\'s lack of counterparty risk versus sovereign debt. Gold cannot be sanctioned or defaulted on.',
            },
            {
                question: 'Which central banks buy the most gold?',
                answer:
                    'China (PBoC), Russia, India (RBI), Turkey, and Poland have been the largest reported buyers since 2022. Many purchases are not publicly reported — WGC estimates undercount actual accumulation.',
            },
        ],
        relatedReading: [
            { to: '/labs/central-bank-gold-purchases', label: 'Central Bank Gold Lab', kind: 'lab' },
            { to: '/glossary/de-dollarization', label: 'De-Dollarization', kind: 'glossary' },
            { to: '/methods/m2-gold-ratio', label: 'M2/Gold Ratio', kind: 'method' },
            { to: '/glossary/foreign-exchange-reserves', label: 'Foreign Exchange Reserves', kind: 'glossary' },
            { to: '/intel/india', label: 'India RBI Gold Strategy', kind: 'intel' },
        ],
    },
};

export function getGlossarySeo(slug: string): GlossarySeoEnrichment | undefined {
    return GLOSSARY_SEO_ENRICHMENT[slug];
}