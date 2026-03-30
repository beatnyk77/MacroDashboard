import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface MetricInfo {
    category: string;
    metric: string;
    metricId: string;
    source: string;
    frequency: string;
    tier: 'Core' | 'Secondary';
}

const metrics: MetricInfo[] = [
    // Liquidity & Rates
    { category: 'Rates', metric: 'SOFR (Secured Overnight Financing Rate)', metricId: 'SOFR_RATE', source: 'FRED', frequency: 'Daily', tier: 'Core' },
    { category: 'Rates', metric: 'Fed Funds Rate', metricId: 'FED_FUNDS_RATE', source: 'FRED', frequency: 'Daily', tier: 'Core' },
    { category: 'Liquidity', metric: 'US M2 Money Supply', metricId: 'US_M2', source: 'FRED (M2SL)', frequency: 'Weekly', tier: 'Core' },
    { category: 'Liquidity', metric: 'Net Liquidity Composite', metricId: 'NET_LIQUIDITY', source: 'Fed Assets - (TGA + RRP*1000)', frequency: 'Daily', tier: 'Core' },

    // Market Pulse
    { category: 'Macro Regime', metric: 'Gold Price (USD/oz)', metricId: 'GOLD_PRICE_USD', source: 'Yahoo Finance (GC=F)', frequency: 'Daily', tier: 'Core' },
    { category: 'Macro Regime', metric: 'WTI Crude Oil', metricId: 'WTI_CRUDE_PRICE', source: 'Yahoo Finance (CL=F)', frequency: 'Daily', tier: 'Core' },
    { category: 'Macro Regime', metric: 'VIX Volatility Index', metricId: 'VIX_INDEX', source: 'Yahoo Finance (^VIX)', frequency: 'Daily', tier: 'Core' },
    { category: 'Macro Regime', metric: 'US Dollar Index (DXY)', metricId: 'DXY_INDEX', source: 'Yahoo Finance (DX-Y.NYB)', frequency: 'Daily', tier: 'Core' },

    // Ratios
    { category: 'Valuation', metric: 'M2 / Gold Ratio', metricId: 'M2/Gold', source: 'Computed', frequency: 'Daily', tier: 'Core' },
    { category: 'Valuation', metric: 'SPX / Gold Ratio', metricId: 'SPX/Gold', source: 'Computed', frequency: 'Daily', tier: 'Secondary' },
    { category: 'Valuation', metric: 'Debt / Gold Ratio', metricId: 'DEBT/Gold', source: 'Computed', frequency: 'Daily', tier: 'Core' },
    { category: 'Valuation', metric: 'Gold / Silver Ratio', metricId: 'Gold/Silver', source: 'Computed', frequency: 'Daily', tier: 'Core' },

    // Treasury & Sovereign
    { category: 'Sovereign', metric: 'US Debt Outstanding', metricId: 'UST_DEBT_TOTAL', source: 'US Treasury FiscalData', frequency: 'Daily', tier: 'Core' },
    { category: 'Sovereign', metric: 'G20 Debt/GDP', metricId: 'G20_DEBT_GDP_PCT', source: 'IMF WEO', frequency: 'Quarterly', tier: 'Core' },

    // BRICS Tracker
    { category: 'BRICS', metric: 'BRICS+ Gold Holdings', metricId: 'BRICS_GOLD_HOLDINGS_TONNES', source: 'IMF / WGC', frequency: 'Quarterly', tier: 'Core' },
    { category: 'BRICS', metric: 'BRICS+ USD Reserve Share (%)', metricId: 'BRICS_USD_RESERVE_SHARE_PCT', source: 'IMF COFER', frequency: 'Quarterly', tier: 'Core' },

    // De-Dollarization
    { category: 'De-Dollarization', metric: 'Global USD Reserve Share (%)', metricId: 'GLOBAL_USD_SHARE_PCT', source: 'IMF COFER', frequency: 'Quarterly', tier: 'Core' },
    { category: 'De-Dollarization', metric: 'Global Gold Reserve Share (%)', metricId: 'GLOBAL_GOLD_SHARE_PCT', source: 'IMF COFER', frequency: 'Quarterly', tier: 'Core' },
];

export const MetricsMethodologyPage: React.FC = () => {
    return (
        <div className="container max-w-7xl mx-auto py-12 px-4 space-y-16">
            <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-heading text-foreground">
                    Data Methodology
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
                    GraphiQuestor provides institutional-grade macro intelligence. All Z-scores and percentiles are calculated using a
                    <strong className="text-foreground"> 25-year rolling window</strong> to capture full debt and monetary cycles.
                </p>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-heading text-foreground">Calculation Formulas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { label: 'Net Liquidity', formula: '(WALCL - TGA - RRP*1000) / 1000' },
                        { label: 'M2 / Gold', formula: 'US M2 Money Stock (Billions) / Gold Spot Price' },
                        { label: 'Debt / Gold', formula: 'Total Public Debt (Billions) / Gold Spot Price' },
                        { label: 'Z-Score', formula: '(Current Value - Rolling Mean) / Rolling StdDev' }
                    ].map((item) => (
                        <div key={item.label} className="p-4 bg-muted/20 border border-border rounded-xl">
                            <span className="text-xs font-black uppercase text-muted-foreground tracking-uppercase block mb-2">{item.label}</span>
                            <p className="font-serif italic text-lg text-foreground/90">{item.formula}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-background">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/30 border-b border-border">
                            <tr>
                                <th className="py-3 px-4 font-bold text-muted-foreground">Category</th>
                                <th className="py-3 px-4 font-bold text-muted-foreground">Metric</th>
                                <th className="py-3 px-4 font-bold text-muted-foreground">Source</th>
                                <th className="py-3 px-4 font-bold text-muted-foreground">Frequency</th>
                                <th className="py-3 px-4 font-bold text-muted-foreground">Tier</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {metrics.map((row) => (
                                <tr key={row.metricId} className="hover:bg-muted/10 transition-colors">
                                    <td className="py-3 px-4 font-semibold">{row.category}</td>
                                    <td className="py-3 px-4 text-foreground">{row.metric}</td>
                                    <td className="py-3 px-4 font-mono text-xs text-primary">{row.source}</td>
                                    <td className="py-3 px-4 text-muted-foreground">{row.frequency}</td>
                                    <td className="py-3 px-4">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border",
                                            row.tier === 'Core'
                                                ? "bg-primary/10 text-primary border-primary/20"
                                                : "bg-muted text-muted-foreground border-border"
                                        )}>
                                            {row.tier}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-heading text-foreground">
                    Regime Detection
                </h2>
                <p className="text-muted-foreground max-w-3xl">
                    Our "Macro Regime" indicator is derived from a deterministic rules-based model using normalized liquidity and volatility signals:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 border-rose-500/20 bg-rose-500/[0.02]">
                        <h3 className="text-lg font-bold text-rose-500 mb-2">Tightening Risk</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Triggered when Net Liquidity Z-Score &lt; -1.5 OR SOFR Spreads widen &gt; 15bps. Indicates restrictive conditions.
                        </p>
                    </Card>
                    <Card className="p-6 border-emerald-500/20 bg-emerald-500/[0.02]">
                        <h3 className="text-lg font-bold text-emerald-500 mb-2">Liquidity Expansion</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Triggered when Net Liquidity Z-Score &gt; 1.5, indicating aggressive central bank accommodation or TGA drain.
                        </p>
                    </Card>
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-muted-foreground mb-2">Neutral / Stable</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Signals are within +/- 1.0 StdDev of the 25-year mean. Market is in a trend-following structural phase.
                        </p>
                    </Card>
                </div>
            </div>

            <div className="pt-8 border-t border-border space-y-4">
                <h2 className="text-2xl font-bold tracking-heading text-foreground">
                    Data Integrity & Sources
                </h2>
                <p className="text-muted-foreground">
                    GraphiQuestor leverages the <strong className="text-foreground">Supabase Model Context Protocol (MCP)</strong> for real-time validation and automated cron-based ingestion.
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span><strong className="text-foreground">MoSPI</strong> – Ministry of Statistics & Programme Implementation (India)</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span><strong className="text-foreground">FRED</strong> – US Federal Reserve Macro Data (St. Louis)</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span><strong className="text-foreground">US Treasury FiscalData</strong> – Real-time debt and auction monitoring</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span><strong className="text-foreground">IMF / COFER</strong> – Global reserve composition and gold accumulation</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span><strong className="text-foreground">Yahoo Finance</strong> – Real-time market data for Gold (GC=F) and SPX</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
