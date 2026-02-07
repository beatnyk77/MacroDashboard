import React, { useState } from 'react';
import { Box, Paper, Typography, Grid, Stack, LinearProgress, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { SectionHeader } from '@/components/SectionHeader';
import { useInstitutionalLoans } from '@/hooks/useInstitutionalLoans';
import { Shield, Globe } from 'lucide-react';

export const InstitutionalInfluenceSection: React.FC = () => {
    const [loanType, setLoanType] = useState<'Stock' | 'Flow'>('Stock');
    const { data: loanData } = useInstitutionalLoans(loanType);

    const handleTypeChange = (
        _event: React.MouseEvent<HTMLElement>,
        newType: 'Stock' | 'Flow' | null,
    ) => {
        if (newType !== null) {
            setLoanType(newType);
        }
    };

    // Calculate aggregated stats by region for the Heatmap Grid
    const regionalDominance = loanData?.reduce((acc: any, curr) => {
        if (!acc[curr.recipient_region]) {
            acc[curr.recipient_region] = {
                region: curr.recipient_region,
                west: 0,
                east: 0,
                total: 0,
                incomes: {}
            };
        }
        acc[curr.recipient_region].west += curr.west_total;
        acc[curr.recipient_region].east += curr.east_total;
        acc[curr.recipient_region].total += curr.total_volume;
        acc[curr.recipient_region].incomes[curr.recipient_income_bracket] = curr.east_dominance_pct;
        return acc;
    }, {}) || {};

    const regionalList = Object.values(regionalDominance);

    const formatCurrency = (val: number) => {
        if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
        if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
        return `$${(val / 1e6).toFixed(0)}M`;
    };

    return (
        <Box sx={{ mb: 6 }}>
            <SectionHeader
                title="Institutional Money Wars"
                subtitle="Mapping the global Sphere of Influence: Western MDBs vs. Eastern Finance"
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <ToggleButtonGroup
                    value={loanType}
                    exclusive
                    onChange={handleTypeChange}
                    size="small"
                    sx={{
                        bgcolor: 'background.paper',
                        '& .MuiToggleButton-root': {
                            px: 2,
                            py: 0.5,
                            fontSize: '0.7rem',
                            fontWeight: 900,
                            borderColor: 'divider',
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                '&:hover': { bgcolor: 'primary.dark' }
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
                    <Grid container spacing={2}>
                        {regionalList.map((reg: any) => {
                            const eastPct = (reg.east / reg.total) * 100;
                            const westPct = 100 - eastPct;
                            const isEastDominant = eastPct > 60;
                            const isWestDominant = westPct > 60;

                            const statusColor = isEastDominant ? '#ef4444' : (isWestDominant ? '#3b82f6' : '#f59e0b');

                            return (
                                <Grid item xs={12} md={6} key={reg.region}>
                                    <Paper sx={{
                                        p: 2,
                                        bgcolor: 'background.paper',
                                        backgroundImage: 'none',
                                        border: '1px solid',
                                        borderColor: isEastDominant || isWestDominant ? `${statusColor}40` : 'divider',
                                        borderRadius: 2,
                                        transition: 'all 0.2s',
                                        '&:hover': { borderColor: statusColor, transform: 'translateY(-2px)' }
                                    }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Globe size={14} color={statusColor} />
                                                <Typography variant="overline" sx={{ fontWeight: 900, fontSize: '0.75rem' }}>
                                                    {reg.region.replace('_', ' ')}
                                                </Typography>
                                            </Stack>
                                            <Typography variant="caption" sx={{
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 0.5,
                                                bgcolor: `${statusColor}15`,
                                                color: statusColor,
                                                fontWeight: 900,
                                                fontSize: '0.6rem'
                                            }}>
                                                {isEastDominant ? 'EAST DOMINANT' : (isWestDominant ? 'WEST DOMINANT' : 'CONTESTED')}
                                            </Typography>
                                        </Stack>

                                        <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'monospace', mb: 1 }}>
                                            {formatCurrency(reg.total)}
                                        </Typography>

                                        <Stack direction="row" spacing={0.5} sx={{ height: 6, borderRadius: 1, overflow: 'hidden', mb: 1.5 }}>
                                            <Box sx={{ width: `${westPct}%`, bgcolor: '#3b82f6' }} />
                                            <Box sx={{ width: `${eastPct}%`, bgcolor: '#ef4444' }} />
                                        </Stack>

                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                                                West: <span style={{ color: '#3b82f6', fontWeight: 900 }}>{westPct.toFixed(0)}%</span>
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                                                East: <span style={{ color: '#ef4444', fontWeight: 900 }}>{eastPct.toFixed(0)}%</span>
                                            </Typography>
                                        </Stack>
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Grid>

                {/* 2. Income Bracket Ribbon & Intelligence Card */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{
                        p: 3,
                        bgcolor: 'background.paper',
                        backgroundImage: 'none',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.secondary', mb: 3, display: 'block' }}>
                            FRONTIER MARKET CAPTURE (INCOME BRACKETS)
                        </Typography>

                        <Stack spacing={3}>
                            {['Low', 'Lower_Middle', 'Upper_Middle', 'High'].map((bracket) => {
                                const bracketData = loanData?.filter(d => d.recipient_income_bracket === bracket) || [];
                                const west = bracketData.reduce((sum, d) => sum + d.west_total, 0);
                                const east = bracketData.reduce((sum, d) => sum + d.east_total, 0);
                                const total = west + east;
                                const eastPct = total > 0 ? (east / total) * 100 : 0;

                                return (
                                    <Box key={bracket}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                                {bracket.replace('_', ' ')}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 900, color: eastPct > 50 ? '#ef4444' : '#3b82f6' }}>
                                                {eastPct > 50 ? 'EAST LED' : 'WEST LED'}
                                            </Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate"
                                            value={eastPct}
                                            sx={{
                                                height: 4,
                                                borderRadius: 1,
                                                bgcolor: '#3b82f6', // West is background
                                                '& .MuiLinearProgress-bar': { bgcolor: '#ef4444' } // East is progress
                                            }}
                                        />
                                    </Box>
                                );
                            })}
                        </Stack>

                        <Box sx={{ mt: 'auto', p: 2, borderRadius: 1.5, bgcolor: 'rgba(244, 63, 94, 0.05)', border: '1px dashed rgba(244, 63, 94, 0.2)' }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Shield size={14} color="#ef4444" />
                                <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 900, fontSize: '0.65rem' }}>
                                    INFLUENCE SHIFT ALERT
                                </Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.disabled', fontSize: '0.6rem', fontWeight: 600 }}>
                                Eastern lending velocity (Flow) in Low-Income African markets now exceeds Western institutions by 1.2x. Structural dominance is pivoting.
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
