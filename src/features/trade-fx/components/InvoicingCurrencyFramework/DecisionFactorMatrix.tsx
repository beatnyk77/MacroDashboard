import React, { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { scrollToAffiliateCta } from '../../lib/hedgingArchetypes';
import { calculateDecisionScore } from '../../lib/invoicingCalculations';
import {
    createDefaultFactors,
    getRecommendedCurrency,
    getTopFactors,
} from '../../lib/decisionFactors';
import type { DecisionFactor } from '../../lib/invoicingTypes';

function scoreDots(score: number): string {
    return '●'.repeat(score) + '○'.repeat(5 - score);
}

export const DecisionFactorMatrix: React.FC = () => {
    const [advanced, setAdvanced] = useState(false);
    const [factors, setFactors] = useState<DecisionFactor[]>(createDefaultFactors);

    const scores = useMemo(() => calculateDecisionScore(factors), [factors]);
    const recommended = getRecommendedCurrency(scores);
    const topFactors = getTopFactors(factors);

    const updateWeight = (id: string, weight: number) => {
        setFactors((prev) =>
            prev.map((f) => (f.id === id ? { ...f, userWeight: weight } : f)),
        );
    };

    const updateScore = (id: string, currency: 'usdScore' | 'cnyScore' | 'inrScore', val: number) => {
        setFactors((prev) =>
            prev.map((f) => (f.id === id ? { ...f, [currency]: val } : f)),
        );
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-black text-white/85 m-0">
                        Invoicing Currency Assessment —{' '}
                        <span className="text-[#B8860B]">{recommended}</span> typically favored in this regime
                    </h3>
                    <span className="text-[9px] font-black uppercase tracking-wider text-white/30 mt-1 inline-block">
                        Educational only
                    </span>
                </div>
                <div className="flex gap-2">
                    {(['Simple', 'Advanced'] as const).map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => setAdvanced(mode === 'Advanced')}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all',
                                advanced === (mode === 'Advanced')
                                    ? 'bg-[#B8860B]/20 text-[#B8860B] border-[#B8860B]/40'
                                    : 'text-white/40 border-white/10',
                            )}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {(['usd', 'cny', 'inr'] as const).map((cur) => {
                    const label = cur.toUpperCase();
                    const score = scores[cur];
                    return (
                        <div key={cur} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-white/50">{label}</span>
                                <span className={cn(cur === 'usd' && 'text-emerald-400', cur === 'cny' && 'text-amber-400', cur === 'inr' && 'text-white/60')}>
                                    {score}/100
                                </span>
                            </div>
                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all',
                                        cur === 'usd' && 'bg-emerald-500/60',
                                        cur === 'cny' && 'bg-amber-500/60',
                                        cur === 'inr' && 'bg-white/30',
                                    )}
                                    style={{ width: `${score}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {!advanced ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {topFactors.map((f) => (
                        <div
                            key={f.id}
                            className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
                        >
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                                {f.label}
                            </div>
                            <p className="text-[11px] text-white/50 m-0 mb-2 leading-relaxed">{f.commentary}</p>
                            <div className="text-[10px] font-mono text-white/35 space-y-0.5">
                                <div>USD {scoreDots(f.usdScore)}</div>
                                <div>CNY {scoreDots(f.cnyScore)}</div>
                                <div>INR {scoreDots(f.inrScore)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => setFactors(createDefaultFactors())}
                        className="text-[10px] font-black uppercase tracking-wider text-[#B8860B] underline bg-transparent border-0 p-0 cursor-pointer"
                    >
                        Restore defaults
                    </button>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-white/10 text-white/40 text-left">
                                    <th className="py-2 pr-3">Factor</th>
                                    <th className="py-2 pr-3">Weight</th>
                                    <th className="py-2 pr-3 text-center">USD</th>
                                    <th className="py-2 pr-3 text-center">CNY</th>
                                    <th className="py-2 text-center">INR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {factors.map((f) => (
                                    <tr key={f.id} className="border-b border-white/5">
                                        <td className="py-3 pr-3 align-top">
                                            <div className="font-medium text-white/70">{f.label}</div>
                                            <p className="text-white/40 m-0 mt-1">{f.commentary}</p>
                                            <details className="mt-2">
                                                <summary className="text-[#B8860B]/80 cursor-pointer text-[10px]">
                                                    Advanced note
                                                </summary>
                                                <p className="text-white/35 mt-1 m-0">{f.advancedNote}</p>
                                            </details>
                                        </td>
                                        <td className="py-3 pr-3 align-top w-32">
                                            <Slider
                                                min={0}
                                                max={10}
                                                step={1}
                                                value={[f.userWeight]}
                                                onValueChange={([v]) => updateWeight(f.id, v)}
                                            />
                                            <span className="text-[10px] font-mono text-white/40">{f.userWeight}</span>
                                        </td>
                                        {(['usdScore', 'cnyScore', 'inrScore'] as const).map((key) => (
                                            <td key={key} className="py-3 pr-3 text-center align-top">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={5}
                                                    value={f[key]}
                                                    onChange={(e) =>
                                                        updateScore(f.id, key, Math.min(5, Math.max(1, Number(e.target.value) || 1)))
                                                    }
                                                    className="w-12 rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-center font-mono text-white"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={scrollToAffiliateCta}
                className="text-sm text-amber-400 underline hover:text-amber-300 transition-colors bg-transparent border-0 p-0 cursor-pointer text-left"
            >
                Discuss invoicing currency options with a partner bank →
            </button>

            <p className="text-[11px] text-white/45 m-0 border-t border-white/5 pt-3">
                Factor scores are illustrative defaults based on current macro conditions. Adjust weights to reflect your business&apos;s specific constraints. This tool is not a substitute for professional treasury advice.
            </p>
        </div>
    );
};