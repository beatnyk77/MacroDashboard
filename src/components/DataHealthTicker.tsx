import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Activity, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export const DataHealthTicker: React.FC = () => {
    const { data: health, isLoading } = useQuery({
        queryKey: ['ingestion-health'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ingestion_logs')
                .select('*')
                .order('start_time', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            return data;
        },
        refetchInterval: 60000 // Refresh every minute
    });

    if (isLoading || !health) return null;

    const isSuccess = health.status === 'success';
    const isError = health.status === 'failed';
    const timeAgo = formatDistanceToNow(new Date(health.completed_at || health.start_time), { addSuffix: true });

    return (
        <div className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-md transition-all duration-500",
            isSuccess ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                isError ? "bg-red-500/10 border-red-500/20 text-red-400" :
                    "bg-blue-500/10 border-blue-500/20 text-blue-400"
        )}>
            <div className="relative flex items-center justify-center">
                {isSuccess ? <CheckCircle2 size={14} /> : isError ? <AlertCircle size={14} /> : <Activity size={14} className="animate-pulse" />}
                {isSuccess && (
                    <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" aria-hidden="true" />
                )}
            </div>

            <div className="flex items-center gap-2 divide-x divide-current/20">
                <span className="text-xs font-black uppercase tracking-widest leading-none">
                    System Health: {health.status}
                </span>
                <span className="pl-2 flex items-center gap-1.5 text-xs font-bold opacity-70 leading-none">
                    <Clock size={10} />
                    {health.service}: {timeAgo}
                </span>
            </div>
        </div>
    );
};
