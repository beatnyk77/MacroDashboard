const TRADE_FX_URL = 'https://graphiquestor.com/trade-fx';

export const TRADE_FX_FAQ_ENTRIES = [
    {
        question: 'What is a zero-cost collar for USD/INR?',
        answer:
            'A zero-cost collar is an options structure that combines a protective strike (typically a put for USD/INR exporters) with an upside cap (call) arranged so net premium is approximately zero. Below the floor strike, the exporter receives a minimum INR rate; between floor and cap, the effective rate follows spot; above the cap, upside is limited. TradeFx renders illustrative payoff diagrams — actual structures involve bid/offer spreads and bank-specific terms.',
    },
    {
        question: 'How do Indian exporters hedge USD receivables?',
        answer:
            'Indian exporters with USD receivables commonly use forward contracts to lock conversion rates, partial hedges to retain spot participation, zero-cost collars when premium outlay is constrained, or natural hedges via INR invoicing where structurally viable. GraphiQuestor\'s TradeFx framework maps these archetypes to the prevailing volatility regime using live India Pulse, US Pulse, and RBI FX defense telemetry — as educational context, not advice.',
    },
    {
        question:
            'What is the difference between a forward contract and a currency option for importers?',
        answer:
            'A forward contract fixes the USD/INR payable rate at inception, eliminating spot uncertainty but forfeiting savings if INR appreciates. A currency option (typically a call for importers) provides a ceiling on payables while preserving downside savings, at the cost of premium. Importers with committed payables often prefer forwards for budget certainty; options suit uncertain timing or asymmetric payoff preferences.',
    },
    {
        question: 'How does RBI intervention affect USD/INR for exporters?',
        answer:
            'When RBI sells USD from forex reserves to dampen INR depreciation, spot USD/INR volatility may compress in the short run — potentially improving forward pricing windows for exporters. Sustained intervention with declining reserve buffers can signal tighter RBI tolerance bands. TradeFx surfaces RBI FX defense posture and reserve levels via India Pulse to contextualize hedging entry timing.',
    },
    {
        question: 'What is the current USD/INR hedging regime in June 2026?',
        answer:
            'As of June 2026, TradeFx classifies the USD/INR environment using realized volatility, composite macro pressure, and signals from India Pulse, US Pulse, De-Dollarization Lab, and commodities telemetry. The live regime label (low, moderate, elevated, or high volatility) updates with each data refresh on graphiquestor.com/trade-fx. Consult the Current Regime strip and Macro Drivers panel for the latest deterministic classification.',
    },
] as const;

export function buildTradeFxJsonLd(): Record<string, unknown>[] {
    return [
        {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            '@id': `${TRADE_FX_URL}#application`,
            name: 'TradeFx — Currency Intelligence',
            description:
                'Institutional-grade USD/INR hedging analysis, zero-cost collar payoff diagrams, and regime-aware currency strategy for Indian exporters and importers.',
            url: TRADE_FX_URL,
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'All',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
            featureList: [
                'Zero-cost collar payoff diagrams',
                'USD/INR exposure impact simulator',
                'Regime-aware hedging strategy framework',
                'Macro driver context from India, US, China pulses',
            ],
            creator: { '@id': 'https://graphiquestor.com/#organization' },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': `${TRADE_FX_URL}#webpage`,
            name: 'TradeFx — Currency Intelligence',
            description:
                'Regime-aware USD/INR hedging analysis, collar payoff diagrams, and macro driver context for Indian exporters and importers.',
            url: TRADE_FX_URL,
            isPartOf: { '@id': 'https://graphiquestor.com/#website' },
            speakable: {
                '@type': 'SpeakableSpecification',
                cssSelector: ['.trade-fx-speakable'],
            },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: 'https://graphiquestor.com/',
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Trade Intelligence',
                    item: 'https://graphiquestor.com/trade',
                },
                {
                    '@type': 'ListItem',
                    position: 3,
                    name: 'TradeFx',
                    item: TRADE_FX_URL,
                },
            ],
        },
        {
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            '@id': `${TRADE_FX_URL}#dataset`,
            name: 'USD/INR Currency Intelligence Telemetry',
            description:
                'Spot rate, volatility regime, and macro driver signals for Indian exporter/importer hedging analysis.',
            url: TRADE_FX_URL,
            creator: { '@id': 'https://graphiquestor.com/#organization' },
            temporalCoverage: '2020-01-01/2026-06-20',
            spatialCoverage: 'India',
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            '@id': `${TRADE_FX_URL}#faq`,
            mainEntity: TRADE_FX_FAQ_ENTRIES.map((entry) => ({
                '@type': 'Question',
                name: entry.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: entry.answer,
                },
            })),
        },
    ];
}