import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Activity, Globe, TrendingUp, Anchor, Zap, ShieldAlert,
    Database, BarChart3, Radio, FileText, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    id: string;
    label: string;
    path: string;
    icon: React.ReactNode;
}

const terminalNavItems: NavItem[] = [
    { id: 'weekly-narrative', label: 'Weekly Narrative', path: '/weekly-narrative', icon: <FileText size={14} /> },
    { id: 'observatory', label: 'Global Macro Overview', path: '/', icon: <Radio size={14} /> },
    { id: 'treasury-hedging', label: 'Treasury Hedging', path: '/treasury-hedging', icon: <ShieldCheck size={14} /> },
    { id: 'us-macro', label: 'US Macro Pulse', path: '/labs/us-macro-fiscal', icon: <TrendingUp size={14} /> },
    { id: 'us-eq', label: 'US Corporate Terminal', path: '/us-equities', icon: <BarChart3 size={14} /> },
    { id: 'china', label: 'China Macro Pulse', path: '/labs/china', icon: <TrendingUp size={14} /> },
    { id: 'india-flow', label: 'India Flow Pulse (FII/DII)', path: '/india-equities/fii-dii', icon: <Activity size={14} /> },
    { id: 'india', label: 'India Macro Pulse', path: '/labs/india', icon: <Globe size={14} /> },
    { id: 'india-eq', label: 'Corporate India Engine', path: '/india-equities', icon: <BarChart3 size={14} /> },
    { id: 'commodities', label: 'Energy & Commodities', path: '/labs/energy-commodities', icon: <Database size={14} /> },
    { id: 'sustainable', label: 'Sustainable Finance', path: '/labs/sustainable-finance-climate-risk', icon: <Zap size={14} /> },
    { id: 'sovereign', label: 'Sovereign Stress', path: '/labs/sovereign-stress', icon: <ShieldAlert size={14} /> },
    { id: 'de-dollarization', label: 'De-Dollarization & Gold', path: '/labs/de-dollarization-gold', icon: <Anchor size={14} /> },
];

export const TerminalSidebar: React.FC = () => {
    const location = useLocation();

    return (
        <aside className="hidden md:flex w-[220px] h-[calc(100vh-72px)] sticky top-[72px] left-0 flex-col border-r border-white/5 bg-slate-950/90 backdrop-blur-2xl py-6 z-[1200] overflow-y-auto">
            <div className="px-4 mb-6">
                <span className="text-xs font-black tracking-uppercase text-blue-500 uppercase flex items-center gap-2">
                    <Activity size={10} /> Terminal Active
                </span>
            </div>

            <nav className="flex-1 px-3">
                <ul className="space-y-1">
                    {terminalNavItems.map((item) => {
                        const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');

                        return (
                            <li key={item.id}>
                                <NavLink
                                    to={item.path}
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
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
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
