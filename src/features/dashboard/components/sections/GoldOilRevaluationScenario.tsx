import React, { useState, useMemo } from 'react';

import { Card } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ReferenceDot } from 'recharts';
import { useGoldOilPrices } from '@/hooks/useGoldOilPrices';
import { cn } from '@/lib/utils';
import { Zap, ShieldCheck, Coins, Layers } from 'lucide-react';

interface HistoricalPoint {
    year: string;
    ratio: number;
    event?: string;
}

// Curated high-fidelity historical data since 1970
const HISTORICAL_DATA: HistoricalPoint[] = [
    { year: '1970', ratio: 21.1, event: 'Bretton Woods Ending' },
    { year: '1972', ratio: 18.5 },
    { year: '1973', ratio: 5.7, event: 'OPEC Oil Embargo' },
    { year: '1975', ratio: 12.8 },
    { year: '1978', ratio: 16.2 },
    { year: '1980', ratio: 16.3, event: 'Volcker Squeeze Peak' },
    { year: '1982', ratio: 11.5 },
    { year: '1986', ratio: 26.2, event: 'Oil Price Counter-Shock' },
    { year: '1990', ratio: 18.1 },
    { year: '1995', ratio: 22.4 },
    { year: '1999', ratio: 15.5, event: 'Browns Gold Bottom' },
    { year: '2003', ratio: 12.8 },
    { year: '2005', ratio: 8.2 },
    { year: '2008', ratio: 9.0, event: 'Great Financial Crisis' },
    { year: '2011', ratio: 14.2, event: 'Euro Sovereign Debt Crisis' },
    { year: '2013', ratio: 13.5 },
    { year: '2015', ratio: 22.3, event: 'US Shale Supply Boom' },
    { year: '2018', ratio: 19.8 },
    { year: '2020', ratio: 88.5, event: 'COVID Negative Oil Anomaly' },
    { year: '2022', ratio: 18.2, event: 'Ukraine Invasions / OPEC+ Cuts' },
    { year: '2024', ratio: 28.3, event: 'Central Bank Gold Acceleration' },
    { year: '2026', ratio: 30.0, event: 'Current Multipolar Era' }
];

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: HistoricalPoint = payload[0].payload;
    return (
        <div className="bg-slate-950/95 border border-white/12 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-uppercase mb-1.5">
                Year {data.year}
            </p>
            <div className="space-y-1">
                <div className="flex items-center gap-6 justify-between">
                    <span className="text-xs font-bold text-white/80">Gold/Oil Ratio:</span>
                    <span className="text-xs font-black text-amber-500">{data.ratio.toFixed(1)} bbl/oz</span>
                </div>
                {data.event && (
                    <div className="text-[10px] font-bold text-blue-400 mt-1 border-t border-white/5 pt-1">
                        💡 {data.event}
                    </div>
                )}
            </div>
        </div>
    );
};

export const GoldOilRevaluationScenario: React.FC = () => {
    const { data: currentPrices } = useGoldOilPrices();

    // Default fallbacks: $2400 Gold, $80 Oil (ratio: 30)
    const initialGold = currentPrices?.goldPrice ?? 2400;
    const initialOil = currentPrices?.oilPrice ?? 80;

    // Interactive slider custom states
    const [customGoldPrice, setCustomGoldPrice] = useState<number | null>(null);
    const [customOilPrice, setCustomOilPrice] = useState<number | null>(null);
    const [yScale, setYScale] = useState<'log' | 'linear'>('log');
    const [activeTab, setActiveTab] = useState<'base' | 'hard' | 'fiat'>('hard');

    const goldPrice = customGoldPrice ?? initialGold;
    const oilPrice = customOilPrice ?? initialOil;


    // Derived states
    const liveRatio = useMemo(() => {
        if (oilPrice === 0) return 0;
        return Number((goldPrice / oilPrice).toFixed(1));
    }, [goldPrice, oilPrice]);

    const currentActualRatio = useMemo(() => {
        if (initialOil === 0) return 0;
        return Number((initialGold / initialOil).toFixed(1));
    }, [initialGold, initialOil]);

    // Live Implied Prices under 500x and 1000x revaluation zones
    const impliedPrices = useMemo(() => {
        return {
            500: {
                gold: oilPrice * 500,
                oil: goldPrice / 500
            },
            1000: {
                gold: oilPrice * 1000,
                oil: goldPrice / 1000
            }
        };
    }, [goldPrice, oilPrice]);

    // Format currencies
    const formatCurrency = (val: number, decimals: number = 0) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: decimals,
            minimumFractionDigits: decimals
        }).format(val);
    };

    // Current simulated state for Recharts positioning
    const chartData = useMemo(() => {
        return HISTORICAL_DATA;
    }, []);

    return (
        <Card className="p-8 bg-black/40 backdrop-blur-3xl border border-white/5 shadow-2xl overflow-hidden rounded-[2.5rem] relative group w-full">
            {/* Background Ambient Radial Glow */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px] -mr-64 -mt-64 group-hover:bg-amber-500/10 transition-colors duration-1000" />

            <div className="relative z-10 space-y-10">
                {/* 1. Header Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-inner">
                                <Coins className="text-amber-500 w-5 h-5 fill-amber-500/20" />
                            </div>
                            <h2 className="text-2xl font-black tracking-heading text-white uppercase italic">
                                Sovereign Energy Pricing & <span className="text-amber-500">Gold/Oil Revaluation</span>
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                            Stress testing the systemic thesis of gold pricing structurally decoupling from legacy fiat networks to anchor strategic energy settle rates (500x to 1,000x barrels/oz revaluation).
                        </p>
                    </div>

                    {/* Scale Mode Switcher */}
                    <div className="flex flex-col justify-center items-start lg:items-end gap-2">
                        <span className="text-[9px] font-black uppercase tracking-uppercase text-muted-foreground/50">Chart Y-Scale Focus</span>
                        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
                            <button
                                onClick={() => setYScale('log')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-uppercase transition-all",
                                    yScale === 'log' ? "bg-amber-500 text-black font-black" : "text-muted-foreground hover:text-white"
                                )}
                            >
                                Logarithmic Reset (5x-1200x)
                            </button>
                            <button
                                onClick={() => setYScale('linear')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-uppercase transition-all",
                                    yScale === 'linear' ? "bg-amber-500 text-black font-black" : "text-muted-foreground hover:text-white"
                                )}
                            >
                                Linear Historical (0x-100x)
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Main Chart Section */}
                <div className="h-[400px] w-full relative">
                    <div className="absolute inset-0 bg-white/[0.01] rounded-[2.5rem] -m-4 border border-white/[0.02]" />

                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="grad-ratio" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />

                            <XAxis
                                dataKey="year"
                                stroke="rgba(255,255,255,0.1)"
                                fontSize={9}
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontWeight: 800 }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            
                            <YAxis
                                stroke="rgba(255,255,255,0.1)"
                                fontSize={9}
                                scale={yScale === 'log' ? 'log' : 'auto'}
                                domain={yScale === 'log' ? [4, 1200] : [0, 100]}
                                allowDataOverflow={true}
                                tickFormatter={(v) => `${v}x`}
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontWeight: 800 }}
                                axisLine={false}
                                tickLine={false}
                            />

                            <Tooltip content={<CustomTooltip />} />

                            {/* Base Reference Areas */}
                            {yScale === 'log' && (
                                <>
                                    {/* 500x Reset Level */}
                                    <ReferenceLine y={500} stroke="#f43f5e" strokeDasharray="5 5" label={{ value: '500x Hard Money Anchor', fill: '#f43f5e', fontSize: 9, fontWeight: 900, position: 'bottom', dy: -5 }} />
                                    {/* 1000x Reset Level */}
                                    <ReferenceLine y={1000} stroke="#f43f5e" strokeDasharray="5 5" label={{ value: '1,000x Systemic Sovereign Floor', fill: '#f43f5e', fontSize: 9, fontWeight: 900, position: 'top', dy: 5 }} />
                                </>
                            )}

                            {/* Current Actual Observation reference line */}
                            <ReferenceLine y={currentActualRatio} stroke="#3b82f6" strokeWidth={1} opacity={0.4} label={{ value: `Actual: ${currentActualRatio}x`, fill: '#3b82f6', fontSize: 9, fontWeight: 800, position: 'insideBottomRight' }} />

                            <Area
                                type="monotone"
                                dataKey="ratio"
                                name="Gold/Oil Ratio"
                                stroke="#f59e0b"
                                fill="url(#grad-ratio)"
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: '#000', stroke: '#f59e0b', strokeWidth: 1.5 }}
                                activeDot={{ r: 5, strokeWidth: 0, fill: '#fff' }}
                            />

                            {/* Interactive State indicator mapping to live slider ratio */}
                            <ReferenceDot
                                x="2026"
                                y={liveRatio}
                                r={6}
                                fill="#ffffff"
                                stroke="#f59e0b"
                                strokeWidth={3}
                                className="animate-ping"
                                style={{ transformOrigin: 'center' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* 3. Slider Controls & Live Output */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/5 items-center">
                    {/* Left Column: Sliders */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Gold Price Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-uppercase">
                                <span className="text-muted-foreground/60">Simulated Gold Price</span>
                                <span className="text-amber-500 font-mono font-bold text-sm">{formatCurrency(goldPrice)}/oz</span>
                            </div>
                            <input
                                type="range"
                                min="1000"
                                max="25000"
                                step="100"
                                value={goldPrice}
                                onChange={(e) => setCustomGoldPrice(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 focus:outline-none"
                            />
                            <div className="flex justify-between text-[9px] text-muted-foreground/35 font-bold uppercase tracking-[0.15em]">
                                <span>$1,000</span>
                                <span>$12,500</span>
                                <span>$25,000</span>
                            </div>
                        </div>

                        {/* Oil Price Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-uppercase">
                                <span className="text-muted-foreground/60">Simulated Brent Oil Price</span>
                                <span className="text-blue-400 font-mono font-bold text-sm">{formatCurrency(oilPrice)}/bbl</span>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="250"
                                step="1"
                                value={oilPrice}
                                onChange={(e) => setCustomOilPrice(Number(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 focus:outline-none"
                            />
                            <div className="flex justify-between text-[9px] text-muted-foreground/35 font-bold uppercase tracking-[0.15em]">
                                <span>$20</span>
                                <span>$135</span>
                                <span>$250</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Calculated State */}
                    <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 flex flex-col justify-center items-center text-center h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/[0.03] to-transparent blur-xl pointer-events-none" />
                        <span className="text-[10px] font-black uppercase tracking-uppercase text-muted-foreground/45 mb-2">Simulated State</span>
                        <div className="text-4xl font-black text-white tracking-heading tabular-nums leading-none">
                            {liveRatio.toFixed(1)}x
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-uppercase text-amber-500/80 mt-2">
                            Barrels of Oil per Ounce
                        </span>
                        
                        <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-uppercase text-muted-foreground/65">
                            {liveRatio > 400 ? (
                                <>
                                    <Zap size={10} className="text-rose-500" /> Extreme Revaluation Mode
                                </>
                            ) : liveRatio > 100 ? (
                                <>
                                    <Zap size={10} className="text-amber-500" /> Structural Reset Zone
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={10} className="text-emerald-500" /> Normal Commodity Bounds
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Implied Reset Matrix */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Layers size={14} className="text-rose-500" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">Implied Sovereign Reset Matrix</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 500x Panel */}
                        <div className="p-6 rounded-3xl bg-rose-950/5 border border-rose-500/10 hover:border-rose-500/20 transition-all duration-300 relative group/card">
                            <div className="absolute -top-px left-8 w-16 h-px bg-rose-500/30" />
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black uppercase tracking-uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">500 Barrels / Ounce</span>
                                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">Stress Ratio A</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/45">Implied Gold Price</span>
                                    <div className="text-lg font-black text-white font-mono mt-1 group-hover/card:text-amber-500 transition-colors">
                                        {formatCurrency(impliedPrices[500].gold)}
                                    </div>
                                    <span className="text-[8px] text-muted-foreground/30 font-bold uppercase">(at current oil)</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/45">Implied Oil Price</span>
                                    <div className="text-lg font-black text-white font-mono mt-1 group-hover/card:text-blue-400 transition-colors">
                                        {formatCurrency(impliedPrices[500].oil, 2)}
                                    </div>
                                    <span className="text-[8px] text-muted-foreground/30 font-bold uppercase">(at current gold)</span>
                                </div>
                            </div>
                        </div>

                        {/* 1,000x Panel */}
                        <div className="p-6 rounded-3xl bg-rose-950/5 border border-rose-500/10 hover:border-rose-500/20 transition-all duration-300 relative group/card">
                            <div className="absolute -top-px left-8 w-16 h-px bg-rose-500/30" />
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black uppercase tracking-uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">1,000 Barrels / Ounce</span>
                                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">Stress Ratio B</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/45">Implied Gold Price</span>
                                    <div className="text-lg font-black text-white font-mono mt-1 group-hover/card:text-amber-500 transition-colors">
                                        {formatCurrency(impliedPrices[1000].gold)}
                                    </div>
                                    <span className="text-[8px] text-muted-foreground/30 font-bold uppercase">(at current oil)</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/45">Implied Oil Price</span>
                                    <div className="text-lg font-black text-white font-mono mt-1 group-hover/card:text-blue-400 transition-colors">
                                        {formatCurrency(impliedPrices[1000].oil, 2)}
                                    </div>
                                    <span className="text-[8px] text-muted-foreground/30 font-bold uppercase">(at current gold)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Scenario Framework & Implications Matrix */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                    {/* Tab Navigation */}
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                            <Layers size={14} className="text-amber-500" />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Systemic Monetary Regimes</h3>
                        </div>
                        <div className="flex bg-white/5 rounded-xl p-1">
                            {(['base', 'hard', 'fiat'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-uppercase transition-all",
                                        activeTab === tab ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                                    )}
                                >
                                    {tab === 'base' && 'Base Trajectory'}
                                    {tab === 'hard' && 'Hard Reset (500x)'}
                                    {tab === 'fiat' && 'Fiat CBDC Dominance'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active Tab Narrative Content */}
                    <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 min-h-[120px] flex items-center">
                        {activeTab === 'base' && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black uppercase tracking-uppercase text-muted-foreground/50">Expected Ratio</span>
                                    <div className="text-xl font-black text-white">25x – 35x</div>
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <h4 className="text-xs font-black text-amber-500 uppercase tracking-uppercase">Slow Bifurcation & Multi-polarity</h4>
                                    <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">
                                        The US dollar maintains primary global reserve dominance (~58% reserve share) while trade networks slowly fragment. Bilateral deals in petroyuan and local currencies (Rupee/Rial) grow gradually within BRICS+ corridors. Financialized G7 debt continues under mild financial repression.
                                    </p>
                                </div>
                            </div>
                        )}
                        {activeTab === 'hard' && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black uppercase tracking-uppercase text-muted-foreground/50">Expected Ratio</span>
                                    <div className="text-xl font-black text-white">500x – 1,000x</div>
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <h4 className="text-xs font-black text-rose-400 uppercase tracking-uppercase">Hard Asset Reset & Sovereign Anchor Shifts</h4>
                                    <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">
                                        Legacy fiat credit systems debase rapidly to match physical reserves. Net energy and commodity producers enforce pricing strictly in physical gold grams or gold-backed settlement tokens. Net importers without significant gold assets suffer balance of payments shocks and hyper-inflation. Real asset repricing reaches historic extremes.
                                    </p>
                                </div>
                            </div>
                        )}
                        {activeTab === 'fiat' && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black uppercase tracking-uppercase text-muted-foreground/50">Expected Ratio</span>
                                    <div className="text-xl font-black text-white">10x – 20x</div>
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <h4 className="text-xs font-black text-blue-400 uppercase tracking-uppercase">Technocratic Centralization & Digital Ledgers</h4>
                                    <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">
                                        G7 central banks successfully coordinate a hyper-efficient digital fiat CBDC network, establishing absolute capital controls. Physical gold is isolated to a secondary hedging tool, while shale oil supply and G7 recycling channels maintain credit standard anchors. Growth equities retain bubble premiums.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Winners vs Losers Matrix */}
                    <div className="space-y-3 pt-6">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block">
                            Sector Revaluation Matrix (Hard Reset Focus)
                        </span>
                        
                        <div className="overflow-x-auto w-full border border-white/5 rounded-2xl bg-white/[0.01]">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/[0.02]">
                                        <th className="p-4 font-black text-[9px] uppercase tracking-uppercase text-muted-foreground/50">Asset Class / Sector</th>
                                        <th className="p-4 font-black text-[9px] uppercase tracking-uppercase text-muted-foreground/50 text-center">Stress Impact</th>
                                        <th className="p-4 font-black text-[9px] uppercase tracking-uppercase text-muted-foreground/50">Strategic Allocator Rationale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                        <td className="p-4 font-black text-white">Physical Gold & Silver</td>
                                        <td className="p-4 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[8px] uppercase tracking-uppercase">
                                                Structural Win
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted-foreground/80 font-medium">
                                            Repriced directly to clear extreme public debt loads and act as the core physical settlement asset.
                                        </td>
                                    </tr>
                                    <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                        <td className="p-4 font-black text-white">Net Energy Exporters with Gold</td>
                                        <td className="p-4 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[8px] uppercase tracking-uppercase">
                                                Win
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted-foreground/80 font-medium">
                                            Captures peak terms-of-trade leverage by demanding payment strictly in physical gold, bypassing the USD network.
                                        </td>
                                    </tr>
                                    <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                        <td className="p-4 font-black text-white">Highly Financialized G7 Debt</td>
                                        <td className="p-4 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black text-[8px] uppercase tracking-uppercase">
                                                Severe Loss
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted-foreground/80 font-medium">
                                            Hyper-depreciation in real buying power as nominal yields fail to offset rapid debasement against gold-based items.
                                        </td>
                                    </tr>
                                    <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                        <td className="p-4 font-black text-white">Energy Importers with Low Gold</td>
                                        <td className="p-4 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black text-[8px] uppercase tracking-uppercase">
                                                Severe Loss
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted-foreground/80 font-medium">
                                            Balance-of-payments crisis; currency defenses collapse under skyrocketing oil-in-fiat prices.
                                        </td>
                                    </tr>
                                    <tr className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                        <td className="p-4 font-black text-white">Hard Infrastructure & Real Estate</td>
                                        <td className="p-4 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[8px] uppercase tracking-uppercase">
                                                Win
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted-foreground/80 font-medium">
                                            Tangible asset utility provides high pricing power; insulates wealth against paper leverage collapses.
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-white/[0.01] transition-colors">
                                        <td className="p-4 font-black text-white">Financialized Equities (Tech/Growth)</td>
                                        <td className="p-4 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-[8px] uppercase tracking-uppercase">
                                                Downside
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted-foreground/80 font-medium">
                                            Multiples compress due to extreme capital flight from paper derivatives to physical assets and rising capital costs.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default GoldOilRevaluationScenario;
