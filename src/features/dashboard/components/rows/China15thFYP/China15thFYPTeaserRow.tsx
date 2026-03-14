import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { useChinaFYP } from '@/hooks/useChinaFYP';
import { 
    Flag, ArrowRight, Wheat, Wind, Microscope, 
    Briefcase, Laptop, TrendingUp, Shield, Cpu
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const China15thFYPTeaserRow: React.FC = () => {
    const { data, isLoading } = useChinaFYP();
    const navigate = useNavigate();

    if (isLoading) {
        return <Skeleton className="w-full h-24 rounded-2xl bg-card/50" />;
    }

    const targets = data?.filter(item => item.section === 'target').slice(0, 4) || [];

    const iconMap: Record<string, any> = {
        wheat: Wheat,
        wind: Wind,
        microscope: Microscope,
        briefcase: Briefcase,
        laptop: Laptop,
        trending: TrendingUp,
        shield: Shield,
        cpu: Cpu
    };

    return (
        <Card className="bg-gradient-to-r from-red-950/20 via-slate-900/40 to-slate-900/40 border-red-500/10 hover:border-red-500/20 transition-all group overflow-hidden">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-stretch">
                    {/* Hero Side */}
                    <div className="md:w-1/4 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5 bg-red-500/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Flag className="text-red-500" size={16} />
                            <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-red-400">Policy Intelligence</span>
                        </div>
                        <h3 className="text-lg font-black tracking-tighter text-white leading-tight">
                            China 15th <br />
                            <span className="text-red-500">Five-Year Plan</span>
                        </h3 >
                        <p className="text-[0.65rem] text-muted-foreground mt-2 line-clamp-2">
                            Structural shift to high-quality development & tech self-reliance.
                        </p>
                    </div>

                    {/* Targets Grid */}
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 p-4 gap-4">
                        {targets.map((target) => {
                            const Icon = iconMap[target.metadata?.icon] || Flag;
                            return (
                                <div key={target.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-default">
                                    <div className="p-2 rounded-lg bg-slate-800/80 text-red-400">
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[0.55rem] font-black uppercase text-muted-foreground/50 tracking-widest">{target.label}</div>
                                        <div className="text-sm font-black text-white">{target.value_target}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* CTA Side */}
                    <div 
                        onClick={() => navigate('/labs/china-15th-fyp')}
                        className="p-6 flex items-center justify-center bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border-t md:border-t-0 border-white/5"
                    >
                        <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                            <span className="text-[0.65rem] font-black uppercase tracking-widest text-red-400">Mission Control</span>
                            <ArrowRight size={14} className="text-red-400" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
