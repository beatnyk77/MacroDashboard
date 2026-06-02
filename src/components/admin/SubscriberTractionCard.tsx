import React from 'react';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const CARD_BG = 'rgba(7, 15, 32, 0.8)';
const GLASS_BORDER = '1px solid rgba(255, 255, 255, 0.08)';
const THRESHOLD = 100; // 90-day traction threshold (north-star metric, plan D5)

interface SubscriberStats {
    confirmed_total: number;
    pending_total: number;
    confirmed_7d: number;
    confirmed_30d: number;
    daily: { day: string; count: number }[];
    recent_sources: { source: string; count: number }[];
}

/**
 * Subscriber Traction widget (plan decision D15).
 * Confirmed count, 7/30-day deltas, a daily sparkline, and progress toward the
 * 100-subscriber 90-day threshold. Reads aggregate counts via the
 * get_subscriber_stats RPC (raw emails stay sealed behind insert-only RLS).
 */
export const SubscriberTractionCard: React.FC = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'subscriber_stats'],
        queryFn: async (): Promise<SubscriberStats | null> => {
            const { data, error } = await supabase.rpc('get_subscriber_stats');
            if (error) throw error;
            return data as SubscriberStats;
        },
    });

    const confirmed = data?.confirmed_total ?? 0;
    const pct = Math.min(100, Math.round((confirmed / THRESHOLD) * 100));

    // Cumulative confirmed across the daily window → a rising sparkline.
    const daily = data?.daily ?? [];
    const cumulative = daily.reduce<number[]>((acc, d) => {
        acc.push((acc[acc.length - 1] ?? 0) + d.count);
        return acc;
    }, []);
    const max = Math.max(1, ...cumulative);

    return (
        <Box sx={{ p: 3, bgcolor: CARD_BG, border: GLASS_BORDER, borderRadius: '18px', maxWidth: 560 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                    Confirmed Subscribers
                </Typography>
                <Chip
                    label="north-star metric"
                    size="small"
                    sx={{ bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#34d399', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                />
            </Box>

            {isLoading ? (
                <CircularProgress size={28} sx={{ my: 3 }} />
            ) : (
                <>
                    <Typography sx={{ fontSize: 46, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1, color: '#fff' }}>
                        {confirmed}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 3, my: 2 }}>
                        <Delta label="7-day" value={`+${data?.confirmed_7d ?? 0}`} />
                        <Delta label="30-day" value={`+${data?.confirmed_30d ?? 0}`} />
                        <Delta label="pending opt-in" value={`+${data?.pending_total ?? 0}`} color="#fbbf24" />
                    </Box>

                    {/* Sparkline */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: 56, mt: 0.5 }} aria-hidden>
                        {cumulative.map((v, i) => (
                            <Box
                                key={i}
                                sx={{
                                    flex: 1,
                                    height: `${Math.max(6, (v / max) * 100)}%`,
                                    borderRadius: '3px 3px 0 0',
                                    background: 'linear-gradient(180deg,#60a5fa,#2563eb)',
                                    opacity: 0.85,
                                }}
                            />
                        ))}
                    </Box>

                    {/* Progress toward threshold */}
                    <Box sx={{ mt: 2.25, pt: 2, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                            <span>90-day threshold</span>
                            <span>{confirmed} / {THRESHOLD}</span>
                        </Box>
                        <Box sx={{ height: 8, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.04)', overflow: 'hidden', mt: 1 }}>
                            <Box sx={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#2563eb,#60a5fa)' }} />
                        </Box>
                    </Box>

                    {data?.recent_sources && data.recent_sources.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {data.recent_sources.map((s) => (
                                <Chip
                                    key={s.source}
                                    label={`${s.source} · ${s.count}`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', fontFamily: 'monospace' }}
                                />
                            ))}
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

const Delta: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = '#34d399' }) => (
    <Box>
        <Typography sx={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 800, mb: 0.5 }}>
            {label}
        </Typography>
        <Typography sx={{ fontSize: 14, fontFamily: 'monospace', color }}>{value}</Typography>
    </Box>
);

export default SubscriberTractionCard;
