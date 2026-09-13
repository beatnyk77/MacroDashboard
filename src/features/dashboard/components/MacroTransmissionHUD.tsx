import React, { useState } from 'react';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { useMetricsBatch } from '@/hooks/useMetricsBatch';
import { ArrowRight, ShieldAlert, Activity, DollarSign, Layers, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrailLink as Link } from '@/components/TrailLink';

type DeskMode = 'all' | 'duration' | 'fx' | 'credit' | 'reserves';

export const MacroTransmissionHUD: React.FC = () => {
    const [activeDesk, setActiveDesk] = useState<DeskMode>('all');
    const [selectedCatalyst, setSelectedCatalyst] = useState<string>('treasury');

    // Batch prefetch canonical live metrics for the 4 transmission pillars
    const { data: metrics, isLoading } = useMetricsBatch([
        MID.UST_10Y_YIELD,
        MID.UST_10Y_2Y_SPREAD,
        MID.FED_FUNDS_RATE,
        MID.DXY_INDEX,
        MID.USD_INR_RATE,
        MID.US_NET_LIQUIDITY_USD_BN,
        MID.RATIO_DEBT_GOLD,
        MID.SOFR_EFFR_SPREAD_BPS,
        MID.GOLD_PRICE_USD,
        MID.TGA_BALANCE,
        MID.RRP_BALANCE_BN,
        MID.FED_BALANCE_SHEET,
    ]);

    // Format helper
    const getVal = (id: string, fallback: string = '—', unit: string = '') => {
        const item = metrics?.[id];
        if (!item || item.value === undefined || Number.isNaN(item.value)) return fallback;
        const v = item.value;
        if (unit === '%') return `${v.toFixed(2)}%`;
        if (unit === 'bps') return `${v >= 0 ? '+' : ''}${v.toFixed(1)} bps`;
        if (unit === '$') return `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
        if (Math.abs(v) >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 1 });
        return v.toFixed(2);
    };


    // Derived 10Y and 2s10s display
    const tenYield = metrics?.[MID.UST_10Y_YIELD]?.value ?? 4.38;
    const curveSlope = metrics?.[MID.UST_10Y_2Y_SPREAD]?.value ?? 0.16;
    const dxyVal = metrics?.[MID.DXY_INDEX]?.value ?? 105.4;
    const goldVal = metrics?.[MID.GOLD_PRICE_USD]?.value ?? 2650;
    const inrVal = metrics?.[MID.USD_INR_RATE]?.value ?? 86.4;

    const deskFilters: { id: DeskMode; label: string; icon: React.ReactNode }[] = [
        { id: 'all', label: 'All Exposures', icon: <Compass size={14} /> },
        { id: 'duration', label: 'Fixed Income / Duration', icon: <Activity size={14} /> },
        { id: 'fx', label: 'FX & Plumbing', icon: <DollarSign size={14} /> },
        { id: 'credit', label: 'Credit & Solvency', icon: <Layers size={14} /> },
        { id: 'reserves', label: 'Reserves & Hard Assets', icon: <ShieldAlert size={14} /> },
    ];

    return (
        <section
            aria-label="Macro Transmission Switchboard"
            className="w-full mb-8 rounded-xl border border-border bg-card/95 shadow-sm backdrop-blur-sm transition-all duration-300 overflow-hidden"
        >
            {/* Top Control Bar & Desk Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border bg-muted/40">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                        </span>
                        <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-foreground">
                            Macro Transmission Switchboard
                        </h2>
                    </div>
                    <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-black tracking-wider bg-primary/10 text-primary border border-primary/20 uppercase">
                        ALADDIN TRANSMISSION VECTOR v4.2
                    </span>
                </div>

                {/* Desk Switcher Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
                    {deskFilters.map((desk) => {
                        const active = activeDesk === desk.id;
                        return (
                            <button
                                key={desk.id}
                                onClick={() => setActiveDesk(desk.id)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-all duration-150",
                                    active
                                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                                )}
                            >
                                {desk.icon}
                                <span>{desk.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 4-Pillar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
                {/* 1. DURATION */}
                <div
                    className={cn(
                        "p-4 sm:p-5 flex flex-col justify-between transition-opacity duration-200",
                        activeDesk !== 'all' && activeDesk !== 'duration' && "opacity-35 hover:opacity-80"
                    )}
                >
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
                                PILLAR 01 // DURATION
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                {curveSlope >= 0 ? 'BEAR STEEPENING' : 'INVERTED DRAG'}
                            </span>
                        </div>

                        <div className="mb-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
                                    {isLoading ? '4.38%' : `${tenYield.toFixed(2)}%`}
                                </span>
                                <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
                                    US 10Y Yield
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs font-mono text-muted-foreground">
                                <div>
                                    <span className="text-[10px] block uppercase text-muted-foreground/70">2s10s Spread</span>
                                    <span className="font-bold text-foreground">{curveSlope >= 0 ? `+${(curveSlope * 100).toFixed(0)}` : (curveSlope * 100).toFixed(0)} bps</span>
                                </div>
                                <div>
                                    <span className="text-[10px] block uppercase text-muted-foreground/70">Fed Funds</span>
                                    <span className="font-bold text-foreground">{getVal(MID.FED_FUNDS_RATE, '5.33', '%')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-2 pt-3 border-t border-border/60">
                        <div className="text-[10px] font-mono font-semibold uppercase text-muted-foreground mb-1">
                            Tactical Stance:
                        </div>
                        <div className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                            Short 7-10Y Benchmark Duration
                        </div>
                        <Link
                            to="/labs/treasury-supply-radar/"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary mt-2 group"
                        >
                            <span>Inspect Treasury Radar</span>
                            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>

                {/* 2. FX & PLUMBING */}
                <div
                    className={cn(
                        "p-4 sm:p-5 flex flex-col justify-between transition-opacity duration-200",
                        activeDesk !== 'all' && activeDesk !== 'fx' && "opacity-35 hover:opacity-80"
                    )}
                >
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
                                PILLAR 02 // FX & PLUMBING
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                                {dxyVal > 104 ? 'DOLLAR SQUEEZE' : 'BALANCED SMILE'}
                            </span>
                        </div>

                        <div className="mb-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
                                    {isLoading ? '105.4' : dxyVal.toFixed(1)}
                                </span>
                                <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                                    DXY Index
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs font-mono text-muted-foreground">
                                <div>
                                    <span className="text-[10px] block uppercase text-muted-foreground/70">USD/INR</span>
                                    <span className="font-bold text-foreground">{inrVal.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] block uppercase text-muted-foreground/70">Net Liquidity</span>
                                    <span className="font-bold text-foreground">${getVal(MID.US_NET_LIQUIDITY_USD_BN, '6,140')}B</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-2 pt-3 border-t border-border/60">
                        <div className="text-[10px] font-mono font-semibold uppercase text-muted-foreground mb-1">
                            Tactical Stance:
                        </div>
                        <div className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                            Hedge EM Delta & Carry Exposure
                        </div>
                        <Link
                            to="/labs/fx-carry-matrix/"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary mt-2 group"
                        >
                            <span>Open FX Carry Matrix</span>
                            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>

                {/* 3. CREDIT & REFINANCING */}
                <div
                    className={cn(
                        "p-4 sm:p-5 flex flex-col justify-between transition-opacity duration-200",
                        activeDesk !== 'all' && activeDesk !== 'credit' && "opacity-35 hover:opacity-80"
                    )}
                >
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
                                PILLAR 03 // CREDIT & SOLVENCY
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                                SPREAD COMPRESSION
                            </span>
                        </div>

                        <div className="mb-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
                                    314 bps
                                </span>
                                <span className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">
                                    US HY OAS
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs font-mono text-muted-foreground">
                                <div>
                                    <span className="text-[10px] block uppercase text-muted-foreground/70">2026-28 Wall</span>
                                    <span className="font-bold text-foreground">$1.42 Trillion</span>
                                </div>
                                <div>
                                    <span className="text-[10px] block uppercase text-muted-foreground/70">SOFR Spread</span>
                                    <span className="font-bold text-foreground">{getVal(MID.SOFR_EFFR_SPREAD_BPS, '6.2', 'bps')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-2 pt-3 border-t border-border/60">
                        <div className="text-[10px] font-mono font-semibold uppercase text-muted-foreground mb-1">
                            Tactical Stance:
                        </div>
                        <div className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
                            Up-in-Quality to A/BBB Senior Debt
                        </div>
                        <Link
                            to="/corporate-transmission/"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary mt-2 group"
                        >
                            <span>Corporate Transmission Wall</span>
                            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>

                {/* 4. RESERVES & SOVEREIGN */}
                <div
                    className={cn(
                        "p-4 sm:p-5 flex flex-col justify-between transition-opacity duration-200",
                        activeDesk !== 'all' && activeDesk !== 'reserves' && "opacity-35 hover:opacity-80"
                    )}
                >
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
                                PILLAR 04 // HARD RESERVES
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                GOLD ROTATION
                            </span>
                        </div>

                        <div className="mb-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
                                    {isLoading ? '$2,650' : `$${goldVal.toLocaleString('en-US')}`}
                                </span>
                                <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                    Gold Spot (USD)
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs font-mono text-muted-foreground">
                                <div>
                                    <span className="text-[10px] block uppercase text-muted-foreground/70">TGA Cash</span>
                                    <span className="font-bold text-foreground">${getVal(MID.TGA_BALANCE, '780')}B</span>
                                </div>
                                <div>
                                    <span className="text-[10px] block uppercase text-muted-foreground/70">Fed RRP</span>
                                    <span className="font-bold text-foreground">${getVal(MID.RRP_BALANCE_BN, '145')}B</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-2 pt-3 border-t border-border/60">
                        <div className="text-[10px] font-mono font-semibold uppercase text-muted-foreground mb-1">
                            Tactical Stance:
                        </div>
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                            Overweight Physical Gold Allocation
                        </div>
                        <Link
                            to="/labs/central-bank-gold-purchases/"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary mt-2 group"
                        >
                            <span>CB Gold Buying Radar</span>
                            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Dynamic Contagion Flow Diagram Strip */}
            <div className="px-4 sm:px-6 py-3.5 bg-muted/20 border-t border-border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground font-mono font-bold text-[11px]">
                    <span className="uppercase tracking-wider">Transmission Vector:</span>
                    <button
                        onClick={() => setSelectedCatalyst(selectedCatalyst === 'treasury' ? 'oil' : 'treasury')}
                        className="px-2 py-0.5 rounded bg-card hover:bg-accent border border-border text-foreground font-semibold"
                    >
                        {selectedCatalyst === 'treasury' ? 'Catalyst: US Treasury Net Issuance' : 'Catalyst: Middle East Energy Shock'}
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/20">
                        {selectedCatalyst === 'treasury' ? '$1.2T Supply Indigestion' : '+$20/bbl Brent Crude Surge'}
                    </span>
                    <ArrowRight size={13} className="text-muted-foreground" />
                    <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                        {selectedCatalyst === 'treasury' ? 'RRP Buffer Depletes ($145B)' : 'India/EU Trade Deficits Expand'}
                    </span>
                    <ArrowRight size={13} className="text-muted-foreground" />
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        {selectedCatalyst === 'treasury' ? '10Y Term Premium Widens (+28bps)' : 'INR & EUR Depreciate vs DXY'}
                    </span>
                    <ArrowRight size={13} className="text-muted-foreground" />
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/20">
                        Corporate Refinancing Hurdle Climbs
                    </span>
                </div>
            </div>
        </section>
    );
};
