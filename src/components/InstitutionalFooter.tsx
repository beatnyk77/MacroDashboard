import { ShieldCheck, BookOpen, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export const InstitutionalFooter: React.FC = () => {
    return (
        <footer className="w-full py-12 border-t border-white/5 bg-black/20 backdrop-blur-md">
            <div className="container mx-auto px-6 max-w-7xl">
                {/* Security Verification Band */}
                <div className="mb-12 flex items-center gap-4 px-6 py-3 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                    <ShieldCheck size={16} className="text-blue-400" />
                    <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-blue-400/80">
                        Institutional Grade Security: Row-Level Security (RLS) Active & Verified
                    </span>
                    <div className="ml-auto flex gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-400/40" />
                        <div className="w-1 h-1 rounded-full bg-blue-400/40" />
                        <div className="w-1 h-1 rounded-full bg-blue-400/40" />
                    </div>
                </div>

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
                            <span className="text-xs text-muted-foreground uppercase tracking-widest">Global Macro Strategy Division</span>
                        </div>
                    </div>
                </div>

                {/* Crawlable Hash Deep-Links — native <a> tags for search engine discovery */}
                <nav className="mt-8 pt-6 border-t border-white/[0.03]" aria-label="Dashboard Sections">
                    <h3 className="text-[0.55rem] font-black uppercase tracking-[0.3em] text-muted-foreground/30 mb-3">Dashboard Deep Dives</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <a href="/#liquidity-hero" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-blue-400/80 transition-colors">Net Liquidity</a>
                        <a href="/#debt-maturity-hero" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-blue-400/80 transition-colors">Debt Maturity Wall</a>
                        <a href="/#india-pulse" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-emerald-400/80 transition-colors">India Macro Pulse</a>
                        <a href="/#thematic-labs" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-blue-400/80 transition-colors">Thematic Labs</a>
                        <a href="/#policy-geopolitics" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-blue-400/80 transition-colors">Geopolitics</a>
                        <a href="/#sovereign-debt-stress" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-blue-400/80 transition-colors">Sovereign Debt</a>
                        <a href="/#country-pulses" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-blue-400/80 transition-colors">Country Pulses</a>
                        <a href="/#yield-curve-monitor" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-blue-400/80 transition-colors">Yield Curves</a>
                    </div>
                </nav>

                <div className="mt-12 pt-8 border-t border-white/[0.03] flex justify-between items-center">
                    <span className="text-[0.55rem] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">
                        © 2026 GraphiQuestor. PRO-SERIES TERMINAL.
                    </span>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 border-r border-white/5 pr-6">
                            <Link to="/api-access" className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 hover:text-blue-400/80 transition-colors">API Access</Link>
                            <Link to="/api-docs" className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 hover:text-blue-400/80 transition-colors">API Docs</Link>
                        </div>
                        <div className="flex items-center gap-4 border-r border-white/5 pr-6">
                            <Link to="/terms" className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 hover:text-blue-400/80 transition-colors">Terms</Link>
                            <Link to="/privacy" className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 hover:text-blue-400/80 transition-colors">Privacy</Link>
                        </div>
                        <Link
                            to="/about"
                            className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 hover:text-white transition-colors"
                        >
                            About Team
                        </Link>
                        <Link
                            to="/blog"
                            className="text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 border-l border-white/5 pl-6"
                        >
                            <BookOpen size={12} />
                            Intelligence Journal
                        </Link>
                        <Link
                            to="/glossary"
                            className="text-xs font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-2 border-l border-white/5 pl-6"
                        >
                            <BookOpen size={12} />
                            Glossary
                        </Link>
                        <Link
                            to="/intel/india"
                            className="text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 border-l border-white/5 pl-6"
                        >
                            <Globe size={12} />
                            🇮🇳 India Intel
                        </Link>
                        <Link
                            to="/intel/china"
                            className="text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 border-l border-white/5 pl-6"
                        >
                            <Globe size={12} />
                            🇨🇳 China Intel
                        </Link>
                        <a
                            href="/rss.xml"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 hover:text-blue-400/80 transition-colors flex items-center gap-1.5"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500/40" />
                            Subscribe via RSS
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
