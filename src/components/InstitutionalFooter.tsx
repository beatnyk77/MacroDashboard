import React from 'react';

export const InstitutionalFooter: React.FC = () => {
    return (
        <footer className="w-full py-12 border-t border-white/5 bg-black/20 backdrop-blur-md">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start opacity-60">
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Legal Disclaimer</h3>
                        <p className="text-[0.65rem] leading-relaxed text-muted-foreground font-medium">
                            GraphiQuestor is a macro intelligence platform provided for informational and educational purposes only.
                            The data, analytics, and interpretations presented do not constitute investment advice, financial planning,
                            or solicitation for any financial product. Past performance of macro indicators is not indicative of future market outcomes.
                            Institutional users should conduct independent verification of all data points.
                        </p>
                    </div>

                    <div className="flex flex-col md:items-end space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Contact & Intelligence</h3>
                        <div className="flex flex-col md:items-end gap-2">
                            <span className="text-[0.65rem] font-mono">graphiquestor@gmail.com</span>
                            <span className="text-[0.6rem] text-muted-foreground uppercase tracking-widest">Global Macro Strategy Division</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/[0.03] flex justify-between items-center">
                    <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">
                        © 2026 GraphiQuestor. PRO-SERIES TERMINAL.
                    </span>
                    <div className="flex gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500/20" />
                    </div>
                </div>
            </div>
        </footer>
    );
};
