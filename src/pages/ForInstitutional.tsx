import React from 'react';
import {
    Mail,
    Database,
    Crown,
    Zap,
    Building2,
    Shield
} from 'lucide-react';
import { SEOManager } from '@/components/SEOManager';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const ForInstitutional: React.FC = () => {
    return (
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-24 mb-32">
            <SEOManager
                title="Institutional API Access"
                description="GraphiQuestor's $28/mo Institutional API provides direct telemetry for global liquidity, sovereign debt stress, and the Corporate India Engine."
                keywords={[
                    'Institutional Macro API', 'Macro Telemetry', 'Quantitative Macro Analysis',
                    'Sovereign Debt Monitoring', 'Liquidity Tracker'
                ]}
            />
            
            <header className="text-center mb-32">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-uppercase mb-8 animate-fade-in">
                    <Crown size={14} /> Institutional Intelligence Console
                </div>
                <h1 className="text-4xl md:text-7xl font-black uppercase tracking-heading leading-[0.9] text-white mb-8">
                    Macro <span className="text-blue-500">Intelligence</span><br />
                    <span className="text-white/30">For Professionals</span>
                </h1>
                <p className="text-muted-foreground/60 max-w-3xl mx-auto text-base md:text-xl font-medium leading-relaxed uppercase tracking-wide">
                    The first terminal for navigating the transition from <span className="text-white">debt-monopoly</span> to <span className="text-white">hard-money telemetry</span>.
                </p>
            </header>

            {/* Pricing Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-48">
                {/* Tier 1: Retail/Analyst */}
                <Card variant="elevated" className="p-10 border-white/5 flex flex-col group hover:border-white/10">
                    <CardHeader className="p-0 mb-8">
                        <CardTitle className="text-[10px] font-black uppercase tracking-uppercase text-muted-foreground/40">Analyst Tier</CardTitle>
                    </CardHeader>
                    <div className="flex items-baseline gap-2 mb-10">
                        <span className="text-5xl font-black text-white">$0</span>
                        <span className="text-muted-foreground/30 text-sm font-bold uppercase tracking-widest">/Mo</span>
                    </div>
                    <ul className="space-y-6 mb-12 flex-1">
                        {['Public Labs Access', 'Weekly Macro Narrative', 'Institutional Digest Preview', 'Community Discord Access'].map(f => (
                            <li key={f} className="flex items-center gap-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/10 flex-shrink-0" /> {f}
                            </li>
                        ))}
                    </ul>
                    <Button variant="outline" className="w-full text-[10px] font-black py-6">
                        Get Started
                    </Button>
                </Card>

                {/* Tier 2: The Core API Offer */}
                <Card variant="elevated" className="p-10 border-blue-500/30 bg-blue-500/[0.03] shadow-[0_0_50px_rgba(59,130,246,0.1)] flex flex-col relative group lg:scale-105 z-10">
                    <div className="absolute top-0 right-10 -translate-y-1/2 px-4 py-1.5 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-uppercase shadow-xl">Most Popular</div>
                    <CardHeader className="p-0 mb-8">
                        <CardTitle className="text-[10px] font-black uppercase tracking-uppercase text-blue-400">Institutional API Access</CardTitle>
                    </CardHeader>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-6xl font-black text-white">$28</span>
                        <span className="text-blue-500 text-sm font-black uppercase tracking-widest">/Mo</span>
                    </div>
                    <p className="text-[10px] font-black text-blue-400/50 uppercase tracking-uppercase mb-10">Billed Monthly • Cancel Anytime</p>

                    <ul className="space-y-6 mb-12 flex-1">
                        {[
                            'Full Quantum API Access',
                            'India Corporate Engine Pro',
                            'Sovereign Debt Maturity Wall',
                            'Real-time Macro Sentiment',
                            'Private Institutional Archives'
                        ].map(f => (
                            <li key={f} className="flex items-center gap-4 text-[10px] font-black text-white uppercase tracking-widest">
                                <Zap size={14} className="text-blue-500 flex-shrink-0" /> {f}
                            </li>
                        ))}
                    </ul>
                    <Button variant="contained" className="w-full text-[10px] font-black py-8 bg-blue-500 hover:bg-blue-600">
                        Unlock Institutional Access
                    </Button>
                </Card>

                {/* Tier 3: Bespoke/Enterprise */}
                <Card variant="elevated" className="p-10 border-white/5 flex flex-col group hover:border-white/10">
                    <CardHeader className="p-0 mb-8">
                        <CardTitle className="text-[10px] font-black uppercase tracking-uppercase text-muted-foreground/40">Bespoke Advisory</CardTitle>
                    </CardHeader>
                    <div className="flex items-baseline gap-2 mb-10">
                        <span className="text-4xl font-black text-white italic tracking-tighter">Contact Us</span>
                    </div>
                    <ul className="space-y-6 mb-12 flex-1">
                        {['White-label Dashboards', 'Custom Data Pipelines', '1-on-1 Strategy Desk', 'Private Geopolitical Audit'].map(f => (
                            <li key={f} className="flex items-center gap-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/10 flex-shrink-0" /> {f}
                            </li>
                        ))}
                    </ul>
                    <Button variant="outline" className="w-full text-[10px] font-black py-6">
                        Contact Desk
                    </Button>
                </Card>
            </div>

            {/* Value Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-48">
                {[
                    {
                        icon: <Database size={28} />,
                        color: 'bg-blue-500/10 text-blue-500',
                        title: 'Direct API Feed',
                        desc: "Don't wait for reports. Access the raw telemetric feed that powers our terminal. Direct REST access to all our proprietary data structures including the US Debt Maturity Wall and India Fiscal Matrix."
                    },
                    {
                        icon: <Building2 size={28} />,
                        color: 'bg-orange-500/10 text-orange-500',
                        title: 'CI Engine Pro',
                        desc: "Full unlocked access to the Corporate India Engine. Deep fundamental analysis on 500+ Indian large caps with an integrated Macro Overlay for regime-based filtering."
                    },
                    {
                        icon: <Shield size={28} />,
                        color: 'bg-rose-500/10 text-rose-500',
                        title: 'Proof of Sovereign',
                        desc: "Navigating the US Treasury maturity wall. We provide the institutional tracking necessary for identifying the shift into hard-money and reserve multi-polarity."
                    }
                ].map((pillar, i) => (
                    <div key={i} className="space-y-8">
                        <div className={`w-16 h-16 rounded-[2rem] ${pillar.color} flex items-center justify-center`}>
                            {pillar.icon}
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-heading">{pillar.title}</h3>
                        <p className="text-muted-foreground/50 text-sm leading-relaxed font-medium uppercase tracking-wide">
                            {pillar.desc}
                        </p>
                    </div>
                ))}
            </div>

            {/* Footer CTA */}
            <section className="relative p-16 md:p-24 rounded-[4rem] border border-blue-500/10 bg-blue-500/[0.02] text-center overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/[0.03] blur-[120px] rounded-full translate-x-1/2" />
                <div className="relative z-10 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-heading text-white mb-6">
                        Institutional <span className="text-blue-500">Desk</span>
                    </h2>
                    <p className="text-muted-foreground/60 text-base md:text-xl font-medium mb-12 uppercase tracking-wide">
                        Custom solutions for sovereign funds, family offices, and institutional traders. Reach out for team access or bespoke integration.
                    </p>
                    <Button
                        variant="contained"
                        size="large"
                        className="rounded-3xl px-12 py-10 text-[10px] font-black uppercase tracking-widest bg-blue-500 hover:bg-blue-600 flex items-center gap-3 mx-auto"
                        asChild
                    >
                        <a href="mailto:institutional@graphiquestor.ai">
                            <Mail size={18} /> Email Institutional Desk
                        </a>
                    </Button>
                </div>
            </section>
        </div>
    );
};

export default ForInstitutional;
