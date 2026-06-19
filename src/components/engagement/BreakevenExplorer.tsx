import React, { useMemo, useState } from 'react';
import { Percent } from 'lucide-react';
import { trackExplorerUse } from '@/lib/analytics';

interface BreakevenExplorerProps {
    className?: string;
    defaultNominal?: number;
    defaultTips?: number;
}

export const BreakevenExplorer: React.FC<BreakevenExplorerProps> = ({
    className,
    defaultNominal = 4.3,
    defaultTips = 2.1,
}) => {
    const [nominal, setNominal] = useState(String(defaultNominal));
    const [tips, setTips] = useState(String(defaultTips));

    const result = useMemo(() => {
        const n = parseFloat(nominal);
        const t = parseFloat(tips);
        if (!Number.isFinite(n) || !Number.isFinite(t)) return null;

        const breakeven = n - t;
        const realRate = t;

        let label: string;
        let color: string;
        if (breakeven > 2.5) {
            label = 'Above Fed 2% anchor — inflation expectations elevated';
            color = 'text-rose-400';
        } else if (breakeven < 1.8) {
            label = 'Below target — disinflation or deflation risk priced';
            color = 'text-emerald-400';
        } else {
            label = 'Well-anchored near Fed mandate';
            color = 'text-blue-400';
        }

        return { breakeven, realRate, label, color };
    }, [nominal, tips]);

    const handleCalc = () => trackExplorerUse('breakeven-inflation', 'calculate');

    return (
        <section
            className={`rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-5 backdrop-blur-xl ${className ?? ''}`}
        >
            <div className="mb-4 flex items-center gap-2">
                <Percent size={16} className="text-blue-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80">
                    Breakeven Inflation Calculator
                </h3>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-uppercase text-white/40">
                        10Y Nominal Yield (%)
                    </span>
                    <input
                        type="number"
                        step={0.05}
                        value={nominal}
                        onChange={(e) => setNominal(e.target.value)}
                        onBlur={handleCalc}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-white focus:border-blue-500/40 focus:outline-none"
                    />
                </label>
                <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-uppercase text-white/40">
                        10Y TIPS Yield (%)
                    </span>
                    <input
                        type="number"
                        step={0.05}
                        value={tips}
                        onChange={(e) => setTips(e.target.value)}
                        onBlur={handleCalc}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-white focus:border-blue-500/40 focus:outline-none"
                    />
                </label>
            </div>

            {result && (
                <div className="rounded-lg border border-white/[0.08] bg-black/20 p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[10px] font-bold uppercase text-white/40">Breakeven</div>
                            <div className="font-mono text-xl font-bold text-white">{result.breakeven.toFixed(2)}%</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold uppercase text-white/40">Real Rate (TIPS)</div>
                            <div className="font-mono text-xl font-bold text-white">{result.realRate.toFixed(2)}%</div>
                        </div>
                    </div>
                    <p className={`mt-3 text-xs leading-relaxed ${result.color}`}>{result.label}</p>
                </div>
            )}
        </section>
    );
};