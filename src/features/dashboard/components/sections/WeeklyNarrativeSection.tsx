import React, { useEffect, useState } from 'react';
import { Box, Typography, CardContent, Skeleton, Button, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { SectionHeader } from '@/components/SectionHeader';
import { TrendingUp, TrendingDown, History, Info, ChevronRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface WeeklySnapshot {
    section_name: string;
    key_metric: string;
    value: number | null;
    wow_change_pct: number | null;
    narrative_snippet: string;
    metadata?: any;
    week_ending_date: string;
}

export const WeeklyNarrativeSection: React.FC = () => {
    const [snapshots, setSnapshots] = useState<WeeklySnapshot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatestNarrative = async () => {
            try {
                // Get the most recent week_ending_date
                const { data: latestDateObj } = await supabase
                    .from('weekly_macro_snapshot')
                    .select('week_ending_date')
                    .order('week_ending_date', { ascending: false })
                    .limit(1);

                if (latestDateObj && latestDateObj.length > 0) {
                    const latestDate = latestDateObj[0].week_ending_date;
                    const { data, error } = await supabase
                        .from('weekly_macro_snapshot')
                        .select('*')
                        .eq('week_ending_date', latestDate);

                    if (!error && data) {
                        setSnapshots(data);
                    }
                }
            } catch (err) {
                console.error('Error fetching weekly narrative:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestNarrative();
    }, []);

    const regimeShift = snapshots.find(s => s.section_name === 'Regime Shift Summary');
    const sections = snapshots.filter(s => !['Regime Shift Summary', 'Cross-Section Insight', 'Forward Look'].includes(s.section_name));
    const insight = snapshots.find(s => s.section_name === 'Cross-Section Insight');
    const forwardLook = snapshots.find(s => s.section_name === 'Forward Look');

    if (loading) {
        return (
            <Box mb={8} px={{ xs: 2, md: 4 }}>
                <Skeleton
                    variant="rectangular"
                    height={350}
                    sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                />
            </Box>
        );
    }

    if (snapshots.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-20 px-4 md:px-0"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <SectionHeader
                    title="Weekly Macro Narrative"
                    subtitle={`Week Ending ${new Date(snapshots[0].week_ending_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`}
                    className="mb-0"
                />
                <Link
                    to="/weekly-narrative"
                    className="inline-flex items-center gap-2 text-[0.65rem] font-black text-muted-foreground hover:text-primary transition-all uppercase tracking-widest bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl border border-white/10 w-fit"
                >
                    <History size={14} />
                    Intelligence Archive
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Regime Shift Highlight */}
                {regimeShift && (
                    <div className="lg:col-span-12">
                        <Card className="bg-blue-500/5 border-blue-500/20 relative overflow-hidden group hover:bg-blue-500/10 transition-all duration-500">
                            {/* Animated Background Element */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />

                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                            <CardContent className="p-8 md:p-10 relative z-10">
                                <Stack direction="row" spacing={2} alignItems="center" mb={4}>
                                    <div className="px-2.5 py-1 bg-blue-500 text-white text-[0.65rem] font-black tracking-widest uppercase rounded shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                        REGIME FOCUS
                                    </div>
                                    <span className="text-[0.65rem] font-bold text-blue-400 tracking-[0.25em] uppercase">
                                        Structural Consensus
                                    </span>
                                </Stack>
                                <Typography variant="h4" className="font-serif leading-relaxed text-foreground md:text-3xl lg:text-4xl" sx={{ fontWeight: 400, letterSpacing: '-0.01em' }}>
                                    {regimeShift.narrative_snippet}
                                </Typography>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Main Content: Sectional Divergence */}
                <div className="lg:col-span-8">
                    <Card className="bg-card/20 backdrop-blur-md border-white/5 h-full">
                        <CardContent className="p-8 md:p-10">
                            <h5 className="text-[0.7rem] font-black tracking-[0.25em] text-muted-foreground uppercase mb-10 flex items-center gap-3">
                                <div className="p-1 rounded bg-primary/10">
                                    <Activity size={14} className="text-primary" />
                                </div>
                                Sectional Divergence
                            </h5>
                            <div className="space-y-12">
                                {sections.map((section, idx) => (
                                    <div key={idx} className="group/item relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <h6 className="text-[0.8rem] font-black text-foreground group-hover/item:text-primary transition-colors uppercase tracking-widest">
                                                {section.section_name}
                                            </h6>
                                            {section.wow_change_pct !== null && (
                                                <div className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.6rem] font-black border",
                                                    section.wow_change_pct >= 0
                                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                        : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                                )}>
                                                    {section.wow_change_pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                    {section.wow_change_pct >= 0 ? '+' : ''}{section.wow_change_pct.toFixed(2)}%
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[1rem] leading-relaxed text-muted-foreground group-hover/item:text-foreground/90 transition-colors font-medium">
                                            {section.narrative_snippet}
                                        </p>
                                        {idx < sections.length - 1 && (
                                            <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent mt-10" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Synthesis */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Proprietary Insight */}
                    {insight && (
                        <Card className="bg-emerald-500/5 border-emerald-500/20 border-dashed hover:bg-emerald-500/10 transition-all duration-300 group/insight">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="p-1.5 rounded-full bg-emerald-500/10">
                                        <Info size={16} className="text-emerald-500" />
                                    </div>
                                    <span className="text-[0.7rem] font-black tracking-[0.2em] text-emerald-500 uppercase">
                                        PROPRIETARY VIEW
                                    </span>
                                </div>
                                <p className="text-[1rem] font-medium italic text-foreground/90 leading-relaxed border-l-2 border-emerald-500/30 pl-5 py-1">
                                    "{insight.narrative_snippet}"
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Forward Look */}
                    {forwardLook && (
                        <Card className="bg-card/40 border-white/10 hover:border-white/20 transition-all shadow-xl">
                            <CardContent className="p-8">
                                <h5 className="text-[0.7rem] font-black tracking-[0.25em] text-muted-foreground uppercase mb-6 flex justify-between items-center">
                                    Next Window
                                    <span className="text-[0.6rem] text-primary bg-primary/10 px-2 py-0.5 rounded">HIGH IMPACT</span>
                                </h5>
                                <p className="text-[0.9rem] text-muted-foreground leading-relaxed mb-8 font-medium">
                                    {forwardLook.narrative_snippet}
                                </p>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 3,
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: 'text.primary',
                                        textTransform: 'none',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        letterSpacing: '0.1em',
                                        py: 1.5,
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'rgba(59,130,246,0.05)'
                                        }
                                    }}
                                    endIcon={<ChevronRight size={14} />}
                                >
                                    FULL SOVEREIGN CALENDAR
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
