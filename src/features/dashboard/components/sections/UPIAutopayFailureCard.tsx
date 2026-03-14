import React from 'react';
import { Card, CardContent, Typography, Box, Tooltip, Chip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useUPIAutopay, useUPIAutopayHistory } from '@/hooks/useUPIAutopay';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip as RechartsTooltip } from 'recharts';

export const UPIAutopayFailureCard: React.FC = () => {
    const { data: latestData, isLoading: isLatestLoading } = useUPIAutopay();
    const { data: historyData, isLoading: isHistoryLoading } = useUPIAutopayHistory();

    if (isLatestLoading || isHistoryLoading) {
        return (
            <Card sx={{ height: '100%', minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper' }}>
                <Typography variant="body2" color="text.secondary">Loading UPI Data...</Typography>
            </Card>
        );
    }

    const { failure_rate_pct, failure_rate_delta_mom, staleness_flag, as_of_date } = latestData || {};
    const history = historyData || [];
    
    const isRising = (failure_rate_delta_mom || 0) > 0;
    const isHighStress = (failure_rate_pct || 0) > 1.0; 

    // Institutional Styling
    const trendColor = isRising ? '#ff5252' : '#4caf50'; 

    return (
        <Card
            sx={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 1,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 6,
                    zIndex: 2
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

                {/* Sparkline Area with Real Data */}
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
                                dot={false}
                                fillOpacity={1}
                                fill="url(#colorFailure)"
                                isAnimationActive={true}
                            />
                            <XAxis dataKey="as_of_date" hide />
                            <YAxis domain={['auto', 'auto']} hide />
                            <RechartsTooltip 
                                contentStyle={{ 
                                    backgroundColor: '#1a1a1a', 
                                    border: '1px solid #333', 
                                    fontSize: '0.7rem',
                                    padding: '4px 8px'
                                }}
                                itemStyle={{ color: trendColor }}
                                labelStyle={{ display: 'none' }}
                                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Failure Rate']}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled', opacity: 0.8 }}>
                        History: 12m trend
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled', opacity: 0.8 }}>
                            Updated: {as_of_date}
                        </Typography>
                        <Box sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: staleness_flag === 'fresh' ? 'primary.main' : 'text.disabled',
                            opacity: staleness_flag === 'fresh' ? 0.8 : 0.3
                        }} />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};
