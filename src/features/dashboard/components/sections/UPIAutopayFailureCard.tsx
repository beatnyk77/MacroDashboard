import React from 'react';
import { Card, CardContent, Typography, Box, Tooltip, Chip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useUPIAutopay } from '@/hooks/useUPIAutopay';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

export const UPIAutopayFailureCard: React.FC = () => {
    const { data, isLoading } = useUPIAutopay();

    // Mock history for sparkline if not fetched separately (Plan didn't specify history endpoint, but we can assume static or simple trend for now or fetch if needed).
    // The migration seeded 5 months. We could fetch history, but for now let's just make the card look good with the data we have.
    // If we want the sparkline, we need history. `useUPIAutopay` only gets latest. 
    // I will add a small history fetch or just use a visual placeholder/static data if easier, 
    // BUT the user asked for "Sparkline: 12m trend".
    // I'll update the hook to fetch history or just fetch it here.
    // Let's keep it simple and just show the latest value with a sophisticated look, 
    // referencing the "Rising failures precede credit stress" note.

    // Actually, to do the sparkline properly, I should query the table `upi_autopay_metrics` directly for history.
    // I will do an inline fetch for history or expand the hook later. 
    // For this step, I'll use the latest data and a small "simulated" sparkline if real data is scant, 
    // or better, I will assume the hook *could* return history if I modified it.
    // Let's modify the hook to return history? No, let's keep the hook for the card's main data and maybe fetch history separately if needed.
    // Given the constraints and "Mocking" capability for the immediate task to look "Beautiful & Institutional",
    // I will implement a lightweight history fetch inside the component or just map the seeded data if I can.
    // I'll stick to the requested UI: "Sparkline: 12m trend".
    // I will implement a separate small useEffect to get history for the sparkline to ensure it's real.

    const [history, setHistory] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchHistory = async () => {
            const { supabase } = await import('@/lib/supabase');
            const { data: hist } = await supabase
                .from('upi_autopay_metrics')
                .select('as_of_date, failure_rate_pct')
                .order('as_of_date', { ascending: true })
                .limit(12);
            if (hist) setHistory(hist);
        };
        fetchHistory();
    }, []);

    if (isLoading) {
        return (
            <Card sx={{ height: '100%', minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper' }}>
                <Typography variant="body2" color="text.secondary">Loading UPI Data...</Typography>
            </Card>
        );
    }

    const { failure_rate_pct, failure_rate_delta_mom, staleness_flag } = data || {};
    const isRising = (failure_rate_delta_mom || 0) > 0;
    const isHighStress = (failure_rate_pct || 0) > 1.0; // Threshold for "High" in this specific metric context (Business Decline of 1%+ is significant)

    // Institutional Styling
    const trendColor = isRising ? '#ff5252' : '#4caf50'; // Red if rising (bad for failure rate)

    return (
        <Card
            onClick={() => {
                gtag('event', 'click_upi_stress', {
                    failure_rate: failure_rate_pct,
                    delta_mom: failure_rate_delta_mom
                });
            }}
            sx={{
                height: '100%',
                position: 'relative',
                overflow: 'visible',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 6
                }
            }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                            UPI AUTOPAY FAILURE RATE
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: -0.5, fontSize: '0.7rem' }}>
                            Consumer Credit Stress Proxy
                        </Typography>
                    </Box>
                    <Tooltip title={
                        <React.Fragment>
                            <Typography variant="subtitle2">Metrics Explained</Typography>
                            <Typography variant="body2" sx={{ my: 1 }}>
                                Represents the "Business Decline" rate of UPI Autopay mandates (insufficient funds).
                            </Typography>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#ffb74d' }}>
                                Note: Rising failures often precede broader credit stress events.
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                Source: NPCI (Monthly)
                            </Typography>
                        </React.Fragment>
                    } arrow placement="top">
                        <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                    </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1.5 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, mr: 1.5, color: isRising ? 'error.main' : 'text.primary' }}>
                        {failure_rate_pct !== undefined && failure_rate_pct !== null ? `${failure_rate_pct.toFixed(2)}%` : 'N/A'}
                    </Typography>
                    {failure_rate_delta_mom !== null && (
                        <Chip
                            icon={isRising ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={`${isRising ? '+' : ''}${(failure_rate_delta_mom !== undefined && failure_rate_delta_mom !== null) ? failure_rate_delta_mom.toFixed(2) : '-'}% MoM`}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.75rem',
                                bgcolor: isRising ? 'error.dark' : 'success.dark',
                                color: 'common.white',
                                '& .MuiChip-icon': { color: 'inherit', fontSize: 14 }
                            }}
                        />
                    )}
                </Box>

                {/* Badge/Signal */}
                {isHighStress && (
                    <Box sx={{ mt: 1 }}>
                        <Chip
                            label="STRESS SIGNAL: ELEVATED"
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ borderRadius: 1, fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                        />
                    </Box>
                )}

                {/* Sparkline Area */}
                <Box sx={{ height: 60, mt: 2, ml: -2, mr: -2, mb: -1.5 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorFailure" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={trendColor} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="failure_rate_pct"
                                stroke={trendColor}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorFailure)"
                            />
                            {/* Hidden YAxis to scale properly */}
                            <YAxis domain={['auto', 'auto']} hide />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        Updated: {data?.as_of_date} {staleness_flag === 'lagged' && '(Lagged)'}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};
