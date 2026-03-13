import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useMajorEconomies } from '@/hooks/useMajorEconomies';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, ChevronDown, ChevronUp, Globe } from 'lucide-react';

const CompactPulseMetric: React.FC<{
    label: string,
    value: number | string,
    unit: string,
    delta?: string,
    trend?: 'up' | 'down',
    status?: 'safe' | 'warning' | 'danger',
    description?: string
}> = ({ label, value, unit, delta, trend, status, description }) => (
    <div className="group/metric p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all duration-300">
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
                <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-widest">{label}</span>
                {description && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-3 h-3 text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-950 border-white/10 p-2 text-[0.6rem] max-w-[150px]">
                                {description}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            {status && (
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full shadow-[0_0_8px]",
                    status === 'safe' ? "bg-emerald-500 shadow-emerald-500/20" :
                        status === 'warning' ? "bg-amber-500 shadow-amber-500/20" :
                            "bg-rose-500 shadow-rose-500/20"
                )} />
            )}
        </div>
        <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white/90 tabular-nums tracking-tighter">{value}</span>
                <span className="text-[0.6rem] font-bold text-white/20 uppercase tracking-widest">{unit}</span>
            </div>
            {delta && (
                <div className={cn(
                    "text-[0.6rem] font-black tabular-nums tracking-tight flex items-center gap-0.5",
                    trend === 'up' ? "text-emerald-500" : "text-rose-500"
                )}>
                    {delta}
                </div>
            )}
        </div>
    </div>
);

export const ChinaMacroPulseSection: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Fetch Metrics
    const { data: gdp } = useLatestMetric('CN_GDP_GROWTH_YOY');
    const { data: cpi } = useLatestMetric('CN_CPI_YOY');
    const { data: credit } = useLatestMetric('CN_CREDIT_IMPULSE');
    const { data: ppi } = useLatestMetric('CN_PPI_YOY');
    const { data: retail } = useLatestMetric('CN_RETAIL_SALES_YOY');
    const { data: ip } = useLatestMetric('CN_IP_YOY');
    const { data: policy } = useLatestMetric('CN_POLICY_RATE');
    const { data: fai } = useLatestMetric('CN_FAI_YOY');

    const { data: majorEconomies } = useMajorEconomies();
    const chinaReserves = useMemo(() =>
        majorEconomies?.find(e => e.code === 'CN'),
        [majorEconomies]);

    return (
        <div className="space-y-16 mt-16">
            {/* Main Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                            <Globe className="text-red-500 w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                            China <span className="text-red-500">Macro Pulse</span>
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
                        High-frequency activity monitor tracking liquidity impulse, industrial velocity, and de-dollarization momentum.
                    </p>
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                >
                    <span className="text-[0.7rem] font-black uppercase tracking-widest text-white/70 group-hover:text-white">
                        {isExpanded ? 'Collapse Pulse' : 'Expand Full Engine'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-red-500" /> : <ChevronDown className="w-4 h-4 text-red-500" />}
                </button>
            </div>

            {/* Fallback Table for AI Crawlers (GEO) */}
            <div className="sr-only" aria-hidden="true">
                <table>
                    <caption>China Macro Pulse - High Frequency Indicators</caption>
                    <thead>
                        <tr>
                            <th>Indicator</th>
                            <th>Value</th>
                            <th>Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>GDP Growth (YoY)</td><td>{gdp?.value ?? '--'}</td><td>%</td></tr>
                        <tr><td>Credit Impulse</td><td>{credit?.value ?? '--'}</td><td>%</td></tr>
                        <tr><td>CPI Inflation</td><td>{cpi?.value ?? '--'}</td><td>%</td></tr>
                        <tr><td>Gold Reserves</td><td>{chinaReserves?.gold_reserves ?? '--'}</td><td>t</td></tr>
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 gap-12">
                {/* Core Activity Grid */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-[2px] w-8 bg-red-500" />
                        <h4 className="text-[0.7rem] font-black text-white/90 uppercase tracking-[0.3em]">Core Activity & Liquidity</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <CompactPulseMetric
                            label="GDP Growth (YoY)"
                            value={gdp?.value ?? '--'}
                            unit="%"
                            delta={gdp?.delta ? `${gdp.delta > 0 ? '+' : ''}${gdp.delta}%` : undefined}
                            trend={gdp?.trend === 'up' ? 'up' : 'down'}
                            status={gdp?.value && gdp.value < 4.5 ? 'warning' : 'safe'}
                            description="Annualized real GDP growth rate. Primary measure of economic output."
                        />
                        <CompactPulseMetric
                            label="Credit Impulse"
                            value={credit?.value ?? '--'}
                            unit="%"
                            delta={credit?.delta ? `${credit.delta > 0 ? '+' : ''}${credit.delta}%` : undefined}
                            trend={credit?.trend === 'up' ? 'up' : 'down'}
                            status="safe"
                            description="New credit as a percentage of GDP. Leading indicator of economic activity."
                        />
                        <CompactPulseMetric
                            label="CPI Inflation"
                            value={cpi?.value ?? '--'}
                            unit="%"
                            status={cpi?.value && cpi.value < 0 ? 'warning' : 'safe'}
                            description="Consumer Price Index: Measures deflationary/inflationary pressure."
                        />
                        <CompactPulseMetric
                            label="Gold Reserves"
                            value={chinaReserves?.gold_reserves ?? '--'}
                            unit="t"
                            status="safe"
                            description="Official PBoC gold holdings in metric tonnes."
                        />
                    </div>
                </div>

                {/* Collapsible Deep Dives */}
                <div className={cn(
                    "grid grid-cols-1 gap-12 transition-all duration-700 ease-in-out overflow-hidden",
                    isExpanded ? "max-h-[2500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}>
                    {/* Industrial & Retail */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-[2px] w-8 bg-orange-500" />
                            <h4 className="text-[0.7rem] font-black text-white/90 uppercase tracking-[0.3em]">Industrial & Consumption Velocity</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <CompactPulseMetric
                                label="Industrial Prod"
                                value={ip?.value ?? '--'}
                                unit="%"
                                status="safe"
                            />
                            <CompactPulseMetric
                                label="Retail Sales"
                                value={retail?.value ?? '--'}
                                unit="%"
                                status={retail?.value && retail.value < 3 ? 'warning' : 'safe'}
                            />
                            <CompactPulseMetric
                                label="PPI Deflation"
                                value={ppi?.value ?? '--'}
                                unit="%"
                                status={ppi?.value && ppi.value < 0 ? 'warning' : 'safe'}
                            />
                            <CompactPulseMetric
                                label="Fixed Asset Inv"
                                value={fai?.value ?? '--'}
                                unit="%"
                            />
                        </div>
                    </div>

                    {/* Monetary & Reserves */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-[2px] w-8 bg-blue-500" />
                            <h4 className="text-[0.7rem] font-black text-white/90 uppercase tracking-[0.3em]">Monetary Policy & External</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <CompactPulseMetric
                                label="PBOC Policy Rate"
                                value={policy?.value ?? '--'}
                                unit="%"
                                description="1Y Loan Prime Rate (LPR)"
                            />
                            <CompactPulseMetric
                                label="FX Reserves"
                                value={chinaReserves?.fx_reserves ? (chinaReserves.fx_reserves / 1000).toFixed(2) : '--'}
                                unit="tn"
                                description="Total Foreign Exchange Reserves in USD Trillions."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
