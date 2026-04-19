import React, { useEffect, useState } from 'react';
import { Box, Typography, CardContent, Skeleton, Button, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { SectionHeader } from '@/components/SectionHeader';
import { History, Info, ChevronRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from "@/components/ui/card";

interface WeeklyRegimeDigest {
    id: string;
    week_ending_date: string;
    executive_summary: string;
    regime_shifts: Array<{ title: string; description: string }>;
    what_changed: Array<{ pillar: string; change: string }>;
    what_to_watch: string[];
    holistic_narrative: string;
    created_at: string;
}

export const WeeklyNarrativeSection: React.FC = () => {
    const [digest, setDigest] = useState<WeeklyRegimeDigest | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatestNarrative = async () => {
            try {
                // Get the most recent week_ending_date
                const { data, error } = await supabase
                    .from('weekly_regime_digests')
                    .select('*')
                    .order('week_ending_date', { ascending: false })
                    .limit(1)
                    .single();

                if (!error && data) {
                    setDigest(data);
                }
            } catch (err) {
                console.error('Error fetching weekly narrative:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestNarrative();
    }, []);

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

    if (!digest) return null;

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
                    subtitle={`Week Ending ${new Date(digest.week_ending_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`}
                    className="mb-0"
                />
                <Link
                    to="/weekly-narrative"
                    className="inline-flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-all uppercase tracking-uppercase bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl border border-white/12 w-fit"
                >
                    <History size={14} />
                    Intelligence Archive
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Executive Summary */}
                <div className="lg:col-span-12">
                    <Card className="bg-blue-500/5 border-blue-500/20 relative overflow-hidden group hover:bg-blue-500/10 transition-all duration-500">
                        {/* Animated Background Element */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />

                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                        <CardContent className="p-8 md:p-10 relative z-10">
                            <Stack direction="row" spacing={2} alignItems="center" mb={4}>
                                <div className="px-2.5 py-1 bg-blue-500 text-white text-xs font-black tracking-uppercase uppercase rounded shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                    REGIME FOCUS
                                </div>
                                <span className="text-xs font-bold text-blue-400 tracking-[0.25em] uppercase">
                                    Executive Summary
                                </span>
                            </Stack>
                            <Typography variant="h4" className="font-serif leading-relaxed text-foreground md:text-3xl lg:text-4xl" sx={{ fontWeight: 400, letterSpacing: '-0.01em' }}>
                                {digest.executive_summary}
                            </Typography>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content: Sectional Divergence */}
                <div className="lg:col-span-8">
                    <Card className="bg-card/20 backdrop-blur-md border-white/5 h-full">
                        <CardContent className="p-8 md:p-10">
                            <h5 className="text-xs font-black tracking-[0.25em] text-muted-foreground uppercase mb-10 flex items-center gap-3">
                                <div className="p-1 rounded bg-primary/10">
                                    <Activity size={14} className="text-primary" />
                                </div>
                                Sectional Divergence
                            </h5>
                            <div className="space-y-12">
                                {digest.what_changed?.map((section, idx) => (
                                    <div key={idx} className="group/item relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <h6 className="text-sm font-black text-foreground group-hover/item:text-primary transition-colors uppercase tracking-uppercase">
                                                {section.pillar}
                                            </h6>
                                        </div>
                                        <p className="text-base leading-relaxed text-muted-foreground group-hover/item:text-foreground/90 transition-colors font-medium">
                                            {section.change}
                                        </p>
                                        {idx < (digest.what_changed?.length || 0) - 1 && (
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
                    <Card className="bg-emerald-500/5 border-emerald-500/20 border-dashed hover:bg-emerald-500/10 transition-all duration-300 group/insight">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-2 mb-5">
                                <div className="p-1.5 rounded-full bg-emerald-500/10">
                                    <Info size={16} className="text-emerald-500" />
                                </div>
                                <span className="text-xs font-black tracking-uppercase text-emerald-500 uppercase">
                                    PROPRIETARY VIEW
                                </span>
                            </div>
                            <p className="text-base font-medium italic text-foreground/90 leading-relaxed border-l-2 border-emerald-500/30 pl-5 py-1">
                                "{digest.holistic_narrative}"
                            </p>
                        </CardContent>
                    </Card>

                    {/* Forward Look */}
                    <Card className="bg-card/40 border-white/12 hover:border-white/20 transition-all shadow-xl">
                        <CardContent className="p-8">
                            <h5 className="text-xs font-black tracking-[0.25em] text-muted-foreground uppercase mb-6 flex justify-between items-center">
                                Next Window
                                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">HIGH IMPACT</span>
                            </h5>
                            <ul className="space-y-4 mb-8">
                                {digest.what_to_watch.map((item, idx) => (
                                    <li key={idx} className="text-sm text-muted-foreground leading-relaxed font-medium flex gap-3">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
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
                </div>
            </div>
        </motion.div>
    );
};
