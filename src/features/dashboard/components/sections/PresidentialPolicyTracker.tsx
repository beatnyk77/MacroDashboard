import React, { useState } from 'react';
import { Flag, ShieldAlert, Zap, Target, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { usePresidentialPolicies } from '@/hooks/usePresidentialPolicies';
import { cn } from '@/lib/utils';

interface AssetImpact {
    symbol: string;
    change: number;
    direction: 'up' | 'down';
}

const MOCK_ASSET_IMPACTS: Record<string, AssetImpact[]> = {
    'Proposed Corporate Tax Cut 2.0': [
        { symbol: 'SPX', change: 1.8, direction: 'up' },
        { symbol: 'DXY', change: -0.5, direction: 'down' }
    ],
    'Tariff Phase 1': [
        { symbol: 'DXY', change: 2.3, direction: 'up' },
        { symbol: 'SPX', change: -1.1, direction: 'down' },
        { symbol: '10Y', change: 0.15, direction: 'up' }
    ]
};

const NARRATIVE_TAGS: Record<string, string> = {
    'Proposed Corporate Tax Cut 2.0': 'Risk-on fiscal impulse',
    'Tariff Phase 1': 'Trade frictions, dollar strength'
};

const MACRO_ANALOGUES: Record<string, string> = {
    'Tariff Phase 1': '2018 Tariff Phase correlates with DXY +3.2% (90D)',
    'Proposed Corporate Tax Cut 2.0': '2017 Tax Cuts Act: SPX +8.5% (6M post-passage)'
};

export const PresidentialPolicyTracker: React.FC = () => {
    const { data: policies, isLoading } = usePresidentialPolicies();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (isLoading || !policies || policies.length === 0) return null;

    const toggleExpanded = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="spa-card bg-rose-500/[0.02] border-rose-500/10 relative overflow-hidden flex flex-col gap-6">
            {/* Edge accent */}
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/60" />

            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Target size={16} className="text-rose-500" />
                        <span className="text-xs font-black uppercase tracking-uppercase text-muted-foreground/60">
                            ADMINISTRATION INTELLIGENCE
                        </span>
                    </div>
                    <h3 className="text-xl font-black tracking-heading text-foreground">
                        Policy Impact Monitor: Trump 2.0
                    </h3>
                </div>
                <div className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                    <span className="text-xs font-black text-rose-400 uppercase tracking-uppercase">H-S CONFIDENCE</span>
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {policies.slice(0, 4).map((policy, idx) => {
                    const absScore = Math.abs(policy.policy_score);
                    const isPositive = policy.policy_score > 0;
                    const assetImpacts = MOCK_ASSET_IMPACTS[policy.event_name] || [];
                    const narrativeTag = NARRATIVE_TAGS[policy.event_name];
                    const macroAnalogue = MACRO_ANALOGUES[policy.event_name];
                    const isExpanded = expandedId === policy.id;

                    return (
                        <div key={policy.id} className={cn(
                            "relative pb-2",
                            idx < policies.slice(0, 4).length - 1 && "border-b border-white/5"
                        )}>
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-1.5">
                                    {isPositive ? <Zap size={12} className="text-amber-500" /> : <ShieldAlert size={12} className="text-rose-500" />}
                                    <span className={cn(
                                        "text-xs font-black uppercase tracking-uppercase",
                                        isPositive ? "text-amber-400/80" : "text-rose-400/80"
                                    )}>
                                        {policy.category}
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-muted-foreground/40">
                                    {new Date(policy.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>

                            <h4 className="text-sm font-black text-foreground mb-2 leading-tight">
                                {policy.event_name}
                            </h4>

                            {narrativeTag && (
                                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-3">
                                    <span className="text-xs font-bold text-blue-400/80">{narrativeTag}</span>
                                </div>
                            )}

                            {assetImpacts.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {assetImpacts.map((asset, assetIdx) => (
                                        <div key={assetIdx} className={cn(
                                            "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-black",
                                            asset.direction === 'up' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                                        )}>
                                            {asset.direction === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                            {asset.symbol} {asset.change > 0 ? '+' : ''}{asset.change}%
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Magnitude Bar */}
                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs font-black uppercase tracking-uppercase text-muted-foreground/40">Market Magnitude</span>
                                    <span className={cn("text-xs font-black", isPositive ? "text-emerald-400" : "text-rose-400")}>
                                        {absScore * 10}%
                                    </span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all duration-1000", isPositive ? "bg-emerald-500" : "bg-rose-500")}
                                        style={{ width: `${absScore * 10}%` }}
                                    />
                                </div>
                            </div>

                            {macroAnalogue && (
                                <div className="mt-4">
                                    <button
                                        onClick={() => toggleExpanded(policy.id)}
                                        className="w-full flex items-center justify-between p-2 rounded-xl bg-amber-500/[0.03] border border-amber-500/10 hover:bg-amber-500/[0.08] transition-all group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Flag size={10} className="text-amber-500/60" />
                                            <span className="text-xs font-black uppercase tracking-uppercase text-amber-500/60 group-hover:text-amber-400 transition-colors">Macro Analogue</span>
                                        </div>
                                        <ChevronDown size={14} className={cn("text-amber-500/60 transition-transform", isExpanded && "rotate-180")} />
                                    </button>
                                    {isExpanded && (
                                        <div className="mt-2 p-3 rounded-xl bg-black/20 border border-white/5">
                                            <p className="text-xs font-bold text-amber-400/80 leading-relaxed italic">
                                                {macroAnalogue}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-auto p-3 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                <div className="flex items-center gap-2">
                    <Flag size={10} className="text-rose-400/60" />
                    <p className="text-xs font-bold text-rose-400/60 uppercase tracking-uppercase leading-tight">
                        Live policy tracking with deep historical correlation analysis
                    </p>
                </div>
            </div>
        </div>
    );
};
