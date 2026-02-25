import React from 'react';
import { Fuel, ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '@mui/material';

export const CompactCommodityCard: React.FC = () => {
    return (
        <div className="p-8 rounded-2xl border border-white/5 bg-gradient-to-br from-amber-500/[0.02] to-transparent">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
                <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-3">
                        <Fuel className="text-amber-500" size={24} />
                        <h3 className="text-2xl font-black uppercase tracking-tight text-white">Sovereign Energy Security</h3>
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                        Tracking geopolitical chokepoints and physical flow dynamics. The shift towards multi-polar supply chains requires constant monitoring of critical reserve thresholds and refining capacities.
                    </p>

                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-sm text-muted-foreground">Strategic Petroleum Reserve (SPR) drawdowns vs. aggregate G20 thresholds.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-sm text-muted-foreground">Geopolitical chokepoint risks (Strait of Malacca, Hormuz) impacting physical flow.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-sm text-muted-foreground">AI base-load energy demand projections scaling against legacy grid limitations.</span>
                        </li>
                    </ul>

                    <div className="pt-4">
                        <Button
                            variant="contained"
                            href="/labs/energy-commodities"
                            endIcon={<ArrowRight size={16} />}
                            sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.2)' } }}
                        >
                            Explore Commodity Labs
                        </Button>
                    </div>
                </div>

                <div className="flex-1 w-full bg-white/[0.02] border border-white/5 rounded-2xl p-8 flex flex-col justify-center items-center text-center">
                    <ShieldAlert size={48} className="text-amber-500/20 mb-4" />
                    <h4 className="text-lg font-black text-white uppercase tracking-widest mb-2">Live Physical Flow Terminal</h4>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Full telemetry including Gold/Silver/REM import flows, supply origin matrices, and disruption hotspot mapping available in the lab.
                    </p>
                </div>
            </div>
        </div>
    );
};
