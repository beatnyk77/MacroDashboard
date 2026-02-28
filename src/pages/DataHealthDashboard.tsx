import React from 'react';
import { Box, Typography, Grid, Paper, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, IconButton, CircularProgress, Tooltip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CheckCircle, AlertCircle, Clock, Activity, RefreshCcw } from 'lucide-react';

export const DataHealthDashboard: React.FC = () => {
    const { data: staleness, isLoading: stalenessLoading } = useQuery({
        queryKey: ['data-staleness'],
        queryFn: async () => {
            const { data, error } = await supabase.from('vw_data_staleness_monitor').select('*').order('days_since_update', { ascending: false });
            if (error) throw error;
            return data;
        },
        refetchInterval: 300000 // 5 mins
    });

    const { data: ingestions, isLoading: ingestionsLoading } = useQuery({
        queryKey: ['latest-ingestions'],
        queryFn: async () => {
            const { data, error } = await supabase.from('vw_latest_ingestions').select('*').order('start_time', { ascending: false });
            if (error) throw error;
            return data;
        },
        refetchInterval: 60000 // 1 min
    });

    const [refreshing, setRefreshing] = React.useState<string | null>(null);

    const handleForceRefresh = async (functionName: string) => {
        setRefreshing(functionName);
        try {
            const { error } = await supabase.functions.invoke(functionName);
            if (error) throw error;
            // Could add toast here for success
        } catch (err) {
            console.error('Refresh failed:', err);
        } finally {
            setRefreshing(null);
        }
    };

    const overallScore = React.useMemo(() => {
        if (!staleness || staleness.length === 0) return 100;
        const freshCount = staleness.filter(r => r.status === 'FRESH').length;
        return Math.round((freshCount / staleness.length) * 100);
    }, [staleness]);

    const renderStalenessStatus = (status: string) => {
        if (status === 'FRESH') return <Chip label="Fresh" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700 }} icon={<CheckCircle size={14} color="#10b981" />} />;
        if (status === 'LAGGED') return <Chip label="Lagged" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 700 }} icon={<Clock size={14} color="#f59e0b" />} />;
        return <Chip label="Very Lagged" size="small" sx={{ bgcolor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', fontWeight: 700 }} icon={<AlertCircle size={14} color="#f43f5e" />} />;
    };

    const renderIngestionStatus = (status: string) => {
        if (status === 'success') return <Chip label="Success" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700 }} />;
        if (status === 'started') return <Chip label="Running/Stuck" size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 700 }} icon={<Activity size={12} color="#3b82f6" />} />;
        return <Chip label="Failed" size="small" sx={{ bgcolor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', fontWeight: 700 }} />;
    };

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: 4 }}>
            <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, textTransform: 'uppercase', tracking: '-0.02em', color: 'white' }}>
                        Data Health Operations
                    </Typography>
                    <Typography sx={{ color: 'text.secondary' }}>
                        System telemetry, staleness monitoring, and ingestion pipeline status.
                    </Typography>
                </Box>
                <Paper sx={{ p: 2, px: 4, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>Overall Freshness</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: overallScore > 90 ? '#10b981' : overallScore > 75 ? '#f59e0b' : '#f43f5e' }}>
                        {overallScore}%
                    </Typography>
                </Paper>
            </Box>

            <Grid container spacing={4}>
                {/* Staleness Monitor */}
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: 'white' }}>Metric Staleness Monitor</Typography>
                        {stalenessLoading && <LinearProgress sx={{ mb: 2 }} />}
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: '#0B1121', color: 'text.secondary', fontWeight: 600 }}>Metric ID</TableCell>
                                        <TableCell sx={{ bgcolor: '#0B1121', color: 'text.secondary', fontWeight: 600 }}>Frequency</TableCell>
                                        <TableCell sx={{ bgcolor: '#0B1121', color: 'text.secondary', fontWeight: 600 }}>Days Lag</TableCell>
                                        <TableCell sx={{ bgcolor: '#0B1121', color: 'text.secondary', fontWeight: 600 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {staleness?.map((row) => (
                                        <TableRow key={row.metric_id} hover>
                                            <TableCell sx={{ color: 'white', fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.metric_id}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={row.frequency_type || 'hf'}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.65rem',
                                                        borderColor: row.frequency_type === 'structural' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.1)',
                                                        color: row.frequency_type === 'structural' ? '#a78bfa' : '#94a3b8'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                                                {Math.round(row.days_since_update)} <span style={{ fontSize: '0.7em', color: '#666' }}>/ {row.expected_interval_days}</span>
                                            </TableCell>
                                            <TableCell>{renderStalenessStatus(row.status || '')}</TableCell>
                                        </TableRow>
                                    ))}
                                    {!stalenessLoading && !staleness?.length && (
                                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>No metrics found</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Pipeline Status */}
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: 'white' }}>Ingestion Pipelines</Typography>
                        {ingestionsLoading && <LinearProgress sx={{ mb: 2 }} />}
                        <TableContainer sx={{ maxHeight: 600 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: '#0B1121', color: 'text.secondary', fontWeight: 600 }}>Function</TableCell>
                                        <TableCell sx={{ bgcolor: '#0B1121', color: 'text.secondary', fontWeight: 600 }}>Rows</TableCell>
                                        <TableCell sx={{ bgcolor: '#0B1121', color: 'text.secondary', fontWeight: 600 }}>Status</TableCell>
                                        <TableCell sx={{ bgcolor: '#0B1121', color: 'text.secondary', fontWeight: 600 }}>Last Run</TableCell>
                                        <TableCell sx={{ bgcolor: '#0B1121', color: 'text.secondary', fontWeight: 600 }} align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ingestions?.map((row) => (
                                        <TableRow key={row.function_name} hover>
                                            <TableCell sx={{ color: 'white', fontWeight: 500, fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.function_name.replace('ingest-', '')}</TableCell>
                                            <TableCell sx={{ color: 'text.secondary' }}>{row.rows_inserted || 0}</TableCell>
                                            <TableCell>{renderIngestionStatus(row.status)}</TableCell>
                                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                                {new Date(row.start_time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Force Refresh Pipeline">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleForceRefresh(row.function_name)}
                                                        disabled={refreshing === row.function_name}
                                                        sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                                                    >
                                                        {refreshing === row.function_name ? <CircularProgress size={16} color="inherit" /> : <RefreshCcw size={16} />}
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!ingestionsLoading && !ingestions?.length && (
                                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>No pipeline logs found</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DataHealthDashboard;
