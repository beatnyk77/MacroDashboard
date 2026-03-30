import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, History, Zap, Shield, TrendingUp } from 'lucide-react';

const SHIFTS = [
    {
        pillar: 'Economic Driver',
        from: 'Real Estate & Infrastructure',
        to: 'New Quality Productive Forces',
        icon: Zap,
        desc: 'Pivot from debt-fueled building to high-tech manufacturing and AI-driven efficiency.'
    },
    {
        pillar: 'Climate Strategy',
        from: 'Energy Intensity Control',
        to: 'Carbon Emission Control',
        icon: Shield,
        desc: 'Shift from limiting total energy use to specifically targeting carbon output per unit.'
    },
    {
        pillar: 'Primary Goal',
        from: 'Moderate Prosperity',
        to: 'High-Quality Development',
        icon: TrendingUp,
        desc: 'Focus on domestic technological breakthroughs and structural resilience over raw GDP volume.'
    }
];

export const ComparisonToggle14v15: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <History className="text-red-500" size={18} />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Strategic Policy Shifts: 14th vs 15th Plan</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SHIFTS.map((shift, idx) => {
                    const Icon = shift.icon;
                    return (
                        <Card key={idx} className="bg-white/[0.02] border-white/5 relative overflow-hidden h-full">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="text-xs font-black text-red-400 uppercase tracking-widest">{shift.pillar}</div>
                                    <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
                                        <Icon size={14} />
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 opacity-40">
                                        <div className="text-xs font-bold text-muted-foreground uppercase">14th FYP</div>
                                        <div className="flex-1 h-[1px] bg-white/5" />
                                    </div>
                                    <div className="text-sm font-bold text-muted-foreground/60">{shift.from}</div>
                                    
                                    <div className="flex justify-center py-2">
                                        <div className="p-1.5 rounded-full bg-red-500/10">
                                            <ArrowRight className="text-red-500" size={14} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="text-xs font-black text-red-400 uppercase">15th FYP</div>
                                        <div className="flex-1 h-[1px] bg-red-500/20" />
                                    </div>
                                    <div className="text-lg font-black text-white leading-tight">{shift.to}</div>
                                </div>

                                <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
                                    {shift.desc}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
