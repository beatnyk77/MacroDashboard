import React from 'react';
import { SEOManager } from '@/components/SEOManager';
import { useNavigate } from 'react-router-dom';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { getStaleness } from '@/hooks/useStaleness';
import { FreshnessChip } from '@/components/FreshnessChip';
import { METRIC_IDS as MID } from '@/constants/metricIds';
import { RelatedContent } from '@/components/RelatedContent';
import {
    Activity,
    Coins,
    Globe,
    ShieldAlert,
    Fuel,
    Building2,
    EyeOff,
    ChevronRight,
    Search
} from 'lucide-react';
import { m } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

const labs = [
    { title: 'US Macro & Fiscal', path: '/labs/us-macro-fiscal', icon: <ShieldAlert size={24} />, color: 'blue', desc: 'Sovereign maturity walls & auction demand dynamics' },
    { title: 'India Intelligence Hub', path: '/intel/india', icon: <Activity size={24} />, color: 'emerald', desc: 'RBI credit impulse & state-side fiscal telemetry' },
    { title: 'China Macro Hub', path: '/intel/china', icon: <Globe size={24} />, color: 'rose', desc: 'PBoC liquidity cycles & de-dollarization flows' },
    { title: 'Africa Macro Pulse', path: '/labs/africa-macro', icon: <Globe size={24} />, color: 'blue', desc: 'Sovereign debt restructuring & commodity gravity flows' },
    { title: 'De-Dollarization & Gold', path: '/labs/de-dollarization-gold', icon: <Coins size={24} />, color: 'amber', desc: 'Hard money regimes & reserve asset multi-polarity' },
    { title: 'Energy & Commodities', path: '/labs/energy-commodities', icon: <Fuel size={24} />, color: 'orange', desc: 'Strategic supply chains & oil-rupee settlement pulse' },
    { title: 'Sovereign Stress', path: '/labs/sovereign-stress', icon: <Building2 size={24} />, color: 'purple', desc: 'EM credit matrix & systemic refinance risk analytics' },
    { title: 'Shadow System', path: '/labs/shadow-system', icon: <EyeOff size={24} />, color: 'zinc', desc: 'Capital flight indices & illicit trade flow telemetry' },
];

const colorMap: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    zinc: 'text-terminal-dim bg-zinc-500/10 border-zinc-500/20',
};

export const MacroObservatory: React.FC = () => {
    const navigate = useNavigate();
    const { data: primaryMetric } = useLatestMetric(MID.GOLD_PRICE_USD);
    const dataFreshness = getStaleness(primaryMetric?.lastUpdated, primaryMetric?.frequency);

    return (
        <>
        <SEOManager
            title="Macro Observatory — Research Labs &"
            description="Access specialized macro research labs covering US fiscal policy, de-dollarization, gold reserves, energy commodities, sovereign stress, and shadow trade"
            keywords={['macro observatory', 'research labs', 'sovereign stress', 'de-dollarization', 'gold reserves', 'energy commodities', 'institutional macro']}
            robots="index, follow"
            jsonLd={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                'name': 'GraphiQuestor Macro Observatory',
                'description': 'Hub page for institutional macro research labs.',
                'url': 'https://graphiquestor.com/macro-observatory',
                'isPartOf': { '@id': 'https://graphiquestor.com/#website' }
            }}
        />
        <div className="min-h-screen">
            <div className="page-shell">
                <div className="mb-12 text-center">
                    <m.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono font-semibold uppercase tracking-wider mb-6"
                    >
                        <Search size={12} /> Intelligence Network
                    </m.div>
                    
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <h1 className="text-2xl md:text-4xl font-bold tracking-heading text-white">
                            Macro <span className="text-blue-500">Observatory</span>
                        </h1>
                        <FreshnessChip status={dataFreshness.state} lastUpdated={primaryMetric?.lastUpdated} />
                    </div>
                    
                    <p className="text-slate-400 text-sm md:text-base font-normal max-w-3xl mx-auto leading-relaxed">
                        Access specialized research labs. Institutional-grade telemetry across global credit, currency, and commodity regimes.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {labs.map((lab, index) => (
                        <m.div
                            key={lab.path}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card 
                                variant="elevated" 
                                className="group cursor-pointer h-full border-border bg-white/[0.02] flex flex-col transition-all duration-300 hover:bg-white/[0.04] p-2"
                                onClick={() => navigate(lab.path)}
                            >
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colorMap[lab.color]}`}>
                                        {lab.icon}
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-blue-400 transition-colors uppercase">
                                        {lab.title}
                                    </CardTitle>
                                    <CardDescription className="uppercase tracking-wider leading-relaxed flex-1">
                                        {lab.desc}
                                    </CardDescription>
                                    {lab.title === 'De-Dollarization & Gold' && (
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate('/labs/de-dollarization-gold#gold-oil-revaluation');
                                            }}
                                            className="mt-3 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full w-fit hover:bg-amber-500/25 transition-colors relative z-20 cursor-pointer"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            Active Stress Scenario: Gold vs Oil Reset
                                        </div>
                                    )}
                                </CardHeader>
                                
                                <CardFooter className="justify-between border-t border-border py-4">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-white transition-colors">Enter Lab</span>
                                    <ChevronRight size={14} className="text-muted-foreground/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </CardFooter>

                                {/* Background decoration overlay */}
                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                                    {React.cloneElement(lab.icon as React.ReactElement, { size: 120 })}
                                </div>
                            </Card>
                        </m.div>
                    ))}

                    {/* Coming Soon Card */}
                    <Card variant="default" className="p-8 border-dashed border-border bg-white/[0.01] flex flex-col justify-center items-center text-center opacity-40">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                            <Activity size={24} className="text-white/20" />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-terminal-dim">New Module Pending</p>
                    </Card>
                </div>
            </div>
            <RelatedContent />
        </div>
        </>
    );
};

export default MacroObservatory;
