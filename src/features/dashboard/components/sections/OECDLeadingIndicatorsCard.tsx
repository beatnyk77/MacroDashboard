import React from 'react';
import { Box, Typography, Paper, Tooltip, Stack, Chip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ReferenceLine } from 'recharts';
import { DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, DEFAULT_TOOLTIP_STYLE, DEFAULT_XAXIS_PROPS, CHART_COLORS, alpha, WHITE_ALPHA } from '@/constants/chartDefaults';
import { useOECDLeadingIndicators } from '@/hooks/useOECDLeadingIndicators';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Info } from 'lucide-react';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

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
        return <Paper sx={{ p: 3, height: 320, bgcolor: WHITE_ALPHA.ghost, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">Loading Leading Indicators...</Typography>
        </Paper>;
    }

    return (
        <Paper sx={{
            p: 3,
            height: '100%',
            bgcolor: WHITE_ALPHA.ghost,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
        }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                <Box>
                    <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.disabled', letterSpacing: '0.1em' }}>
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
                <MacroChartContainer height="fill">
                    <LineChart data={history as any[]}>
                        <CartesianGrid {...DEFAULT_CARTESIAN_GRID_PROPS} vertical={false} />
                        <XAxis
                            {...DEFAULT_XAXIS_PROPS}
                            dataKey="date"
                            axisLine={false}
                            tick={{ fill: WHITE_ALPHA.dim, fontSize: 11 }}
                            tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short' })}
                        />
                        <YAxis
                            hide
                            domain={['auto', 'auto']}
                        />
                        <RechartsTooltip
                            contentStyle={DEFAULT_TOOLTIP_STYLE}
                            labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
                            itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
                        />
                        <ReferenceLine y={100} stroke={WHITE_ALPHA.soft} strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="US" stroke={CHART_COLORS.west} strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="EA" stroke={CHART_COLORS.orange} strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="CN" stroke={CHART_COLORS.stress} strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="IN" stroke={CHART_COLORS.expansion} strokeWidth={2} dot={false} />
                    </LineChart>
                </MacroChartContainer>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                {latestRegions?.map(r => (
                    <Chip
                        key={r.id}
                        label={`${r.name}: ${r.value.toFixed(1)}`}
                        size="small"
                        icon={r.trend === 'expansion' ? <TrendingUp size={12} /> : undefined}
                        sx={{
                            bgcolor: r.trend === 'expansion' ? alpha(CHART_COLORS.expansion, 0.1) : r.trend === 'contraction' ? alpha(CHART_COLORS.stress, 0.1) : WHITE_ALPHA.faint,
                            color: r.trend === 'expansion' ? CHART_COLORS.expansion : r.trend === 'contraction' ? CHART_COLORS.stress : 'text.secondary',
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
