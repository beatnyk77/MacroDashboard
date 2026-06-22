import type { InvoicingRegimeSignals, RegimeVerdict } from './invoicingTypes';

const ELEVATED_VOL = new Set(['elevated', 'high']);

/**
 * Deterministic invoicing currency regime verdict from macro signals.
 */
export function deriveInvoicingRegimeVerdict(
    signals: InvoicingRegimeSignals,
    freshness: string,
): RegimeVerdict {
    const watch = [
        'CNY/INR monthly cross-rate trend',
        'USD/INR RBI intervention bias',
        'De-Dol Lab INR settlement corridor signals',
        'China macro liquidity / PBOC policy stance',
    ];

    if (
        signals.cnyInr24mAppreciation > 15 &&
        ELEVATED_VOL.has(signals.cnyInrVolatilityRegime)
    ) {
        return {
            recommendation: 'maintain_usd',
            confidenceLevel: 'high',
            headline:
                'Maintain USD invoicing — CNY/INR appreciation and volatility argue strongly against CNY invoicing',
            rationale: [
                `CNY/INR has appreciated ${signals.cnyInr24mAppreciation.toFixed(1)}% over 24 months — materially raising INR import costs for CNY-invoiced contracts.`,
                'CNY/INR volatility regime is elevated relative to USD/INR, increasing revaluation and hedging complexity.',
                'USD/INR forwards remain liquid and competitively priced through Indian AD banks.',
                'Structural de-dollarization signals remain insufficient to offset near-term CNY cost pressure.',
            ],
            keyIndicatorsToWatch: watch,
            freshness,
        };
    }

    if (
        signals.cnyInr24mAppreciation > 8 &&
        (signals.dedolSignal === 'weak' || signals.dedolSignal === 'moderate')
    ) {
        return {
            recommendation: 'maintain_usd',
            confidenceLevel: 'moderate',
            headline:
                'USD invoicing remains preferred — CNY has outpaced USD depreciation vs INR',
            rationale: [
                `CNY/INR appreciation of ${signals.cnyInr24mAppreciation.toFixed(1)}% over 24 months has widened the cost gap vs USD invoicing.`,
                'INR settlement corridors are emerging but not yet mainstream for China trade at scale.',
                'Treasury desks typically retain USD as the invoicing benchmark until CNY/INR stabilizes.',
            ],
            keyIndicatorsToWatch: watch,
            freshness,
        };
    }

    if (
        signals.cnyInr24mAppreciation < 5 &&
        signals.dedolSignal === 'strong' &&
        signals.chinaMacroSentiment === 'supportive'
    ) {
        return {
            recommendation: 'monitor_cny',
            confidenceLevel: 'moderate',
            headline:
                'Monitor CNY flexibility — structural de-dollarization signals emerging, evaluate on 6M horizon',
            rationale: [
                'CNY/INR appreciation has moderated below 5% over the lookback window.',
                'De-dollarization composite signals support exploring bilateral CNY settlement.',
                'China macro pulse is supportive — supplier willingness for CNY invoicing may improve.',
            ],
            keyIndicatorsToWatch: watch,
            freshness,
        };
    }

    if (signals.dedolSignal === 'strong' && signals.rbiInterventionBias === 'supportive') {
        return {
            recommendation: 'explore_inr',
            confidenceLevel: 'low',
            headline:
                'INR invoicing corridor may be emerging for China trade — monitor RBI settlement framework',
            rationale: [
                'De-Dol Lab signals strong structural shift toward INR settlement corridors.',
                'RBI intervention bias is supportive — INR stability may facilitate bilateral invoicing.',
                'Counterparty acceptance and Vostro infrastructure remain the binding constraint.',
            ],
            keyIndicatorsToWatch: watch,
            freshness,
        };
    }

    return {
        recommendation: 'neutral',
        confidenceLevel: 'low',
        headline:
            'Mixed signals — maintain current invoicing currency while monitoring CNY/INR trajectory',
        rationale: [
            'CNY/INR and USD/INR trends do not present a clear directional case for switching invoicing currency.',
            'Evaluate supplier pricing buffers and hedging availability before any contract renegotiation.',
        ],
        keyIndicatorsToWatch: watch,
        freshness,
    };
}

export function mapDedolSignal(
    sentiment: 'supportive' | 'neutral' | 'cautionary',
    usdShareDeltaYoy: number | null,
): 'strong' | 'moderate' | 'weak' {
    if (sentiment === 'supportive' || (usdShareDeltaYoy !== null && usdShareDeltaYoy < -0.5)) {
        return 'strong';
    }
    if (sentiment === 'cautionary') return 'weak';
    return 'moderate';
}