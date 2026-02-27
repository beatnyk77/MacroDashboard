import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import {
    Mail,
    Database,
    Crown,
    Zap,
    Building2,
    Shield
} from 'lucide-react';

export const ForInstitutional: React.FC = () => {
    return (
        <div className="min-h-screen pt-24 pb-32">
            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', mb: 16 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[0.7rem] font-black uppercase tracking-[0.2em] mb-8 animate-fade-in">
                        <Crown size={14} /> Institutional Intelligence Console
                    </div>
                    <Typography variant="h1" sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: { xs: '2.5rem', md: '5rem' }, letterSpacing: '-0.04em', lineHeight: 0.9, mb: 4 }}>
                        Macro <span className="text-blue-500">Sovereignty</span><br />
                        <span className="text-white/40">For Professionals</span>
                    </Typography>
                    <Typography variant="h5" sx={{
                        color: 'rgba(255,255,255,0.6)',
                        maxWidth: '800px',
                        mx: 'auto',
                        fontWeight: 500,
                        lineHeight: 1.5,
                        fontSize: '1.2rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        '& span': { color: 'white' }
                    }}>
                        The first terminal for navigating the transition from debt-monopoly to hard-money telemetry.
                    </Typography>
                </Box>

                {/* Pricing Tiers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
                    {/* Tier 1: Retail/Analyst */}
                    <div className="p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.02] flex flex-col group hover:border-white/10 transition-all">
                        <h4 className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground/60 mb-6">Analyst Tier</h4>
                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-4xl font-black text-white">$0</span>
                            <span className="text-muted-foreground/40 text-sm font-bold uppercase">/Mo</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['Public Labs Access', 'Weekly Macro Narrative', 'Institutional Digest Preview', 'Community Discord Access'].map(f => (
                                <li key={f} className="flex items-center gap-3 text-xs font-bold text-white/50 uppercase text-left">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0" /> {f}
                                </li>
                            ))}
                        </ul>
                        <Button
                            variant="outlined"
                            fullWidth
                            sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 900, py: 1.5, borderRadius: '12px' }}
                        >
                            Get Started
                        </Button>
                    </div>

                    {/* Tier 2: The Core API Offer */}
                    <div className="p-10 rounded-[2.5rem] border-2 border-blue-500/30 bg-blue-500/[0.03] shadow-[0_0_50px_rgba(59,130,246,0.1)] flex flex-col relative group md:scale-105 z-10">
                        <div className="absolute top-0 right-10 -translate-y-1/2 px-4 py-1.5 rounded-full bg-blue-500 text-white text-[0.6rem] font-black uppercase tracking-widest shadow-xl">Most Popular</div>
                        <h4 className="text-[0.65rem] font-black uppercase tracking-widest text-blue-400 mb-6">Quantum Intelligence</h4>
                        <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-5xl font-black text-white">$28</span>
                            <span className="text-blue-500 text-sm font-black uppercase">/Mo</span>
                        </div>
                        <p className="text-[0.65rem] font-black text-blue-400/60 uppercase tracking-widest mb-8 text-left">Billed Monthly • Cancel Anytime</p>

                        <ul className="space-y-4 mb-10 flex-1">
                            {[
                                'Full Quantum API Access',
                                'India Corporate Engine Pro',
                                'Sovereign Debt Maturity Wall',
                                'Real-time Macro Sentiment',
                                'Private Institutional Archives'
                            ].map(f => (
                                <li key={f} className="flex items-center gap-3 text-xs font-black text-white uppercase text-left">
                                    <Zap size={14} className="text-blue-500 flex-shrink-0" /> {f}
                                </li>
                            ))}
                        </ul>
                        <Button
                            variant="contained"
                            fullWidth
                            sx={{ bgcolor: '#3b82f6', fontWeight: 900, py: 2, borderRadius: '16px', boxShadow: '0 20px 40px -10px rgba(59,130,246,0.3)', '&:hover': { bgcolor: '#2563eb' } }}
                        >
                            Unlock Institutional Access
                        </Button>
                    </div>

                    {/* Tier 3: Bespoke/Enterprise */}
                    <div className="p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.02] flex flex-col group hover:border-white/10 transition-all">
                        <h4 className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground/60 mb-6">Bespoke Advisory</h4>
                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-3xl font-black text-white italic">Contact Us</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                            {['White-label Dashboards', 'Custom Data Pipelines', '1-on-1 Strategy Desk', 'Private Geopolitical Audit'].map(f => (
                                <li key={f} className="flex items-center gap-3 text-xs font-bold text-white/50 uppercase text-left">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0" /> {f}
                                </li>
                            ))}
                        </ul>
                        <Button
                            variant="outlined"
                            fullWidth
                            sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 900, py: 1.5, borderRadius: '12px' }}
                        >
                            Contact Desk
                        </Button>
                    </div>
                </div>

                {/* Value Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
                    <div className="space-y-6">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Database size={28} />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Direct API Feed</h3>
                        <p className="text-muted-foreground/60 text-sm leading-relaxed font-medium">
                            Don't wait for reports. Access the raw telemetric feed that powers our terminal. Direct REST access to all our proprietary data structures including the US Debt Maturity Wall and India Fiscal Matrix.
                        </p>
                    </div>
                    <div className="space-y-6">
                        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Building2 size={28} />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">CI Engine Pro</h3>
                        <p className="text-muted-foreground/60 text-sm leading-relaxed font-medium">
                            Full unlocked access to the Corporate India Engine. Deep fundamental analysis on 500+ Indian large caps with an integrated Macro Overlay for regime-based filtering.
                        </p>
                    </div>
                    <div className="space-y-6">
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <Shield size={28} />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Proof of Sovereign</h3>
                        <p className="text-muted-foreground/60 text-sm leading-relaxed font-medium">
                            Navigating the US Treasury maturity wall. We provide the institutional tracking necessary for identifying the shift into hard-money and reserve multi-polarity.
                        </p>
                    </div>
                </div>

                <div className="p-16 rounded-[4rem] border border-blue-500/20 bg-blue-500/[0.02] text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full translate-x-1/2" />
                    <div className="relative z-10">
                        <Typography variant="h3" sx={{ fontWeight: 900, textTransform: 'uppercase', mb: 3 }}>
                            Institutional <span className="text-blue-500">Desk</span>
                        </Typography>
                        <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto font-medium">
                            Custom solutions for sovereign funds, family offices, and institutional traders. Reach out for team access or bespoke integration.
                        </p>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<Mail />}
                            sx={{
                                borderRadius: '1.5rem',
                                px: 8,
                                py: 2.5,
                                bgcolor: '#3b82f6',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                fontSize: '1rem',
                                boxShadow: '0 20px 40px -10px rgba(59,130,246,0.3)',
                                '&:hover': { bgcolor: '#2563eb' }
                            }}
                        >
                            Email Institutional Desk
                        </Button>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default ForInstitutional;
