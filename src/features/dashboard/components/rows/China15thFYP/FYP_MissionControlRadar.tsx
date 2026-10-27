import React from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis 
} from 'recharts';
import { useChinaFYP } from '@/hooks/useChinaFYP';
import { Card, CardContent } from "@/components/ui/card";
import { Info, Target } from 'lucide-react';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';
import { CHART_HEIGHTS, CHART_COLORS, WHITE_ALPHA } from '@/constants/chartDefaults';

export const FYP_MissionControlRadar: React.FC = () => {
    const { data } = useChinaFYP();
    
    const pillars = data?.filter(item => item.section === 'pillar') || [];
    
    const chartData = pillars.map(p => ({
        subject: p.label,
        A: p.impact_score * 10,
        fullMark: 100,
    }));

    return (
        <Card className="bg-card/30 border-border backdrop-blur-sm h-full">
            <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Target className="text-red-500" size={18} />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Mission Control Radar</h3>
                    </div>
                    <Info size={14} className="text-terminal-dim cursor-help" />
                </div>

                <MacroChartContainer height={CHART_HEIGHTS.standard} className="mt-4">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke={WHITE_ALPHA.faint} />
                            <PolarAngleAxis 
                                dataKey="subject" 
                                tick={{ fill: WHITE_ALPHA.dim, fontSize: 11, fontWeight: 700 }} 
                            />
                            <Radar
                                name="FYP Priority"
                                dataKey="A"
                                stroke={CHART_COLORS.stress}
                                fill={CHART_COLORS.stress}
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                </MacroChartContainer>

                <div className="mt-6 grid grid-cols-2 gap-2">
                    {pillars.slice(0, 4).map(p => (
                        <div key={p.id} className="p-2 bg-white/5 rounded-lg border border-border">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-heading">{p.label}</div>
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-semibold text-white uppercase">{p.value_target}</div>
                                <div className="text-xs font-bold text-red-400">Idx: {p.impact_score}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
