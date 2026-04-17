import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

const countries = [
    { iso: 'ZA', name: 'South Africa', debt_gdp: 72.3, china_gravity: 35.2, oil_exp: 0, inflation: 5.3 },
    { iso: 'NG', name: 'Nigeria', debt_gdp: 38.4, china_gravity: 42.1, oil_exp: 92, inflation: 31.7 },
    { iso: 'EG', name: 'Egypt', debt_gdp: 92.5, china_gravity: 28.4, oil_exp: 15, inflation: 35.8 },
    { iso: 'KE', name: 'Kenya', debt_gdp: 70.1, china_gravity: 48.6, oil_exp: 0, inflation: 6.3 },
    { iso: 'AO', name: 'Angola', debt_gdp: 65.2, china_gravity: 55.4, oil_exp: 95, inflation: 24.1 },
    { iso: 'GH', name: 'Ghana', debt_gdp: 88.1, china_gravity: 32.1, oil_exp: 30, inflation: 23.2 },
    { iso: 'ET', name: 'Ethiopia', debt_gdp: 45.3, china_gravity: 58.4, oil_exp: 0, inflation: 28.5 },
    { iso: 'MA', name: 'Morocco', debt_gdp: 69.4, china_gravity: 12.5, oil_exp: 0, inflation: 2.1 },
    { iso: 'DZ', name: 'Algeria', debt_gdp: 52.1, china_gravity: 18.4, oil_exp: 94, inflation: 9.3 },
    { iso: 'ZM', name: 'Zambia', debt_gdp: 110.4, china_gravity: 45.1, oil_exp: 0, inflation: 13.5 },
];

const metrics = [
    { key: 'debt_gdp', label: 'Debt/GDP (%)', color: 'rose' },
    { key: 'china_gravity', label: 'China Trade (%)', color: 'blue' },
    { key: 'oil_exp', label: 'Oil/Total Exp (%)', color: 'amber' },
    { key: 'inflation', label: 'Inflation (%)', color: 'rose' },
];

export const AfricaComparisonHeatmap: React.FC = () => {
    const getIntensity = (val: number, key: string) => {
        if (key === 'debt_gdp') return val > 80 ? 0.8 : val > 60 ? 0.5 : 0.2;
        if (key === 'china_gravity') return val > 50 ? 0.8 : val > 30 ? 0.5 : 0.2;
        if (key === 'oil_exp') return val > 80 ? 0.8 : val > 40 ? 0.5 : 0.2;
        if (key === 'inflation') return val > 25 ? 0.8 : val > 10 ? 0.5 : 0.2;
        return 0.5;
    };

    return (
        <div className="w-full overflow-x-auto rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-sm">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest text-white/30">Country</th>
                        {metrics.map(m => (
                            <th key={m.key} className="p-6 text-center text-[10px] font-black uppercase tracking-widest text-white/30">{m.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {countries.map((c, idx) => (
                        <tr key={c.iso} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                            <td className="p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/60">
                                        {c.iso}
                                    </div>
                                    <div className="text-sm font-black text-white">{c.name}</div>
                                </div>
                            </td>
                            {metrics.map(m => {
                                const val = (c as any)[m.key];
                                const intensity = getIntensity(val, m.key);
                                return (
                                    <td key={m.key} className="p-2">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={cn(
                                                "h-12 flex items-center justify-center rounded-xl text-xs font-mono font-black tabular-nums border",
                                                m.color === 'rose' ? `bg-rose-500/[${intensity * 0.2}] border-rose-500/[${intensity * 0.3}] text-rose-400` :
                                                m.color === 'blue' ? `bg-blue-500/[${intensity * 0.2}] border-blue-500/[${intensity * 0.3}] text-blue-400` :
                                                `bg-amber-500/[${intensity * 0.2}] border-amber-500/[${intensity * 0.3}] text-amber-400`
                                            )}
                                            style={{
                                                backgroundColor: m.color === 'rose' ? `rgba(244, 63, 94, ${intensity * 0.2})` : 
                                                                 m.color === 'blue' ? `rgba(59, 130, 246, ${intensity * 0.2})` :
                                                                 `rgba(245, 158, 11, ${intensity * 0.2})`,
                                                borderColor: m.color === 'rose' ? `rgba(244, 63, 94, ${intensity * 0.3})` : 
                                                             m.color === 'blue' ? `rgba(59, 130, 246, ${intensity * 0.3})` :
                                                             `rgba(245, 158, 11, ${intensity * 0.3})`
                                            }}
                                        >
                                            {val}%
                                        </motion.div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
