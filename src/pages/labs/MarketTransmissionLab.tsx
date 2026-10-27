import React from 'react';
import { MarketTransmissionModule } from '@/features/market-transmission/components/MarketTransmissionModule';
import { SEOManager } from '@/components/SEOManager';
import { TrailLink as Link } from '@/components/TrailLink';
import {
    ShieldAlert,
    BookOpen,
    CheckCircle2,
} from 'lucide-react';
import { LabPageHeader } from '@/components/LabPageHeader';

export const MarketTransmissionLab: React.FC = () => {
    return (
        <div className="page-shell space-y-8">
            <SEOManager
                title="Market Transmission & Breadth Lab — Equity Risk Premium & Sector Rotations"
                description="Real-time macro transmission monitor tracking sector rotations, market breadth, Equity Risk Premium (ERP), and macro baskets via finvizfinance."
                keywords={[
                    'market transmission',
                    'market breadth',
                    'equity risk premium',
                    'sector rotation',
                    'cyclical vs defensive spread',
                    'finvizfinance',
                    'macro intelligence'
                ]}
                isApp={true}
            />

            <LabPageHeader
                trail={[{ label: 'Home', to: '/' }, { label: 'Thematic Labs', to: '/labs/' }]}
                current="Market Transmission &amp; Breadth"
                badge="Institutional Telemetry"
                badgeIcon={<CheckCircle2 size={12} />}
                title="Market Transmission &amp; Breadth Observatory"
                thesis="Bridging macroeconomic policy and sovereign rate shifts to micro equity pricing, sector rotations, and market internals."
            />

            {/* Core Interactive Module */}
            <MarketTransmissionModule />

            {/* Institutional Framework & Methodology Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border border-border bg-card/90 space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <BookOpen size={16} className="text-primary" />
                        The Transmission Mechanism
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Macro policy operates through interest rate channels, liquidity conditions, and sovereign bond yields. However,
                        policy transmission into asset pricing is non-linear. By tracking the <strong className="text-foreground">Cyclical vs. Defensive Spread</strong>,
                        we observe whether equities are pricing an <strong className="text-foreground">Expansionary</strong> regime or a <strong className="text-foreground">Late-Cycle / Contractionary</strong> slowdown
                        ahead of lagged national account statistics.
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                        <li><strong className="text-foreground">Cyclical Basket:</strong> Technology (XLK), Consumer Discretionary (XLY), Industrials (XLI), Materials (XLB).</li>
                        <li><strong className="text-foreground">Defensive Basket:</strong> Utilities (XLU), Consumer Staples (XLP), Healthcare (XLV).</li>
                        <li><strong className="text-foreground">Decision Metric:</strong> Sustained positive spread indicates capital allocation aligned with real economic expansion.</li>
                    </ul>
                </div>

                <div className="p-5 rounded-xl border border-border bg-card/90 space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <ShieldAlert size={16} className="text-amber-400" />
                        Equity Risk Premium &amp; Rate Vulnerability
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        The <strong className="text-foreground">Equity Risk Premium (ERP)</strong> measures the expected excess yield of equities over risk-free Treasuries:
                        <code className="block my-2 p-2 bg-muted rounded font-mono text-[11px] text-primary">
                            ERP = S&amp;P 500 Forward Earnings Yield (1 / Forward P/E) − 10Y Benchmark Treasury Yield
                        </code>
                        When the ERP compresses below 100 bps, equities provide negligible margin of safety against sovereign debt auctions, yield spikes, and refinancing walls.
                        Companies with high leverage (Debt/Equity &gt; 2.0) and low liquidity (Quick Ratio &lt; 1.0) bear the brunt of duration shocks.
                    </p>
                </div>
            </div>

            {/* Related Labs & Content */}
            <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Connected Observatories &amp; Rates Telemetry
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Link
                        to="/labs/treasury-basis-trade/"
                        className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                        <div className="text-xs font-bold text-foreground">Treasury Basis Trade Lab</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Sovereign cash-futures leverage &amp; unwind risk</div>
                    </Link>
                    <Link
                        to="/labs/interbank-funding/"
                        className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                        <div className="text-xs font-bold text-foreground">Interbank Funding Lab</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">SOFR, repo collateral, and dollar plumbing</div>
                    </Link>
                    <Link
                        to="/labs/global-liquidity/"
                        className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                        <div className="text-xs font-bold text-foreground">Global Net Liquidity Lab</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Central bank balance sheets and fiat velocity</div>
                    </Link>
                </div>
            </div>
        </div>
    );
};
