import React from 'react';
import { m } from 'framer-motion';
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
    Building,
    Info
} from 'lucide-react';
import { SectionHeader } from '@/components/SectionHeader';
import { Sparkline } from '@/components/Sparkline';
import { useFinancialHubs, FinancialHubMetric } from '@/hooks/useFinancialHubs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const HUB_INTELLIGENCE: Record<string, {
    roleType: 'PHYSICAL' | 'FUTURES' | 'CLEARING' | 'CORRIDOR' | 'CENTRAL_BANK';
    dailyVolume: string;
    significance: string;
    strategicNote: string;
    geoRegion: 'WEST' | 'EAST' | 'MIDDLE';
}> = {
    'London': {
        roleType: 'CLEARING',
        dailyVolume: '~$30bn OTC/day',
        significance: 'World\'s largest OTC gold clearing. Primary gold lending market. LBMA benchmark sets global spot price.',
        strategicNote: 'Post-2022: CBs auditing London vault holdings. Singapore and UAE gaining share.',
        geoRegion: 'WEST'
    },
    'New York': {
        roleType: 'FUTURES',
        dailyVolume: '~$60bn futures/day',
        significance: 'COMEX dominates paper gold. 200:1 paper-to-physical ratio. Registered vaults hold delivery inventory.',
        strategicNote: 'COMEX-LBMA basis spread watched as physical tightness signal. Elevated = real demand.',
        geoRegion: 'WEST'
    },
    'Switzerland': {
        roleType: 'PHYSICAL',
        dailyVolume: '~2,000t refined/year',
        significance: 'Swiss refiners (PAMP, Valcambi, Argor-Heraeus) process ~70% of global newly mined gold.',
        strategicNote: 'Neutral status = preferred CB storage. Receives African/Latin American mine output.',
        geoRegion: 'WEST'
    },
    'Shanghai': {
        roleType: 'PHYSICAL',
        dailyVolume: '~10-15t physical/day',
        significance: 'SGE is a closed loop — gold imported, rarely exported. Tracks Chinese domestic demand directly.',
        strategicNote: 'SGE premium to LBMA = Chinese demand intensity gauge. Also PBoC accumulation pathway.',
        geoRegion: 'EAST'
    },
    'Dubai': {
        roleType: 'CORRIDOR',
        dailyVolume: '~25t transit/month',
        significance: 'DMCC GOLD souk. UAE abstained from Russia sanctions — now handles significant non-Western gold flows.',
        strategicNote: 'Post-2022: Russian, African, and Central Asian gold transits through Dubai. Growing BRICS+ node.',
        geoRegion: 'MIDDLE'
    },
    'Singapore': {
        roleType: 'CENTRAL_BANK',
        dailyVolume: '~$2bn/day cleared',
        significance: 'Asia\'s preferred vault jurisdiction for CB reserves. MAS exempts investment gold from GST.',
        strategicNote: 'Multiple CBs repatriated gold FROM London TO Singapore post-2022. Geopolitical hedge in action.',
        geoRegion: 'EAST'
    },
    'Hong Kong': {
        roleType: 'CORRIDOR',
        dailyVolume: '~5-10t/week',
        significance: 'Regional wealth hub. Gateway between Western and Eastern gold markets. HKMA holds substantial reserves.',
        strategicNote: 'Squeezed between US restrictions and BRICS+ corridor growth. Critical for CNY-denominated flows.',
        geoRegion: 'EAST'
    },
    'GIFT City': {
        roleType: 'CENTRAL_BANK',
        dailyVolume: '~$1-2bn/day cleared',
        significance: 'India\'s offshore financial center. RBI repatriating gold from UK to local vaults.',
        strategicNote: 'RBI repatriated 100t from UK (2024). India reducing London gold custody exposure.',
        geoRegion: 'EAST'
    }
};

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

const getRoleBadgeColor = (roleType: string): { bg: string; text: string; border: string } => {
    switch (roleType) {
        case 'CLEARING':
            return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-400/30' };
        case 'FUTURES':
            return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-400/30' };
        case 'PHYSICAL':
            return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-400/30' };
        case 'CORRIDOR':
            return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-400/30' };
        case 'CENTRAL_BANK':
            return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-400/30' };
        default:
            return { bg: 'bg-neutral-500/10', text: 'text-neutral-400', border: 'border-neutral-400/30' };
    }
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
    const intelligence = HUB_INTELLIGENCE[hub.hub];
    const roleBadgeColor = intelligence ? getRoleBadgeColor(intelligence.roleType) : null;

    return (
        <m.div
            variants={cardVariants}
            className="group relative bg-neutral-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:bg-neutral-900/60 hover:border-white/12 transition-all duration-300 shadow-2xl overflow-hidden flex flex-col h-full"
        >
            {/* Background Glow */}
            <div
                className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-20 blur-3xl"
                style={{ backgroundColor: HUB_COLORS[hub.hub] }}
            />

            <div className="relative z-10 flex flex-col h-full">
                {/* HEADER: Hub Name + Role Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="p-3 bg-white/5 rounded-xl">
                            {HUB_ICONS[hub.hub] || <Coins className="text-yellow-400 w-8 h-8" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white tracking-heading leading-none">
                                {hub.hub}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Role Badge */}
                {intelligence && roleBadgeColor && (
                    <div className={`mb-4 inline-block px-3 py-1.5 rounded border ${roleBadgeColor.bg} ${roleBadgeColor.text} ${roleBadgeColor.border} text-xs font-bold uppercase tracking-wide w-fit`}>
                        {intelligence.roleType.replace(/_/g, ' ')}
                    </div>
                )}

                {/* Daily Volume */}
                {intelligence && (
                    <div className="mb-4 p-3 bg-white/5 rounded border border-white/5">
                        <p className="text-xs text-neutral-500 uppercase tracking-heading mb-1">Daily Volume</p>
                        <p className="text-sm font-mono text-white">{intelligence.dailyVolume}</p>
                    </div>
                )}

                {/* Primary Metric */}
                <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-black text-white font-mono leading-none">
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
                                <p className="text-xs text-neutral-400 uppercase tracking-uppercase cursor-help hover:text-white transition-colors">
                                    {hub.primary_metric_label}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent className="bg-black/90 border-white/12 text-xs">
                                Source: {hub.source}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Sparkline */}
                <div className="h-12 mb-4">
                    <Sparkline
                        data={sparklineData}
                        color={HUB_COLORS[hub.hub]}
                        height={48}
                    />
                </div>

                {/* Significance */}
                {intelligence && (
                    <div className="mb-4 p-3 bg-white/5 rounded border border-white/5">
                        <p className="text-xs text-neutral-500 uppercase tracking-heading mb-1 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Significance
                        </p>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                            {intelligence.significance}
                        </p>
                    </div>
                )}

                {/* Strategic Note */}
                {intelligence && (
                    <div className="mt-auto pt-4 border-t border-white/5">
                        <p className="text-xs italic text-neutral-400 leading-relaxed">
                            {intelligence.strategicNote}
                        </p>
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <ArrowUpRight className="w-16 h-16 text-white/5 -mb-4 -mr-4" />
            </div>
        </m.div>
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

            {/* Market Summary Header */}
            <div className="mt-8 mb-12 p-4 bg-white/5 border border-white/10 rounded-lg">
                <p className="text-xs text-neutral-300 font-mono leading-relaxed">
                    <span className="text-emerald-400 font-bold">GOLD MARKET INFRASTRUCTURE</span> – Global OTC clearing ~$182bn/day |
                    COMEX paper:physical ~200:1 | Physical corridor: London → Zurich → Singapore → Dubai |
                    <span className="text-amber-400 font-bold ml-1">Post-2022 shift:</span> Central banks accelerating repatriation from Western vaults to Singapore/Dubai/Mumbai
                </p>
            </div>

            <m.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {orderedHubs.map((hub) => (
                    <HubCard key={hub.id} hub={hub} />
                ))}
            </m.div>

            <div className="mt-8 flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-6 gap-4">
                <p className="text-xs text-neutral-500 uppercase tracking-uppercase font-medium text-center md:text-left">
                    Data: SNB, MAS, LBMA, DMCC, HKMA, SGE, PBoC – Updated Monthly
                </p>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs text-neutral-500 uppercase tracking-uppercase">Live Signals Active</span>
                </div>
            </div>
        </div>
    );
};
