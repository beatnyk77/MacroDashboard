import React from 'react';
import { Box, IconButton } from '@mui/material';
import { X, TrendingUp, TrendingDown, Info, ShieldCheck } from 'lucide-react';
import { TreasuryHolder } from '@/hooks/useTreasuryHolders';
import { cn } from '@/lib/utils';
import { AreaChart, Area, Tooltip } from 'recharts';
import { DEFAULT_TOOLTIP_STYLE, DEFAULT_TOOLTIP_ITEM_STYLE, DEFAULT_TOOLTIP_LABEL_STYLE, CHART_COLORS } from '@/constants/chartDefaults';
import { MacroChartContainer } from '@/components/charts/MacroChartContainer';

interface TICStatsDrawerProps {
    country: TreasuryHolder | null;
    allData: TreasuryHolder[];
    onClose: () => void;
}

export const TICStatsDrawer: React.FC<TICStatsDrawerProps> = ({ country, allData, onClose }) => {
    if (!country) return null;

    // Filter historical data for this country
    const history = allData
        .filter(d => d.country_name === country.country_name)
        .sort((a, b) => new Date(a.as_of_date).getTime() - new Date(b.as_of_date).getTime());

    const isRising = (country.yoy_pct_change || 0) > 0;

    return (
        <Box className="absolute bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-3xl border-t border-border p-8 transform transition-transform duration-500 ease-out animate-in slide-in-from-bottom-full shadow-2xl">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 relative">
                <IconButton
                    onClick={onClose}
                    className="absolute -top-4 -right-4 bg-muted hover:bg-muted/80 text-foreground"
                    aria-label="Close statistics drawer"
                >
                    <X size={20} aria-hidden="true" />
                </IconButton>

                {/* Country Profile */}
                <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <ShieldCheck className=" text-cyan-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-foreground uppercase tracking-heading italic">
                                {country.country_name}
                            </h3>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Sovereign Exposure Profile
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        <StatItem label="Current Holdings" value={`$${Math.round(country.holdings_usd_bn)}B`} sub="TIC Monthly Snapshot" />
                        <StatItem
                            label="YoY Change"
                            value={`${isRising ? '+' : ''}${country.yoy_pct_change?.toFixed(1)}%`}
                            color={isRising ? " text-emerald-400" : " text-rose-400"}
                            icon={isRising ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        />
                        <StatItem label="Global Share" value={`${country.pct_of_total_foreign?.toFixed(2)}%`} sub="Of total foreign ownership" />
                        <StatItem label="Risk Tier" value="STRUCTURAL" sub="Long-term accumulation" />
                    </div>

                    <div className="p-6 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center gap-2 mb-3">
                            <Info size={14} className=" text-cyan-400" />
                            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Macro Context</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                            {country.country_name} remains a {country.pct_of_total_foreign && country.pct_of_total_foreign > 2 ? 'major' : 'significant'} pillar of UST liquidity.
                            Recent trends show a {isRising ? 'steady accumulation' : 'structural reduction'} in nominal holdings,
                            consistent with broader {(country.yoy_pct_change || 0) < -5 ? 'aggressive de-dollarization' : 'regime-shifting'} narratives.
                        </p>
                    </div>
                </div>

                {/* Historical Sparkline */}
                <div className="flex-1 min-h-[250px] bg-card rounded-xl border border-border overflow-hidden p-6 relative">
                    <div className="absolute top-6 left-6 z-10">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">UST Accumulation Path</span>
                        <span className="text-xs font-semibold text-foreground tracking-wider uppercase">Historical Trend (LTM+)</span>
                    </div>
                    <MacroChartContainer height="fill">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorHoldings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.westDeep} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={CHART_COLORS.westDeep} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="holdings_usd_bn"
                                stroke={CHART_COLORS.westDeep}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorHoldings)"
                            />
                            <Tooltip
                                labelStyle={DEFAULT_TOOLTIP_LABEL_STYLE}
                                itemStyle={DEFAULT_TOOLTIP_ITEM_STYLE}
                                contentStyle={DEFAULT_TOOLTIP_STYLE}
                            />
                        </AreaChart>
                    </MacroChartContainer>
                </div>
            </div>
        </Box>
    );
};

const StatItem = ({ label, value, sub, color = "text-foreground", icon }: any) => (
    <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-none">{label}</span>
        <div className="flex items-center gap-2">
            <span className={cn("text-xl font-bold tabular-nums", color)}>{value}</span>
            {icon}
        </div>
        {sub && <span className="text-xs font-semibold text-muted-foreground uppercase tracking-heading">{sub}</span>}
    </div>
);
