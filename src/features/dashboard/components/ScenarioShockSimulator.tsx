import React, { useState, useMemo } from 'react';
import { Sliders, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ScenarioShockSimulator: React.FC = () => {
    // Shocks state
    const [rateShockBps, setRateShockBps] = useState<number>(45);
    const [oilShockUsd, setOilShockUsd] = useState<number>(15);
    const [usdImpulsePct, setUsdImpulsePct] = useState<number>(2.5);

    const resetBaseCase = () => {
        setRateShockBps(0);
        setOilShockUsd(0);
        setUsdImpulsePct(0);
    };

    // Calculate dynamic cross-asset transmission impacts based on empirical macro sensitivities
    const impacts = useMemo(() => {
        // Equity valuation sensitivity: ~0.028x multiple contraction per 10bps yield spike
        const peContract = -(rateShockBps * 0.028 + usdImpulsePct * 0.12);
        const equityPct = (peContract / 19.5) * 100;

        // EM Debt spreads sensitivity: ~0.9bps per 1bp yield + 7bps per 1% USD
        const emSpreadBps = Math.round(rateShockBps * 0.85 + usdImpulsePct * 6.8 + oilShockUsd * 0.4);

        // Synthetic liquidity drain: ~$3.2B per 1bp rate surge + ~$45B per 1% DXY
        const liqDrainBn = Math.round(rateShockBps * 3.2 + usdImpulsePct * 45);

        // Gold flight-to-safety: boosted by geopolitical oil surge and inflation, dampened by real rate spikes
        const goldDrift = Math.round(oilShockUsd * 4.8 - rateShockBps * 0.45 + (rateShockBps > 50 ? 30 : 0));

        // USD/INR pressure: 86.42 baseline + 0.024 per $1 oil + 0.24 per 1% DXY
        const inrDrift = 86.42 + (oilShockUsd * 0.024) + (usdImpulsePct * 0.22);

        return {
            peContract: peContract.toFixed(2),
            equityPct: equityPct.toFixed(1),
            emSpreadBps,
            liqDrainBn,
            goldDrift,
            inrDrift: inrDrift.toFixed(2),
        };
    }, [rateShockBps, oilShockUsd, usdImpulsePct]);

    return (
        <div className="w-full mb-8 rounded-xl border border-border bg-card/95 p-4 sm:p-6 shadow-sm backdrop-blur-sm transition-all duration-300">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Sliders size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-black tracking-tight text-foreground uppercase">
                            Factor Sensitivity & Scenario Shock Simulator
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono">
                            Deterministic systemic transmission engine • Simulate rates, energy, and currency shocks
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={resetBaseCase}
                        className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm"
                        title="Reset sliders to zero"
                    >
                        <RefreshCw size={12} />
                        <span>RESET BASE CASE</span>
                    </button>
                </div>
            </div>

            {/* Main Interactive Deck: Sliders on left, Reactive Chips on right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* 3 Interactive Sliders */}
                <div className="lg:col-span-6 flex flex-col gap-4">
                    {/* Slider 1: 10Y Yield */}
                    <div className="p-3.5 rounded-lg bg-card border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
                            <span className="font-bold text-foreground">US 10Y Benchmark Yield Shock</span>
                            <span className={cn("font-bold px-2 py-0.5 rounded text-[11px]", rateShockBps > 0 ? "bg-amber-500/20 text-amber-900 dark:text-amber-300 font-black" : rateShockBps < 0 ? "bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-black" : "text-muted-foreground")}>
                                {rateShockBps >= 0 ? `+${rateShockBps}` : rateShockBps} bps
                            </span>
                        </div>
                        <input
                            type="range"
                            min="-100"
                            max="100"
                            step="5"
                            value={rateShockBps}
                            onChange={(e) => setRateShockBps(Number(e.target.value))}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-[#FF5B04]"
                            aria-label="US 10Y Yield Shock in basis points"
                        />
                        <div className="flex justify-between text-[10px] font-mono font-medium text-muted-foreground mt-1">
                            <span>-100 bps (Dovish Pivot)</span>
                            <span>0 bps</span>
                            <span>+100 bps (Term Premium Spike)</span>
                        </div>
                    </div>

                    {/* Slider 2: Crude Oil */}
                    <div className="p-3.5 rounded-lg bg-card border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
                            <span className="font-bold text-foreground">Crude Oil (Brent) Shock</span>
                            <span className={cn("font-bold px-2 py-0.5 rounded text-[11px]", oilShockUsd > 0 ? "bg-rose-500/20 text-rose-900 dark:text-rose-300 font-black" : oilShockUsd < 0 ? "bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-black" : "text-muted-foreground")}>
                                {oilShockUsd >= 0 ? `+$${oilShockUsd}` : `-$${Math.abs(oilShockUsd)}`}/bbl
                            </span>
                        </div>
                        <input
                            type="range"
                            min="-30"
                            max="50"
                            step="2"
                            value={oilShockUsd}
                            onChange={(e) => setOilShockUsd(Number(e.target.value))}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-[#075056]"
                            aria-label="Crude Oil Price Shock in USD per barrel"
                        />
                        <div className="flex justify-between text-[10px] font-mono font-medium text-muted-foreground mt-1">
                            <span>-$30/bbl (Demand Slump)</span>
                            <span>Baseline</span>
                            <span>+$50/bbl (Geopolitical Shock)</span>
                        </div>
                    </div>

                    {/* Slider 3: DXY Broad USD */}
                    <div className="p-3.5 rounded-lg bg-card border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
                            <span className="font-bold text-foreground">Broad Dollar Impulse (DXY)</span>
                            <span className={cn("font-bold px-2 py-0.5 rounded text-[11px]", usdImpulsePct > 0 ? "bg-primary/20 text-primary dark:text-orange-300 font-black" : usdImpulsePct < 0 ? "bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-black" : "text-muted-foreground")}>
                                {usdImpulsePct >= 0 ? `+${usdImpulsePct.toFixed(1)}%` : `${usdImpulsePct.toFixed(1)}%`}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="-5"
                            max="10"
                            step="0.5"
                            value={usdImpulsePct}
                            onChange={(e) => setUsdImpulsePct(Number(e.target.value))}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-[#233038]"
                            aria-label="Dollar Index Impulse percentage"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1">
                            <span>-5% (Dollar Selloff)</span>
                            <span>0%</span>
                            <span>+10% (Liquidity Squeeze)</span>
                        </div>
                    </div>
                </div>

                {/* Live Resulting Transmission Delta Chips */}
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Chip 1: S&P P/E Valuation Impact */}
                    <div className="p-3.5 rounded-lg border border-border bg-card">
                        <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1">
                            Equity Valuation Multiple
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className={cn("text-xl font-black font-mono", Number(impacts.peContract) < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
                                {impacts.peContract}x P/E
                            </span>
                            <span className="text-xs font-mono text-muted-foreground">
                                ({impacts.equityPct}%)
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                            Duration repricing contracts equity discount rates and terminal multiples.
                        </p>
                    </div>

                    {/* Chip 2: EM Debt Contagion */}
                    <div className="p-3.5 rounded-lg border border-border bg-card">
                        <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1">
                            EM Sovereign Spread Contagion
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className={cn("text-xl font-black font-mono", impacts.emSpreadBps > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
                                {impacts.emSpreadBps >= 0 ? `+${impacts.emSpreadBps}` : impacts.emSpreadBps} bps
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                            Dollar strength + yield surge widens external refinancing premiums.
                        </p>
                    </div>

                    {/* Chip 3: Synthetic Liquidity Drain */}
                    <div className="p-3.5 rounded-lg border border-border bg-card">
                        <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1">
                            Global Synthetic Liquidity
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className={cn("text-xl font-black font-mono", impacts.liqDrainBn > 0 ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400")}>
                                {impacts.liqDrainBn > 0 ? `-$${impacts.liqDrainBn}B` : `+$${Math.abs(impacts.liqDrainBn)}B`}
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                            Higher cash collateral rates shrink shadow banking leverage capacity.
                        </p>
                    </div>

                    {/* Chip 4: USD/INR Stress Drift */}
                    <div className="p-3.5 rounded-lg border border-border bg-card">
                        <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-1">
                            USD/INR Projected Stress Level
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black font-mono text-foreground">
                                {impacts.inrDrift}
                            </span>
                            <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">
                                RBI Band Test
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
                            Oil import bill expansion forces central bank FX reserves defense.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
