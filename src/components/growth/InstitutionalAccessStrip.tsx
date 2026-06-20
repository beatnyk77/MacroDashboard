import React from 'react';
import { TrailLink } from '@/components/TrailLink';
import { ArrowRight, Bot, Code2, Mail, Shield } from 'lucide-react';
import { trackClick } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface InstitutionalAccessStripProps {
    className?: string;
    variant?: 'full' | 'compact';
}

export const InstitutionalAccessStrip: React.FC<InstitutionalAccessStripProps> = ({
    className,
    variant = 'full',
}) => {
    return (
        <section
            className={cn(
                'rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-blue-950/30 p-5 backdrop-blur-xl sm:p-6',
                className
            )}
            aria-label="Institutional access and regime digest"
        >
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <Shield size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80">
                    Institutional Access
                </span>
            </div>

            {variant === 'full' && (
                <p className="mb-5 max-w-2xl text-sm leading-relaxed text-white/55">
                    Direct access to live macro telemetry, proprietary composites, and weekly regime synthesis —
                    built for research desks, allocators, and API integrators.
                </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <TrailLink
                    to="/api-access"
                    onClick={() => trackClick('institutional_api', 'access_strip')}
                    className="group flex flex-1 items-center justify-between gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.08] px-5 py-4 no-underline transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/10">
                            <Code2 size={18} className="text-blue-400" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-400/70">
                                Programmatic Access
                            </div>
                            <div className="text-sm font-extrabold text-white/90 group-hover:text-white">
                                Institutional API
                            </div>
                            {variant === 'full' && (
                                <div className="text-[11px] text-white/40">Live metrics · provenance · REST</div>
                            )}
                        </div>
                    </div>
                    <ArrowRight size={16} className="text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-400" />
                </TrailLink>

                <TrailLink
                    to="/regime-digest"
                    onClick={() => trackClick('regime_digest', 'access_strip')}
                    className="group flex flex-1 items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-4 no-underline transition-all hover:border-amber-500/35 hover:shadow-lg hover:shadow-amber-500/5"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10">
                            <Mail size={18} className="text-amber-400" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-400/70">
                                Weekly Synthesis
                            </div>
                            <div className="text-sm font-extrabold text-white/90 group-hover:text-white">
                                Regime Digest
                            </div>
                            {variant === 'full' && (
                                <div className="text-[11px] text-white/40">15+ official sources · Sunday publish</div>
                            )}
                        </div>
                    </div>
                    <ArrowRight size={16} className="text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-400" />
                </TrailLink>

                <TrailLink
                    to="/mcp"
                    onClick={() => trackClick('mcp_server', 'access_strip')}
                    className="group flex flex-1 items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-5 py-4 no-underline transition-all hover:border-cyan-500/35 hover:shadow-lg hover:shadow-cyan-500/5 sm:min-w-[calc(50%-0.375rem)]"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/25 bg-cyan-500/10">
                            <Bot size={18} className="text-cyan-400" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-400/70">
                                Agent Integration
                            </div>
                            <div className="text-sm font-extrabold text-white/90 group-hover:text-white">
                                MCP Server
                            </div>
                            {variant === 'full' && (
                                <div className="text-[11px] text-white/40">8 tools · Smithery · Cursor</div>
                            )}
                        </div>
                    </div>
                    <ArrowRight size={16} className="text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-400" />
                </TrailLink>
            </div>
        </section>
    );
};