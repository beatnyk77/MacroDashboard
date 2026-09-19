import React, { useState } from 'react';
import { useMarketTransmission } from '@/hooks/useMarketTransmission';
import {
    Activity,
    AlertTriangle,
    Compass,
    Layers,
    Sliders,
    ShieldCheck,
    Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketTransmissionModuleProps {
    className?: string;
}

type Horizon = '1W' | '1M' | '3M' | '1Y';
type BasketTab = 'rate_vulnerable' | 'pricing_power';

export const MarketTransmissionModule: React.FC<MarketTransmissionModuleProps> = ({
    className,
}) => {
    const [selectedHorizon, setSelectedHorizon] = useState<Horizon>('1M');
    const [activeBasket, setActiveBasket] = useState<BasketTab>('rate_vulnerable');
    const [simulatedYield, setSimulatedYield] = useState<number>(4.38);
    const [isSimulatingYield, setIsSimulatingYield] = useState<boolean>(false);

    const { data: marketData } = useMarketTransmission();

    const sectorData = marketData?.sector_rotation;
    const breadthData = marketData?.market_breadth;
    const erpData = marketData?.equity_risk_premium;
    const baskets = marketData?.macro_baskets;

    // Derived ERP with simulation if active
    const activeYield = isSimulatingYield ? simulatedYield : (erpData?.ten_year_yield ?? 4.38);
    const forwardEarningsYield = erpData?.forward_earnings_yield ?? 5.06;
    const computedErp = Number((forwardEarningsYield - activeYield).toFixed(2));
    const computedErpBps = Number((computedErp * 100).toFixed(0));

    const getSimulatedPosture = (erp: number) => {
        if (erp >= 3.0) return { label: 'Extremely Attractive', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
        if (erp >= 1.5) return { label: 'Neutral / Fair Value', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
        if (erp >= 0.0) return { label: 'Stretched / Low Cushion', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
        return { label: 'High Risk / Inverted', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    };

    const currentPosture = getSimulatedPosture(computedErp);
    const currentSpread = sectorData?.spreads?.[selectedHorizon];

    // Sorted sectors by selected horizon performance
    const horizonKey = `perf_${selectedHorizon.toLowerCase()}` as 'perf_1w' | 'perf_1m' | 'perf_3m' | 'perf_1y';
    const sortedSectors = [...(sectorData?.sectors ?? [])].sort(
        (a, b) => b[horizonKey] - a[horizonKey]
    );

    return (
        <section
            aria-label="Market Transmission & Breadth Layer"
            className={cn(
                "w-full rounded-xl border border-border bg-card/95 shadow-sm backdrop-blur-sm transition-all duration-300 overflow-hidden",
                className
            )}
        >
            {/* Top Control Bar & Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border bg-muted/40">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-foreground">
                            Market Transmission & Breadth Monitor
                        </h2>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-primary/10 text-primary border border-primary/20 uppercase">
                        <ShieldCheck size={11} />
                        FINVIZFINANCE CACHED LAYER (15M TTL)
                    </span>
                </div>

                {/* Regime Ticker Pill */}
                {sectorData && (
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-muted-foreground uppercase">
                            Equity Cycle Regime:
                        </span>
                        <span
                            className={cn(
                                "px-2 py-0.5 rounded text-xs font-mono font-black tracking-wide border uppercase",
                                sectorData.regime_signal.regime.includes('Expansionary')
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            )}
                        >
                            {sectorData.regime_signal.regime}
                        </span>
                    </div>
                )}
            </div>

            <div className="p-4 sm:p-6 space-y-6">
                {/* ── PILLAR 1: SECTOR ROTATION & CYCLE ASSESSMENT ─────────── */}
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div>
                            <h3 className="text-sm font-bold tracking-wide uppercase text-foreground flex items-center gap-1.5">
                                <Layers size={15} className="text-primary" />
                                Sector Rotation & Cyclical/Defensive Spread
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Cyclicals (XLK, XLY, XLI, XLB) vs. Defensives (XLU, XLP, XLV) performance differential
                            </p>
                        </div>

                        {/* Horizon Switcher */}
                        <div className="flex items-center p-0.5 rounded-lg border border-border bg-muted/50">
                            {(['1W', '1M', '3M', '1Y'] as Horizon[]).map((hz) => (
                                <button
                                    key={hz}
                                    onClick={() => setSelectedHorizon(hz)}
                                    className={cn(
                                        "px-2.5 py-1 text-xs font-mono font-bold rounded transition-all",
                                        selectedHorizon === hz
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {hz}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cycle Spread Metric Strip */}
                    {currentSpread && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <div className="p-3 rounded-lg border border-border/80 bg-background/50">
                                <div className="text-[11px] font-mono text-muted-foreground uppercase">
                                    Cyclical Basket ({selectedHorizon})
                                </div>
                                <div className="text-lg font-black font-mono mt-0.5 text-cyan-400">
                                    {currentSpread.cyclical_avg >= 0 ? '+' : ''}
                                    {currentSpread.cyclical_avg.toFixed(2)}%
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                    XLK, XLY, XLI, XLB Equal-Weight
                                </div>
                            </div>

                            <div className="p-3 rounded-lg border border-border/80 bg-background/50">
                                <div className="text-[11px] font-mono text-muted-foreground uppercase">
                                    Defensive Basket ({selectedHorizon})
                                </div>
                                <div className="text-lg font-black font-mono mt-0.5 text-purple-400">
                                    {currentSpread.defensive_avg >= 0 ? '+' : ''}
                                    {currentSpread.defensive_avg.toFixed(2)}%
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                    XLU, XLP, XLV Equal-Weight
                                </div>
                            </div>

                            <div className="p-3 rounded-lg border border-border/80 bg-background/50">
                                <div className="text-[11px] font-mono text-muted-foreground uppercase">
                                    Cyclical vs. Defensive Spread
                                </div>
                                <div
                                    className={cn(
                                        "text-lg font-black font-mono mt-0.5",
                                        currentSpread.spread >= 0 ? "text-emerald-400" : "text-rose-400"
                                    )}
                                >
                                    {currentSpread.spread >= 0 ? '+' : ''}
                                    {currentSpread.spread.toFixed(2)}%
                                </div>
                                <div className="text-[10px] font-mono uppercase text-muted-foreground mt-0.5">
                                    Pricing: {currentSpread.regime}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sector Performance Horizontal Bars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {sortedSectors.map((sector) => {
                            const val = sector[horizonKey];
                            const isPositive = val >= 0;
                            // Scale bar width to max 100% (capped at 40% magnitude for clean visual)
                            const barWidth = Math.min(100, (Math.abs(val) / 30) * 100);

                            return (
                                <div
                                    key={sector.name}
                                    className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                                >
                                    <div className="flex items-center gap-2 w-44 min-w-[170px]">
                                        <span
                                            className={cn(
                                                "w-1.5 h-6 rounded-full shrink-0",
                                                sector.type === 'cyclical' && "bg-cyan-500",
                                                sector.type === 'defensive' && "bg-purple-500",
                                                sector.type === 'neutral' && "bg-muted-foreground/40"
                                            )}
                                        />
                                        <div>
                                            <div className="text-xs font-bold text-foreground leading-tight">
                                                {sector.name}
                                            </div>
                                            <div className="text-[10px] font-mono text-muted-foreground">
                                                {sector.symbol} • {sector.type.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bar visual */}
                                    <div className="flex-1 mx-3 hidden sm:flex items-center h-2 bg-muted rounded overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded transition-all duration-500",
                                                isPositive ? "bg-emerald-500" : "bg-rose-500"
                                            )}
                                            style={{ width: `${Math.max(4, barWidth)}%` }}
                                        />
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div
                                            className={cn(
                                                "text-xs font-mono font-black",
                                                isPositive ? "text-emerald-400" : "text-rose-400"
                                            )}
                                        >
                                            {isPositive ? '+' : ''}
                                            {val.toFixed(2)}%
                                        </div>
                                        <div className="text-[10px] font-mono text-muted-foreground">
                                            Fwd P/E: {sector.fwd_pe ? sector.fwd_pe.toFixed(1) : '—'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="border-t border-border" />

                {/* ── PILLAR 2: MARKET BREADTH & INTERNAL STRESS MONITOR ─── */}
                <div>
                    <div className="mb-3">
                        <h3 className="text-sm font-bold tracking-wide uppercase text-foreground flex items-center gap-1.5">
                            <Activity size={15} className="text-primary" />
                            Market Breadth & Technical Health Monitor
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Internal equity participation across 11,000+ US-listed securities
                        </p>
                    </div>

                    {/* Breadth Divergence Warning Banner */}
                    {breadthData?.divergence_alert?.triggered && (
                        <div className="mb-4 p-3.5 rounded-lg border border-amber-500/40 bg-amber-500/10 flex items-start gap-3">
                            <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                                    {breadthData.divergence_alert.title}
                                </h4>
                                <p className="text-xs text-foreground/90 mt-0.5 leading-relaxed">
                                    {breadthData.divergence_alert.message}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* 50-day SMA Gauge */}
                        <div className="p-3.5 rounded-lg border border-border bg-background/50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground">Above 50-Day SMA</span>
                                <span className="text-xs font-mono font-black text-primary">
                                    {breadthData?.pct_above_50_sma ?? 37.3}%
                                </span>
                            </div>
                            <div className="w-full bg-muted h-2 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="bg-primary h-full rounded-full transition-all duration-500"
                                    style={{ width: `${breadthData?.pct_above_50_sma ?? 37.3}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1.5">
                                <span>{breadthData?.above_50_sma?.toLocaleString() ?? '4,341'} Stocks</span>
                                <span>Threshold: 50%</span>
                            </div>
                        </div>

                        {/* 200-day SMA Gauge */}
                        <div className="p-3.5 rounded-lg border border-border bg-background/50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground">Above 200-Day SMA</span>
                                <span className="text-xs font-mono font-black text-cyan-400">
                                    {breadthData?.pct_above_200_sma ?? 50.1}%
                                </span>
                            </div>
                            <div className="w-full bg-muted h-2 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${breadthData?.pct_above_200_sma ?? 50.1}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1.5">
                                <span>{breadthData?.above_200_sma?.toLocaleString() ?? '5,831'} Stocks</span>
                                <span>Long-term Regime Divider</span>
                            </div>
                        </div>

                        {/* 52-Week Highs vs Lows */}
                        <div className="p-3.5 rounded-lg border border-border bg-background/50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground">52W High / Low Ratio</span>
                                <span
                                    className={cn(
                                        "text-xs font-mono font-black",
                                        (breadthData?.high_low_ratio ?? 0.34) >= 1.0
                                            ? "text-emerald-400"
                                            : "text-rose-400"
                                    )}
                                >
                                    {(breadthData?.high_low_ratio ?? 0.34).toFixed(2)}x
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 text-center py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
                                    <div className="text-[10px] font-mono text-emerald-400 font-bold">
                                        +{breadthData?.new_52w_highs ?? 195}
                                    </div>
                                    <div className="text-[9px] text-muted-foreground">New Highs</div>
                                </div>
                                <div className="flex-1 text-center py-1 bg-rose-500/10 rounded border border-rose-500/20">
                                    <div className="text-[10px] font-mono text-rose-400 font-bold">
                                        -{breadthData?.new_52w_lows ?? 570}
                                    </div>
                                    <div className="text-[9px] text-muted-foreground">New Lows</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border" />

                {/* ── PILLAR 3: EQUITY RISK PREMIUM (ERP) CALCULATOR ──────── */}
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div>
                            <h3 className="text-sm font-bold tracking-wide uppercase text-foreground flex items-center gap-1.5">
                                <Percent size={15} className="text-primary" />
                                Equity Risk Premium (ERP) Valuation Calculator
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                S&P 500 Forward Earnings Yield (1/PE) minus Risk-Free 10-Year Treasury Yield
                            </p>
                        </div>

                        {/* Interactive Stress-Test Toggle */}
                        <button
                            onClick={() => setIsSimulatingYield(!isSimulatingYield)}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border transition-colors",
                                isSimulatingYield
                                    ? "bg-primary text-primary-foreground border-primary font-bold"
                                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                            )}
                        >
                            <Sliders size={12} />
                            {isSimulatingYield ? "Custom Rate Active" : "Stress-Test 10Y Yield"}
                        </button>
                    </div>

                    {/* Interactive yield slider when active */}
                    {isSimulatingYield && (
                        <div className="mb-4 p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-foreground font-bold">Simulate 10Y Yield Shock:</span>
                                <span className="text-primary font-black text-sm">{simulatedYield.toFixed(2)}%</span>
                            </div>
                            <input
                                type="range"
                                min="2.5"
                                max="6.5"
                                step="0.05"
                                value={simulatedYield}
                                onChange={(e) => setSimulatedYield(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex gap-2 justify-end">
                                {[3.75, 4.00, 4.38, 4.75, 5.25].map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => setSimulatedYield(preset)}
                                        className="px-2 py-0.5 text-[10px] font-mono rounded bg-muted hover:bg-muted/80 text-foreground"
                                    >
                                        {preset}%
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ERP Core Display Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg border border-border bg-background/50">
                            <div className="text-[11px] font-mono text-muted-foreground uppercase">S&P 500 Forward P/E</div>
                            <div className="text-lg font-black font-mono text-foreground mt-0.5">
                                {(erpData?.fwd_pe ?? 19.78).toFixed(1)}x
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                Trailing P/E: {(erpData?.pe_ttm ?? 26.04).toFixed(1)}x
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border border-border bg-background/50">
                            <div className="text-[11px] font-mono text-muted-foreground uppercase">Forward Earnings Yield</div>
                            <div className="text-lg font-black font-mono text-cyan-400 mt-0.5">
                                {forwardEarningsYield.toFixed(2)}%
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">Formula: 1 / Forward P/E</div>
                        </div>

                        <div className="p-3 rounded-lg border border-border bg-background/50">
                            <div className="text-[11px] font-mono text-muted-foreground uppercase">
                                10-Year Benchmark Yield {isSimulatingYield && "(Shocked)"}
                            </div>
                            <div className="text-lg font-black font-mono text-amber-400 mt-0.5">
                                {activeYield.toFixed(2)}%
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">Risk-Free Benchmark</div>
                        </div>

                        <div className="p-3 rounded-lg border border-border bg-background/50">
                            <div className="text-[11px] font-mono text-muted-foreground uppercase">Equity Risk Premium</div>
                            <div
                                className={cn(
                                    "text-lg font-black font-mono mt-0.5",
                                    computedErp >= 1.5 ? "text-emerald-400" : computedErp >= 0 ? "text-amber-400" : "text-rose-400"
                                )}
                            >
                                {computedErp >= 0 ? '+' : ''}{computedErp.toFixed(2)}% ({computedErpBps >= 0 ? '+' : ''}{computedErpBps} bps)
                            </div>
                            <div className={cn("inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border uppercase mt-1", currentPosture.color)}>
                                {currentPosture.label}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border" />

                {/* ── PILLAR 4: MACRO BASKET SCREENER PIPELINES ───────────── */}
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div>
                            <h3 className="text-sm font-bold tracking-wide uppercase text-foreground flex items-center gap-1.5">
                                <Compass size={15} className="text-primary" />
                                Macro-Sensitive Equity Screeners
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Real-time stock baskets filtered by policy and rate sensitivity criteria
                            </p>
                        </div>

                        {/* Basket Tabs */}
                        <div className="flex items-center p-0.5 rounded-lg border border-border bg-muted/50">
                            <button
                                onClick={() => setActiveBasket('rate_vulnerable')}
                                className={cn(
                                    "px-3 py-1 text-xs font-mono font-bold rounded transition-all",
                                    activeBasket === 'rate_vulnerable'
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Rate-Vulnerable Basket (Debt/Equity &gt; 2.0)
                            </button>
                            <button
                                onClick={() => setActiveBasket('pricing_power')}
                                className={cn(
                                    "px-3 py-1 text-xs font-mono font-bold rounded transition-all",
                                    activeBasket === 'pricing_power'
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Pricing Power Basket (Gross Margin &gt; 50%)
                            </button>
                        </div>
                    </div>

                    {/* Basket Table */}
                    <div className="rounded-lg border border-border overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                            <thead className="border-b border-border bg-muted/40 text-muted-foreground text-[11px] uppercase">
                                <tr>
                                    <th className="py-2.5 px-3">Ticker</th>
                                    <th className="py-2.5 px-3">Company</th>
                                    <th className="py-2.5 px-3">Sector</th>
                                    <th className="py-2.5 px-3 text-right">Market Cap</th>
                                    <th className="py-2.5 px-3 text-right">Price</th>
                                    <th className="py-2.5 px-3">Macro Investment Thesis</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 bg-background/50">
                                {(baskets?.[activeBasket] ?? []).map((item) => (
                                    <tr key={item.ticker} className="hover:bg-muted/20 transition-colors">
                                        <td className="py-2 px-3 font-bold text-primary">{item.ticker}</td>
                                        <td className="py-2 px-3 text-foreground truncate max-w-[200px]">{item.company}</td>
                                        <td className="py-2 px-3 text-muted-foreground">{item.sector}</td>
                                        <td className="py-2 px-3 text-right font-bold text-foreground">
                                            ${item.market_cap_bn.toFixed(1)}B
                                        </td>
                                        <td className="py-2 px-3 text-right text-foreground">
                                            ${item.price.toFixed(2)}
                                        </td>
                                        <td className="py-2 px-3 text-muted-foreground text-[11px] truncate max-w-[320px]">
                                            {item.thesis}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
};
