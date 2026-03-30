import React, { useEffect } from 'react';
import { 
    Flag, Shield, Terminal as TerminalIcon, Info,
    ArrowUpRight, Share2, Download
} from 'lucide-react';
import { FYP_HeroTimeline } from '@/features/dashboard/components/rows/China15thFYP/FYP_HeroTimeline';
import { FYP_MissionControlRadar } from '@/features/dashboard/components/rows/China15thFYP/FYP_MissionControlRadar';
import { FYP_TargetGrid } from '@/features/dashboard/components/rows/China15thFYP/FYP_TargetGrid';
import { FYP_ImpactHeatmap } from '@/features/dashboard/components/rows/China15thFYP/FYP_ImpactHeatmap';
import { ComparisonToggle14v15 } from '@/features/dashboard/components/rows/China15thFYP/ComparisonToggle14v15';
import { Button } from '@mui/material';
import { Card, CardContent } from '@/components/ui/card';

export const China15thFYPLab: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-red-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-500/5 blur-[150px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] translate-y-1/2 -translate-x-1/2" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
                    <div className="space-y-6 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                                <Flag className="text-red-500 w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Mission Intelligence Lab</span>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white italic uppercase">
                                    China 15th <span className="text-red-500">Five-Year Plan</span>
                                </h1>
                            </div>
                        </div>
                        <p className="text-lg text-slate-400 leading-relaxed font-medium">
                            An institutional-grade telemetry dashboard tracking the 2026–2030 roadmap for high-quality development, technological self-reliance, and national economic security.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/12 text-xs font-bold uppercase tracking-widest text-slate-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                Active Monitoring
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/12 text-xs font-bold uppercase tracking-widest text-slate-300">
                                Last Updated: March 14, 2026
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <Button 
                            variant="contained"
                            startIcon={<Download size={18} />}
                            sx={{ 
                                bgcolor: '#dc2626', 
                                '&:hover': { bgcolor: '#b91c1c' },
                                borderRadius: '12px',
                                px: 4,
                                py: 1.5,
                                fontWeight: 900,
                                fontSize: '0.7rem',
                                letterSpacing: '0.1em'
                            }}
                        >
                            Download Strategist PDF
                        </Button>
                        <Button 
                            variant="outlined"
                            startIcon={<Share2 size={18} />}
                            sx={{ 
                                borderColor: 'rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.7)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)' },
                                borderRadius: '12px',
                                px: 4,
                                py: 1.5,
                                fontWeight: 900,
                                fontSize: '0.7rem',
                                letterSpacing: '0.1em'
                            }}
                        >
                            Share Intelligence
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                    <div className="lg:col-span-8 space-y-8">
                        {/* Hero Timeline */}
                        <Card className="bg-slate-900/40 border-white/5 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <TerminalIcon className="text-red-500" size={18} />
                                        <h2 className="text-sm font-black uppercase tracking-widest text-white">2026-2030 Strategic Milestone Timeline</h2>
                                    </div>
                                    <Info size={14} className="text-muted-foreground/30 cursor-help" />
                                </div>
                                <FYP_HeroTimeline />
                            </CardContent>
                        </Card>

                        {/* Quantitative Target Grid */}
                        <FYP_TargetGrid />
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        {/* Radar Component */}
                        <FYP_MissionControlRadar />

                        {/* Alpha Insight Box */}
                        <Card className="bg-red-500/5 border-red-500/20">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-2 text-red-500 uppercase font-black text-xs tracking-widest">
                                    <Shield size={16} />
                                    Strategist Deep Insight
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                    The 15th FYP represents a fundamental shift from <span className="text-white italic">"Growth at any cost"</span> to <span className="text-white italic">"High-quality resilience."</span> The key metric to watch is R&D growth and supply chain self-sufficiency indices, which now carry higher political weighting than raw GDP.
                                </p>
                                <div className="pt-4 border-t border-red-500/10">
                                    <div className="text-xs text-red-400 uppercase font-black mb-2 opacity-60 italic">Key Tipping Point: 2027</div>
                                    <div className="text-xs font-bold text-slate-200">Military centennial goals and semiconductor node independence parity targets align.</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Secondary Layers */}
                <div className="space-y-16">
                    <ComparisonToggle14v15 />
                    <FYP_ImpactHeatmap />
                </div>

                {/* Footer Insight */}
                <div className="mt-24 pt-12 border-t border-white/5 flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
                    <div className="p-3 rounded-full bg-red-500/10">
                        <ArrowUpRight className="text-red-500 w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight italic">
                        "Development and Security must be in dynamic equilibrium."
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Data source: Central Committee of the Communist Party of China (CPC), Official Release (March 2026). Forecast models internalized from GraphiQuestor Quantitative Intelligence.
                    </p>
                </div>
            </main>
        </div>
    );
};
