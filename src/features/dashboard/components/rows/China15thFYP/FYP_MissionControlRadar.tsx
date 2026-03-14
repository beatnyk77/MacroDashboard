import React from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, 
    ResponsiveContainer 
} from 'recharts';
import { useChinaFYP } from '@/hooks/useChinaFYP';
import { Card, CardContent } from "@/components/ui/card";
import { Info, Target } from 'lucide-react';

export const FYP_MissionControlRadar: React.FC = () => {
    const { data } = useChinaFYP();
    
    const pillars = data?.filter(item => item.section === 'pillar') || [];
    
    const chartData = pillars.map(p => ({
        subject: p.label,
        A: p.impact_score * 10,
        fullMark: 100,
    }));

    return (
        <Card className="bg-card/30 border-white/5 backdrop-blur-sm h-full">
            <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Target className="text-red-500" size={18} />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Mission Control Radar</h3>
                    </div>
                    <Info size={14} className="text-muted-foreground/30 cursor-help" />
                </div>

                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="rgba(255,255,255,0.05)" />
                            <PolarAngleAxis 
                                dataKey="subject" 
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700 }} 
                            />
                            <Radar
                                name="FYP Priority"
                                dataKey="A"
                                stroke="#ef4444"
                                fill="#ef4444"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2">
                    {pillars.slice(0, 4).map(p => (
                        <div key={p.id} className="p-2 bg-white/5 rounded-lg border border-white/5">
                            <div className="text-[0.55rem] font-black text-muted-foreground/60 uppercase tracking-tighter">{p.label}</div>
                            <div className="flex items-center justify-between">
                                <div className="text-[0.65rem] font-bold text-white uppercase">{p.value_target}</div>
                                <div className="text-[0.6rem] font-black text-red-400">Idx: {p.impact_score}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
