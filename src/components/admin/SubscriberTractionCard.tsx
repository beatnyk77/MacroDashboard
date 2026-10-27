import React from 'react';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CHART_COLORS, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';

const CARD_BG = alpha(CHART_COLORS.panel, 0.8);
const GLASS_BORDER = `1px solid ${WHITE_ALPHA.line}`;
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
    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin', 'subscriber_stats'],
        queryFn: async (): Promise<SubscriberStats | null> => {
            const { data, error } = await supabase.rpc('get_subscriber_stats');
            // RPC is service_role-only (2026-07-19); client anon cannot call it.
            if (error) {
                console.warn('[SubscriberTractionCard] RPC unavailable:', error.message);
                return null;
            }
            return data as unknown as SubscriberStats; // TODO(types): RPC returns Json — shape validated at runtime
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
                <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: WHITE_ALPHA.mid }}>
                    Confirmed Subscribers
                </Typography>
                <Chip
                    label="north-star metric"
                    size="small"
                    sx={{ bgcolor: alpha(CHART_COLORS.expansion, 0.12), color: CHART_COLORS.expansion, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                />
            </Box>

            {isLoading ? (
                <CircularProgress size={28} sx={{ my: 3 }} />
            ) : !data || isError ? (
                <Typography sx={{ color: WHITE_ALPHA.dim, fontSize: 12, lineHeight: 1.5 }}>
                    Subscriber stats require a service-role path (RPC revoked from public anon). Query Supabase SQL or rewire via an authenticated edge proxy.
                </Typography>
            ) : (
                <>
                    <Typography sx={{ fontSize: 46, fontWeight: 700, fontFamily: 'Fira Code, monospace', lineHeight: 1, color: '#fff' }}>
                        {confirmed}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 3, my: 2 }}>
                        <Delta label="7-day" value={`+${data?.confirmed_7d ?? 0}`} />
                        <Delta label="30-day" value={`+${data?.confirmed_30d ?? 0}`} />
                        <Delta label="pending opt-in" value={`+${data?.pending_total ?? 0}`} color={CHART_COLORS.gold} />
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
                                    background: `linear-gradient(180deg,${CHART_COLORS.westSoft},${CHART_COLORS.westDeep})`,
                                    opacity: 0.85,
                                }}
                            />
                        ))}
                    </Box>

                    {/* Progress toward threshold */}
                    <Box sx={{ mt: 2.25, pt: 2, borderTop: `1px solid ${WHITE_ALPHA.ghost}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Fira Code, monospace', fontSize: 11, color: WHITE_ALPHA.mid }}>
                            <span>90-day threshold</span>
                            <span>{confirmed} / {THRESHOLD}</span>
                        </Box>
                        <Box sx={{ height: 8, borderRadius: 999, bgcolor: WHITE_ALPHA.ghost, overflow: 'hidden', mt: 1 }}>
                            <Box sx={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${CHART_COLORS.westDeep},${CHART_COLORS.westSoft})` }} />
                        </Box>
                    </Box>

                    {data?.recent_sources && data.recent_sources.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {data.recent_sources.map((s) => (
                                <Chip
                                    key={s.source}
                                    label={`${s.source} · ${s.count}`}
                                    size="small"
                                    sx={{ bgcolor: WHITE_ALPHA.ghost, color: WHITE_ALPHA.mid, fontSize: '0.6875rem', fontFamily: 'Fira Code, monospace' }}
                                />
                            ))}
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

const Delta: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = CHART_COLORS.expansion }) => (
    <Box>
        <Typography sx={{ display: 'block', color: WHITE_ALPHA.mid, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, mb: 0.5 }}>
            {label}
        </Typography>
        <Typography sx={{ fontSize: 14, fontFamily: 'Fira Code, monospace', color }}>{value}</Typography>
    </Box>
);

export default SubscriberTractionCard;
