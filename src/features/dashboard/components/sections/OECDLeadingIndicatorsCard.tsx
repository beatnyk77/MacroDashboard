import React from 'react';
import { Box, Typography, Paper, Tooltip, Stack, Chip } from '@mui/material';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ReferenceLine } from 'recharts';
import { useOECDLeadingIndicators } from '@/hooks/useOECDLeadingIndicators';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Info } from 'lucide-react';

export const OECDLeadingIndicatorsCard: React.FC = () => {
    const { data: latestRegions, isLoading: regionsLoading } = useOECDLeadingIndicators();

    // Fetch historical data for all 4 CLI indicators
    const { data: history, isLoading: historyLoading } = useQuery({
        queryKey: ['oecd-cli-history'],
        queryFn: async () => {
            const metrics = ['OECD_CLI_US', 'OECD_CLI_EA', 'OECD_CLI_CN', 'OECD_CLI_IN'];
            const { data } = await supabase
                .from('metric_observations')
                .select('metric_id, as_of_date, value')
                .in('metric_id', metrics)
                .order('as_of_date', { ascending: false })
                .limit(100);

            // Pivot data for Recharts: [{ date: '...', US: 100, EA: 99, ... }]
            const pivoted: any = {};
            data?.forEach(obs => {
                const date = obs.as_of_date;
                if (!pivoted[date]) pivoted[date] = { date };
                const key = obs.metric_id.replace('OECD_CLI_', '');
                pivoted[date][key] = Number(obs.value);
            });

            return Object.values(pivoted).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        },
        staleTime: 1000 * 60 * 60
    });

    const isLoading = regionsLoading || historyLoading;

    if (isLoading) {
        return <Paper sx={{ p: 3, height: 320, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">Loading Leading Indicators...</Typography>
        </Paper>;
    }

    return (
        <Paper sx={{
            p: 3,
            height: '100%',
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: '0.1em' }}>
                        Forward-Looking Growth
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                        OECD Leading Indicators
                    </Typography>
                </Box>
                <Tooltip title="OECD Composite Leading Indicators (CLI) are designed to provide early signals of turning points in business cycles. 100 is the long-term trend.">
                    <Info size={16} style={{ opacity: 0.5, cursor: 'help' }} />
                </Tooltip>
            </Stack>

            <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history as any[]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                        />
                        <YAxis
                            hide
                            domain={['auto', 'auto']}
                        />
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: '#121212', border: '1px solid #333', borderRadius: '4px' }}
                            itemStyle={{ fontSize: '11px' }}
                        />
                        <ReferenceLine y={100} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="US" stroke="#4dabf5" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="EA" stroke="#ff9800" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="CN" stroke="#f44336" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="IN" stroke="#4caf50" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                {latestRegions?.map(r => (
                    <Chip
                        key={r.id}
                        label={`${r.name}: ${r.value.toFixed(1)}`}
                        size="small"
                        icon={r.trend === 'expansion' ? <TrendingUp size={12} /> : undefined}
                        sx={{
                            bgcolor: r.trend === 'expansion' ? 'rgba(76, 175, 80, 0.1)' : r.trend === 'contraction' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255,255,255,0.05)',
                            color: r.trend === 'expansion' ? '#4caf50' : r.trend === 'contraction' ? '#f44336' : 'text.secondary',
                            border: '1px solid currentColor',
                            borderColor: 'transparent',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                        }}
                    />
                ))}
            </Stack>
        </Paper>
    );
};
