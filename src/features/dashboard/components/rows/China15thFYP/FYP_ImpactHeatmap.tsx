import React from 'react';
import { useChinaFYP } from '@/hooks/useChinaFYP';
import { Card, CardContent } from "@/components/ui/card";
import { 
    Activity, ArrowRight, Zap, Globe, 
    Shield, TrendingUp, Link as LinkIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const FYP_ImpactHeatmap: React.FC = () => {
    const { data } = useChinaFYP();
    const correlations = data?.filter(item => item.section === 'correlation') || [];

    const iconMap: Record<string, any> = {
        "Global Risk": Activity,
        "Energy": Zap,
        "Finance": TrendingUp,
        "Geopolitics": Globe,
        "India": Shield
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Activity className="text-red-500" size={18} />
                <h3 className="text-sm font-black uppercase tracking-uppercase text-white">Cross-Terminal Impact Matrix</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {correlations.map((corr) => {
                    const Icon = iconMap[corr.category] || LinkIcon;
                    const score = corr.impact_score || 5;
                    
                    return (
                        <Card key={corr.id} className="bg-slate-900/40 border-white/5 group hover:bg-slate-900/60 transition-all overflow-hidden relative">
                            {/* Intensity bar */}
                            <div 
                                className="absolute top-0 left-0 h-full w-1 bg-red-500 opacity-20 group-hover:opacity-100 transition-opacity" 
                                style={{ opacity: score / 10 }}
                            />
                            
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                                            <Icon size={14} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-uppercase text-muted-foreground/60">{corr.category}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[...Array(10)].map((_, i) => (
                                            <div 
                                                key={i} 
                                                className={cn(
                                                    "w-1 h-3 rounded-full",
                                                    i < score ? "bg-red-500" : "bg-white/5"
                                                )} 
                                            />
                                        ))}
                                    </div>
                                </div>

                                <h4 className="text-sm font-black text-white uppercase mb-1">{corr.label}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                                    {corr.value_target} — {corr.value_baseline} influence.
                                </p>

                                <Link 
                                    to={corr.metadata?.link || '#'} 
                                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-uppercase text-red-400 hover:text-red-300 transition-colors"
                                >
                                    View Logic <ArrowRight size={10} />
                                </Link>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
