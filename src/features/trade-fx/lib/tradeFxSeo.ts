const TRADE_FX_URL = 'https://graphiquestor.com/trade-fx/';

export const TRADE_FX_FAQ_ENTRIES = [
    {
        question: 'What is a zero-cost collar for USD/INR hedging?',
        answer:
            'A zero-cost collar is a hedging structure where an Indian exporter buys a put option (setting a floor on the INR rate they receive for USD) and simultaneously sells a call option (capping their upside). The premium from selling the call offsets the cost of buying the put, resulting in zero net premium outlay. The exporter is protected below the floor strike but cannot benefit above the cap strike. Indicative terms vary by bank — request pricing from an authorised forex dealer.',
    },
    {
        question: 'How can Indian exporters hedge USD/INR exposure?',
        answer:
            'Indian exporters holding USD receivables can hedge using several instruments: forward contracts (lock a rate now for future delivery), zero-cost collars (floor protection with capped upside, zero net premium), partial hedges (hedge a portion of exposure), or natural hedges (match USD receivables with USD payables). The right approach depends on the current volatility regime, RBI intervention bias, and the exporter\'s risk tolerance. This tool illustrates the trade-offs — consult your bank\'s treasury desk for execution.',
    },
    {
        question:
            'What is the difference between a forward contract and a currency option for importers?',
        answer:
            'A forward contract locks in an exchange rate today for a future date — the importer knows exactly how many rupees they will pay per USD, eliminating uncertainty but also giving up any potential benefit if the INR strengthens. A currency option (such as a call option on USD) gives the importer the right but not the obligation to buy USD at a set rate, preserving the benefit if INR strengthens while providing protection if it weakens. Options require an upfront premium; forwards typically do not. Both are executed through authorised dealers — indicative pricing depends on tenor, notional, and market conditions.',
    },
    {
        question: 'How does RBI intervention affect USD/INR for exporters?',
        answer:
            'The Reserve Bank of India intervenes in the currency market to manage excessive INR volatility — typically selling USD from its forex reserves to prevent sharp INR depreciation or buying USD to prevent sharp appreciation. For exporters with USD receivables, RBI intervention that supports the INR (appreciation bias) compresses the INR value of future receipts. Conversely, when RBI allows INR depreciation, exporters benefit. GraphiQuestor\'s India Macro Pulse tracks RBI intervention signals, reserve levels, and policy bias to contextualise the hedging environment.',
    },
    {
        question: 'What is the current USD/INR macro regime for exporters in June 2026?',
        answer:
            'As of June 2026, the USD/INR regime signal from GraphiQuestor\'s macro framework shows a low-volatility environment with India forex reserves at approximately $585B, providing an RBI intervention buffer. The de-dollarisation composite signals emerging INR settlement corridors on key trade routes. For exporters, this regime is typically associated with tactical forward booking or zero-cost collar structures — the low implied volatility makes collar premium dynamics favourable. This is illustrative context only — not a forecast or recommendation.',
    },
    {
        question: 'Should Indian importers invoice China imports in USD or Chinese Yuan?',
        answer:
            'For most Indian importers, USD invoicing has been significantly more cost-effective than CNY invoicing since mid-2025. The Chinese Yuan appreciated approximately 23% against the Indian Rupee between May 2025 and June 2026, compared to approximately 0% for USD/INR over the same period. This means CNY-invoiced imports became substantially more expensive in INR terms. USD invoicing also offers better hedging instrument availability, more competitive forward rates, and simpler accounting treatment. The right choice depends on individual business factors including supplier pricing, hedging ability, and strategic considerations — consult your bank\'s treasury desk for specific guidance.',
    },
    {
        question: 'What is the CNY/INR exchange rate trend in 2025–2026?',
        answer:
            'The Chinese Yuan (CNY) appreciated approximately 23% against the Indian Rupee (INR) between May 2025 and June 2026, rising from approximately ₹11.58 per CNY to ₹14.31 per CNY. Over the same period, the US Dollar (USD) showed relatively smaller movement against INR. This divergence means that Indian companies invoicing China imports in CNY faced significantly higher INR costs during this period compared to USD-invoiced importers. GraphiQuestor\'s TradeFx tool tracks this historical divergence and provides a forward-looking regime view based on current macro signals.',
    },
] as const;

export function buildTradeFxJsonLd(): Record<string, unknown>[] {
    return [
        {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'TradeFx — Currency Intelligence',
            url: TRADE_FX_URL,
            description:
                'Institutional-grade USD/INR hedging analysis, zero-cost collar payoff diagrams, and regime-aware currency strategy frameworks for Indian exporters and importers.',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
            featureList: [
                'Zero-cost collar payoff diagram',
                'USD/INR exposure impact simulator',
                'Regime-aware hedging strategy matrix',
                'Macro driver context from India, US, China, De-Dol pulses',
                'Invoicing currency decision framework for China imports',
            ],
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
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