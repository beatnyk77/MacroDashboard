import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Droplet, Activity, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PetrodollarVsPetroyuanProps {
    className?: string;
}
const DEALS = [
    { country: 'Saudi Arabia', volume: '≈ $7B/yr (Partial)', currency: 'CNY', date: '2023-Present', status: 'Active' },
    { country: 'Russia', volume: '≈ $40B/yr (Majority)', currency: 'CNY', date: '2022-Present', status: 'Active' },
    { country: 'UAE', volume: 'Multiple LNG deals', currency: 'CNY/AED', date: '2023-Present', status: 'Active' },
    { country: 'Iran', volume: '100% of China exports', currency: 'CNY', date: '2020-Present', status: 'Active' },
];

const ESTIMATED_NON_USD_SHARE = 20; // 20% estimate

export const PetrodollarVsPetroyuan: React.FC<PetrodollarVsPetroyuanProps> = ({ className }) => {
    return (
        <Card className={cn("w-full bg-black/40 border-white/12 backdrop-blur-xl relative overflow-hidden", className)}>
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[120px] bg-amber-500/10 pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-[120px] bg-red-500/10 pointer-events-none" />

            <CardHeader className="relative z-10 pb-2">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <Droplet className="w-5 h-5 text-amber-500" />
                            <CardTitle className="text-xl font-medium tracking-heading text-white/90 font-mono uppercase">
                                Petrodollar vs Petroyuan
                            </CardTitle>
                        </div>
                        <CardDescription className="flex items-center gap-2 text-xs font-mono uppercase text-muted-foreground">
                            <Activity className="w-3.5 h-3.5 text-amber-500" />
                            <span>Global Oil Settlement Network Bifurcation</span>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Gauge / Share Section */}
                <div className="flex flex-col gap-6">
                    <div className="bg-black/20 border border-white/5 rounded-xl p-6">
                        <h3 className="text-sm font-mono font-semibold text-white/80 uppercase mb-4">Parallel Oil System Share</h3>
                        <div className="flex flex-col items-center justify-center">
                            <div className="text-5xl font-black text-amber-500 mb-2">{ESTIMATED_NON_USD_SHARE}%</div>
                            <div className="text-xs font-mono text-muted-foreground uppercase text-center max-w-[200px]">
                                Estimated global oil trade settled in non-USD currencies
                            </div>
                        </div>

                        {/* Custom Progress Bar Chart */}
                        <div className="mt-8 space-y-2">
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-blue-400 font-bold">USD (Petrodollar) - 80%</span>
                                <span className="text-red-400 font-bold">CNY/Local (Petroyuan+) - 20%</span>
                            </div>
                            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex">
                                <div className="h-full bg-blue-500/80" style={{ width: '80%' }} />
                                <div className="h-full bg-red-500/80" style={{ width: '20%' }} />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-xs font-mono text-muted-foreground leading-relaxed">
                        <span className="text-amber-500 font-semibold">Insight:</span> The expiration of the 1974 US-Saudi Petrodollar agreement marked a psychological shift, but structural de-dollarization in energy is led by Russia (sanctions) and China's bilateral swap lines, aiming to price commodities outside the SWIFT network.
                    </div>
                </div>

                {/* Major Deals Section */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-mono font-semibold text-white/80 uppercase">Major Non-USD Energy Agreements</h3>
                    
                    <div className="space-y-3">
                        {DEALS.map((deal, idx) => (
                            <div key={idx} className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/60">
                                        <Banknote size={14} />
                                    </div>
                                    <div>
                                        <div className="font-mono text-sm font-bold text-white/90">{deal.country} / China</div>
                                        <div className="font-mono text-[10px] text-muted-foreground uppercase">{deal.date}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-xs font-bold text-red-400">{deal.currency} Settlement</div>
                                    <div className="font-mono text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full mt-1 border border-white/5">
                                        {deal.volume}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
