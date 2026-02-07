import { RefreshCw, Wifi } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export const DataHealthBanner: React.FC = () => {
    const { data: healthIssues, isLoading } = useQuery({
        queryKey: ['data-health'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('metrics')
                .select('id, name, last_updated_at, expected_interval_days')
                .eq('is_active', true);

            if (error) throw error;

            const now = new Date();
            return data.filter(m => {
                if (!m.last_updated_at) return true;
                const lastUpdate = new Date(m.last_updated_at);
                const diffDays = (now.getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);
                // Allow 20% buffer on top of expected interval
                return diffDays > (m.expected_interval_days || 1) * 1.2;
            });
        },
        refetchInterval: 300000 // 5m
    });

    if (isLoading) return null;

    const isHealthy = !healthIssues || healthIssues.length === 0;

    return (
        <div className={cn(
            "w-full px-6 py-2 border-b flex items-center justify-between transition-colors duration-500",
            isHealthy
                ? "bg-emerald-500/[0.02] border-emerald-500/10"
                : "bg-amber-500/[0.04] border-amber-500/20"
        )}>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full shadow-[0_0_8px]",
                        isHealthy ? "bg-emerald-500 shadow-emerald-500/50 animate-pulse" : "bg-amber-500 shadow-amber-500/50 animate-bounce"
                    )} />
                    <span className={cn(
                        "text-[0.65rem] font-black tracking-[0.2em] uppercase",
                        isHealthy ? "text-emerald-500/70" : "text-amber-500"
                    )}>
                        {isHealthy ? "Systems Nominal" : "Stale Data Advisory"}
                    </span>
                </div>

                {!isHealthy && (
                    <div className="flex items-center gap-3 pl-4 border-l border-white/5">
                        <span className="text-[0.6rem] font-bold text-muted-foreground/60 uppercase tracking-widest">
                            Lag detected in {healthIssues.length} feeds
                        </span>
                        <div className="flex items-center gap-1">
                            {healthIssues.slice(0, 2).map((m) => (
                                <span key={m.id} className="text-[0.55rem] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground/40 font-black">
                                    {m.id}
                                </span>
                            ))}
                            {healthIssues.length > 2 && (
                                <span className="text-[0.55rem] text-muted-foreground/20 font-black">
                                    +{healthIssues.length - 2}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2">
                    <Wifi size={10} className={cn(isHealthy ? "text-emerald-500/40" : "text-amber-500/40")} />
                    <span className="text-[0.6rem] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">
                        Live Terminal Connection
                    </span>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 text-[0.6rem] font-black text-muted-foreground/40 hover:text-foreground transition-colors group"
                >
                    <RefreshCw size={10} className="group-active:animate-spin" />
                    <span className="uppercase tracking-widest">Clear Cache</span>
                </button>
            </div>
        </div>
    );
};
