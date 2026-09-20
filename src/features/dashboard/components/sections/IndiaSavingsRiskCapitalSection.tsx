import React from 'react';
import { ShieldAlert, TrendingDown, ArrowRight, BarChart2, Globe2 } from 'lucide-react';

export const IndiaSavingsRiskCapitalSection: React.FC = () => {
    return (
        <section className="space-y-12">
            <div className="flex items-center gap-3 mb-8">
                <ShieldAlert className="text-rose-500" size={24} />
                <h2 className="text-xl font-black uppercase tracking-heading text-foreground">
                    The Risk Capital Bottleneck
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Physical vs Financial */}
                <div className="p-6 rounded-[2rem] bg-card border border-border">
                    <h3 className="text-sm font-black uppercase tracking-uppercase text-muted-foreground mb-6 flex items-center gap-2">
                        <BarChart2 size={14} /> Physical vs Financial Composition
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-background border border-border">
                            <div className="flex justify-between items-baseline mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gross Savings</span>
                                <span className="font-mono font-medium text-lg text-foreground">31.4% GDP</span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                                <div className="h-full bg-rose-500/80" style={{ width: '52.8%' }} title="Physical Assets (52.8%)"></div>
                                <div className="h-full bg-blue-500/80" style={{ width: '47.2%' }} title="Financial Assets (47.2%)"></div>
                            </div>
                            <div className="flex justify-between mt-3 text-xs text-muted-foreground font-medium">
                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500/80" /> Physical (52.8%)</span>
                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500/80" /> Financial (47.2%)</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="group p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-colors">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-semibold text-foreground">Real Estate & Gold Lockup</span>
                                    <span className="font-mono text-sm text-rose-500">$623B (Est.)</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">Household gold imports draining current account balance, and real estate locking up capital that could otherwise fund productive capacity.</p>
                            </div>

                            <div className="group p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-semibold text-foreground">Public Equity & Deposit Bias</span>
                                    <span className="font-mono text-sm text-blue-500">$557B (Est.)</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">Tax treatment asymmetries favoring secondary public equities over early-stage patient capital. Mutual funds (SIP run-rate: ₹23,547 Cr/mo) and deposits dominate.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Domestic LP Deficit */}
                <div className="p-6 rounded-[2rem] bg-card border border-border">
                    <h3 className="text-sm font-black uppercase tracking-uppercase text-muted-foreground mb-6 flex items-center gap-2">
                        <TrendingDown size={14} /> Domestic LP Deficit
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-background border border-border">
                                <span className="block text-xs font-bold uppercase text-muted-foreground mb-1">Venture Allocation</span>
                                <span className="block font-mono text-xl text-rose-500">&lt; 0.5%</span>
                                <span className="block text-[10px] text-muted-foreground mt-1">Domestic Institutions (LIC, EPFO)</span>
                            </div>
                            <div className="p-4 rounded-xl bg-background border border-border">
                                <span className="block text-xs font-bold uppercase text-muted-foreground mb-1">Foreign LP Reliance</span>
                                <span className="block font-mono text-xl text-amber-500">84.2%</span>
                                <span className="block text-[10px] text-muted-foreground mt-1">Of domestic risk capital</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Key Friction Metrics</h4>
                            <ul className="space-y-2">
                                {[
                                    'Regulatory caps on Pension/PF alternative assets (currently max ~1.5%)',
                                    'Liquidity horizons misaligned with 10-year venture fund cycles',
                                    'Exit velocity discount in unlisted risk securities vs public markets'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <ArrowRight size={14} className="mt-0.5 text-blue-500 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Peer Benchmarking */}
            <div className="p-6 rounded-[2rem] bg-card border border-border overflow-hidden">
                <h3 className="text-sm font-black uppercase tracking-uppercase text-muted-foreground mb-6 flex items-center gap-2">
                    <Globe2 size={14} /> Global Peer Benchmarking
                </h3>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground font-black uppercase tracking-wider border-b border-border">
                            <tr>
                                <th className="pb-3 pr-4">Country</th>
                                <th className="pb-3 px-4 font-mono">Savings % GDP</th>
                                <th className="pb-3 px-4">Financial / Physical</th>
                                <th className="pb-3 px-4 font-mono">Venture per Capita</th>
                                <th className="pb-3 pl-4 font-mono text-right">Foreign Dependency</th>
                            </tr>
                        </thead>
                        <tbody className="font-medium">
                            <tr className="border-b border-border/50 bg-rose-500/5">
                                <td className="py-4 pr-4 text-foreground flex items-center gap-2">
                                    🇮🇳 India
                                </td>
                                <td className="py-4 px-4 font-mono text-muted-foreground">31.4%</td>
                                <td className="py-4 px-4 text-muted-foreground">47% / 53%</td>
                                <td className="py-4 px-4 font-mono text-muted-foreground">$4.5</td>
                                <td className="py-4 pl-4 font-mono text-right text-rose-500">84.2%</td>
                            </tr>
                            <tr className="border-b border-border/50">
                                <td className="py-4 pr-4 text-foreground">🇺🇸 United States</td>
                                <td className="py-4 px-4 font-mono text-muted-foreground">17.8%</td>
                                <td className="py-4 px-4 text-muted-foreground">88% / 12%</td>
                                <td className="py-4 px-4 font-mono text-muted-foreground">$820.0</td>
                                <td className="py-4 pl-4 font-mono text-right text-emerald-500">14.0%</td>
                            </tr>
                            <tr className="border-b border-border/50">
                                <td className="py-4 pr-4 text-foreground">🇨🇳 China</td>
                                <td className="py-4 px-4 font-mono text-muted-foreground">45.2%</td>
                                <td className="py-4 px-4 text-muted-foreground">62% / 38%</td>
                                <td className="py-4 px-4 font-mono text-muted-foreground">$95.0</td>
                                <td className="py-4 pl-4 font-mono text-right text-emerald-500">38.0%</td>
                            </tr>
                            <tr>
                                <td className="py-4 pr-4 text-foreground">🇰🇷 South Korea</td>
                                <td className="py-4 px-4 font-mono text-muted-foreground">33.5%</td>
                                <td className="py-4 px-4 text-muted-foreground">75% / 25%</td>
                                <td className="py-4 px-4 font-mono text-muted-foreground">$142.0</td>
                                <td className="py-4 pl-4 font-mono text-right text-blue-500">22.0%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};
