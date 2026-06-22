import React, { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { CompactDisclaimer } from '../CompactDisclaimer';
import {
    calculateInvoicingScenario,
    getCurrentRates,
} from '../../lib/invoicingCalculations';
import { formatInrIndian } from '../../lib/formatInr';
import type { CollarHandoffParams, InvoicingCurrency, MonthlyRatePoint } from '../../lib/invoicingTypes';

type Props = {
    monthlyImportValue: number;
    monthlyRates: MonthlyRatePoint[];
    onCollarHandoff: (params: CollarHandoffParams) => void;
};

export const ScenarioSimulator: React.FC<Props> = ({
    monthlyImportValue,
    monthlyRates,
    onCollarHandoff,
}) => {
    const [horizonMonths, setHorizonMonths] = useState<3 | 6 | 12>(6);
    const [cnyAppreciationPct, setCnyAppreciationPct] = useState(5);
    const [usdAppreciationPct, setUsdAppreciationPct] = useState(2);
    const [invoicingCurrency, setInvoicingCurrency] = useState<InvoicingCurrency>('USD');

    const currentRates = getCurrentRates(monthlyRates);

    const result = useMemo(
        () =>
            calculateInvoicingScenario(
                {
                    notionalMonthly: monthlyImportValue,
                    invoicingCurrency,
                    cnyAppreciationPct,
                    usdAppreciationPct,
                    horizonMonths,
                },
                currentRates,
            ),
        [
            monthlyImportValue,
            invoicingCurrency,
            cnyAppreciationPct,
            usdAppreciationPct,
            horizonMonths,
            currentRates,
        ],
    );

    const handleHandoff = () => {
        onCollarHandoff(result.collarHandoffParams);
        document.getElementById('collar-payoff')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/35">
                        Horizon
                    </span>
                    <div className="flex gap-2">
                        {([3, 6, 12] as const).map((h) => (
                            <button
                                key={h}
                                type="button"
                                onClick={() => setHorizonMonths(h)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border',
                                    horizonMonths === h
                                        ? 'bg-[#B8860B]/20 text-[#B8860B] border-[#B8860B]/40'
                                        : 'text-white/40 border-white/10',
                                )}
                            >
                                {h}M
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/35">
                        Preferred invoicing currency
                    </span>
                    <div className="flex gap-2">
                        {(['USD', 'CNY', 'INR'] as const).map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setInvoicingCurrency(c)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border',
                                    invoicingCurrency === c
                                        ? 'bg-[#B8860B]/20 text-[#B8860B] border-[#B8860B]/40'
                                        : 'text-white/40 border-white/10',
                                )}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SliderField
                    label="Assume CNY appreciates vs INR over horizon"
                    value={cnyAppreciationPct}
                    min={-10}
                    max={30}
                    step={0.5}
                    onChange={setCnyAppreciationPct}
                />
                <SliderField
                    label="Assume USD changes vs INR over horizon"
                    value={usdAppreciationPct}
                    min={-10}
                    max={15}
                    step={0.5}
                    onChange={setUsdAppreciationPct}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ScenarioCard
                    title="USD invoiced"
                    total={result.usdInvoicedTotalINR}
                    sub="Baseline for China imports invoiced in USD"
                    tone="blue"
                />
                <ScenarioCard
                    title="CNY invoiced"
                    total={result.cnyInvoicedTotalINR}
                    sub={`vs USD: ${formatInrIndian(result.relativeCostDifference)}`}
                    tone={result.relativeCostDifference > 0 ? 'danger' : 'success'}
                />
                <ScenarioCard
                    title="INR invoiced"
                    total={result.inrInvoicedTotalINR}
                    sub="Requires supplier acceptance of INR settlement"
                    tone="success"
                />
            </div>

            <p className="text-sm text-white/70 m-0">{result.verdict}</p>

            {invoicingCurrency !== 'INR' ? (
                <button
                    type="button"
                    onClick={handleHandoff}
                    className="text-sm text-amber-400 underline hover:text-amber-300 transition-colors bg-transparent border-0 p-0 cursor-pointer text-left"
                >
                    Now see the appropriate hedging overlay for {invoicingCurrency} invoicing →
                </button>
            ) : null}

            <CompactDisclaimer context="simulator" />
        </div>
    );
};

const SliderField: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/35">{label}</span>
            <span className="text-xs font-mono text-[#B8860B]">
                {value > 0 ? '+' : ''}
                {value.toFixed(1)}%
            </span>
        </div>
        <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
);

const ScenarioCard: React.FC<{
    title: string;
    total: number;
    sub: string;
    tone: 'blue' | 'danger' | 'success';
}> = ({ title, total, sub, tone }) => (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4 space-y-1">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 m-0">{title}</h4>
        <p
            className={cn(
                'text-2xl font-black font-mono m-0',
                tone === 'blue' && 'text-blue-400',
                tone === 'danger' && 'text-rose-400',
                tone === 'success' && 'text-emerald-400',
            )}
        >
            {formatInrIndian(total)}
        </p>
        <p className="text-[11px] text-white/45 m-0">{sub}</p>
    </div>
);