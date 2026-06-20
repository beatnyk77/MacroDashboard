import React, { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { calculateExposureImpact } from '../lib/collarPayoff';
import { getPairConfig } from '../constants/currencyPairs';
import { describeInrMove, formatInrIndian } from '../lib/formatInr';
import type { CurrencyPair, Role, TimeHorizon } from '../lib/tradeFxTypes';

interface ExposureSimulatorProps {
    role: Role;
    pair: CurrencyPair;
    horizon: TimeHorizon;
    spot: number | null;
    regimeNote: string;
    onCollarNotionalSync?: (notional: number) => void;
}

const DEFAULT_NOTIONAL = 100_000;

function formatUsdNotional(amount: number): string {
    return amount.toLocaleString('en-US');
}

function buildSummary(
    role: Role,
    notionalFC: number,
    deltaRatePct: number,
    pnlINR: number,
    horizon: TimeHorizon,
    baseCurrency: string,
): string {
    if (notionalFC === 0 || deltaRatePct === 0) return '';

    const direction = deltaRatePct > 0 ? 'depreciates' : 'appreciates';
    const absMove = Math.abs(deltaRatePct).toFixed(1);
    const formatted = formatInrIndian(Math.abs(pnlINR), false);
    const notionalLabel = `${baseCurrency} ${formatUsdNotional(notionalFC)}`;

    if (role === 'exporter') {
        const gain = deltaRatePct > 0;
        return `A ${absMove}% INR ${direction} would ${gain ? 'increase' : 'reduce'} your USD receivables value by ${formatted} on ${notionalLabel} exposure over ${horizon}.`;
    }
    if (role === 'importer') {
        const gain = deltaRatePct < 0;
        return `A ${absMove}% INR ${direction} would ${gain ? 'reduce' : 'increase'} your USD payable cost by ${formatted} on ${notionalLabel} exposure over ${horizon}.`;
    }

    return `A ${absMove}% INR ${direction}: exporters gain/lose ${formatted}; importers see the opposite impact on ${notionalLabel} notional.`;
}

function PnlCard({
    title,
    result,
    moveLabel,
    fcCurrency,
    highlighted,
}: {
    title: string;
    result: ReturnType<typeof calculateExposureImpact>;
    moveLabel: string;
    fcCurrency: string;
    highlighted: boolean;
}) {
    const isGain = result.direction === 'gain';
    const isLoss = result.direction === 'loss';

    return (
        <div
            className={cn(
                'rounded-xl border px-4 py-4 space-y-2',
                highlighted ? 'border-[#B8860B]/35 bg-[#B8860B]/[0.04]' : 'border-white/10 bg-white/[0.02]',
            )}
        >
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 m-0">
                {title}
            </h3>
            <p
                className={cn(
                    'text-2xl font-black font-mono m-0',
                    isGain && 'text-emerald-400',
                    isLoss && 'text-rose-400',
                    !isGain && !isLoss && 'text-white/50',
                )}
            >
                {formatInrIndian(result.pnlINR)}
            </p>
            <p className="text-[11px] text-white/45 leading-relaxed m-0">
                If {moveLabel} {Math.abs(result.deltaRatePct).toFixed(1)}%, your{' '}
                {fcCurrency} {title.toLowerCase().includes('exporter') ? 'receivables' : 'payables'}{' '}
                {title.toLowerCase().includes('exporter')
                    ? isGain
                        ? 'gain'
                        : isLoss
                          ? 'lose'
                          : 'see no change on'
                    : isLoss
                      ? 'cost'
                      : isGain
                        ? 'save'
                        : 'see no change on'}{' '}
                {formatInrIndian(Math.abs(result.pnlINR), false)} in INR terms.
            </p>
        </div>
    );
}

export const ExposureSimulator: React.FC<ExposureSimulatorProps> = ({
    role,
    pair,
    horizon,
    spot,
    regimeNote,
    onCollarNotionalSync,
}) => {
    const pairConfig = getPairConfig(pair);
    const [notionalFC, setNotionalFC] = useState(DEFAULT_NOTIONAL);
    const [deltaRatePct, setDeltaRatePct] = useState(2.0);

    const moveLabel = describeInrMove(deltaRatePct);

    const exporterResult = useMemo(() => {
        if (spot === null) return null;
        return calculateExposureImpact('exporter', notionalFC, spot, deltaRatePct, regimeNote);
    }, [notionalFC, spot, deltaRatePct, regimeNote]);

    const importerResult = useMemo(() => {
        if (spot === null) return null;
        return calculateExposureImpact('importer', notionalFC, spot, deltaRatePct, regimeNote);
    }, [notionalFC, spot, deltaRatePct, regimeNote]);

    const summary = useMemo(() => {
        if (spot === null) return '';
        const activeResult =
            role === 'exporter'
                ? exporterResult
                : role === 'importer'
                  ? importerResult
                  : exporterResult;
        if (!activeResult) return '';
        return buildSummary(
            role,
            notionalFC,
            deltaRatePct,
            activeResult.pnlINR,
            horizon,
            pairConfig.baseCurrency,
        );
    }, [role, notionalFC, deltaRatePct, horizon, pairConfig.baseCurrency, exporterResult, importerResult, spot]);

    const handleCollarCta = () => {
        onCollarNotionalSync?.(notionalFC);
        document.getElementById('collar-payoff')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (spot === null) {
        return (
            <div className="border border-white/10 bg-white/[0.02] rounded-2xl px-5 py-8 text-center">
                <p className="text-xs text-white/40 m-0">
                    Exposure simulator requires live spot data. Select USD/INR or retry when
                    telemetry recovers.
                </p>
            </div>
        );
    }

    return (
        <section className="border border-white/10 bg-white/[0.02] rounded-2xl p-4 md:p-6 space-y-5">
            <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 m-0 mb-1">
                    Exposure Impact Simulator
                </h2>
                <p className="text-[11px] text-white/40 m-0 leading-relaxed">
                    Illustrative <dfn title="The face value of foreign currency exposure">notional</dfn>{' '}
                    impact under an assumed INR move. Horizon context: {horizon}. Not a forecast.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/35">
                        <dfn title="Face value of foreign currency receivables or payables">Notional</dfn>{' '}
                        ({pairConfig.baseCurrency})
                    </span>
                    <input
                        type="number"
                        min={1000}
                        step={10000}
                        value={notionalFC}
                        onChange={(e) => setNotionalFC(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-mono text-white focus:border-[#B8860B]/40 focus:outline-none"
                    />
                </label>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/35">
                            Assumed INR move
                        </span>
                        <span className="text-xs font-mono text-[#B8860B]">
                            {deltaRatePct > 0 ? '+' : ''}
                            {deltaRatePct.toFixed(1)}%
                        </span>
                    </div>
                    <Slider
                        min={-10}
                        max={10}
                        step={0.5}
                        value={[deltaRatePct]}
                        onValueChange={([v]) => setDeltaRatePct(v)}
                        className="py-2"
                    />
                    <div className="flex justify-between text-[9px] text-white/25 font-mono">
                        <span>−10%</span>
                        <span>0</span>
                        <span>+10%</span>
                    </div>
                </div>
            </div>

            {summary ? (
                <div className="text-sm font-medium text-white/90 bg-white/5 border border-white/10 rounded px-4 py-3">
                    {summary}
                </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exporterResult && (
                    <PnlCard
                        title="Exporter Perspective"
                        result={exporterResult}
                        moveLabel={moveLabel}
                        fcCurrency={pairConfig.baseCurrency}
                        highlighted={role === 'exporter' || role === 'balanced'}
                    />
                )}
                {importerResult && (
                    <PnlCard
                        title="Importer Perspective"
                        result={importerResult}
                        moveLabel={moveLabel}
                        fcCurrency={pairConfig.baseCurrency}
                        highlighted={role === 'importer' || role === 'balanced'}
                    />
                )}
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={handleCollarCta}
                    className="text-sm text-amber-400 underline hover:text-amber-300 transition-colors bg-transparent border-0 p-0 cursor-pointer text-left"
                >
                    See how a forward vs zero-cost collar changes this outcome →
                </button>
            </div>

            <p className="text-[11px] text-white/45 leading-relaxed m-0 border-t border-white/5 pt-3">
                {regimeNote}
            </p>
        </section>
    );
};