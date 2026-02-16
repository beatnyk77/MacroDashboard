import React from 'react';
import { motion } from 'framer-motion';
import {
    Landmark,
    Ship,
    Building2,
    Coins,
    TrendingUp,
    TrendingDown,
    Info,
    ArrowUpRight,
    MapPin
} from 'lucide-react';
import { SectionHeader } from '@/components/SectionHeader';
import { Sparkline } from '@/components/Sparkline';
import { useFinancialHubs, FinancialHubMetric } from '@/hooks/useFinancialHubs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const HUB_ICONS: Record<string, React.ReactNode> = {
    Switzerland: <Landmark className="text-blue-400" />,
    Singapore: <MapPin className="text-emerald-400" />,
    London: <Building2 className="text-purple-400" />,
    Dubai: <Ship className="text-amber-400" />,
    "GIFT City": <Landmark className="text-orange-400" />
};

const HUB_COLORS: Record<string, string> = {
    Switzerland: '#60a5fa',
    Singapore: '#34d399',
    London: '#a78bfa',
    Dubai: '#fbbf24',
    "GIFT City": '#fb923c'
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const HubCard: React.FC<{ hub: FinancialHubMetric }> = ({ hub }) => {
    const isUp = hub.z_score > 0;
    const sparklineData = hub.sparkline_data.map((val, i) => ({
        date: i.toString(),
        value: val
    }));

    return (
        <motion.div
            variants={cardVariants}
            className="group relative bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:bg-neutral-900/60 hover:border-white/10 transition-all duration-300 shadow-2xl overflow-hidden"
        >
            {/* Background Glow */}
            <div
                className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-20 blur-3xl"
                style={{ backgroundColor: HUB_COLORS[hub.hub] }}
            />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-xl">
                            {HUB_ICONS[hub.hub] || <Coins className="text-yellow-400" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">
                                {hub.hub === 'GIFT City' ? 'GIFT City IFSC Pulse' : hub.hub}
                            </h3>
                            <p className="text-[0.65rem] text-neutral-500 uppercase tracking-widest font-black">
                                {hub.hub === 'Switzerland' ? 'Safe-Haven' :
                                    hub.hub === 'Singapore' ? 'Asian Wealth' :
                                        hub.hub === 'London' ? 'Financial Plumbing' :
                                            hub.hub === 'GIFT City' ? "India's Offshore Hub" : 'Trade Gateway'}
                            </p>
                        </div>
                    </div>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-help">
                                    <Info className="w-3.5 h-3.5 text-neutral-500" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-black/90 border-white/10 text-xs p-2">
                                <p>Source: {hub.source}</p>
                                <p className="mt-1 text-neutral-400">Reflects {hub.primary_metric_label.toLowerCase()}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white mapping">
                            {hub.hub === 'GIFT City' ? '$' : ''}
                            {hub.primary_metric_value.toLocaleString()}
                            <span className="text-xs text-neutral-500 ml-1 font-normal uppercase">
                                {hub.hub === 'Singapore' ? '%' :
                                    hub.hub === 'London' ? 'Moz' :
                                        hub.hub === 'Switzerland' ? 't' :
                                            hub.hub === 'GIFT City' ? 'bn' : ''}
                            </span>
                        </span>
                        <div className={`flex items-center text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {hub.z_score > 0 ? '+' : ''}{hub.z_score.toFixed(1)}σ
                        </div>
                    </div>
                    {hub.hub === 'GIFT City' && hub.secondary_metrics.vs_singapore_aum_pct && (
                        <div className="mt-1 px-2 py-0.5 bg-neutral-800/50 border border-white/5 rounded-md inline-block">
                            <p className="text-[0.5rem] text-neutral-400 font-medium">
                                vs Singapore: <span className="text-emerald-400 font-bold">{hub.secondary_metrics.vs_singapore_aum_pct}%</span> of NR AUM
                            </p>
                        </div>
                    )}
                    <p className="text-[0.6rem] text-neutral-400 uppercase tracking-wider mt-1">
                        {hub.primary_metric_label}
                    </p>
                </div>

                <div className="mb-6 h-12">
                    <Sparkline
                        data={sparklineData}
                        color={HUB_COLORS[hub.hub]}
                        height={48}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div>
                        <p className="text-[0.55rem] text-neutral-500 uppercase tracking-tighter mb-1">Percentile</p>
                        <div className="text-sm font-bold text-white">
                            {hub.percentile}%
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[0.55rem] text-neutral-500 uppercase tracking-tighter mb-1">Last Updated</p>
                        <div className="text-[0.65rem] font-medium text-neutral-400">
                            {new Date(hub.last_updated).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    {Object.entries(hub.secondary_metrics).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-[0.65rem]">
                            <span className="text-neutral-500 capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="text-neutral-300 font-mono">
                                {typeof value === 'number' ?
                                    (value > 10 ? value.toLocaleString() : value.toFixed(2)) :
                                    value}
                                {key.includes('growth') || key.includes('yoy') || key.includes('pct') ? '%' : ''}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-4 absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <ArrowUpRight className="w-12 h-12 text-white/5 -mb-2 -mr-2" />
                </div>
            </div>
        </motion.div>
    );
};

export const GlobalFinancialHubsGoldGateways: React.FC = () => {
    const { data: hubs, isLoading } = useFinancialHubs();

    if (isLoading) {
        return (
            <div className="py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!hubs || hubs.length === 0) return null;

    // Ensure they are always in a consistent order
    const orderedHubs = ['Switzerland', 'Singapore', 'London', 'Dubai', 'GIFT City']
        .map(name => hubs.find(h => h.hub === name))
        .filter(Boolean) as FinancialHubMetric[];

    return (
        <div id="global-financial-hubs" className="py-24">
            <SectionHeader
                title="Global Financial Hubs & Gold Gateways"
                subtitle="High-frequency wealth custody, physical flows, and arbitrage signals"
                icon={<Landmark className="w-6 h-6 text-blue-400" />}
            />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
            >
                {orderedHubs.map((hub) => (
                    <HubCard key={hub.id} hub={hub} />
                ))}
            </motion.div>

            <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                <p className="text-[0.6rem] text-neutral-500 uppercase tracking-widest font-medium">
                    Data from SNB, MAS, LBMA, DMCC, UAE CB, IFSCA, SEBI – Updated Monthly/Quarterly
                </p>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[0.6rem] text-neutral-500 uppercase tracking-widest">Live Signals Active</span>
                </div>
            </div>
        </div>
    );
};
