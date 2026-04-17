import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { cn } from "@/lib/utils";

const countries = [
    { iso: 'ZA', name: 'South Africa', stress_score: 65, primary_risk: 'Energy/Logistics', outlook: 'Stable' },
    { iso: 'NG', name: 'Nigeria', stress_score: 82, primary_risk: 'Inflation/FX', outlook: 'Negative' },
    { iso: 'EG', name: 'Egypt', stress_score: 88, primary_risk: 'External Debt', outlook: 'Stable' },
    { iso: 'KE', name: 'Kenya', stress_score: 74, primary_risk: 'Refinancing', outlook: 'Stable' },
    { iso: 'AO', name: 'Angola', stress_score: 58, primary_risk: 'Oil Volatility', outlook: 'Positive' },
    { iso: 'GH', name: 'Ghana', stress_score: 91, primary_risk: 'Restructuring', outlook: 'Improving' },
    { iso: 'ET', name: 'Ethiopia', stress_score: 79, primary_risk: 'Civil Conflict/Debt', outlook: 'Stable' },
    { iso: 'MA', name: 'Morocco', stress_score: 42, primary_risk: 'Tourism/Water', outlook: 'Positive' },
    { iso: 'DZ', name: 'Algeria', stress_score: 48, primary_risk: 'Energy Reliance', outlook: 'Stable' },
    { iso: 'ZM', name: 'Zambia', stress_score: 94, primary_risk: 'Default Resolution', outlook: 'Improving' },
];

export const CountryDeepDiveGrid: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {countries.map((c, idx) => (
                <motion.div
                    key={c.iso}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer"
                    onClick={() => window.location.href = `/countries/${c.iso}`}
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40">
                            {c.iso}
                        </div>
                        <div className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                            c.stress_score > 80 ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                            c.stress_score > 60 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                            "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        )}>
                            STRESS: {c.stress_score}
                        </div>
                    </div>

                    <h3 className="text-lg font-black text-white mb-1 group-hover:text-blue-400 transition-colors">{c.name}</h3>
                    <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-6">Primary Risk: {c.primary_risk}</div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-white/30">Outlook</span>
                            <span className={cn(
                                c.outlook === 'Positive' || c.outlook === 'Improving' ? "text-emerald-500" :
                                c.outlook === 'Negative' ? "text-rose-500" : "text-amber-500"
                            )}>{c.outlook}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${c.stress_score}%` }}
                                className={cn(
                                    "h-full rounded-full",
                                    c.stress_score > 80 ? "bg-rose-500" :
                                    c.stress_score > 60 ? "bg-amber-500" :
                                    "bg-emerald-500"
                                )}
                            />
                        </div>
                    </div>

                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={14} className="text-white/20" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
