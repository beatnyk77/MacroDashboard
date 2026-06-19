import React, { Suspense } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Activity } from 'lucide-react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { Sparkline } from '@/components/Sparkline';
import { FreshnessChip } from '@/components/FreshnessChip';
import { getStaleness } from '@/hooks/useStaleness';
import { ChartSkeleton } from '@/components/charts/ChartSkeleton';

interface GlossaryMetricPanelProps {
    metricId: string;
    label: string;
    unit?: string;
}

export const GlossaryMetricPanel: React.FC<GlossaryMetricPanelProps> = ({ metricId, label, unit = '' }) => {
    const { data: metric, isLoading } = useLatestMetric(metricId);

    if (isLoading) {
        return <ChartSkeleton height={120} />;
    }

    if (!metric) return null;

    const freshness = getStaleness(metric.lastUpdated, metric.frequency);

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 3,
                mb: 4,
                borderRadius: 2,
                border: '1px solid rgba(59,130,246,0.15)',
                bgcolor: 'rgba(59,130,246,0.03)',
            }}
        >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography
                    component="h2"
                    variant="subtitle2"
                    sx={{
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <Activity size={16} className="text-blue-400" />
                    Live Data: {label}
                </Typography>
                <FreshnessChip
                    status={freshness.state}
                    lastUpdated={metric.lastUpdated}
                    isProvisional={metric.isProvisional}
                    sourceRef={metric.sourceRef}
                    provenance={metric.provenance}
                />
            </Box>

            <Box display="flex" alignItems="flex-end" justifyContent="space-between" gap={3}>
                <Box>
                    <Typography
                        sx={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '2rem',
                            fontWeight: 700,
                            color: 'primary.main',
                            lineHeight: 1,
                        }}
                    >
                        {metric.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        {unit && (
                            <Typography component="span" sx={{ fontSize: '1rem', ml: 0.5, color: 'text.secondary' }}>
                                {unit}
                            </Typography>
                        )}
                    </Typography>
                    {metric.sourceRef && (
                        <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                            Source: {metric.sourceRef}
                        </Typography>
                    )}
                </Box>
                {metric.history.length > 1 && (
                    <Suspense fallback={<ChartSkeleton height={48} className="min-w-[120px]" />}>
                        <Sparkline data={metric.history} color="#3b82f6" height={48} />
                    </Suspense>
                )}
            </Box>
        </Paper>
    );
};