import React from 'react';
import { useLocation } from 'react-router-dom';
import { TrailNavLink } from '@/components/TrailLink';
import { withoutTrailingSlash } from '@/lib/urlPath';
import {
    Activity, Globe, TrendingUp, Anchor,
    ShieldAlert, Database, Radio, FileText, Library, Newspaper, GitCompare, FileSearch
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    id: string;
    label: string;
    path: string;
    icon: React.ReactNode;
    group: 'CORE DESK' | 'REGIONAL' | 'STRUCTURAL';
}

const terminalNavItems: NavItem[] = [
    { id: 'morning-brief', label: 'Morning Brief', path: '/macro-brief', icon: <Newspaper size={14} />, group: 'CORE DESK' },
    { id: 'weekly-narrative', label: 'Weekly Narrative', path: '/weekly-narrative', icon: <FileText size={14} />, group: 'CORE DESK' },
    { id: 'observatory', label: 'Global Macro Overview', path: '/', icon: <Radio size={14} />, group: 'CORE DESK' },
    { id: 'sec-corporate-transmission', label: 'US SEC Transmission', path: '/corporate-transmission', icon: <FileSearch size={14} />, group: 'CORE DESK' },
    { id: 'regime-digest', label: 'Regime Digest', path: '/regime-digest', icon: <FileText size={14} />, group: 'CORE DESK' },
    { id: 'metrics', label: 'Metric Explorer', path: '/metrics', icon: <Database size={14} />, group: 'CORE DESK' },
    { id: 'labs', label: 'Thematic Labs', path: '/labs', icon: <Library size={14} />, group: 'STRUCTURAL' },
    { id: 'us-macro', label: 'US Macro Pulse', path: '/labs/us-macro-fiscal', icon: <TrendingUp size={14} />, group: 'CORE DESK' },
    { id: 'gov-financial-position', label: 'Gov Financial Position', path: '/labs/gov-financial-position', icon: <ShieldAlert size={14} />, group: 'CORE DESK' },
    { id: 'china', label: 'China Macro Pulse', path: '/intel/china', icon: <TrendingUp size={14} />, group: 'REGIONAL' },
    { id: 'india', label: 'India Macro Pulse', path: '/intel/india', icon: <Globe size={14} />, group: 'REGIONAL' },
    { id: 'commodities', label: 'Energy & Commodities', path: '/labs/energy-commodities', icon: <Database size={14} />, group: 'REGIONAL' },
    { id: 'sovereign', label: 'Sovereign Stress', path: '/labs/sovereign-stress', icon: <ShieldAlert size={14} />, group: 'STRUCTURAL' },
    { id: 'macro-precedents', label: 'Precedents & Benchmarks', path: '/labs/macro-precedents', icon: <GitCompare size={14} />, group: 'STRUCTURAL' },
    { id: 'de-dollarization', label: 'De-Dollarization & Gold', path: '/labs/de-dollarization-gold', icon: <Anchor size={14} />, group: 'STRUCTURAL' },
    { id: 'africa', label: 'Africa Macro Pulse', path: '/labs/africa-macro', icon: <Globe size={14} />, group: 'REGIONAL' },
];

export const TerminalSidebar: React.FC = () => {
    const location = useLocation();

    return (
        <aside
            className="hidden md:block sticky top-16 h-[calc(100vh-4rem)] w-[260px] overflow-y-auto overscroll-contain border-r border-border bg-background"
            aria-label="Terminal Navigation Sidebar"
        >
            <div className="px-4 mb-5 pt-3">
                <span className="text-xs font-black tracking-uppercase text-primary uppercase flex items-center gap-2">
                    <Activity size={10} /> Terminal Active
                </span>
            </div>

            <nav className="flex-1 px-3" aria-label="Main terminal navigation">
                {(['CORE DESK', 'REGIONAL', 'STRUCTURAL'] as const).map((group) => (
                    <div key={group} className="mb-5">
                        <h2 className="mb-2 px-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{group}</h2>
                        <ul className="space-y-1">
                    {terminalNavItems.filter((item) => item.group === group).map((item) => {
                        const normPath = withoutTrailingSlash(location.pathname);
                        const normItem = withoutTrailingSlash(item.path);
                        const isActive = normPath === normItem || (normPath.startsWith(`${normItem}/`) && normItem !== '/');

                        return (
                            <li key={item.id}>
                                <TrailNavLink
                                    to={item.path}
                                    title={`Navigate to ${item.label}`}
                                    aria-label={`View ${item.label}`}
                                    className={cn(
                                        "group flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all duration-200 border border-transparent tracking-body min-h-[44px]",
                                        isActive
                                            ? "bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_rgba(255,91,4,0.12)] border-primary/25"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                    )}
                                >
                                    <span className={cn(
                                        "shrink-0 transition-colors duration-200",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-secondary"
                                    )}>
                                        {item.icon}
                                    </span>
                                    <span className="truncate uppercase">{item.label}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(255,91,4,0.35)]" />
                                    )}
                                </TrailNavLink>
                            </li>
                        );
                    })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="mt-auto px-4 py-4 border-t border-border">
                <div className="p-3 rounded-lg bg-card border border-border shadow-sm">
                    <span className="block text-xs font-black tracking-uppercase text-muted-foreground/70 uppercase mb-2">
                        Data Pipeline
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-60"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary shadow-[0_0_8px_rgba(7,80,86,0.35)]"></span>
                        </div>
                        <span className="text-xs font-bold text-secondary uppercase tracking-uppercase leading-none">
                            All Systems Nominal
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
};
