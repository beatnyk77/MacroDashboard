import React, { useState, useMemo } from 'react';
import { Slider } from '@mui/material';
import { Grid } from '@mui/material'; // Temporary; will replace spacing later
import { Target, TrendingUp, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { useLatestMetric } from '@/hooks/useLatestMetric';
import { useViewContext } from '@/context/ViewContext';
import { Card } from '@/components/ui/card';

// Institutional Baselines for Simulation (124Y Context)
const BASELINES = {
    RATIO_M2_GOLD: { mean: 10.69, stddev: 3.37 },
    US_M2: { current: 21200 }, // Approx B
    GOLD: { current: 2800 }     // Approx USD
};

export const ScenarioStudio: React.FC = () => {
    const { isInstitutionalView } = useViewContext();
    const { data: m2Data } = useLatestMetric('US_M2');

    // Simulation State
    const [simGold, setSimGold] = useState(3000);
    const [simM2Growth, setSimM2Growth] = useState(5); // %
    const [simReserveShift, setSimReserveShift] = useState(0); // % displacement

    // Calculations
    const currentM2 = m2Data?.value || BASELINES.US_M2.current;

    // Reserve displacement effectively reduces the 'real' backing or increases the required gold backing
    const effectiveM2 = currentM2 * (1 + simM2Growth / 100) * (1 + simReserveShift / 50);
    const simRatio = effectiveM2 / simGold;

    const zScore = (simRatio - BASELINES.RATIO_M2_GOLD.mean) / BASELINES.RATIO_M2_GOLD.stddev;

    // Normal Distribution Percentile Approximation
    const getPercentile = (z: number) => {
        const p = 0.5 * (1 + erf(z / Math.sqrt(2)));
        return p * 100;
    };
    const percentile = getPercentile(zScore);

    const regimeLabel = useMemo(() => {
        if (zScore > 3) return 'Hyper-Debasement (Post-GFC/WWII)';
        if (zScore > 2) return 'Monetary Expansion (1970s Peak)';
        if (zScore < 1) return 'Sound Money Anchor (Historical Mean)';
        return 'Standard Fiat Expansion';
    }, [zScore]);

    if (!isInstitutionalView) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-3">
                <Target color="#3b82f6" size={24} />
                <h2 className="text-2xl font-extrabold tracking-heading">
                    Scenario Studio <span className="text-xl font-normal text-muted-foreground">(Beta)</span>
                </h2>
            </div>

            <Grid container spacing={{ xs: 2, md: 3 }}> {/* spacing={3} -> gap-6? We'll keep for now */}
                <Grid item xs={12} md={7}>
                    <Card variant="elevated" className="p-8 h-full bg-card">
                        <p className="text-xs font-bold uppercase tracking-uppercase text-muted-foreground/70 mb-3">Simulation Inputs</p>

                        <div className="space-y-6 mt-3">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold">Simulated Gold Price (USD)</span>
                                    <span className="text-sm font-bold text-primary">${simGold.toLocaleString()}</span>
                                </div>
                                <Slider
                                    value={simGold}
                                    onChange={(_, v) => setSimGold(v as number)}
                                    min={2000}
                                    max={25000}
                                    step={500}
                                    marks={[
                                        { value: 2800, label: 'Current' },
                                        { value: 10000, label: '$10K' },
                                        { value: 25000, label: '$25K' }
                                    ]}
                                    sx={{
                                        '& .MuiSlider-markLabel': { fontSize: '0.65rem', fontWeight: 700 }
                                    }}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold">M2 Annual Growth Rate</span>
                                    <span className="text-sm font-bold text-primary">{simM2Growth}%</span>
                                </div>
                                <Slider
                                    value={simM2Growth}
                                    onChange={(_, v) => setSimM2Growth(v as number)}
                                    min={-5}
                                    max={50}
                                    step={1}
                                    marks={[
                                        { value: 0, label: 'Flat' },
                                        { value: 15, label: '1970s Avg' },
                                        { value: 40, label: '2020 Peak' }
                                    ]}
                                    sx={{
                                        '& .MuiSlider-markLabel': { fontSize: '0.65rem', fontWeight: 700 }
                                    }}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold">Reserve Displacement (USD)</span>
                                    <span className="text-sm font-bold text-primary">-{simReserveShift}%</span>
                                </div>
                                <Slider
                                    value={simReserveShift}
                                    onChange={(_, v) => setSimReserveShift(v as number)}
                                    min={0}
                                    max={50}
                                    step={1}
                                    marks={[
                                        { value: 0, label: 'Stable' },
                                        { value: 10, label: 'High Shift' },
                                        { value: 40, label: 'Hyper-Displacement' }
                                    ]}
                                    sx={{
                                        '& .MuiSlider-markLabel': { fontSize: '0.65rem', fontWeight: 700 }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="mt-6 p-2 bg-white/[0.02] rounded-lg border border-white/10">
                            <div className="flex items-center gap-1 mb-1">
                                <Info size={14} color="#94a3b8" />
                                <span className="text-xs font-bold text-muted-foreground">INSTITUTIONAL MODELING NOTE</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                This engine uses 124 years of fiscal and monetary data.
                                **Reserve Displacement** simulates a global shift away from USD reserves, impacting sovereign refinancing capacity and the 124Y historical Z-Score relative to Gold.
                            </p>
                        </div>
                    </Card>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Card variant="elevated" className="p-8 h-full bg-blue-500/[0.03] border border-primary relative overflow-hidden">
                        <div className="absolute top-[-20px] right-[-20px] opacity-5">
                            <TrendingUp size={120} color="#3b82f6" />
                        </div>

                        <p className="text-xs font-bold uppercase tracking-uppercase text-primary mb-3">Simulated Outputs</p>

                        <div className="space-y-6 mt-3">
                            <div>
                                <span className="text-xs font-bold text-muted-foreground/60 block mb-1">M2 / GOLD RATIO</span>
                                <div className="text-2xl font-black">
                                    {(simRatio !== undefined && simRatio !== null && !isNaN(simRatio)) ? simRatio.toFixed(2) : '-'}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-0.5">
                                    <span className="text-xs font-bold text-muted-foreground/60">INSTITUTIONAL Z-SCORE</span>
                                    <span className={`text-xs font-black ${Math.abs(zScore) > 2 ? 'text-error' : 'text-primary'}`}>
                                        {zScore > 0 ? '+' : ''}{(zScore !== undefined && zScore !== null && !isNaN(zScore)) ? zScore.toFixed(2) : '-'}σ
                                    </span>
                                </div>
                                <div className="h-1 bg-white/10 rounded overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${Math.abs(zScore) > 2 ? 'bg-error' : 'bg-primary'}`}
                                        style={{ width: `${Math.min(100, Math.max(0, percentile))}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Percentile Rank: <strong>{(percentile !== undefined && percentile !== null && !isNaN(percentile)) ? percentile.toFixed(1) : '-'}%</strong>
                                </p>
                            </div>

                            <hr className="border-white/10 my-2" />

                            <div>
                                <span className="text-xs font-bold text-muted-foreground/60">REGIME PROJECTION</span>
                                <div className="flex items-center gap-1 mt-1">
                                    {zScore > 2 ? <AlertTriangle size={18} color="#f43f5e" /> : <ShieldCheck size={18} color="#10b981" />}
                                    <span className="text-lg font-bold">{regimeLabel}</span>
                                </div>
                            </div>

                            <div>
                                <span className="text-xs font-bold text-muted-foreground/60">SIMULATED LIQUIDITY POOL</span>
                                <div className="text-2xl font-bold">
                                    ${(effectiveM2 !== undefined && effectiveM2 !== null && !isNaN(effectiveM2)) ? (effectiveM2 / 1000).toFixed(1) : '-'}T
                                </div>
                                <p className="text-xs text-muted-foreground/50">
                                    {(effectiveM2 / currentM2 - 1) > 0 ? '+' : ''}{(!isNaN(effectiveM2) && !isNaN(currentM2) && currentM2 !== 0) ? ((effectiveM2 / currentM2 - 1) * 100).toFixed(1) : '-'}% vs Current
                                </p>
                            </div>
                        </div>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};

// Simple Erf function for browser
function erf(x: number) {
    // constants
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    // Save the sign of x
    const sign = (x >= 0) ? 1 : -1;
    x = Math.abs(x);

    // A&S formula 7.1.26
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
}
