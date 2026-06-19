import React from 'react';
import { useLocation } from 'react-router-dom';
import { TrailLink } from '@/components/TrailLink';
import { withoutTrailingSlash } from '@/lib/urlPath';
import { BookOpen, Globe, Home, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
    { id: 'terminal', label: 'Terminal', icon: Home, paths: ['/', '/macro-observatory'], to: '/' },
    { id: 'learn', label: 'Glossary & Methods', icon: BookOpen, paths: ['/glossary', '/methods', '/methodology'], to: '/glossary', match: (p: string) => p.startsWith('/glossary') || p.startsWith('/methods') },
    { id: 'explore', label: 'Labs & Intel', icon: Globe, paths: ['/labs', '/intel', '/trade', '/countries'], to: '/labs', match: (p: string) => p.startsWith('/labs') || p.startsWith('/intel') || p.startsWith('/trade') || p.startsWith('/countries') },
    { id: 'subscribe', label: 'Digest & API', icon: Mail, paths: ['/regime-digest', '/api-access', '/api-docs'], to: '/regime-digest', match: (p: string) => p.startsWith('/regime-digest') || p.startsWith('/api') },
] as const;

function getActiveStep(path: string): string {
    for (const step of STEPS) {
        if ('match' in step && step.match(path)) return step.id;
        if (step.paths.some((s) => path === s || path.startsWith(`${s}/`))) return step.id;
    }
    return 'terminal';
}

interface ValueProgressionPathProps {
    className?: string;
}

export const ValueProgressionPath: React.FC<ValueProgressionPathProps> = ({ className }) => {
    const { pathname } = useLocation();
    const path = withoutTrailingSlash(pathname);
    const active = getActiveStep(path);
    const activeIdx = STEPS.findIndex((s) => s.id === active);

    return (
        <nav
            className={cn('rounded-xl border border-white/[0.08] bg-slate-900/40 p-4 backdrop-blur-xl', className)}
            aria-label="Intelligence progression"
        >
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                Your Intelligence Path
            </p>
            <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0">
                {STEPS.map((step, idx) => {
                    const isActive = step.id === active;
                    const isPast = idx < activeIdx;
                    const Icon = step.icon;
                    return (
                        <li key={step.id} className="flex flex-1 items-center gap-2 sm:flex-col sm:gap-1.5 sm:text-center">
                            {idx > 0 && (
                                <div
                                    className={cn(
                                        'hidden h-px flex-1 sm:block',
                                        isPast || isActive ? 'bg-blue-500/40' : 'bg-white/10'
                                    )}
                                    aria-hidden
                                />
                            )}
                            <TrailLink
                                to={step.to}
                                className={cn(
                                    'group flex items-center gap-2 rounded-lg border px-3 py-2 no-underline transition-all sm:flex-col sm:px-2',
                                    isActive
                                        ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                                        : isPast
                                          ? 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20'
                                          : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:border-white/15 hover:text-white/70'
                                )}
                            >
                                <Icon size={14} className={isActive ? 'text-blue-400' : ''} />
                                <span className="text-[10px] font-black uppercase tracking-uppercase">{step.label}</span>
                            </TrailLink>
                        </li>
                    );
                })}
            </ol>
            {activeIdx < STEPS.length - 1 && (
                <p className="mt-3 text-center text-[11px] text-white/35">
                    Next:{' '}
                    <TrailLink
                        to={STEPS[activeIdx + 1].to}
                        className="font-semibold text-blue-400/80 no-underline hover:text-blue-400"
                    >
                        {STEPS[activeIdx + 1].label}
                    </TrailLink>
                </p>
            )}
        </nav>
    );
};