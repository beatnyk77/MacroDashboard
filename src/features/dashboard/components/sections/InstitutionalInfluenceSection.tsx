import React, { useState } from 'react';
import { Box, Paper, Typography, Grid, Stack, ToggleButtonGroup, ToggleButton, Skeleton, Alert } from '@mui/material';
import { SectionHeader } from '@/components/SectionHeader';
import { useInstitutionalLoans } from '@/hooks/useInstitutionalLoans';
import { Shield, Globe, AlertTriangle } from 'lucide-react';

export const InstitutionalInfluenceSection = () => {
    console.log("InstitutionalInfluenceSection: Render start");
    const [loanType, setLoanType] = useState<'Stock' | 'Flow'>('Stock');
    const { data: loanData, isLoading, error } = useInstitutionalLoans(loanType);

    const handleTypeChange = (
        _event: React.MouseEvent<HTMLElement>,
        newType: 'Stock' | 'Flow' | null,
    ) => {
        if (newType !== null) {
            setLoanType(newType);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ mb: 6 }}>
                <SectionHeader
                    title="Institutional Money Wars"
                    subtitle="Analyzing global institutional lending flows..."
                />
                <Grid container spacing={3} mt={2}>
                    <Grid item xs={12} lg={8}>
                        <Grid container spacing={2}>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Grid item key={i} xs={12} md={6}>
                                    <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                    <Grid item xs={12} lg={4}>
                        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
                    </Grid>
                </Grid>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ mb: 6 }}>
                <SectionHeader
                    title="Institutional Money Wars"
                    subtitle="Data Stream Interrupted"
                />
                <Alert severity="error" sx={{ mt: 2 }} icon={<AlertTriangle />}>
                    Failed to load institutional lending data. Please try refreshing the page.
                    {process.env.NODE_ENV === 'development' && <pre>{JSON.stringify(error, null, 2)}</pre>}
                </Alert>
            </Box>
        );
    }

    // Calculate aggregated stats by region for the Heatmap Grid
    const regionalDominance = loanData?.reduce((acc: any, curr) => {
        if (!acc[curr.recipient_region]) {
            acc[curr.recipient_region] = {
                region: curr.recipient_region,
                west: 0,
                east: 0,
                japan: 0,
                total: 0,
                incomes: {}
            };
        }
        acc[curr.recipient_region].west += Number(curr.west_total || 0);
        acc[curr.recipient_region].east += Number(curr.east_total || 0);
        acc[curr.recipient_region].japan += Number(curr.japan_total || 0);
        acc[curr.recipient_region].total += Number(curr.total_volume || 0);
        acc[curr.recipient_region].incomes[curr.recipient_income_bracket] = {
            west: curr.west_total,
            east: curr.east_total,
            japan: curr.japan_total
        };
        return acc;
    }, {}) || {};

    const regionalList = Object.values(regionalDominance);

    const formatCurrency = (val: number) => {
        if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
        if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
        return `$${(val / 1e6).toFixed(0)}M`;
    };

    const COLORS = {
        WEST: '#3b82f6',
        EAST: '#ef4444',
        JAPAN: '#ffffff'
    };

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader
                title="Institutional Money Wars"
                subtitle="Mapping the global Sphere of Influence: Western MDBs vs. Eastern Finance vs. Japan (JICA)"
            />
            <Typography variant="body2" sx={{ color: 'red', display: 'none' }} id="debug-marker-institutional">
                DEBUG: COMPONENT RENDERED
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <ToggleButtonGroup
                    value={loanType}
                    exclusive
                    onChange={handleTypeChange}
                    size="small"
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        '& .MuiToggleButton-root': {
                            px: 2,
                            py: 0.5,
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            color: 'text.disabled',
                            borderColor: 'transparent',
                            '&.Mui-selected': {
                                bgcolor: 'white',
                                color: 'black',
                                '&:hover': { bgcolor: '#eee' }
                            }
                        }
                    }}
                >
                    <ToggleButton value="Stock">TOTAL COMMITMENT (STOCK)</ToggleButton>
                    <ToggleButton value="Flow">ANNUAL VELOCITY (FLOW)</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Grid container spacing={3}>
                {/* 1. Regional Dominance Heatmap Grid */}
                <Grid item xs={12} lg={8}>
                    {regionalList.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2, width: '100%' }}>
                            <Typography variant="body2" color="text.secondary">No lending data available for this view.</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                            {regionalList.map((reg: any) => {
                                const westPct = reg.total > 0 ? (reg.west / reg.total) * 100 : 0;
                                const eastPct = reg.total > 0 ? (reg.east / reg.total) * 100 : 0;
                                const japanPct = reg.total > 0 ? (reg.japan / reg.total) * 100 : 0;

                                const status = getStatus(reg.west, reg.east, reg.japan);
                                const statusColor = status === 'EAST_DOMINANT' ? COLORS.EAST : (status === 'WEST_DOMINANT' ? COLORS.WEST : (status === 'JAPAN_DOMINANT' ? COLORS.JAPAN : '#f59e0b'));

                                return (
                                    <Grid item xs={12} md={6} key={reg.region}>
                                        <Paper sx={{
                                            p: 2.5,
                                            bgcolor: 'rgba(255,255,255,0.01)',
                                            backgroundImage: 'none',
                                            border: '1px solid',
                                            borderColor: 'rgba(255,255,255,0.05)',
                                            borderRadius: 2,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            '&:hover': {
                                                borderColor: `${statusColor}40`,
                                                bgcolor: 'rgba(255,255,255,0.02)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 8px 24px -12px ${statusColor}40`
                                            }
                                        }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Globe size={14} color={statusColor} />
                                                    <Typography variant="overline" sx={{ fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                                                        {reg.region.replace('_', ' ')}
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="caption" sx={{
                                                    px: 1,
                                                    py: 0.2,
                                                    borderRadius: 0.5,
                                                    bgcolor: `${statusColor}15`,
                                                    color: statusColor,
                                                    fontWeight: 900,
                                                    fontSize: '0.55rem',
                                                    border: `1px solid ${statusColor}30`
                                                }}>
                                                    {status.replace('_', ' ')}
                                                </Typography>
                                            </Stack>

                                            <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'monospace', mb: 1.5, color: '#fff' }}>
                                                {formatCurrency(reg.total)}
                                            </Typography>

                                            <Stack direction="row" spacing={0.5} sx={{ height: 4, borderRadius: 1, overflow: 'hidden', mb: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
                                                <Box sx={{ width: `${westPct}%`, bgcolor: COLORS.WEST }} />
                                                <Box sx={{ width: `${eastPct}%`, bgcolor: COLORS.EAST }} />
                                                <Box sx={{ width: `${japanPct}%`, bgcolor: COLORS.JAPAN }} />
                                            </Stack>

                                            <Grid container spacing={1}>
                                                <Grid item xs={4}>
                                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, display: 'block', fontSize: '0.6rem' }}>WEST</Typography>
                                                    <Typography variant="caption" sx={{ color: COLORS.WEST, fontWeight: 900 }}>{westPct.toFixed(0)}%</Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, display: 'block', fontSize: '0.6rem' }}>EAST</Typography>
                                                    <Typography variant="caption" sx={{ color: COLORS.EAST, fontWeight: 900 }}>{eastPct.toFixed(0)}%</Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, display: 'block', fontSize: '0.6rem' }}>JAPAN</Typography>
                                                    <Typography variant="caption" sx={{ color: COLORS.JAPAN, fontWeight: 900 }}>{japanPct.toFixed(0)}%</Typography>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Grid>

                {/* 2. Income Bracket Ribbon & Intelligence Card */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{
                        p: 3,
                        bgcolor: 'rgba(255,255,255,0.01)',
                        backgroundImage: 'none',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary', mb: 3, display: 'block', letterSpacing: '0.15em' }}>
                            FRONTIER MARKET CAPTURE
                        </Typography>

                        <Stack spacing={3.5}>
                            {['Low', 'Lower_Middle', 'Upper_Middle'].map((bracket) => {
                                const bracketData = loanData?.filter(d => d.recipient_income_bracket === bracket) || [];
                                const west = bracketData.reduce((sum, d) => sum + Number(d.west_total), 0);
                                const east = bracketData.reduce((sum, d) => sum + Number(d.east_total), 0);
                                const japan = bracketData.reduce((sum, d) => sum + Number(d.japan_total), 0);
                                const total = west + east + japan;

                                const westW = total > 0 ? (west / total) * 100 : 0;
                                const eastW = total > 0 ? (east / total) * 100 : 0;
                                const japanW = total > 0 ? (japan / total) * 100 : 0;

                                return (
                                    <Box key={bracket}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.65rem' }}>
                                                {bracket.replace('_', ' ')}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.primary', fontSize: '0.55rem' }}>
                                                {formatCurrency(total)}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={0.25} sx={{ height: 4, borderRadius: 1, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.03)' }}>
                                            <Box sx={{ width: `${westW}%`, bgcolor: COLORS.WEST }} />
                                            <Box sx={{ width: `${eastW}%`, bgcolor: COLORS.EAST }} />
                                            <Box sx={{ width: `${japanW}%`, bgcolor: COLORS.JAPAN }} />
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>

                        <Box sx={{ mt: 'auto', p: 2, borderRadius: 1.5, bgcolor: 'rgba(59, 130, 246, 0.03)', border: '1px dashed rgba(59, 130, 246, 0.15)' }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Shield size={14} color={COLORS.WEST} />
                                <Typography variant="caption" sx={{ color: COLORS.WEST, fontWeight: 900, fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                                    DOMINANCE STATUS: MULTIPOLAR
                                </Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.disabled', fontSize: '0.6rem', fontWeight: 600, fontStyle: 'italic' }}>
                                Data suggests a transition from a binary West/East split to a multipolar institutional environment where Japan (JICA) operates as a critical independent balance force in Southeast Asia.
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

const getStatus = (west: number, east: number, japan: number) => {
    const total = west + east + japan;
    if (total === 0) return 'NEUTRAL';
    const wp = west / total;
    const ep = east / total;
    const jp = japan / total;

    if (wp > 0.5) return 'WEST_DOMINANT';
    if (ep > 0.5) return 'EAST_DOMINANT';
    if (jp > 0.5) return 'JAPAN_DOMINANT';
    return 'CONTESTED';
}
