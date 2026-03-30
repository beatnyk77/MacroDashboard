import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    Coins,
    Globe,
    ShieldAlert,
    Fuel,
    Building2,
    EyeOff,
    ChevronRight,
    Search,
    Leaf
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

const labs = [
    { title: 'US Corporate Terminal', path: '/us-equities', icon: <Building2 size={24} />, color: 'blue', desc: 'SEC EDGAR fundamentals, whale tracking & insider conviction' },
    { title: 'US Macro & Fiscal', path: '/labs/us-macro-fiscal', icon: <ShieldAlert size={24} />, color: 'blue', desc: 'Sovereign maturity walls & auction demand dynamics' },
    { title: 'India Lab', path: '/labs/india', icon: <Activity size={24} />, color: 'emerald', desc: 'RBI credit impulse & state-side fiscal telemetry' },
    { title: 'China Lab', path: '/labs/china', icon: <Globe size={24} />, color: 'rose', desc: 'PBoC liquidity cycles & de-dollarization flows' },
    { title: 'De-Dollarization & Gold', path: '/labs/de-dollarization-gold', icon: <Coins size={24} />, color: 'amber', desc: 'Hard money regimes & reserve asset multi-polarity' },
    { title: 'Energy & Commodities', path: '/labs/energy-commodities', icon: <Fuel size={24} />, color: 'orange', desc: 'Strategic supply chains & oil-rupee settlement pulse' },
    { title: 'Sovereign Stress', path: '/labs/sovereign-stress', icon: <Building2 size={24} />, color: 'purple', desc: 'EM credit matrix & systemic refinance risk analytics' },
    { title: 'Shadow System', path: '/labs/shadow-system', icon: <EyeOff size={24} />, color: 'zinc', desc: 'Capital flight indices & illicit trade flow telemetry' },
    { title: 'Sustainable Finance & Climate Risk', path: '/labs/sustainable-finance-climate-risk', icon: <Leaf size={24} />, color: 'emerald', desc: 'Climate transition alpha & institutional ESG risk telemetry' },
];

const colorMap: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    zinc: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
};

export const MacroObservatory: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen pt-24 pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
                <div className="mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-uppercase mb-8"
                    >
                        <Search size={14} /> Intelligence Network
                    </motion.div>
                    
                    <h1 className="text-4xl md:text-7xl font-black uppercase mb-3 letter-spacing-tight tracking-heading leading-none text-white">
                        Macro <span className="text-blue-500">Observatory</span>
                    </h1>
                    
                    <p className="text-muted-foreground/60 text-lg md:text-xl font-medium max-w-2xl mx-auto uppercase tracking-wide leading-relaxed">
                        Access specialized research labs. Institutional-grade telemetry across global credit, currency, and commodity regimes.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {labs.map((lab, index) => (
                        <motion.div
                            key={lab.path}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card 
                                variant="elevated" 
                                className="group cursor-pointer h-full border-white/5 bg-white/[0.02] flex flex-col transition-all duration-300 hover:bg-white/[0.04] p-2"
                                onClick={() => navigate(lab.path)}
                            >
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colorMap[lab.color]}`}>
                                        {lab.icon}
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-blue-400 transition-colors uppercase">
                                        {lab.title}
                                    </CardTitle>
                                    <CardDescription className="uppercase tracking-wide leading-relaxed flex-1">
                                        {lab.desc}
                                    </CardDescription>
                                </CardHeader>
                                
                                <CardFooter className="justify-between border-t border-white/5 py-4">
                                    <span className="text-xs font-black uppercase tracking-uppercase text-muted-foreground/40 group-hover:text-white transition-colors">Enter Lab</span>
                                    <ChevronRight size={14} className="text-muted-foreground/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </CardFooter>

                                {/* Background decoration overlay */}
                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                                    {React.cloneElement(lab.icon as React.ReactElement, { size: 120 })}
                                </div>
                            </Card>
                        </motion.div>
                    ))}

                    {/* Coming Soon Card */}
                    <Card variant="default" className="p-8 border-dashed border-white/5 bg-white/[0.01] flex flex-col justify-center items-center text-center opacity-40">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                            <Activity size={24} className="text-white/20" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-uppercase text-white/40">New Module Pending</p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MacroObservatory;
