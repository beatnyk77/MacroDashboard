import React from 'react';
import { cn } from '@/lib/utils';
import { Info, TrendingUp, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { StateEnergyStats } from '@/hooks/useIndiaEnergy';
import { StateASIStats } from '@/hooks/useIndiaASI';

interface StateMacroInsightsProps {
    type: 'energy' | 'asi';
    data: StateEnergyStats | StateASIStats | null;
}

export const StateMacroInsights: React.FC<StateMacroInsightsProps> = ({ type, data }) => {
    if (!data) return null;

    const insights: { icon: any, text: string, type: 'success' | 'warning' | 'info' | 'neutral' }[] = [];

    if (type === 'energy') {
        const energyData = data as StateEnergyStats;
        const renewableShare = energyData.renewable_share;

        // Transition Leader
        if (renewableShare > 25) {
            insights.push({
                icon: ShieldCheck,
                text: `Transition Leader: Renewables constitute ${renewableShare.toFixed(1)}% of total energy production.`,
                type: 'success'
            });
        }

        // Carbon Intensive
        if (energyData.coal_production > 5000 && renewableShare < 5) {
            insights.push({
                icon: AlertTriangle,
                text: `Carbon Intensive: High coal output (${energyData.coal_production.toLocaleString()} KToE) with limited transition progress.`,
                type: 'warning'
            });
        }

        // Demand Growth
        if (energyData.consumption_growth_yoy > 10) {
            insights.push({
                icon: TrendingUp,
                text: `Surging Demand: Electricity consumption increased by ${energyData.consumption_growth_yoy.toFixed(1)}% YoY, indicating rapid urban/industrial expansion.`,
                type: 'success'
            });
        } else if (energyData.consumption_growth_yoy < 0) {
            insights.push({
                icon: AlertTriangle,
                text: `Demand Contraction: Consumption dipped by ${Math.abs(energyData.consumption_growth_yoy).toFixed(1)}%, suggesting industrial cooling.`,
                type: 'info'
            });
        }
    } else if (type === 'asi') {
        const asiData = data as StateASIStats;

        // Efficiency Analysis
        if (asiData.employment_growth_yoy > 5) {
            insights.push({
                icon: Zap,
                text: `Industrial Momentum: Employment growth of ${asiData.employment_growth_yoy.toFixed(1)}% YoY reflects aggressive sectoral expansion.`,
                type: 'success'
            });
        }

        // Capacity Utilization
        if (asiData.avg_capacity_utilization > 80) {
            insights.push({
                icon: TrendingUp,
                text: `High Utilization: Operating at ${asiData.avg_capacity_utilization.toFixed(1)}% capacity. Proximity to full utilization signals upcoming CAPEX requirements.`,
                type: 'info'
            });
        } else if (asiData.avg_capacity_utilization < 40) {
            insights.push({
                icon: AlertTriangle,
                text: `Underutilization: Operating below 40%. Significant legacy capacity remains idle.`,
                type: 'warning'
            });
        }

        // GVA Focus
        const gvaPerEmployee = asiData.total_gva / (asiData.total_employment || 1);
        if (gvaPerEmployee > 200) {
            insights.push({
                icon: ShieldCheck,
                text: `High Value-Add: Capital-intensive output profile with significant value-addition per labor unit.`,
                type: 'success'
            });
        }
    }

    if (insights.length === 0) {
        insights.push({
            icon: Info,
            text: `Stable Baseline: Performance metrics within standard historical distribution for this region.`,
            type: 'neutral'
        });
    }

    return (
        <div className="space-y-3">
            {insights.map((insight, idx) => (
                <div
                    key={idx}
                    className={cn(
                        "flex gap-3 p-4 rounded-2xl border transition-all duration-300 animate-in fade-in slide-in-from-right-2",
                        insight.type === 'success' ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-300/90" :
                            insight.type === 'warning' ? "bg-rose-500/5 border-rose-500/10 text-rose-300/90" :
                                insight.type === 'info' ? "bg-blue-500/5 border-blue-500/10 text-blue-300/90" :
                                    "bg-white/[0.02] border-white/5 text-muted-foreground"
                    )}
                >
                    <insight.icon className={cn(
                        "w-4 h-4 mt-0.5 shrink-0",
                        insight.type === 'success' ? "text-emerald-500" :
                            insight.type === 'warning' ? "text-rose-500" :
                                insight.type === 'info' ? "text-blue-500" :
                                    "text-muted-foreground"
                    )} />
                    <p className="text-xs font-bold leading-relaxed uppercase tracking-heading italic">
                        {insight.text}
                    </p>
                </div>
            ))}
        </div>
    );
};
