import React, { Suspense } from 'react';
import { useCommodities } from '@/hooks/useCommodities';
import { CommodityHistoryCard } from '../cards/CommodityHistoryCard';
import {
    Activity,
    Droplets,
    Info,
    Calendar,
    Target
} from 'lucide-react';

const LoadingCard = () => (
    <div className="h-[380px] w-full rounded-[2.5rem] bg-white/[0.02] border border-white/5 animate-pulse flex items-center justify-center">
        <Activity className="w-6 h-6 text-white/10" />
    </div>
);

export const CommodityTerminal: React.FC = () => {
    const { data } = useCommodities();

    return (
        <section id="commodity-terminal" className="space-y-10 py-12">
            {/* Header Narrative */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4 px-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                            <Droplets className="text-orange-500 w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">
                                Commodities <span className="text-orange-500">Terminal</span>
                            </h2>
                            <p className="text-[0.65rem] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                                Cross-Asset Commodity Intelligence • 25-Year Context
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed italic">
                        Monitoring the "Real Assets" core. From petro-cycles to industrial metal demand, our terminal tracks
                        commodity regimes relative to <span className="text-white font-bold underline decoration-orange-500/30">quarter-century volatility nodes</span>.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <Calendar size={14} className="text-orange-500" />
                        <span className="text-[0.6rem] font-black text-white/60 uppercase tracking-widest">25Y History Buffer</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <Target size={14} className="text-emerald-500" />
                        <span className="text-[0.6rem] font-black text-white/60 uppercase tracking-widest">Real-Time Markers</span>
                    </div>
                </div>
            </div>

            {/* Commodity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                <Suspense fallback={<LoadingCard />}>
                    <CommodityHistoryCard
                        title="Brent Crude"
                        category="Energy / Global Benchmark"
                        price={data.brent.current?.value ?? 0}
                        unit="USD/bbl"
                        history={data.brent.history}
                        color="red"
                        delta={data.brent.current?.delta_qoq}
                    />
                </Suspense>

                <Suspense fallback={<LoadingCard />}>
                    <CommodityHistoryCard
                        title="WTI Crude"
                        category="Energy / US Context"
                        price={data.wti.current?.value ?? 0}
                        unit="USD/bbl"
                        history={data.wti.history}
                        color="red"
                        delta={data.wti.current?.delta_qoq}
                    />
                </Suspense>

                <Suspense fallback={<LoadingCard />}>
                    <CommodityHistoryCard
                        title="LME Copper"
                        category="Industrial / Growth Signal"
                        price={data.copper.current?.value ?? 0}
                        unit="USD/t"
                        history={data.copper.history}
                        color="orange"
                        delta={data.copper.current?.delta_qoq}
                    />
                </Suspense>

                <Suspense fallback={<LoadingCard />}>
                    <CommodityHistoryCard
                        title="LME Nickel"
                        category="Industrial / EV Metals"
                        price={data.nickel.current?.value ?? 0}
                        unit="USD/t"
                        history={data.nickel.history}
                        color="slate"
                        delta={data.nickel.current?.delta_qoq}
                    />
                </Suspense>
            </div>

            {/* Strategic Disclosure */}
            <div className="mx-4 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-start gap-6 group hover:border-orange-500/20 transition-colors duration-500">
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mt-1 shrink-0 group-hover:bg-blue-500/20 transition-all">
                    <Info className="text-blue-500 w-6 h-6" />
                </div>
                <div className="space-y-2">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Macro Logic: The Real Asset Pivot</h4>
                    <p className="text-[0.7rem] text-muted-foreground leading-relaxed max-w-4xl italic">
                        Commodities act as the ultimate "Regime Verification" engine. While liquidity drives nominal prices, industrial activity
                        manifests in metal spreads. High energy costs act as a <span className="text-rose-400 font-bold">tax on consumption</span>, while rising
                        copper demand signals <span className="text-emerald-400 font-bold">industrial expansion</span>. The 25-year charts above help visualize
                        current prices relative to secular peaks (e.g. 2008 Oil, 2021 Copper) and help identify structural breakouts.
                    </p>
                </div>
            </div>
        </section>
    );
};
