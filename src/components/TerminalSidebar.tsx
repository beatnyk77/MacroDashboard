import React from 'react';
import { useLocation } from 'react-router-dom';
import { TrailNavLink } from '@/components/TrailLink';
import { withoutTrailingSlash } from '@/lib/urlPath';
import {
    Activity, Globe, TrendingUp, Anchor,
    ShieldAlert, Database, Radio, FileText, Library, Newspaper
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
    { id: 'regime-digest', label: 'Regime Digest', path: '/regime-digest', icon: <FileText size={14} />, group: 'CORE DESK' },
    { id: 'labs', label: 'Thematic Labs', path: '/labs', icon: <Library size={14} />, group: 'STRUCTURAL' },
    { id: 'us-macro', label: 'US Macro Pulse', path: '/labs/us-macro-fiscal', icon: <TrendingUp size={14} />, group: 'CORE DESK' },
    { id: 'gov-financial-position', label: 'Gov Financial Position', path: '/labs/gov-financial-position', icon: <ShieldAlert size={14} />, group: 'CORE DESK' },
    { id: 'china', label: 'China Macro Pulse', path: '/intel/china', icon: <TrendingUp size={14} />, group: 'REGIONAL' },
    { id: 'india', label: 'India Macro Pulse', path: '/intel/india', icon: <Globe size={14} />, group: 'REGIONAL' },
    { id: 'commodities', label: 'Energy & Commodities', path: '/labs/energy-commodities', icon: <Database size={14} />, group: 'REGIONAL' },
    { id: 'sovereign', label: 'Sovereign Stress', path: '/labs/sovereign-stress', icon: <ShieldAlert size={14} />, group: 'STRUCTURAL' },
    { id: 'de-dollarization', label: 'De-Dollarization & Gold', path: '/labs/de-dollarization-gold', icon: <Anchor size={14} />, group: 'STRUCTURAL' },
    { id: 'africa', label: 'Africa Macro Pulse', path: '/labs/africa-macro', icon: <Globe size={14} />, group: 'REGIONAL' },
];

export const TerminalSidebar: React.FC = () => {
    const location = useLocation();

    return (
        <aside
            className="hidden md:block sticky top-16 h-[calc(100vh-4rem)] w-[260px] overflow-y-auto overscroll-contain bg-background"
            aria-label="Terminal Navigation Sidebar"
        >
            <div className="px-4 mb-6">
                <span className="text-xs font-black tracking-uppercase text-blue-500 uppercase flex items-center gap-2">
                    <Activity size={10} /> Terminal Active
                </span>
            </div>

            <nav className="flex-1 px-3" aria-label="Main terminal navigation">
                {(['CORE DESK', 'REGIONAL', 'STRUCTURAL'] as const).map((group) => (
                    <div key={group} className="mb-5">
                        <h2 className="mb-2 px-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">{group}</h2>
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
                                        "group flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all duration-200 border border-transparent tracking-heading min-h-[44px]",
                                        isActive
                                            ? "bg-blue-500/10 text-white shadow-[inset_0_0_12px_rgba(59,130,246,0.15)] border-blue-500/20"
                                            : "text-muted-foreground/60 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <span className={cn(
                                        "shrink-0 transition-colors duration-200",
                                        isActive ? "text-blue-400" : "text-muted-foreground/40 group-hover:text-blue-400/50"
                                    )}>
                                        {item.icon}
                                    </span>
                                    <span className="truncate uppercase">{item.label}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                    )}
                                </TrailNavLink>
                            </li>
                        );
                    })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="mt-auto px-4 py-4 border-t border-white/5">
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <span className="block text-xs font-black tracking-uppercase text-muted-foreground/70 uppercase mb-2">
                        System Status
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-uppercase leading-none">
                            All Systems Nominal
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
};
