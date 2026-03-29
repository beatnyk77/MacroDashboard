import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, ShieldCheck, Activity } from 'lucide-react';

export const BOPPressureTable: React.FC = () => {
    const indicators = [
        {
            name: "Current Account Deficit (CAD)",
            value: "-0.7%",
            status: "Safe",
            trend: "Improving",
            definition: "The difference between total exports and total imports of goods, services and transfers."
        },
        {
            name: "FX Reserves (Months Cover)",
            value: "11.2m",
            status: "Safe",
            trend: "Stable",
            definition: "Foreign exchange reserves held by the central bank, measured in months of import coverage."
        },
        {
            name: "Basic Balance (FDI + CAD)",
            value: "+$2.1B",
            status: "Safe",
            trend: "Positive",
            definition: "The sum of the Current Account and Foreign Direct Investment. A key measure of structural flows."
        },
        {
            name: "Real Effective Exchange Rate",
            value: "104.2",
            status: "Warning",
            trend: "Overvalued",
            definition: "REER: The weighted average of a country's currency relative to an index of other major currencies, adjusted for inflation."
        },
        {
            name: "External Debt (Short-term)",
            value: "18.4%",
            status: "Safe",
            trend: "Low Risk",
            definition: "The portion of total external debt that is due within one year."
        },
    ];

    return (
        <TooltipProvider>
            <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent pointer-events-none" />

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6 relative z-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                            <h3 className="text-xl font-black text-white italic tracking-tight uppercase">BOP Pressure Terminal</h3>
                        </div>
                        <p className="text-[0.65rem] font-black tracking-[0.2em] text-muted-foreground/40 uppercase">External Sector Stability Matrix</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Protocol: Stable</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto relative z-10 -mx-8 px-8">
                    <table className="w-full text-left min-w-[600px]">
                        <thead>
                            <tr className="text-[0.55rem] font-black text-muted-foreground/30 uppercase tracking-[0.25em] border-b border-white/5">
                                <th className="pb-4 font-black">Stability Indicator</th>
                                <th className="pb-4 font-black">Live Value</th>
                                <th className="pb-4 font-black">Risk Analysis</th>
                                <th className="pb-4 hidden sm:table-cell font-black">Regime Delta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {indicators.map((item, i) => (
                                <tr key={i} className="group/row hover:bg-white/[0.02] transition-colors">
                                    <td className="py-5 pr-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-white/80 uppercase tracking-tight group-hover/row:text-blue-400 transition-colors">
                                                {item.name}
                                            </span>
                                            <Tooltip>
                                                <TooltipTrigger className="cursor-help opacity-20 hover:opacity-100 transition-opacity">
                                                    <Info className="w-3 h-3 text-white" />
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-slate-950 border-white/10 p-3 text-[0.65rem] max-w-[200px] leading-relaxed">
                                                    {item.definition}
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </td>
                                    <td className="py-5 font-mono">
                                        <span className="text-sm font-black text-white/90 tracking-tighter">{item.value}</span>
                                    </td>
                                    <td className="py-5">
                                        <div className={cn(
                                            "inline-flex items-center px-2.5 py-0.5 rounded-md text-[0.55rem] font-black uppercase tracking-widest border",
                                            item.status === 'Safe'
                                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                : "bg-amber-400/10 border-amber-400/20 text-amber-400"
                                        )}>
                                            {item.status}
                                        </div>
                                    </td>
                                    <td className="py-5 hidden sm:table-cell">
                                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/30">
                                            {item.trend}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
                    <span className="text-[0.55rem] font-medium text-muted-foreground/40 italic">Aggregated via Reserve Bank telemetry & Custom Flows</span>
                    <button className="text-[0.55rem] font-black text-blue-500/60 hover:text-blue-400 tracking-[0.1em] uppercase">Export Stability Data</button>
                </div>
            </div>
        </TooltipProvider>
    );
};
