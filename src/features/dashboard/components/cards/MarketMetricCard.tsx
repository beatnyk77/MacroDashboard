import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Sparkline } from '@/components/Sparkline';
import { PercentCircle, Activity } from 'lucide-react';

interface MarketMetricCardProps {
    label: string;
    value: string | number;
    subValue?: string | number;
    trend?: 'up' | 'down' | 'neutral';
    accentColor?: 'blue' | 'rose' | 'emerald' | 'gold' | 'purple';
    description?: string;
    percentile?: number;
    zScore?: number;
    history?: { date: string; value: number }[];
}

export const MarketMetricCard: React.FC<MarketMetricCardProps> = ({
    label,
    value,
    subValue,
    trend = 'neutral',
    accentColor = 'blue',
    description,
    percentile,
    zScore,
    history
}) => {
    const accentColors = {
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        gold: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -2 }}
            className={cn(
                "flex flex-col p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 h-full group relative overflow-hidden",
                accentColors[accentColor].split(' ')[2] // Use only the border part for a subtle hint
            )}
        >
            {/* Subtle Accent Glow */}
            <div className={cn("absolute -top-12 -right-12 w-24 h-24 blur-3xl opacity-10 rounded-full", accentColors[accentColor].split(' ')[1])} />
            <div className="flex justify-between items-start mb-4">
                <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                    {label}
                </span>
                {description && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-white/30 transition-colors" />
                )}
            </div>

            <div className="flex items-baseline gap-2 mb-1">
                <span className={cn(
                    "text-4xl font-bold tracking-tighter tabular-nums",
                    trend === 'up' && "text-emerald-400",
                    trend === 'down' && "text-rose-400",
                    trend === 'neutral' && "text-white"
                )}>
                    {value}
                </span>
            </div>

            {subValue && (
                <div className="text-xs font-medium text-muted-foreground/50 mb-4">
                    {subValue}
                </div>
            )}

            {/* Historical Context Stats */}
            <div className="grid grid-cols-2 gap-2 mb-6">
                {(typeof percentile === 'number') && (
                    <div className="flex flex-col p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                        <span className="text-[0.55rem] font-black text-muted-foreground/30 uppercase tracking-tighter mb-1 flex items-center gap-1">
                            <PercentCircle size={8} /> Percentile
                        </span>
                        <span className="text-xs font-bold text-white/80 tabular-nums">
                            {percentile.toFixed(0)}<span className="text-[0.6rem] font-medium text-muted-foreground/40 ml-0.5">th</span>
                        </span>
                    </div>
                )}
                {(typeof zScore === 'number') && (
                    <div className="flex flex-col p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                        <span className="text-[0.55rem] font-black text-muted-foreground/30 uppercase tracking-tighter mb-1 flex items-center gap-1">
                            <Activity size={8} /> Z-Score
                        </span>
                        <span className={cn(
                            "text-xs font-bold tabular-nums",
                            Math.abs(zScore) > 2 ? "text-amber-400" : "text-blue-400"
                        )}>
                            {zScore > 0 ? '+' : ''}{zScore.toFixed(2)}<span className="text-[0.6rem] font-medium text-muted-foreground/40 ml-0.5">σ</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Sparkline Integration */}
            {history && history.length > 0 && (
                <div className="h-12 w-full mt-auto mb-4 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Sparkline
                        data={history}
                        color={trend === 'up' ? '#10b981' : trend === 'down' ? '#f43f5e' : '#3b82f6'}
                        height={48}
                    />
                </div>
            )}

            {description && (
                <p className="text-[0.65rem] leading-relaxed text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors">
                    {description}
                </p>
            )}
        </motion.div>
    );
};
