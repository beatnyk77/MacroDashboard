import React from 'react';
import { useChinaFYP } from '@/hooks/useChinaFYP';
import { Card, CardContent } from "@/components/ui/card";
import { 
    Wheat, Wind, Microscope, Briefcase, Laptop, 
    TrendingUp, Target
} from 'lucide-react';

export const FYP_TargetGrid: React.FC = () => {
    const { data } = useChinaFYP();
    const targets = data?.filter(item => item.section === 'target') || [];

    const iconMap: Record<string, any> = {
        wheat: Wheat,
        wind: Wind,
        microscope: Microscope,
        briefcase: Briefcase,
        laptop: Laptop
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Target className="text-red-500" size={18} />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Quantitative Performance Targets</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {targets.map((target) => {
                    const Icon = iconMap[target.metadata?.icon] || Target;
                    return (
                        <Card key={target.id} className="bg-white/[0.02] border-white/5 hover:border-red-500/30 transition-all group">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 rounded-xl bg-red-500/10 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all">
                                        <Icon size={18} />
                                    </div>
                                    <div className="text-xs font-black text-rose-500/70 uppercase">
                                        High Priority
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase text-muted-foreground/50 tracking-widest">{target.label}</p>
                                    <h4 className="text-xl font-black text-white tracking-tighter">{target.value_target}</h4>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                    <div className="text-[0.55rem] font-bold text-muted-foreground/40 uppercase">Baseline: {target.value_baseline}</div>
                                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-black">
                                        <TrendingUp size={10} />
                                        SHIFT
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
