import React from 'react';
import { Card } from "@/components/ui/card";
import { Send, MessageSquare, Github } from 'lucide-react';
import { trackClick } from '@/lib/analytics';

export const FeedbackSection: React.FC = () => {
    return (
        <Card className="p-12 bg-black/40 backdrop-blur-3xl border-white/5 shadow-2xl relative overflow-hidden rounded-[3rem] group">
            {/* Ambient Background Radial */}
            <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] group-hover:bg-emerald-500/10 transition-colors duration-1000" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
                            <MessageSquare className="text-emerald-500 w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-black tracking-heading text-white uppercase italic">
                            Help us improve – <span className="text-emerald-500">share feedback</span> (30 seconds)
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        GraphiQuestor is an evolving macro observatory. Help us refine our signals, request new data layers, or report institutional inconsistencies.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <a
                        href="https://forms.gle/tdbeGz4YXMdybDg18"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                            trackClick('feedback_form', 'footer');
                        }}
                        className="group/btn flex items-center justify-between p-5 rounded-3xl bg-white/[0.03] border border-white/12 hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all duration-300"
                    >
                        <div className="flex flex-col items-start px-2">
                            <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-uppercase mb-1">Observation Log</span>
                            <span className="text-sm font-black text-white">Share Feedback</span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-500/10 group-hover/btn:bg-emerald-500/20 transition-colors">
                            <Send className="w-4 h-4 text-emerald-500" />
                        </div>
                    </a>

                    <a
                        href="https://github.com/beatnyk77/MacroDashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackClick('github_repo', 'footer')}
                        className="group/btn flex items-center justify-between p-5 rounded-3xl bg-white/[0.03] border border-white/12 hover:bg-white/[0.06] hover:border-blue-500/30 transition-all duration-300"
                    >
                        <div className="flex flex-col items-start px-2">
                            <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-uppercase mb-1">Source Control</span>
                            <span className="text-sm font-black text-white">GitHub Repository</span>
                        </div>
                        <div className="p-2 rounded-xl bg-blue-500/10 group-hover/btn:bg-blue-500/20 transition-colors">
                            <Github className="w-4 h-4 text-blue-500" />
                        </div>
                    </a>
                </div>

                <div className="pt-4 flex items-center gap-6 opacity-40 hover:opacity-100 transition-opacity duration-500">
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-uppercase">Version</span>
                        <span className="text-xs font-mono text-white">1.0.0-PRO</span>
                    </div>
                    <div className="w-[1px] h-4 bg-white/10" />
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-uppercase">Build</span>
                        <span className="text-xs font-mono text-white">2026.Q1</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};
