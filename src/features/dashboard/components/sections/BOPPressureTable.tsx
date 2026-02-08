import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
            <div className="spa-card bg-slate-900/40 border-white/5 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger className="cursor-help border-b border-dashed border-white/20">BOP</TooltipTrigger>
                                <TooltipContent>Balance of Payments: A statement of all transactions made between entities in one country and the rest of the world.</TooltipContent>
                            </Tooltip>
                            Pressure Terminal
                        </h3>
                        <p className="text-[0.65rem] font-black tracking-widest text-blue-400 uppercase">External Sector Stability Matrix</p>
                    </div>
                    <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                        <span className="text-[0.6rem] font-black text-blue-400 uppercase tracking-tighter">Signal: Stable</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-white/5">
                            <tr className="text-[0.65rem] font-black text-muted-foreground/50 uppercase tracking-widest">
                                <th className="pb-4">Indicator</th>
                                <th className="pb-4">Value</th>
                                <th className="pb-4">Risk Status</th>
                                <th className="pb-4 hidden sm:table-cell">Regime Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium">
                            {indicators.map((item, i) => (
                                <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4">
                                        <Tooltip>
                                            <TooltipTrigger className="text-white hover:text-blue-400 transition-colors cursor-help border-b border-dashed border-white/10 decoration-blue-500/20">
                                                {item.name}
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">{item.definition}</TooltipContent>
                                        </Tooltip>
                                    </td>
                                    <td className="py-4">
                                        <span className="text-white font-mono font-bold">{item.value}</span>
                                    </td>
                                    <td className="py-4">
                                        <span className={cn(
                                            "text-[0.6rem] font-black uppercase px-2 py-0.5 rounded",
                                            item.status === 'Safe' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                        )}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="py-4 hidden sm:table-cell">
                                        <span className="text-muted-foreground/50 text-[0.7rem] uppercase font-black">{item.trend}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </TooltipProvider>
    );
};
