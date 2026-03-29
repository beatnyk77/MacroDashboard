import React from 'react';
import { motion } from 'framer-motion';
import {
    Landmark,
    Ship,
    Building2,
    Coins,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    MapPin,
    Gem,
    Building
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
    "GIFT City": <Landmark className="text-orange-400" />,
    "Hong Kong": <Building className="text-red-400" />,
    "Shanghai": <Gem className="text-amber-400" />
};

const HUB_COLORS: Record<string, string> = {
    Switzerland: '#60a5fa',
    Singapore: '#34d399',
    London: '#a78bfa',
    Dubai: '#fbbf24',
    "GIFT City": '#fb923c',
    "Hong Kong": '#f87171',
    "Shanghai": '#fbbf24'
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
            className="group relative bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:bg-neutral-900/60 hover:border-white/10 transition-all duration-300 shadow-2xl overflow-hidden flex flex-col h-full"
        >
            {/* Background Glow */}
            <div
                className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-20 blur-3xl"
                style={{ backgroundColor: HUB_COLORS[hub.hub] }}
            />

            <div className="relative z-10 flex flex-col h-full">
                {/* TOP SECTION: Hub Info + Primary Metric */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/5 rounded-xl">
                            {HUB_ICONS[hub.hub] || <Coins className="text-yellow-400 w-8 h-8" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white tracking-tight leading-none mb-1">
                                {hub.hub === 'GIFT City' ? 'GIFT City' : hub.hub}
                            </h3>
                            <p className="text-xs text-neutral-500 uppercase tracking-widest font-black">
                                {hub.hub === 'Switzerland' ? 'Safe-Haven' :
                                    hub.hub === 'Singapore' ? 'Asian Wealth' :
                                        hub.hub === 'London' ? 'Fin. Plumbing' :
                                            hub.hub === 'GIFT City' ? "Offshore Hub" :
                                                hub.hub === 'Hong Kong' ? 'Wealth Gateway' :
                                                    hub.hub === 'Shanghai' ? 'Gold Exchange' : 'Trade Gateway'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-black text-white font-mono leading-none">
                            {hub.hub === 'GIFT City' ? '$' : ''}
                            {hub.primary_metric_value.toLocaleString()}
                            <span className="text-sm text-neutral-500 ml-1 font-normal uppercase">
                                {hub.hub === 'Singapore' ? '%' :
                                    hub.hub === 'London' ? 'Moz' :
                                        hub.hub === 'Switzerland' ? 't' :
                                            hub.hub === 'Hong Kong' ? 't' :
                                                hub.hub === 'Shanghai' ? 't' :
                                                    hub.hub === 'GIFT City' ? 'bn' : ''}
                            </span>
                        </span>
                        <div className={`flex items-center px-1.5 py-0.5 rounded text-xs ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {isUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            <span className="font-bold">
                                {hub.z_score > 0 ? '+' : ''}{hub.z_score.toFixed(1)}σ
                            </span>
                        </div>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <p className="text-[0.65rem] text-neutral-400 uppercase tracking-wider truncate cursor-help hover:text-white transition-colors">
                                    {hub.primary_metric_label}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent className="bg-black/90 border-white/10 text-xs">
                                Source: {hub.source}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* MIDDLE: Sparkline */}
                <div className="h-12 mb-6">
                    <Sparkline
                        data={sparklineData}
                        color={HUB_COLORS[hub.hub]}
                        height={48}
                    />
                </div>

                {/* BOTTOM: Secondary Metrics */}
                <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                    {Object.entries(hub.secondary_metrics)
                        .filter(([key]) => key !== 'vs_singapore_aum_pct')
                        .slice(0, 2)
                        .map(([key, value]) => (
                            <div key={key}>
                                <p className="text-[0.55rem] text-neutral-500 uppercase tracking-tighter mb-0.5 truncate">
                                    {key.replace(/_/g, ' ').replace(/yoy/gi, 'YoY').replace(/aum/gi, 'AUM').replace(/tonnes/gi, '')}
                                </p>
                                <div className="text-xs font-bold text-white font-mono truncate">
                                    {typeof value === 'number' ?
                                        (value > 10 ? value.toLocaleString() : value.toFixed(2)) :
                                        value}
                                    {key.includes('growth') || key.includes('yoy') || key.includes('pct') ? '%' : ''}
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <ArrowUpRight className="w-16 h-16 text-white/5 -mb-4 -mr-4" />
            </div>
        </motion.div>
    );
};

export const GlobalFinancialHubsGoldGateways: React.FC = () => {
    const { data: hubs, isLoading } = useFinancialHubs();

    if (isLoading) {
        return (
            <div className="py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!hubs || hubs.length === 0) return null;

    // Ensure they are always in a consistent order
    const orderedHubs = ['Switzerland', 'Singapore', 'London', 'Dubai', 'Hong Kong', 'Shanghai']
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
                className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {orderedHubs.map((hub) => (
                    <HubCard key={hub.id} hub={hub} />
                ))}
            </motion.div>

            <div className="mt-8 flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-6 gap-4">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-medium text-center md:text-left">
                    Data: SNB, MAS, LBMA, DMCC, HKMA, SGE, PBoC – Updated Monthly
                </p>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs text-neutral-500 uppercase tracking-widest">Live Signals Active</span>
                </div>
            </div>
        </div>
    );
};
