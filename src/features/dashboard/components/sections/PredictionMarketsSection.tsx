import React from 'react';
import { Card } from "@/components/ui/card";
import { SPASection } from '@/components/spa/SPASection';
import { SectionHeader } from '@/components/SectionHeader';
import { FileText, ExternalLink, Quote, BarChart3, Globe, Sparkles } from 'lucide-react';


// The generated image path
import infographicImg from '/Users/kartikaysharma/.gemini/antigravity/brain/7b2eab03-13eb-47aa-859a-9dc5e802b91d/feds_2026_010_infographic_v2_1771525581049.png';

export const PredictionMarketsSection: React.FC = () => {
    return (
        <SPASection id="prediction-markets-discovery" className="py-24 bg-white/[0.01]">
            <div className="mb-16">
                <SectionHeader
                    title="The Rise of Macro Markets"
                    subtitle="Synthesizing the Federal Reserve research on algorithmic prediction accuracy (FEDS 2026-010)"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
                {/* Visual Side */}
                <div className="relative group perspective-1000">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                    <Card className="relative overflow-hidden border-white/5 bg-slate-950/50 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl transition-transform duration-700 group-hover:scale-[1.01]">
                        <img
                            src={infographicImg}
                            alt="FEDS 2026-010 Infographic: Kalshi & Prediction Markets"
                            className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-all duration-700"
                        />

                        {/* Shimmer Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    </Card>

                    {/* Floating Label */}
                    <div className="absolute -bottom-4 -right-4 bg-slate-900 border border-white/10 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce-subtle">
                        <Sparkles size={16} className="text-blue-400" />
                        <span className="text-[0.6rem] font-black text-white uppercase tracking-widest">Enhanced Intelligence</span>
                    </div>
                </div>

                {/* Content Side */}
                <div className="space-y-10">
                    <article className="space-y-6" role="article" aria-label="Research Summary">
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-white tracking-tighter leading-none">
                                Kalshi and the Prediction Paradox
                            </h3>
                            <p className="text-sm text-muted-foreground/80 leading-relaxed font-medium">
                                Federal Reserve Board researchers in <span className="text-blue-400 font-bold italic">FEDS 2026-010</span> conclude that Kalshi's event contracts offer a "statistically superior" predictive signal compared to traditional Bloomberg surveys for FOMC target rate outcomes. By incentivizing participants to risk capital on binary outcomes rather than responding to anonymous polls, these markets compress the discovery cycle from weeks to minutes.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <KeyFactor
                                icon={<BarChart3 size={18} className="text-blue-400" />}
                                title="Superior Accuracy"
                                text="Prediction markets reduce Mean Absolute Error (MAE) by 14% vs. professional forecasts for one-month horizons."
                            />
                            <KeyFactor
                                icon={<Globe size={18} className="text-emerald-400" />}
                                title="Macro Discovery"
                                text="Kalshi provides instantaneous reaction to NFP/CPI prints, serving as a live 'Macro Heartbeat' for liquidity providers."
                            />
                        </div>

                        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[2rem] space-y-4">
                            <div className="flex items-center gap-3">
                                <Quote size={20} className="text-blue-500/40" />
                                <span className="text-[0.65rem] font-black text-muted-foreground/40 uppercase tracking-widest">Formal Citation</span>
                            </div>
                            <p className="text-[0.7rem] font-mono text-muted-foreground/60 leading-relaxed italic">
                                Bianchi, F. & Rogers, J. (2026). Kalshi and the Rise of Macro Markets. Federal Reserve Board, Finance and Economics Discussion Series 2026-010. https://doi.org/10.17016/FEDS.2026.010
                            </p>
                        </div>
                    </article>

                    <div className="flex flex-wrap gap-4">
                        <a
                            href="https://www.federalreserve.gov/econres/feds/files/2026010pap.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center h-14 px-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-[0.7rem] font-black uppercase tracking-widest gap-2 text-white transition-all shadow-xl active:scale-95"
                        >
                            <FileText size={16} />
                            Download PDF
                        </a>
                        <a
                            href="https://kalshi.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center h-14 px-8 rounded-2xl text-[0.7rem] font-black uppercase tracking-widest gap-2 text-muted-foreground/60 hover:text-white transition-all active:scale-95"
                        >
                            <ExternalLink size={16} />
                            Visit Kalshi
                        </a>
                    </div>

                </div>
            </div>
        </SPASection>
    );
};

const KeyFactor = ({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) => (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
        <div className="mb-4">{icon}</div>
        <h4 className="text-sm font-black text-white mb-2">{title}</h4>
        <p className="text-[0.65rem] text-muted-foreground/60 leading-relaxed">{text}</p>
    </div>
);
