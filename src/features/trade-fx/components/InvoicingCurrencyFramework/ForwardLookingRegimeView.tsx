import React, { useMemo } from 'react';
import { FreshnessChip } from '@/components/FreshnessChip';
import { cn } from '@/lib/utils';
import { CompactDisclaimer } from '../CompactDisclaimer';
import {
    computeCnyInrAppreciation,
    computeCnyInrVolatility,
} from '../../lib/invoicingCalculations';
import { deriveInvoicingRegimeVerdict, mapDedolSignal } from '../../lib/invoicingRegimeEngine';
import type { MonthlyRatePoint, RegimeVerdict } from '../../lib/invoicingTypes';
import type { TradeFxData } from '../../lib/tradeFxTypes';
import type { InvoicingFxRatesResult } from '../../hooks/useInvoicingFxRates';

const VERDICT_STYLES: Record<RegimeVerdict['recommendation'], string> = {
    maintain_usd: 'border-amber-500/40 bg-amber-500/[0.04]',
    monitor_cny: 'border-blue-500/40 bg-blue-500/[0.04]',
    explore_inr: 'border-emerald-500/40 bg-emerald-500/[0.04]',
    neutral: 'border-white/20 bg-white/[0.02]',
};

const SENTIMENT_STYLES = {
    supportive: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    neutral: 'text-amber-400 border-amber-500/25 bg-amber-500/10',
    cautionary: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
};

type Props = {
    monthlyRates: MonthlyRatePoint[];
    fxMeta: InvoicingFxRatesResult;
    tradeFxData: TradeFxData;
};

export const ForwardLookingRegimeView: React.FC<Props> = ({
    monthlyRates,
    fxMeta,
    tradeFxData,
}) => {
    const cny24m = computeCnyInrAppreciation(
        monthlyRates,
        monthlyRates[Math.max(0, monthlyRates.length - 24)]?.month ?? monthlyRates[0]?.month,
        monthlyRates[monthlyRates.length - 1]?.month,
    );

    const dedolSignal = tradeFxData.macroSignals.find((s) => s.source === 'dedol_lab');
    const indiaSignal = tradeFxData.macroSignals.find((s) => s.source === 'india_pulse');
    const chinaSentiment: 'supportive' | 'neutral' | 'cautionary' = 'neutral';

    const verdict = useMemo(
        () =>
            deriveInvoicingRegimeVerdict(
                {
                    cnyInrVolatilityRegime: computeCnyInrVolatility(monthlyRates),
                    usdInrVolatilityRegime: tradeFxData.volatilityRegime,
                    chinaMacroSentiment: chinaSentiment,
                    dedolSignal: mapDedolSignal(
                        dedolSignal?.sentiment ?? 'neutral',
                        null,
                    ),
                    rbiInterventionBias: indiaSignal?.sentiment ?? 'neutral',
                    cnyInr24mAppreciation: cny24m,
                },
                fxMeta.freshness,
            ),
        [cny24m, tradeFxData, dedolSignal, indiaSignal, fxMeta.freshness, chinaSentiment, monthlyRates],
    );

    const signals = [
        {
            label: 'CNY/INR Trend (24M)',
            value: `${cny24m > 0 ? '+' : ''}${cny24m.toFixed(1)}% vs INR`,
            sentiment: cny24m > 8 ? 'cautionary' as const : 'neutral' as const,
            note: 'CNY has appreciated against INR — cost of CNY invoicing has risen for importers.',
        },
        {
            label: 'USD/INR Stability',
            value: tradeFxData.spot ? `₹${tradeFxData.spot.toFixed(2)}` : '—',
            sentiment: tradeFxData.volatilityRegime === 'low' ? 'supportive' as const : 'cautionary' as const,
            note: `${tradeFxData.volatilityRegime} volatility regime from GraphiQuestor India Pulse.`,
        },
        {
            label: 'China Macro Pulse',
            value: 'Monitoring',
            sentiment: 'neutral' as const,
            note: 'China macro liquidity signals — monitor PBOC policy stance via China Pulse.',
        },
        {
            label: 'De-Dol Lab — INR Settlement',
            value: dedolSignal?.sentiment ?? 'neutral',
            sentiment: dedolSignal?.sentiment ?? 'neutral',
            note: 'INR invoicing with China counterparties — corridor feasibility signal.',
        },
    ];

    return (
        <div className="space-y-5">
            <article
                className={cn(
                    'rounded-2xl border-2 px-5 py-5 space-y-3',
                    VERDICT_STYLES[verdict.recommendation],
                )}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        Regime Verdict
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-white/15 text-white/50">
                        {verdict.confidenceLevel} confidence
                    </span>
                    <FreshnessChip status={fxMeta.staleness} lastUpdated={fxMeta.freshness} />
                </div>
                <h3 className="text-base font-black text-white/90 m-0 leading-snug">{verdict.headline}</h3>
                <ul className="text-[12px] text-white/55 space-y-1.5 m-0 pl-4 list-disc">
                    {verdict.rationale.map((r) => (
                        <li key={r}>{r}</li>
                    ))}
                </ul>
                <div className="text-[11px] text-white/40 pt-2 border-t border-white/5">
                    <span className="font-black uppercase tracking-wider text-[9px] text-white/30">
                        Indicators to watch:{' '}
                    </span>
                    {verdict.keyIndicatorsToWatch.join(' · ')}
                </div>
            </article>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {signals.map((s) => (
                    <div
                        key={s.label}
                        className="min-w-[200px] shrink-0 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
                    >
                        <div className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-1">
                            {s.label}
                        </div>
                        <div className="text-sm font-mono font-bold text-white/80 mb-2">{s.value}</div>
                        <span
                            className={cn(
                                'inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border mb-2',
                                SENTIMENT_STYLES[s.sentiment],
                            )}
                        >
                            {s.sentiment}
                        </span>
                        <p className="text-[10px] text-white/40 m-0 leading-relaxed">{s.note}</p>
                    </div>
                ))}
            </div>

            <CompactDisclaimer context="regime" />
        </div>
    );
};