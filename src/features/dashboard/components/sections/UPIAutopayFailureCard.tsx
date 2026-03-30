import React from 'react';
import { Card } from '@/components/ui/card';
import { Tooltip, Chip } from '@mui/material';
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
            <Card variant="elevated" className="h-full min-h-[160px] flex items-center justify-center bg-card">
                <p className="text-sm text-muted-foreground">Loading UPI Data...</p>
            </Card>
        );
    }

    const { failure_rate_pct, failure_rate_delta_mom, staleness_flag, as_of_date } = latestData || {};
    const history = historyData || [];

    const isRising = (failure_rate_delta_mom || 0) > 0;
    const isHighStress = (failure_rate_pct || 0) > 1.0;

    const trendColor = isRising ? '#ff5252' : '#4caf50';

    return (
        <Card
            variant="elevated"
            className="h-full relative overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl group"
        >
            <div className="p-5">
                <div className="flex justify-between items-start mb-1">
                    <div>
                        <p className="text-xs font-semibold tracking-uppercase text-muted-foreground/70">
                            UPI AUTOPAY FAILURE RATE
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5 font-medium">
                            Consumer Credit Stress Proxy
                        </p>
                    </div>
                    <Tooltip title={
                        <React.Fragment>
                            <p className="font-bold text-sm mb-1">Metrics Explained</p>
                            <p className="text-xs my-1">
                                Represents the "Business Decline" rate of UPI Autopay mandates (insufficient funds).
                            </p>
                            <p className="text-xs italic" style={{ color: '#ffb74d' }}>
                                Note: Rising failures often precede broader credit stress events.
                            </p>
                            <p className="text-xs mt-1">
                                Source: NPCI (Monthly)
                            </p>
                        </React.Fragment>
                    } arrow placement="top">
                        <InfoOutlinedIcon className="text-muted-foreground/50 text-base cursor-help" />
                    </Tooltip>
                </div>

                <div className="flex items-baseline mt-1.5">
                    <h3 className={`text-xl font-bold mr-1.5 ${isRising ? 'text-error' : 'text-foreground'}`}>
                        {failure_rate_pct !== undefined && failure_rate_pct !== null ? `${failure_rate_pct.toFixed(2)}%` : 'N/A'}
                    </h3>
                    {failure_rate_delta_mom !== null && (
                        <Chip
                            icon={isRising ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={`${isRising ? '+' : ''}${(failure_rate_delta_mom !== undefined && failure_rate_delta_mom !== null) ? failure_rate_delta_mom.toFixed(2) : '-'}% MoM`}
                            size="small"
                        />
                    )}
                </div>

                {isHighStress && (
                    <div className="mt-1">
                        <Chip
                            label="STRESS SIGNAL: ELEVATED"
                            size="small"
                            color="error"
                            variant="outlined"
                            className="rounded font-bold"
                        />
                    </div>
                )}

                <div className="h-[60px] mt-2 -ml-2 -mr-2 -mb-1.5">
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
                </div>

                <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground/50 opacity-80">
                        History: 12m trend
                    </p>
                    <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground/50 opacity-80">
                            Updated: {as_of_date}
                        </p>
                        <span className={`w-1.5 h-1.5 rounded-full ${staleness_flag === 'fresh' ? 'bg-primary' : 'bg-muted-foreground/30'}`} style={{ opacity: staleness_flag === 'fresh' ? 0.8 : 0.3 }} />
                    </div>
                </div>
            </div>
        </Card>
    );
};
