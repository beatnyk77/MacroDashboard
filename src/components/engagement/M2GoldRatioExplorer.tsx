import React, { useMemo, useState } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { trackExplorerUse } from '@/lib/analytics';

/** WGC above-ground gold stock — tonnes */
const GOLD_STOCK_TONNES = 212_582;
const OZ_PER_TONNE = 32_150.7;

interface M2GoldRatioExplorerProps {
    className?: string;
    defaultM2Trillions?: number;
    defaultGoldPrice?: number;
}

export const M2GoldRatioExplorer: React.FC<M2GoldRatioExplorerProps> = ({
    className,
    defaultM2Trillions = 95,
    defaultGoldPrice = 3200,
}) => {
    const [m2T, setM2T] = useState(String(defaultM2Trillions));
    const [gold, setGold] = useState(String(defaultGoldPrice));

    const result = useMemo(() => {
        const m2 = parseFloat(m2T);
        const spot = parseFloat(gold);
        if (!Number.isFinite(m2) || !Number.isFinite(spot) || m2 <= 0 || spot <= 0) return null;

        const goldMarketCap = GOLD_STOCK_TONNES * OZ_PER_TONNE * spot;
        const m2Usd = m2 * 1e12;
        const ratio = m2Usd / goldMarketCap;
        const goldOzPerM2Unit = goldMarketCap / m2Usd;

        let label: string;
        let color: string;
        if (ratio > 120) {
            label = 'Extreme fiat debasement — historically precedes gold re-rating';
            color = 'text-rose-400';
        } else if (ratio > 90) {
            label = 'Elevated — M2 outpacing gold monetary coverage';
            color = 'text-amber-400';
        } else if (ratio < 70) {
            label = 'Compressed — gold rich relative to money supply';
            color = 'text-emerald-400';
        } else {
            label = 'Within historical mean-reversion band';
            color = 'text-blue-400';
        }

        return { ratio, goldOzPerM2Unit, label, color };
    }, [m2T, gold]);

    const handleCalc = () => trackExplorerUse('m2-gold-ratio', 'calculate');

    return (
        <section
            className={`rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5 backdrop-blur-xl ${className ?? ''}`}
        >
            <div className="mb-4 flex items-center gap-2">
                <Calculator size={16} className="text-amber-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/80">
                    M2/Gold Ratio Explorer
                </h3>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-uppercase text-white/40">
                        Global M2 ($ Trillions)
                    </span>
                    <input
                        type="number"
                        min={1}
                        step={0.5}
                        value={m2T}
                        onChange={(e) => setM2T(e.target.value)}
                        onBlur={handleCalc}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-white focus:border-amber-500/40 focus:outline-none"
                    />
                </label>
                <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-uppercase text-white/40">
                        Gold Spot ($/oz)
                    </span>
                    <input
                        type="number"
                        min={100}
                        step={10}
                        value={gold}
                        onChange={(e) => setGold(e.target.value)}
                        onBlur={handleCalc}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-white focus:border-amber-500/40 focus:outline-none"
                    />
                </label>
            </div>

            {result && (
                <div className="rounded-lg border border-white/[0.08] bg-black/20 p-4">
                    <div className="mb-2 flex items-end gap-2">
                        <TrendingUp size={18} className="text-amber-400" />
                        <span className="font-mono text-2xl font-bold text-white">
                            {result.ratio.toFixed(1)}
                        </span>
                        <span className="pb-0.5 text-xs text-white/40">M2/Gold ratio</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${result.color}`}>{result.label}</p>
                    <p className="mt-2 text-[10px] text-white/30">
                        Implied coverage: {(result.goldOzPerM2Unit * 1e6).toFixed(2)} oz gold per $1M M2 ·
                        Stock: {GOLD_STOCK_TONNES.toLocaleString()}t above-ground
                    </p>
                </div>
            )}
        </section>
    );
};